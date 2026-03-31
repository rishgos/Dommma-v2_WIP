"""Recurring rent payment scheduler and payment reminders"""
import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

router = APIRouter(tags=["scheduler"])
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def generate_monthly_invoices():
    """Generate rent invoices for all active agreements on their due day"""
    today = datetime.now(timezone.utc)
    current_day = today.day
    current_month = today.strftime("%Y-%m")
    
    active_agreements = await db.rent_agreements.find({
        "status": "active",
        "due_day": current_day
    }).to_list(500)
    
    generated = 0
    for agreement in active_agreements:
        existing = await db.rent_payments.find_one({
            "agreement_id": agreement["id"],
            "due_month": current_month
        })
        if existing:
            continue
        
        grace_end = today + timedelta(days=agreement.get("grace_period_days", 3))
        
        payment = {
            "id": str(uuid.uuid4()),
            "agreement_id": agreement["id"],
            "tenant_id": agreement["tenant_id"],
            "landlord_id": agreement["landlord_id"],
            "property_id": agreement.get("property_id"),
            "amount": agreement["monthly_rent"],
            "due_date": today.isoformat(),
            "due_month": current_month,
            "grace_end_date": grace_end.isoformat(),
            "late_fee_type": agreement.get("late_fee_type", "flat"),
            "late_fee_amount": agreement.get("late_fee_amount", 0),
            "status": "pending",
            "created_at": today.isoformat()
        }
        await db.rent_payments.insert_one(payment)
        generated += 1
    
    logger.info(f"Generated {generated} rent invoices for day {current_day}")
    return generated


async def send_payment_reminders():
    """Send email reminders 3 days before rent is due"""
    today = datetime.now(timezone.utc)
    reminder_day = (today + timedelta(days=3)).day
    
    agreements = await db.rent_agreements.find({
        "status": "active",
        "due_day": reminder_day
    }).to_list(500)
    
    sent = 0
    for agreement in agreements:
        tenant = await db.users.find_one({"id": agreement["tenant_id"]}, {"_id": 0})
        if not tenant or not tenant.get("email"):
            continue
        
        # Create in-app notification
        reminder = {
            "id": str(uuid.uuid4()),
            "user_id": agreement["tenant_id"],
            "type": "payment_reminder",
            "title": "Rent Payment Due Soon",
            "message": f"Your rent payment of ${agreement['monthly_rent']:,.2f} is due on the {agreement['due_day']}th. Please ensure your payment method is up to date.",
            "read": False,
            "created_at": today.isoformat()
        }
        await db.notifications.insert_one(reminder)
        
        # Send email via Resend
        try:
            from services.email import send_email as resend_send
            html = f"""
            <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
              <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:28px;">DOMMMA</h1>
                <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Rent Payment Reminder</p>
              </div>
              <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
                <h2 style="color:#1A2F3A;margin:0 0 16px;">Hi {tenant.get('name', 'Tenant')}!</h2>
                <p style="color:#555;line-height:1.6;">This is a friendly reminder that your rent payment of <strong>${agreement['monthly_rent']:,.2f}</strong> is due on the <strong>{agreement['due_day']}th</strong> of this month.</p>
                <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
                  <p style="color:#1A2F3A;font-size:28px;font-weight:bold;margin:0;">${agreement['monthly_rent']:,.2f}</p>
                  <p style="color:#888;font-size:14px;margin:8px 0 0;">Due on the {agreement['due_day']}th</p>
                  <p style="color:#888;font-size:12px;margin:4px 0 0;">Grace period: {agreement.get('grace_period_days', 3)} days</p>
                </div>
                <div style="text-align:center;margin:20px 0;">
                  <a href="https://dommma.com/rent-agreements" style="background:#1A2F3A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Pay Now</a>
                </div>
                <p style="color:#888;font-size:12px;text-align:center;">Late fees of {('$'+str(agreement.get('late_fee_amount',0))) if agreement.get('late_fee_type')=='flat' else (str(agreement.get('late_fee_amount',0))+'%')} will apply after the grace period.</p>
              </div>
            </div>"""
            import asyncio as aio
            aio.create_task(resend_send(tenant["email"], "DOMMMA - Rent Payment Due Soon", html))
        except Exception as email_err:
            logger.warning(f"Email reminder failed: {email_err}")
        
        sent += 1
    
    logger.info(f"Sent {sent} payment reminders")
    return sent


async def check_late_payments():
    """Check for overdue payments and apply late fees"""
    today = datetime.now(timezone.utc)
    
    overdue = await db.rent_payments.find({
        "status": "pending",
        "grace_end_date": {"$lt": today.isoformat()}
    }).to_list(500)
    
    updated = 0
    for payment in overdue:
        if payment.get("late_fee_applied"):
            continue
        
        late_fee = 0
        if payment.get("late_fee_type") == "flat":
            late_fee = payment.get("late_fee_amount", 0)
        elif payment.get("late_fee_type") == "percentage":
            late_fee = payment["amount"] * (payment.get("late_fee_amount", 0) / 100)
        
        await db.rent_payments.update_one(
            {"id": payment["id"]},
            {"$set": {
                "status": "overdue",
                "late_fee": round(late_fee, 2),
                "total_due": round(payment["amount"] + late_fee, 2),
                "late_fee_applied": True,
                "late_fee_applied_at": today.isoformat()
            }}
        )
        updated += 1
    
    logger.info(f"Applied late fees to {updated} overdue payments")
    return updated


async def check_lease_renewals():
    """Send reminders for leases expiring within 60 days"""
    today = datetime.now(timezone.utc)
    sixty_days = (today + timedelta(days=60)).isoformat()
    
    expiring = await db.rent_agreements.find({
        "status": "active",
        "end_date": {"$exists": True, "$ne": None, "$lte": sixty_days}
    }).to_list(500)
    
    sent = 0
    for agreement in expiring:
        existing = await db.notifications.find_one({
            "user_id": agreement["tenant_id"],
            "type": "lease_renewal",
            "agreement_id": agreement["id"]
        })
        if existing:
            continue
        
        for user_id in [agreement["tenant_id"], agreement["landlord_id"]]:
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "type": "lease_renewal",
                "agreement_id": agreement["id"],
                "title": "Lease Expiring Soon",
                "message": f"Your lease agreement is expiring on {agreement['end_date'][:10]}. Please discuss renewal options.",
                "read": False,
                "created_at": today.isoformat()
            }
            await db.notifications.insert_one(notification)
            sent += 1
    
    logger.info(f"Sent {sent} lease renewal reminders")
    return sent


# ===== API Endpoints =====

@router.post("/scheduler/run-invoices")
async def trigger_invoices(admin_key: str):
    """Manually trigger monthly invoice generation"""
    expected = os.environ.get('ADMIN_SECRET_KEY', 'dommma-admin-2026')
    if admin_key != expected:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    count = await generate_monthly_invoices()
    return {"status": "success", "invoices_generated": count}


@router.post("/scheduler/run-reminders")
async def trigger_reminders(admin_key: str):
    """Manually trigger payment reminders"""
    expected = os.environ.get('ADMIN_SECRET_KEY', 'dommma-admin-2026')
    if admin_key != expected:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    reminders = await send_payment_reminders()
    late = await check_late_payments()
    renewals = await check_lease_renewals()
    return {"reminders_sent": reminders, "late_fees_applied": late, "renewal_reminders": renewals}


@router.get("/notifications")
async def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get user notifications"""
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return notifications


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}


@router.post("/notifications/mark-all-read")
async def mark_all_read(user_id: str):
    """Mark all notifications as read"""
    result = await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success", "count": result.modified_count}
