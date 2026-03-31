"""AI Property Search Chatbot & Credit Check Integration"""
import os
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

router = APIRouter(tags=["ai-chatbot"])
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None


@router.post("/ai/property-chat")
async def property_search_chat(msg: ChatMessage):
    """AI chatbot for natural language property search"""
    session_id = msg.session_id or str(uuid.uuid4())
    
    history = []
    if msg.session_id:
        history = await db.chat_sessions.find(
            {"session_id": session_id}, {"_id": 0}
        ).sort("created_at", 1).to_list(20)
    
    await db.chat_sessions.insert_one({
        "session_id": session_id,
        "role": "user",
        "content": msg.message,
        "user_id": msg.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    sample_listings = await db.listings.find(
        {"status": "active"}, {"_id": 0, "id": 1, "title": 1, "address": 1, "price": 1, 
         "bedrooms": 1, "bathrooms": 1, "sqft": 1, "listing_type": 1, "city": 1,
         "pet_friendly": 1, "property_type": 1, "amenities": 1}
    ).to_list(30)
    
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        return {
            "session_id": session_id,
            "response": "I can help you find properties! Try asking about apartments in specific neighborhoods, price ranges, or amenities you need.",
            "listings": sample_listings[:5],
            "suggestions": ["Show me 2BR apartments under $2500", "Pet-friendly places in Kitsilano", "What's available downtown?"]
        }
    
    from anthropic import AsyncAnthropic
    ai_client = AsyncAnthropic(api_key=anthropic_key)
    
    listings_context = json.dumps(sample_listings[:20], default=str)
    
    messages = []
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": msg.message})
    
    system = f"""You are DOMMMA's property search assistant for Vancouver, BC. Help users find rental properties, answer questions about neighborhoods, and provide real estate advice.

Available listings data:
{listings_context}

Rules:
1. Be conversational and helpful
2. When recommending properties, reference specific listings from the data with their titles and prices
3. If asked about something outside real estate, politely redirect
4. Include practical tips about Vancouver neighborhoods
5. Always respond in JSON format:
{{"response": "your helpful message", "matched_listing_ids": ["id1", "id2"], "follow_up_questions": ["q1", "q2"]}}"""

    try:
        response = await ai_client.messages.create(
            model="claude-sonnet-4-20250514", max_tokens=1000,
            system=system,
            messages=messages
        )
        
        text = response.content[0].text
        try:
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start >= 0:
                parsed = json.loads(text[json_start:json_end])
            else:
                parsed = {"response": text, "matched_listing_ids": [], "follow_up_questions": []}
        except json.JSONDecodeError:
            parsed = {"response": text, "matched_listing_ids": [], "follow_up_questions": []}
        
        await db.chat_sessions.insert_one({
            "session_id": session_id,
            "role": "assistant",
            "content": parsed.get("response", text),
            "user_id": msg.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        matched = []
        for lid in parsed.get("matched_listing_ids", []):
            listing = next((l for l in sample_listings if l.get("id") == lid), None)
            if listing:
                matched.append(listing)
        
        return {
            "session_id": session_id,
            "response": parsed.get("response", text),
            "listings": matched[:5] if matched else sample_listings[:3],
            "suggestions": parsed.get("follow_up_questions", [])
        }
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return {
            "session_id": session_id,
            "response": "I'm having trouble processing your request right now. Please try again.",
            "listings": sample_listings[:3],
            "suggestions": ["Show me available rentals", "What's the average rent downtown?"]
        }


@router.get("/ai/chat-history")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_sessions.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    return {"session_id": session_id, "messages": messages}


# ===== CREDIT CHECK =====

class CreditCheckRequest(BaseModel):
    tenant_id: str
    full_name: str
    date_of_birth: Optional[str] = None
    sin_last4: Optional[str] = None
    consent: bool = False


@router.post("/credit-check/request")
async def request_credit_check(req: CreditCheckRequest):
    """Request a tenant credit check (simulated for demo)"""
    if not req.consent:
        raise HTTPException(status_code=400, detail="Tenant consent is required for credit checks")
    
    tenant = await db.users.find_one({"id": req.tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    import random
    credit_score = random.randint(580, 850)
    
    risk_level = "low" if credit_score >= 720 else "medium" if credit_score >= 650 else "high"
    
    report = {
        "id": str(uuid.uuid4()),
        "tenant_id": req.tenant_id,
        "tenant_name": req.full_name,
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
        "credit_score": credit_score,
        "risk_level": risk_level,
        "score_range": "300-900",
        "factors": {
            "payment_history": random.choice(["Excellent", "Good", "Fair"]),
            "credit_utilization": f"{random.randint(15, 65)}%",
            "credit_age": f"{random.randint(2, 15)} years",
            "recent_inquiries": random.randint(0, 5),
            "derogatory_marks": random.randint(0, 2),
        },
        "rental_history": {
            "evictions": 0,
            "late_payments_12mo": random.randint(0, 3),
            "previous_landlord_rating": random.choice(["Positive", "Neutral", None]),
        },
        "recommendation": "Approve" if credit_score >= 680 else "Review" if credit_score >= 620 else "Decline",
        "disclaimer": "This is a simulated credit report for demonstration purposes. In production, this would integrate with Equifax or TransUnion Canada."
    }
    
    await db.credit_reports.insert_one({**report})
    report.pop("_id", None)
    
    return report


@router.get("/credit-check/reports")
async def get_credit_reports(landlord_id: str = None, tenant_id: str = None, limit: int = 20):
    """Get credit check reports"""
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    reports = await db.credit_reports.find(query, {"_id": 0}).sort("requested_at", -1).to_list(limit)
    return reports
