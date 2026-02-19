"""
Moving Quote Router - Get moving cost estimates
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from db import db
from models import MovingQuoteRequest
from services.moving import MovingQuoteService

router = APIRouter(prefix="/moving", tags=["moving"])
moving_service = MovingQuoteService(db)


@router.post("/quote")
async def get_moving_quote(user_id: Optional[str] = None, request: MovingQuoteRequest = None):
    """Generate a moving cost estimate"""
    try:
        quote = await moving_service.generate_quote(user_id or "", request.model_dump())
        return quote
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quotes/{user_id}")
async def get_user_quotes(user_id: str):
    """Get all moving quotes for a user"""
    quotes = await moving_service.get_user_quotes(user_id)
    return quotes


@router.get("/quote/{quote_id}")
async def get_quote_details(quote_id: str):
    """Get a specific quote"""
    quote = await moving_service.get_quote(quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.get("/pricing-info")
async def get_pricing_info():
    """Get pricing information for UI"""
    return {
        "home_sizes": [
            {"value": "studio", "label": "Studio", "estimated_hours": 2},
            {"value": "1br", "label": "1 Bedroom", "estimated_hours": 3},
            {"value": "2br", "label": "2 Bedrooms", "estimated_hours": 4},
            {"value": "3br", "label": "3 Bedrooms", "estimated_hours": 6},
            {"value": "4br+", "label": "4+ Bedrooms", "estimated_hours": 8},
            {"value": "house", "label": "Full House", "estimated_hours": 10},
        ],
        "special_items": [
            {"value": "piano", "label": "Piano", "surcharge": 300},
            {"value": "pool_table", "label": "Pool Table", "surcharge": 250},
            {"value": "antiques", "label": "Antiques/Fragile Items", "surcharge": 150},
            {"value": "hot_tub", "label": "Hot Tub", "surcharge": 400},
            {"value": "safe", "label": "Heavy Safe", "surcharge": 200},
            {"value": "artwork", "label": "Large Artwork", "surcharge": 100},
            {"value": "gym_equipment", "label": "Gym Equipment", "surcharge": 150},
        ],
        "services": [
            {"value": "packing", "label": "Full Packing Service", "multiplier": 1.4},
            {"value": "storage", "label": "Storage Options", "base_monthly": 150},
        ],
        "notes": [
            "Estimates include labor, truck, and basic moving equipment",
            "Final price may vary based on actual conditions",
            "Quotes valid for 7 days",
            "Insurance options available at checkout"
        ]
    }
