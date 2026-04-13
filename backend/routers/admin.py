"""Admin router - Database stats, clear test data, contact messages, bulk import"""
import os
import uuid
import json
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Body
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

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
async def clear_test_data(admin_key: str = Query(...), collection: str = None, keep_test_accounts: bool = True):
    """Clear test/seed data from collections. Preserves test accounts by default."""
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    results = {}
    
    if collection:
        if collection == "users" and keep_test_accounts:
            count = await db[collection].count_documents({
                "email": {"$nin": ["test@dommma.com", "testlandlord@dommma.com", "rgoswami@dommma.com"]}
            })
            await db[collection].delete_many({
                "email": {"$nin": ["test@dommma.com", "testlandlord@dommma.com", "rgoswami@dommma.com"]}
            })
            results[collection] = f"Deleted {count} documents (kept test accounts)"
        else:
            count = await db[collection].count_documents({})
            await db[collection].delete_many({})
            results[collection] = f"Deleted {count} documents"
    else:
        # Clean up common test/demo collections
        cleanup_collections = [
            "chat_sessions", "ai_chat_sessions", "virtual_stagings",
            "credit_reports", "campaigns", "credit_transactions",
            "notifications", "push_subscriptions"
        ]
        all_collections = await db.list_collection_names()
        for coll_name in cleanup_collections:
            if coll_name in all_collections:
                count = await db[coll_name].count_documents({})
                if count > 0:
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


# ============================================================
# BULK LISTING IMPORT
# ============================================================

# AI column mapping — maps common variations to our field names
COLUMN_ALIASES = {
    "title": ["title", "name", "listing_name", "property_name", "unit_name", "listing"],
    "address": ["address", "street", "street_address", "location", "addr"],
    "city": ["city", "town", "municipality"],
    "province": ["province", "state", "prov"],
    "postal_code": ["postal_code", "zip", "zipcode", "zip_code", "postalcode", "postal"],
    "price": ["price", "rent", "monthly_rent", "rent_price", "monthly_price", "cost", "amount"],
    "bedrooms": ["bedrooms", "beds", "bed", "br", "bedroom"],
    "bathrooms": ["bathrooms", "baths", "bath", "ba", "bathroom"],
    "sqft": ["sqft", "sq_ft", "square_feet", "area", "size", "square_footage"],
    "property_type": ["property_type", "type", "unit_type", "building_type", "prop_type"],
    "description": ["description", "desc", "details", "notes", "about"],
    "pet_friendly": ["pet_friendly", "pets", "pets_allowed", "pet", "animals"],
    "parking": ["parking", "has_parking", "parking_available"],
    "listing_type": ["listing_type", "list_type", "for_rent_or_sale", "transaction_type"],
    "lat": ["lat", "latitude"],
    "lng": ["lng", "longitude", "lon", "long"],
    "amenities": ["amenities", "features", "extras", "included"],
    "available_date": ["available_date", "move_in", "move_in_date", "available", "availability"],
    "year_built": ["year_built", "built", "year", "construction_year"],
    "images": ["images", "photos", "image_urls", "photo_urls"],
}


def map_columns(headers: list) -> dict:
    """AI-style column mapping — matches CSV headers to our field names"""
    mapping = {}
    headers_lower = [h.strip().lower().replace(" ", "_").replace("-", "_") for h in headers]

    for field, aliases in COLUMN_ALIASES.items():
        for i, header in enumerate(headers_lower):
            if header in aliases:
                mapping[headers[i]] = field
                break

    return mapping


def parse_bool(val):
    """Parse various boolean representations"""
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.strip().lower() in ("true", "yes", "1", "y", "t")
    return bool(val)


def parse_int(val, default=0):
    try:
        return int(float(str(val).strip().replace(",", "").replace("$", "")))
    except (ValueError, TypeError):
        return default


def parse_float(val, default=0.0):
    try:
        return float(str(val).strip().replace(",", "").replace("$", ""))
    except (ValueError, TypeError):
        return default


