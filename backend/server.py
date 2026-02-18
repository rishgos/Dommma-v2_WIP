from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========== MODELS ==========

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Listing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    address: str
    city: str
    province: str
    postal_code: str
    lat: float
    lng: float
    price: int
    bedrooms: int
    bathrooms: float
    sqft: int
    property_type: str
    description: str
    amenities: List[str]
    images: List[str]
    available_date: str
    pet_friendly: bool
    parking: bool
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ListingCreate(BaseModel):
    title: str
    address: str
    city: str
    province: str
    postal_code: str
    lat: float
    lng: float
    price: int
    bedrooms: int
    bathrooms: float
    sqft: int
    property_type: str
    description: str
    amenities: List[str] = []
    images: List[str] = []
    available_date: str
    pet_friendly: bool = False
    parking: bool = False

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[ChatMessage] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

class ChatResponse(BaseModel):
    session_id: str
    response: str
    listings: List[dict] = []

# ========== ROUTES ==========

@api_router.get("/")
async def root():
    return {"message": "DOMMMA API - Real Estate Platform"}

# Status Check Routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Listing Routes
@api_router.get("/listings", response_model=List[Listing])
async def get_listings(
    city: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[float] = None,
    property_type: Optional[str] = None,
    pet_friendly: Optional[bool] = None
):
    query = {"status": "active"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_price:
        query["price"] = {"$gte": min_price}
    if max_price:
        query.setdefault("price", {})["$lte"] = max_price
    if bedrooms:
        query["bedrooms"] = {"$gte": bedrooms}
    if bathrooms:
        query["bathrooms"] = {"$gte": bathrooms}
    if property_type:
        query["property_type"] = property_type
    if pet_friendly is not None:
        query["pet_friendly"] = pet_friendly
    
    listings = await db.listings.find(query, {"_id": 0}).to_list(100)
    return listings

@api_router.get("/listings/map")
async def get_listings_for_map(
    north_east_lat: Optional[float] = None,
    north_east_lng: Optional[float] = None,
    south_west_lat: Optional[float] = None,
    south_west_lng: Optional[float] = None
):
    query = {"status": "active"}
    if all([north_east_lat, north_east_lng, south_west_lat, south_west_lng]):
        query["lat"] = {"$gte": south_west_lat, "$lte": north_east_lat}
        query["lng"] = {"$gte": south_west_lng, "$lte": north_east_lng}
    
    listings = await db.listings.find(query, {"_id": 0}).to_list(100)
    return listings

@api_router.get("/listings/{listing_id}", response_model=Listing)
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing

@api_router.post("/listings", response_model=Listing)
async def create_listing(listing: ListingCreate):
    listing_obj = Listing(**listing.model_dump())
    doc = listing_obj.model_dump()
    await db.listings.insert_one(doc)
    return listing_obj

# Chat Routes (Nova AI)
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_nova(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    # Get or create chat session
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        session = {"id": session_id, "messages": [], "created_at": datetime.now(timezone.utc).isoformat()}
        await db.chat_sessions.insert_one(session)
    
    # Get available listings for context
    listings = await db.listings.find({"status": "active"}, {"_id": 0}).to_list(50)
    listings_context = "\n".join([
        f"- {l['title']}: {l['bedrooms']}bd/{l['bathrooms']}ba, ${l['price']}/mo, {l['address']}, {l['city']} (Pet-friendly: {l['pet_friendly']})"
        for l in listings
    ])
    
    # Build conversation context from history
    history_context = ""
    prev_messages = session.get("messages", [])[-6:]  # Last 6 messages for context
    if prev_messages:
        history_context = "\n\nRecent conversation:\n" + "\n".join([
            f"{'User' if m['role'] == 'user' else 'Nova'}: {m['content'][:200]}"
            for m in prev_messages
        ])
    
    system_message = f"""You are Nova, DOMMMA's friendly AI real estate assistant. You help users find rental properties in Vancouver.

Available Properties:
{listings_context}
{history_context}

Guidelines:
- Be conversational, helpful, and enthusiastic
- When users ask about properties, recommend relevant listings with match scores (70-99%)
- Format property recommendations nicely with key details
- If no exact matches, suggest closest alternatives
- Help with questions about renting, neighborhoods, moving tips
- Keep responses concise (2-3 paragraphs max)"""

    try:
        # Initialize fresh chat with Claude Sonnet 4.5 for each request
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"{session_id}-{uuid.uuid4().hex[:8]}",  # Unique per request
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Send current message directly (context is in system message)
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Save messages to session
        await db.chat_sessions.update_one(
            {"id": session_id},
            {"$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
                        {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
                    ]
                }
            }}
        )
        
        # Find mentioned listings in response
        mentioned_listings = []
        for listing in listings:
            if listing['title'].lower() in response.lower():
                mentioned_listings.append(listing)
        
        return ChatResponse(
            session_id=session_id,
            response=response,
            listings=mentioned_listings[:5]
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            session_id=session_id,
            response="I'm having a moment! Let me help you - try asking about apartments in Vancouver, and I'll find the perfect matches for you! 🏠",
            listings=[]
        )

