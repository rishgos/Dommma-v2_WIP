"""AI Listing Description Generator and Social Sharing router"""
import os
import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from db import db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["listing-tools"])


# ========== AI LISTING DESCRIPTION ==========

class ListingDescriptionRequest(BaseModel):
    title: str
    address: str
    city: str
    bedrooms: int
    bathrooms: float
    sqft: int
    property_type: str
    price: int
    amenities: List[str] = []
    pet_friendly: bool = False
    parking: bool = False
    listing_type: str = "rent"
    additional_notes: Optional[str] = None
    tone: str = "professional"  # professional, casual, luxury, concise
    extra_context: Optional[str] = None   # "Anything else?" user text
    image_urls: List[str] = []            # up to 4 property photos for Claude Vision
    nearby_places: List[Dict[str, Any]] = []  # [{"name": "...", "type": "transit", "walk_minutes": 10}]


@router.post("/listings/generate-description")
async def generate_listing_description(req: ListingDescriptionRequest):
    """Generate an AI-powered listing description using Claude"""
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    tone_instructions = {
        "professional": "Write in a professional, informative tone suitable for a real estate listing.",
        "casual": "Write in a friendly, approachable tone that feels welcoming.",
        "luxury": "Write in an elegant, upscale tone emphasizing premium features and exclusivity.",
        "concise": "Write a brief, punchy description with key highlights. Keep it under 100 words."
    }

    nearby_text = ""
    neighborhood_rule = ""
    if req.nearby_places:
        lines = []
        for p in req.nearby_places[:5]:
            name = p.get("name", "")
            ptype = p.get("type", "")
            walk = p.get("walk_minutes")
            if name:
                suffix = f" ({walk} min walk)" if walk else ""
                lines.append(f"- {name} [{ptype}]{suffix}")
        if lines:
            nearby_text = (
                "VERIFIED nearby amenities (this is the COMPLETE list — do not add any others):\n"
                + "\n".join(lines)
            )
            neighborhood_rule = (
                "STRICT NEIGHBORHOOD RULE: When referencing the neighborhood, you may mention ONLY the "
                "verified places listed above. Do not name any other businesses, restaurants, parks, stores, "
                "transit stops, or landmarks — even if you have general knowledge of the area. Describe the "
                "neighborhood generically (e.g. 'the neighborhood', 'the area', 'local') unless using a "
                "name from the verified list."
            )
        else:
            neighborhood_rule = (
                "NEIGHBORHOOD RULE: You have no verified nearby places data. Do not name any specific "
                "businesses, restaurants, parks, transit stops, or landmarks. Describe the neighborhood "
                "only in generic terms."
            )
    else:
        neighborhood_rule = (
            "NEIGHBORHOOD RULE: You have no verified nearby places data. Do not name any specific "
            "businesses, restaurants, parks, transit stops, or landmarks. Describe the neighborhood "
            "only in generic terms (e.g. 'the area', 'nearby shops', 'local dining')."
        )

    extras_text = f"\nExtra context from landlord: {req.extra_context}" if req.extra_context else ""
    additional_text = f"\nAdditional notes: {req.additional_notes}" if req.additional_notes else ""

    text_prompt = f"""Generate a compelling property listing description for:

Title: {req.title}
Address: {req.address}, {req.city}
Type: {req.property_type} ({req.listing_type})
Price: ${req.price:,}{'/mo' if req.listing_type == 'rent' else ''}
Bedrooms: {req.bedrooms} | Bathrooms: {req.bathrooms} | Size: {req.sqft} sqft
Amenities: {', '.join(req.amenities) if req.amenities else 'None listed'}
Pet Friendly: {'Yes' if req.pet_friendly else 'No'}
Parking: {'Yes' if req.parking else 'No'}{additional_text}{extras_text}

{nearby_text}

{tone_instructions.get(req.tone, tone_instructions['professional'])}

{neighborhood_rule}

{'PHOTO RULE: The attached photos show the actual property. Describe visible features naturally (finishes, layout, natural light, views, condition) — but only mention what you can clearly see in the photos. Do not invent details or assume features that are not visible.' if req.image_urls else ''}

Write ONLY the description text (2-3 short paragraphs, ~120-180 words total). Do not include the title, price, or address — those are shown separately. Focus on lifestyle, features, and neighborhood appeal. Do not use headings or bullet points."""

    # Build the message content — vision if images provided, plain text otherwise
    content = []
    for url in req.image_urls[:4]:  # cap at 4 images to control cost
        if url and url.startswith("http"):
            content.append({
                "type": "image",
                "source": {"type": "url", "url": url}
            })
    content.append({"type": "text", "text": text_prompt})

    try:
        import httpx
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 500,
                    "messages": [{"role": "user", "content": content}]
                }
            )

            if response.status_code != 200:
                logger.error(f"Claude error {response.status_code}: {response.text[:300]}")
                # Graceful degrade — retry without images if vision failed
                if req.image_urls:
                    retry = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": ANTHROPIC_API_KEY,
                            "anthropic-version": "2023-06-01",
                            "content-type": "application/json"
                        },
                        json={
                            "model": "claude-sonnet-4-20250514",
                            "max_tokens": 500,
                            "messages": [{"role": "user", "content": text_prompt}]
                        }
                    )
                    if retry.status_code == 200:
                        result = retry.json()
                        description = result.get("content", [{}])[0].get("text", "")
                        return {"description": description, "tone": req.tone, "used_vision": False}
                raise HTTPException(status_code=500, detail="AI generation failed")

            result = response.json()
            description = result.get("content", [{}])[0].get("text", "")

            return {
                "description": description,
                "tone": req.tone,
                "used_vision": bool(req.image_urls),
                "used_nearby": bool(req.nearby_places),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI description error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


# ========== SOCIAL SHARING ==========

@router.get("/listings/{listing_id}/share-links")
async def get_share_links(listing_id: str, base_url: str = "https://dommma.com"):
    """Generate shareable links for a listing across platforms"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing_url = f"{base_url}/browse?listing={listing_id}"
    title = listing.get("title", "Property Listing")
    price = listing.get("price", 0)
    beds = listing.get("bedrooms", 0)
    baths = listing.get("bathrooms", 0)
    city = listing.get("city", "")
    listing_type = listing.get("listing_type", "rent")

    price_text = f"${price:,}{'/mo' if listing_type == 'rent' else ''}"
    share_text = f"{title} - {beds}BR/{baths}BA in {city} - {price_text}"
    encoded_text = share_text.replace(" ", "%20").replace("&", "%26")
    encoded_url = listing_url.replace("&", "%26")

    return {
        "listing_url": listing_url,
        "share_text": share_text,
        "platforms": {
            "facebook": f"https://www.facebook.com/sharer/sharer.php?u={encoded_url}&quote={encoded_text}",
            "facebook_marketplace": f"https://www.facebook.com/marketplace/create/rental?url={encoded_url}",
            "twitter": f"https://twitter.com/intent/tweet?text={encoded_text}&url={encoded_url}",
            "linkedin": f"https://www.linkedin.com/sharing/share-offsite/?url={encoded_url}",
            "whatsapp": f"https://wa.me/?text={encoded_text}%20{encoded_url}",
            "email": f"mailto:?subject={encoded_text}&body=Check%20out%20this%20listing:%20{encoded_url}",
            "craigslist": f"https://post.craigslist.org/?listing_url={encoded_url}",
            "copy_link": listing_url
        },
        "listing_summary": {
            "title": title,
            "price": price_text,
            "bedrooms": beds,
            "bathrooms": baths,
            "city": city,
            "image": listing.get("images", [None])[0]
        }
    }


# ========== FLEXIBLE LEASE PRICING ==========

class LeasePricingTier(BaseModel):
    duration_months: int
    monthly_price: int
    label: str


class FlexiblePricingUpdate(BaseModel):
    listing_id: str
    landlord_id: str
    pricing_tiers: List[LeasePricingTier]


@router.post("/listings/flexible-pricing")
async def set_flexible_pricing(data: FlexiblePricingUpdate):
    """Set flexible lease-duration pricing for a listing"""
    listing = await db.listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    owner = listing.get("owner_id") or listing.get("landlord_id") or listing.get("user_id")
    if owner != data.landlord_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    tiers = [t.model_dump() for t in data.pricing_tiers]
    await db.listings.update_one(
        {"id": data.listing_id},
        {"$set": {
            "pricing_tiers": tiers,
            "has_flexible_pricing": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True, "pricing_tiers": tiers}


@router.get("/listings/{listing_id}/pricing")
async def get_flexible_pricing(listing_id: str):
    """Get flexible pricing tiers for a listing"""
    listing = await db.listings.find_one(
        {"id": listing_id},
        {"_id": 0, "pricing_tiers": 1, "has_flexible_pricing": 1, "price": 1}
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if not listing.get("has_flexible_pricing") or not listing.get("pricing_tiers"):
        return {
            "has_flexible_pricing": False,
            "pricing_tiers": [{"duration_months": 12, "monthly_price": listing.get("price", 0), "label": "1 Year"}]
        }
    return {"has_flexible_pricing": True, "pricing_tiers": listing["pricing_tiers"]}


# ========== CAMPAIGN / BOOST PROMOTIONS ==========

class CampaignCreate(BaseModel):
    listing_id: str
    landlord_id: str
    campaign_type: str  # "boost", "featured", "premium"
    budget: float
    duration_days: int = 7


CAMPAIGN_PRICING = {
    "boost": {"daily_rate": 2.99, "label": "Boost", "description": "Appear higher in search results"},
    "featured": {"daily_rate": 4.99, "label": "Featured", "description": "Featured badge + priority placement"},
    "premium": {"daily_rate": 9.99, "label": "Premium", "description": "Top of all searches + featured badge + social promotion"},
}


@router.get("/campaigns/pricing")
async def get_campaign_pricing():
    """Get available campaign types and pricing"""
    return CAMPAIGN_PRICING


@router.post("/campaigns")
async def create_campaign(campaign: CampaignCreate):
    """Create a new listing promotion campaign"""
    listing = await db.listings.find_one({"id": campaign.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    pricing = CAMPAIGN_PRICING.get(campaign.campaign_type)
    if not pricing:
        raise HTTPException(status_code=400, detail="Invalid campaign type")

    total_cost = pricing["daily_rate"] * campaign.duration_days
    if campaign.budget < total_cost:
        raise HTTPException(status_code=400, detail=f"Minimum budget: ${total_cost:.2f} for {campaign.duration_days} days")

    campaign_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    end_date = now + timedelta(days=campaign.duration_days)

    campaign_doc = {
        "id": campaign_id,
        "listing_id": campaign.listing_id,
        "landlord_id": campaign.landlord_id,
        "campaign_type": campaign.campaign_type,
        "budget": campaign.budget,
        "daily_rate": pricing["daily_rate"],
        "duration_days": campaign.duration_days,
        "total_cost": total_cost,
        "status": "active",
        "impressions": 0,
        "clicks": 0,
        "leads": 0,
        "start_date": now.isoformat(),
        "end_date": end_date.isoformat(),
        "created_at": now.isoformat()
    }
    await db.campaigns.insert_one(campaign_doc)

    boost_score = {"boost": 50, "featured": 100, "premium": 200}.get(campaign.campaign_type, 50)
    await db.listings.update_one(
        {"id": campaign.listing_id},
        {"$set": {
            "boost_score": boost_score,
            "campaign_id": campaign_id,
            "campaign_type": campaign.campaign_type,
            "campaign_end": end_date.isoformat()
        }}
    )

    campaign_doc.pop("_id", None)
    return campaign_doc


@router.get("/campaigns/landlord/{landlord_id}")
async def get_landlord_campaigns(landlord_id: str, status: Optional[str] = None):
    """Get all campaigns for a landlord"""
    query = {"landlord_id": landlord_id}
    if status:
        query["status"] = status
    campaigns = await db.campaigns.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    for c in campaigns:
        listing = await db.listings.find_one({"id": c["listing_id"]}, {"_id": 0, "title": 1, "address": 1, "images": 1})
        c["listing"] = listing or {}
    return campaigns


@router.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str):
    """Get campaign performance stats"""
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign
