"""Stripe Connect router - Landlord onboarding and payouts"""
import os
import stripe
import logging
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/stripe-connect", tags=["stripe-connect"])
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

PLATFORM_FEE_PERCENT = 2.5


@router.post("/create-account")
async def create_connect_account(landlord_id: str):
    """Create a Stripe Connect Express account for a landlord"""
    stripe.api_key = os.environ.get("STRIPE_API_KEY")
    
    landlord = await db.users.find_one({"id": landlord_id})
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    
    existing_connect_id = landlord.get("stripe_connect_id")
    if existing_connect_id:
        return {"status": "exists", "connect_id": existing_connect_id}
    
    try:
        account = stripe.Account.create(
            type="express",
            country="CA",
            email=landlord.get("email"),
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            metadata={"dommma_user_id": landlord_id}
        )
        
        await db.users.update_one(
            {"id": landlord_id},
            {"$set": {
                "stripe_connect_id": account.id,
                "stripe_connect_status": "pending"
            }}
        )
        
        return {"status": "created", "connect_id": account.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/onboarding-link")
async def create_onboarding_link(landlord_id: str, return_url: str = None):
    """Generate a Stripe Connect onboarding link for the landlord"""
    stripe.api_key = os.environ.get("STRIPE_API_KEY")
    
    landlord = await db.users.find_one({"id": landlord_id})
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    
    connect_id = landlord.get("stripe_connect_id")
    if not connect_id:
        raise HTTPException(status_code=400, detail="No Connect account. Create one first.")
    
    base_url = return_url or os.environ.get('FRONTEND_URL', 'https://dommma.com')
    
    try:
        link = stripe.AccountLink.create(
            account=connect_id,
            refresh_url=f"{base_url}/rent-agreements?connect_refresh=true",
            return_url=f"{base_url}/rent-agreements?connect_success=true",
            type="account_onboarding",
        )
        return {"url": link.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status")
async def get_connect_status(landlord_id: str):
    """Check landlord's Stripe Connect account status"""
    stripe.api_key = os.environ.get("STRIPE_API_KEY")
    
    landlord = await db.users.find_one({"id": landlord_id})
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    
    connect_id = landlord.get("stripe_connect_id")
    if not connect_id:
        return {"status": "not_connected", "connect_id": None, "payouts_enabled": False}
    
    try:
        account = stripe.Account.retrieve(connect_id)
        status = "active" if account.payouts_enabled else "pending"
        
        await db.users.update_one(
            {"id": landlord_id},
            {"$set": {
                "stripe_connect_status": status,
                "stripe_connect_payouts_enabled": account.payouts_enabled,
                "stripe_connect_charges_enabled": account.charges_enabled
            }}
        )
        
        return {
            "status": status,
            "connect_id": connect_id,
            "payouts_enabled": account.payouts_enabled,
            "charges_enabled": account.charges_enabled,
            "details_submitted": account.details_submitted
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


@router.get("/dashboard-link")
async def get_connect_dashboard(landlord_id: str):
    """Get Stripe Express Dashboard login link for landlord"""
    stripe.api_key = os.environ.get("STRIPE_API_KEY")
    
    landlord = await db.users.find_one({"id": landlord_id})
    if not landlord or not landlord.get("stripe_connect_id"):
        raise HTTPException(status_code=400, detail="No Connect account found")
    
    try:
        link = stripe.Account.create_login_link(landlord.get("stripe_connect_id"))
        return {"url": link.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