@api_router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# Seed Data Route
@api_router.post("/seed")
async def seed_data():
    """Seed the database with sample Vancouver listings"""
    
    # Check if already seeded
    count = await db.listings.count_documents({})
    if count > 0:
        return {"message": f"Database already has {count} listings"}
    
    sample_listings = [
        {
            "id": str(uuid.uuid4()),
            "title": "Modern Downtown Condo",
            "address": "1200 West Georgia St, Unit 2505",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6E 4R2",
            "lat": 49.2849,
            "lng": -123.1215,
            "price": 2800,
            "bedrooms": 2,
            "bathrooms": 2,
            "sqft": 950,
            "property_type": "Condo",
            "description": "Stunning views from this 25th floor condo in the heart of downtown. Floor-to-ceiling windows, modern finishes, in-suite laundry.",
            "amenities": ["Gym", "Rooftop Deck", "Concierge", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
            "available_date": "2026-02-01",
            "pet_friendly": False,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Cozy Kitsilano Character Home",
            "address": "2456 West 3rd Ave",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6K 1L8",
            "lat": 49.2689,
            "lng": -123.1620,
            "price": 3200,
            "bedrooms": 3,
            "bathrooms": 1.5,
            "sqft": 1400,
            "property_type": "House",
            "description": "Beautiful character home in family-friendly Kitsilano. Original hardwood floors, updated kitchen, large backyard. Steps to the beach!",
            "amenities": ["Backyard", "Garage", "Fireplace", "Washer/Dryer"],
            "images": ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
            "available_date": "2026-02-15",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Yaletown Luxury Loft",
            "address": "1155 Mainland St, Unit 808",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6B 5P2",
            "lat": 49.2756,
            "lng": -123.1209,
            "price": 3500,
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 850,
            "property_type": "Loft",
            "description": "Stunning industrial loft in trendy Yaletown. 16ft ceilings, exposed brick, chef's kitchen. Walk to restaurants and seawall.",
            "amenities": ["Gym", "Bike Storage", "Rooftop Patio", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
            "available_date": "2026-01-15",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Mount Pleasant Studio",
            "address": "456 Main St, Unit 302",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V5T 3E2",
            "lat": 49.2634,
            "lng": -123.1006,
            "price": 1650,
            "bedrooms": 0,
            "bathrooms": 1,
            "sqft": 450,
            "property_type": "Studio",
            "description": "Bright studio in hip Mount Pleasant. Perfect for young professionals. Steps to Main Street shops and restaurants.",
            "amenities": ["In-suite Laundry", "Bike Room", "Rooftop"],
            "images": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
            "available_date": "2026-02-01",
            "pet_friendly": False,
            "parking": False,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Coal Harbour Waterfront Suite",
            "address": "1499 West Pender St, Unit 3201",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6G 2S3",
            "lat": 49.2898,
            "lng": -123.1323,
            "price": 4200,
            "bedrooms": 2,
            "bathrooms": 2,
            "sqft": 1150,
            "property_type": "Condo",
            "description": "Breathtaking water and mountain views from this prestigious Coal Harbour address. High-end finishes throughout.",
            "amenities": ["Pool", "Gym", "Concierge", "Spa", "Wine Cellar"],
            "images": ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
            "available_date": "2026-03-01",
            "pet_friendly": False,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Commercial Drive Townhouse",
            "address": "1876 Venables St",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V5L 2H6",
            "lat": 49.2752,
            "lng": -123.0711,
            "price": 2900,
            "bedrooms": 3,
            "bathrooms": 2.5,
            "sqft": 1600,
            "property_type": "Townhouse",
            "description": "Spacious townhouse near Commercial Drive. Modern kitchen, private patio, close to SkyTrain. Great for families!",
            "amenities": ["Patio", "Storage", "Washer/Dryer", "Dishwasher"],
            "images": ["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"],
            "available_date": "2026-02-15",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Gastown Heritage Apartment",
            "address": "55 Water St, Unit 402",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6B 1A1",
            "lat": 49.2842,
            "lng": -123.1088,
            "price": 2200,
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 650,
            "property_type": "Apartment",
            "description": "Historic Gastown building with modern updates. Exposed brick, high ceilings, hardwood floors. Walk everywhere!",
            "amenities": ["Exposed Brick", "High Ceilings", "Rooftop Access"],
            "images": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
            "available_date": "2026-01-20",
            "pet_friendly": False,
            "parking": False,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "UBC Area Family Home",
            "address": "4521 West 10th Ave",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6R 2J1",
            "lat": 49.2628,
            "lng": -123.2011,
            "price": 4500,
            "bedrooms": 4,
            "bathrooms": 3,
            "sqft": 2200,
            "property_type": "House",
            "description": "Spacious family home near UBC. Updated throughout, large yard, quiet street. Excellent schools nearby.",
            "amenities": ["Large Yard", "Double Garage", "Fireplace", "Deck"],
            "images": ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800"],
            "available_date": "2026-03-01",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Olympic Village Modern 1BR",
            "address": "1788 Columbia St, Unit 1205",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V5Y 0L7",
            "lat": 49.2689,
            "lng": -123.1069,
            "price": 2400,
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 680,
            "property_type": "Condo",
            "description": "Bright corner unit in Olympic Village. Walking distance to seawall, Science World, and Main Street.",
            "amenities": ["Gym", "Rooftop Deck", "Bike Storage", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800"],
            "available_date": "2026-02-01",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Cambie Village 2BR",
            "address": "3456 Cambie St, Unit 506",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V5Z 2W8",
            "lat": 49.2567,
            "lng": -123.1147,
            "price": 2600,
            "bedrooms": 2,
            "bathrooms": 1,
            "sqft": 850,
            "property_type": "Condo",
            "description": "Well-maintained 2BR near Canada Line. Great for commuters. Queen Elizabeth Park nearby.",
            "amenities": ["Gym", "Garden", "Storage", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800"],
            "available_date": "2026-02-15",
            "pet_friendly": False,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Granville Island Area Suite",
            "address": "1456 West 2nd Ave, Unit 301",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6H 3Y2",
            "lat": 49.2702,
            "lng": -123.1380,
            "price": 2100,
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 600,
            "property_type": "Apartment",
            "description": "Charming 1BR steps from Granville Island Market. Perfect for food lovers and artists!",
            "amenities": ["Balcony", "Storage", "Shared Laundry"],
            "images": ["https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800"],
            "available_date": "2026-01-25",
            "pet_friendly": True,
            "parking": False,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Burnaby Heights 3BR",
            "address": "3890 Hastings St, Unit 208",
            "city": "Burnaby",
            "province": "BC",
            "postal_code": "V5C 2H6",
            "lat": 49.2812,
            "lng": -123.0156,
            "price": 2300,
            "bedrooms": 3,
            "bathrooms": 2,
            "sqft": 1100,
            "property_type": "Condo",
            "description": "Spacious 3BR in quiet Burnaby Heights. Great schools, parks, and easy access to Vancouver.",
            "amenities": ["Gym", "Playground", "Storage", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800"],
            "available_date": "2026-02-01",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "North Van Mountain View",
            "address": "145 East 13th St, Unit 702",
            "city": "North Vancouver",
            "province": "BC",
            "postal_code": "V7L 2L4",
            "lat": 49.3156,
            "lng": -123.0748,
            "price": 2750,
            "bedrooms": 2,
            "bathrooms": 2,
            "sqft": 980,
            "property_type": "Condo",
            "description": "Stunning mountain and city views! Near Lonsdale Quay and SeaBus. Perfect for outdoor enthusiasts.",
            "amenities": ["Gym", "Hot Tub", "BBQ Area", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
            "available_date": "2026-02-15",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Richmond City Centre Condo",
            "address": "6088 No.3 Rd, Unit 1505",
            "city": "Richmond",
            "province": "BC",
            "postal_code": "V6Y 4M3",
            "lat": 49.1667,
            "lng": -123.1367,
            "price": 2100,
            "bedrooms": 2,
            "bathrooms": 1,
            "sqft": 780,
            "property_type": "Condo",
            "description": "Central Richmond location. Steps to Richmond Centre mall and Canada Line. Great restaurants nearby!",
            "amenities": ["Gym", "Party Room", "Storage", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800"],
            "available_date": "2026-01-30",
            "pet_friendly": False,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "West End Beach Apartment",
            "address": "1845 Beach Ave, Unit 601",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6G 1Y9",
            "lat": 49.2856,
            "lng": -123.1412,
            "price": 2950,
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 720,
            "property_type": "Apartment",
            "description": "Beach living in the West End! Walk to English Bay and Stanley Park. Incredible sunsets from balcony.",
            "amenities": ["Ocean View", "Balcony", "Pool", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800"],
            "available_date": "2026-03-01",
            "pet_friendly": True,
            "parking": False,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Strathcona Artist Loft",
            "address": "678 Union St, Unit 205",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6A 2B8",
            "lat": 49.2789,
            "lng": -123.0892,
            "price": 1850,
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 750,
            "property_type": "Loft",
            "description": "Creative loft space in artsy Strathcona. High ceilings, lots of natural light. Near CRAB Park.",
            "amenities": ["High Ceilings", "Exposed Ductwork", "Bike Storage"],
            "images": ["https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800"],
            "available_date": "2026-02-01",
            "pet_friendly": True,
            "parking": False,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Metrotown Modern Tower",
            "address": "4720 Kingsway, Unit 2803",
            "city": "Burnaby",
            "province": "BC",
            "postal_code": "V5H 4N2",
            "lat": 49.2276,
            "lng": -123.0016,
            "price": 2200,
            "bedrooms": 2,
            "bathrooms": 2,
            "sqft": 900,
            "property_type": "Condo",
            "description": "Brand new tower at Metrotown! Steps to SkyTrain, Metropolis, and Crystal Mall.",
            "amenities": ["Gym", "Pool", "Games Room", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
            "available_date": "2026-02-15",
            "pet_friendly": False,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dunbar Family Duplex",
            "address": "3456 West 28th Ave",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6S 1S4",
            "lat": 49.2456,
            "lng": -123.1789,
            "price": 3800,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "sqft": 1800,
            "property_type": "Duplex",
            "description": "Upper duplex in sought-after Dunbar. Near top schools, parks, and shops. Bright and spacious!",
            "amenities": ["Private Entrance", "Deck", "Garage", "Washer/Dryer"],
            "images": ["https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800"],
            "available_date": "2026-03-15",
            "pet_friendly": True,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "False Creek Waterfront",
            "address": "1502 Marinaside Crescent, Unit 1801",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6Z 2W1",
            "lat": 49.2723,
            "lng": -123.1189,
            "price": 3600,
            "bedrooms": 2,
            "bathrooms": 2,
            "sqft": 1050,
            "property_type": "Condo",
            "description": "Waterfront living on False Creek! Watch the dragon boats from your balcony. Near seawall and Yaletown.",
            "amenities": ["Water View", "Gym", "Concierge", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?w=800"],
            "available_date": "2026-02-01",
            "pet_friendly": False,
            "parking": True,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "East Van Garden Suite",
            "address": "2345 East 12th Ave (Basement)",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V5N 2A2",
            "lat": 49.2598,
            "lng": -123.0656,
            "price": 1500,
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 550,
            "property_type": "Basement Suite",
            "description": "Cozy basement suite with separate entrance. Quiet neighborhood near Trout Lake. Utilities included!",
            "amenities": ["Private Entrance", "Utilities Included", "Shared Laundry"],
            "images": ["https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800"],
            "available_date": "2026-01-15",
            "pet_friendly": False,
            "parking": False,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.listings.insert_many(sample_listings)
    return {"message": f"Successfully seeded {len(sample_listings)} listings"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
