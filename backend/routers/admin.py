"""Admin router - Database stats, clear test data, contact messages"""
import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/admin", tags=["admin"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

ADMIN_SECRET_KEY = os.environ.get("ADMIN_SECRET_KEY", "pray1234")


@router.get("/database-stats")
async def database_stats(admin_key: str = Query(...)):
    """Get database statistics for all collections"""
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    collections = await db.list_collection_names()
    stats = {}
    for coll_name in sorted(collections):
        count = await db[coll_name].count_documents({})
        stats[coll_name] = count
    
    return {
        "total_collections": len(collections),
        "collections": stats,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.delete("/clear-test-data")
async def clear_test_data(admin_key: str = Query(...), collection: str = None):
    """Clear test/seed data from collections"""
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    results = {}
    
    if collection:
        count = await db[collection].count_documents({})
        await db[collection].delete_many({})
        results[collection] = f"Deleted {count} documents"
    else:
        test_collections = [
            "test_data", "seed_listings", "demo_users"
        ]
        for coll_name in test_collections:
            if coll_name in await db.list_collection_names():
                count = await db[coll_name].count_documents({})
                await db[coll_name].delete_many({})
                results[coll_name] = f"Deleted {count} documents"
    
    return {"status": "success", "results": results}


@router.get("/contact-messages")
async def get_contact_messages(admin_key: str = Query(...), limit: int = 50):
    """Get contact form submissions"""
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    messages = await db.contact_messages.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return messages


@router.get("/users")
async def get_all_users(admin_key: str = Query(...), user_type: str = None, limit: int = 100):
    """Get all users for admin review"""
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    query = {}
    if user_type:
        query["user_type"] = user_type
    
    users = await db.users.find(
        query, {"_id": 0, "password": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return users


@router.get("/rent-payments")
async def get_all_rent_payments(admin_key: str = Query(...), limit: int = 100):
    """Get all rent payment records"""
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    payments = await db.rent_payments.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return payments