@router.post("/bulk-import")
async def bulk_import_listings(
    admin_key: str = Query(...),
    landlord_id: str = Query(...),
    file: UploadFile = File(...)
):
    """Bulk import listings from CSV/Excel file.
    Auto-maps columns, validates data, creates listings for specified landlord."""
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    # Verify landlord exists
    landlord = await db.users.find_one({"id": landlord_id}, {"_id": 0})
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")

    # Read file content
    content = await file.read()
    filename = file.filename.lower()

    # Parse CSV
    try:
        if filename.endswith(".csv"):
            text = content.decode("utf-8-sig")  # Handle BOM
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)
            headers = reader.fieldnames or []
        elif filename.endswith(".tsv"):
            text = content.decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(text), delimiter="\t")
            rows = list(reader)
            headers = reader.fieldnames or []
        elif filename.endswith(".json"):
            rows = json.loads(content.decode("utf-8"))
            if isinstance(rows, dict):
                rows = rows.get("listings", rows.get("data", [rows]))
            headers = list(rows[0].keys()) if rows else []
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV, TSV, or JSON.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="File contains no data rows")

    # Map columns
    column_map = map_columns(headers)

    # Process rows
    created = []
    errors = []
    for i, row in enumerate(rows):
        try:
            # Map fields using column mapping
            mapped = {}
            for original_header, value in row.items():
                field = column_map.get(original_header)
                if field:
                    mapped[field] = value

            # Build listing
            title = mapped.get("title", "").strip()
            address = mapped.get("address", "").strip()
            city = mapped.get("city", "Vancouver").strip()

            if not title and not address:
                errors.append({"row": i + 2, "error": "Missing title and address"})
                continue

            listing = {
                "id": str(uuid.uuid4()),
                "title": title or f"Property at {address}",
                "address": address,
                "city": city,
                "province": mapped.get("province", "BC").strip(),
                "postal_code": mapped.get("postal_code", "").strip(),
                "lat": parse_float(mapped.get("lat"), 49.2827),
                "lng": parse_float(mapped.get("lng"), -123.1207),
                "price": parse_int(mapped.get("price"), 0),
                "bedrooms": parse_int(mapped.get("bedrooms"), 1),
                "bathrooms": parse_float(mapped.get("bathrooms"), 1.0),
                "sqft": parse_int(mapped.get("sqft"), 0),
                "property_type": mapped.get("property_type", "Apartment").strip(),
                "description": mapped.get("description", "").strip(),
                "amenities": [a.strip() for a in mapped.get("amenities", "").split(",") if a.strip()] if isinstance(mapped.get("amenities"), str) else [],
                "images": [i.strip() for i in mapped.get("images", "").split(",") if i.strip()] if isinstance(mapped.get("images"), str) else [],
                "available_date": mapped.get("available_date", ""),
                "pet_friendly": parse_bool(mapped.get("pet_friendly", False)),
                "parking": parse_bool(mapped.get("parking", False)),
                "listing_type": mapped.get("listing_type", "rent").strip().lower(),
                "landlord_id": landlord_id,
                "status": "active",
                "featured": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

            # Optional fields
            if mapped.get("year_built"):
                listing["year_built"] = parse_int(mapped["year_built"])
            if mapped.get("sale_price"):
                listing["sale_price"] = parse_int(mapped["sale_price"])

            await db.listings.insert_one(listing)
            created.append({"row": i + 2, "id": listing["id"], "title": listing["title"]})

        except Exception as e:
            errors.append({"row": i + 2, "error": str(e)})

    return {
        "status": "complete",
        "total_rows": len(rows),
        "created": len(created),
        "errors": len(errors),
        "column_mapping": column_map,
        "created_listings": created,
        "error_details": errors,
        "landlord": {"id": landlord_id, "name": landlord.get("name", ""), "email": landlord.get("email", "")}
    }


@router.get("/bulk-import/template")
async def get_import_template():
    """Return CSV template headers for bulk listing import"""
    return {
        "template_headers": [
            "title", "address", "city", "province", "postal_code",
            "price", "bedrooms", "bathrooms", "sqft", "property_type",
            "description", "pet_friendly", "parking", "listing_type",
            "amenities", "available_date", "images"
        ],
        "example_row": {
            "title": "Modern Downtown Condo",
            "address": "123 Main St, Unit 405",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6B 1A1",
            "price": "2500",
            "bedrooms": "2",
            "bathrooms": "1",
            "sqft": "850",
            "property_type": "Condo",
            "description": "Bright 2BR condo with mountain views",
            "pet_friendly": "yes",
            "parking": "yes",
            "listing_type": "rent",
            "amenities": "Gym, Pool, Concierge, In-suite Laundry",
            "available_date": "2026-05-01",
            "images": "https://example.com/photo1.jpg, https://example.com/photo2.jpg"
        },
        "supported_formats": ["CSV", "TSV", "JSON"],
        "notes": [
            "Column headers are auto-mapped — exact names not required",
            "price: monthly rent in dollars (no $ sign needed)",
            "pet_friendly/parking: yes/no, true/false, or 1/0",
            "amenities: comma-separated list",
            "images: comma-separated URLs",
            "listing_type: rent, sale, or lease_takeover"
        ]
    }
