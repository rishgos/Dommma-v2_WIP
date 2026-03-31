"""Landlord Earnings Dashboard - income charts, vacancy rates, ROI projections"""
import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/landlord", tags=["landlord-earnings"])
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


@router.get("/earnings")
async def get_landlord_earnings(landlord_id: str, months: int = 12):
    """Get landlord earnings summary with monthly breakdown"""
    properties = await db.listings.find(
        {"owner_id": landlord_id}, {"_id": 0}
    ).to_list(100)
    
    agreements = await db.rent_agreements.find(
        {"landlord_id": landlord_id}, {"_id": 0}
    ).to_list(100)
    
    payments = await db.rent_payments.find(
        {"landlord_id": landlord_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Monthly breakdown
    now = datetime.now(timezone.utc)
    monthly = []
    for i in range(months):
        month_date = now - timedelta(days=30 * i)
        month_key = month_date.strftime("%Y-%m")
        month_payments = [p for p in payments if p.get("due_month", "") == month_key or (p.get("paid_at", "").startswith(month_key) if p.get("paid_at") else False)]
        collected = sum(p.get("amount", 0) for p in month_payments if p.get("status") in ["paid", "completed"])
        pending = sum(p.get("amount", 0) for p in month_payments if p.get("status") == "pending")
        overdue = sum(p.get("total_due", p.get("amount", 0)) for p in month_payments if p.get("status") == "overdue")
        platform_fees = sum(p.get("platform_fee", 0) for p in month_payments if p.get("status") in ["paid", "completed"])
        
        monthly.append({
            "month": month_key,
            "label": month_date.strftime("%b %Y"),
            "collected": round(collected, 2),
            "pending": round(pending, 2),
            "overdue": round(overdue, 2),
            "platform_fees": round(platform_fees, 2),
            "net_income": round(collected - platform_fees, 2),
            "payment_count": len(month_payments)
        })
    
    # Vacancy analysis
    total_properties = len(properties)
    active_agreements = [a for a in agreements if a.get("status") == "active"]
    occupied = len(set(a.get("property_id") for a in active_agreements if a.get("property_id")))
    vacant = max(0, total_properties - occupied)
    vacancy_rate = round((vacant / total_properties * 100) if total_properties > 0 else 0, 1)
    
    # Total calculations
    total_collected = sum(m["collected"] for m in monthly)
    total_pending = sum(m["pending"] for m in monthly)
    total_fees = sum(m["platform_fees"] for m in monthly)
    avg_monthly = round(total_collected / max(1, months), 2)
    
    # ROI projection
    total_property_value = sum(p.get("price", 0) for p in properties if p.get("listing_type") == "sale")
    annual_rental_income = avg_monthly * 12
    roi = round((annual_rental_income / total_property_value * 100) if total_property_value > 0 else 0, 1)
    
    # Collection rate
    total_expected = sum(a.get("monthly_rent", 0) for a in active_agreements) * months
    collection_rate = round((total_collected / total_expected * 100) if total_expected > 0 else 100, 1)
    
    return {
        "summary": {
            "total_collected": round(total_collected, 2),
            "total_pending": round(total_pending, 2),
            "total_platform_fees": round(total_fees, 2),
            "net_income": round(total_collected - total_fees, 2),
            "avg_monthly_income": avg_monthly,
            "projected_annual": round(annual_rental_income, 2),
        },
        "properties": {
            "total": total_properties,
            "occupied": occupied,
            "vacant": vacant,
            "vacancy_rate": vacancy_rate,
            "active_agreements": len(active_agreements),
        },
        "performance": {
            "collection_rate": collection_rate,
            "roi_percentage": roi,
            "avg_rent": round(sum(a.get("monthly_rent", 0) for a in active_agreements) / max(1, len(active_agreements)), 2),
        },
        "monthly_breakdown": list(reversed(monthly)),
        "top_properties": sorted(
            [{"id": p.get("id"), "title": p.get("title", ""), "address": p.get("address", ""),
              "rent": p.get("price", 0), "type": p.get("listing_type", "")}
             for p in properties[:10]],
            key=lambda x: x["rent"], reverse=True
        )
    }


@router.get("/property-performance")
async def get_property_performance(landlord_id: str, property_id: str):
    """Get performance details for a specific property"""
    prop = await db.listings.find_one({"id": property_id, "owner_id": landlord_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    agreements = await db.rent_agreements.find(
        {"landlord_id": landlord_id, "property_id": property_id}, {"_id": 0}
    ).to_list(50)
    
    payments = await db.rent_payments.find(
        {"landlord_id": landlord_id, "property_id": property_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    total_income = sum(p.get("amount", 0) for p in payments if p.get("status") in ["paid", "completed"])
    late_payments = sum(1 for p in payments if p.get("late_fee_applied"))
    on_time_rate = round((1 - late_payments / max(1, len(payments))) * 100, 1)
    
    current_agreement = next((a for a in agreements if a.get("status") == "active"), None)
    tenant = None
    if current_agreement:
        tenant = await db.users.find_one({"id": current_agreement.get("tenant_id")}, {"_id": 0, "id": 1, "name": 1, "email": 1})
    
    return {
        "property": {
            "id": prop.get("id"),
            "title": prop.get("title"),
            "address": prop.get("address"),
            "current_rent": current_agreement.get("monthly_rent") if current_agreement else prop.get("price", 0),
        },
        "tenant": {"name": tenant.get("name"), "email": tenant.get("email")} if tenant else None,
        "financials": {
            "total_income": round(total_income, 2),
            "total_payments": len(payments),
            "on_time_rate": on_time_rate,
            "late_payments": late_payments,
        },
        "agreement": {
            "status": current_agreement.get("status") if current_agreement else "vacant",
            "start_date": current_agreement.get("start_date") if current_agreement else None,
            "end_date": current_agreement.get("end_date") if current_agreement else None,
        },
        "history": [{"month": p.get("due_month", ""), "amount": p.get("amount", 0), "status": p.get("status", ""), "late_fee": p.get("late_fee", 0)} for p in payments[:12]]
    }
