from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback for old plaintext passwords during migration
        return plain_password == hashed_password

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

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

    async def broadcast(self, message: str, user_ids: List[str]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()

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
    landlord_id: Optional[str] = None
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
    user_context: Optional[Dict[str, Any]] = None  # For lifestyle/budget info

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    user_type: str

class UserLogin(BaseModel):
    email: str
    password: str
    user_type: Optional[str] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    user_type: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Payment Models
class PaymentCreate(BaseModel):
    amount: float
    description: str
    property_id: Optional[str] = None
    recipient_id: Optional[str] = None

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    amount: float
    currency: str = "cad"
    description: str
    property_id: Optional[str] = None
    recipient_id: Optional[str] = None
    payment_status: str = "pending"
    status: str = "initiated"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Document Models
class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str  # lease, application, receipt, id, etc.
    content: Optional[str] = None  # base64 for small files
    url: Optional[str] = None
    status: str = "active"
    signed: bool = False
    signed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Message Models
class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    recipient_id: str
    content: str
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MessageCreate(BaseModel):
    recipient_id: str
    content: str

class ChatResponse(BaseModel):
    session_id: str
    response: str
    listings: List[dict] = []
    suggestions: List[str] = []  # Nova's proactive suggestions

# FCM Token Model for Push Notifications
class FCMTokenCreate(BaseModel):
    user_id: str
    token: str

class FCMToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    body: str
    notification_type: str  # message, payment, document, property
    data: Optional[Dict[str, Any]] = None

# Rental Application Models
class RentalApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    listing_id: str
    landlord_id: Optional[str] = None
    # Personal Info
    full_name: str
    email: str
    phone: str
    current_address: str
    move_in_date: str
    # Employment Info
    employer: Optional[str] = None
    job_title: Optional[str] = None
    monthly_income: Optional[float] = None
    employment_length: Optional[str] = None
    # References
    references: List[Dict[str, str]] = []
    # Additional
    num_occupants: int = 1
    has_pets: bool = False
    pet_details: Optional[str] = None
    additional_notes: Optional[str] = None
    # Status tracking
    status: str = "pending"  # pending, under_review, approved, rejected
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ApplicationCreate(BaseModel):
    listing_id: str
    full_name: str
    email: str
    phone: str
    current_address: str
    move_in_date: str
    employer: Optional[str] = None
    job_title: Optional[str] = None
    monthly_income: Optional[float] = None
    employment_length: Optional[str] = None
    references: List[Dict[str, str]] = []
    num_occupants: int = 1
    has_pets: bool = False
    pet_details: Optional[str] = None
    additional_notes: Optional[str] = None

# Maintenance Request Models
class MaintenanceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # tenant who submitted
    landlord_id: Optional[str] = None
    property_id: Optional[str] = None
    title: str
    description: str
    category: str  # plumbing, electrical, appliance, hvac, structural, pest, other
    priority: str = "medium"  # low, medium, high, emergency
    images: List[str] = []
    status: str = "open"  # open, in_progress, scheduled, completed, cancelled
    assigned_contractor_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    completed_date: Optional[str] = None
    cost: Optional[float] = None
    notes: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MaintenanceRequestCreate(BaseModel):
    property_id: Optional[str] = None
    title: str
    description: str
    category: str
    priority: str = "medium"
    images: List[str] = []

# Contractor Job Models
class ContractorJob(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    maintenance_request_id: Optional[str] = None
    landlord_id: str
    contractor_id: Optional[str] = None
    title: str
    description: str
    category: str
    location: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    status: str = "open"  # open, assigned, in_progress, completed, cancelled
    bids: List[Dict[str, Any]] = []
    selected_bid_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ContractorJobCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    maintenance_request_id: Optional[str] = None

class ContractorBid(BaseModel):
    contractor_id: str
    amount: float
    estimated_days: int
    message: str

# ========== ROUTES ==========

@api_router.get("/")
async def root():
    return {"message": "DOMMMA V2 API - Complete Real Estate Marketplace"}

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
    if bedrooms is not None:
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
async def create_listing_basic(listing: ListingCreate):
    listing_obj = Listing(**listing.model_dump())
    doc = listing_obj.model_dump()
    await db.listings.insert_one(doc)
    return listing_obj

# Auth Routes
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name or user_data.email.split('@')[0],
        user_type=user_data.user_type
    )
    user_doc = user.model_dump()
    user_doc['password'] = user_data.password
    user_doc['preferences'] = {}  # For Nova's memory
    await db.users.insert_one(user_doc)
    
    return {"id": user.id, "email": user.email, "name": user.name, "user_type": user.user_type}

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        user = User(
            email=login_data.email,
            name=login_data.email.split('@')[0],
            user_type=login_data.user_type or 'renter'
        )
        user_doc = user.model_dump()
        user_doc['password'] = login_data.password
        user_doc['preferences'] = {}
        await db.users.insert_one(user_doc)
        return {"id": user.id, "email": user.email, "name": user.name, "user_type": user.user_type}
    
    return {"id": user.get('id'), "email": user.get('email'), "name": user.get('name'), "user_type": user.get('user_type')}

# ========== STRIPE PAYMENT ROUTES ==========

RENT_PACKAGES = {
    "monthly": {"amount": 0, "description": "Monthly Rent Payment"},  # Amount set dynamically
}

@api_router.post("/payments/create-checkout")
async def create_payment_checkout(request: Request, payment: PaymentCreate):
    try:
        api_key = os.environ.get('STRIPE_API_KEY')
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        # Get origin from request headers
        origin = request.headers.get('origin', host_url)
        success_url = f"{origin}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/dashboard?payment=cancelled"
        
        checkout_request = CheckoutSessionRequest(
            amount=float(payment.amount),
            currency="cad",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "description": payment.description,
                "property_id": payment.property_id or "",
                "recipient_id": payment.recipient_id or ""
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create transaction record
        transaction = PaymentTransaction(
            session_id=session.session_id,
            amount=payment.amount,
            currency="cad",
            description=payment.description,
            property_id=payment.property_id,
            recipient_id=payment.recipient_id,
            payment_status="pending",
            status="initiated"
        )
        await db.payment_transactions.insert_one(transaction.model_dump())
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logger.error(f"Payment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(request: Request, session_id: str):
    try:
        api_key = os.environ.get('STRIPE_API_KEY')
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": status.status
            }}
        )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/history")
async def get_payment_history(user_id: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    payments = await db.payment_transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return payments

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        api_key = os.environ.get('STRIPE_API_KEY')
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}}
            )
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ========== DOCUMENT MANAGEMENT ROUTES ==========

@api_router.post("/documents/upload")
async def upload_document(
    user_id: str,
    name: str,
    doc_type: str,
    file: UploadFile = File(...)
):
    try:
        content = await file.read()
        content_b64 = base64.b64encode(content).decode('utf-8')
        
        doc = Document(
            user_id=user_id,
            name=name,
            type=doc_type,
            content=content_b64
        )
        await db.documents.insert_one(doc.model_dump())
        
        return {"id": doc.id, "name": doc.name, "type": doc.type, "status": "uploaded"}
        
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/documents/{user_id}")
async def get_user_documents(user_id: str, doc_type: Optional[str] = None):
    query = {"user_id": user_id, "status": "active"}
    if doc_type:
        query["type"] = doc_type
    
    docs = await db.documents.find(query, {"_id": 0, "content": 0}).to_list(100)
    return docs

@api_router.get("/documents/download/{doc_id}")
async def download_document(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@api_router.post("/documents/sign/{doc_id}")
async def sign_document(doc_id: str, user_id: str):
    result = await db.documents.update_one(
        {"id": doc_id},
        {"$set": {
            "signed": True,
            "signed_at": datetime.now(timezone.utc).isoformat(),
            "signed_by": user_id
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "signed", "signed_at": datetime.now(timezone.utc).isoformat()}

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    result = await db.documents.update_one(
        {"id": doc_id},
        {"$set": {"status": "deleted"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted"}

# ========== MESSAGING ROUTES ==========

@api_router.post("/messages/send")
async def send_message(sender_id: str, message: MessageCreate):
    msg = DirectMessage(
        sender_id=sender_id,
        recipient_id=message.recipient_id,
        content=message.content
    )
    await db.messages.insert_one(msg.model_dump())
    
    # Send via WebSocket if recipient is connected
    await manager.send_personal_message(
        json.dumps({
            "type": "new_message",
            "message": msg.model_dump()
        }),
        message.recipient_id
    )
    
    return {"id": msg.id, "status": "sent"}

@api_router.get("/messages/{user_id}")
async def get_messages(user_id: str, other_user_id: Optional[str] = None):
    if other_user_id:
        # Get conversation between two users
        query = {
            "$or": [
                {"sender_id": user_id, "recipient_id": other_user_id},
                {"sender_id": other_user_id, "recipient_id": user_id}
            ]
        }
    else:
        # Get all messages for user
        query = {
            "$or": [
                {"sender_id": user_id},
                {"recipient_id": user_id}
            ]
        }
    
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return messages

@api_router.get("/messages/conversations/{user_id}")
async def get_conversations(user_id: str):
    # Get unique conversation partners
    pipeline = [
        {"$match": {"$or": [{"sender_id": user_id}, {"recipient_id": user_id}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {
                "$cond": [
                    {"$eq": ["$sender_id", user_id]},
                    "$recipient_id",
                    "$sender_id"
                ]
            },
            "last_message": {"$first": "$content"},
            "last_time": {"$first": "$created_at"},
            "unread": {"$sum": {"$cond": [{"$and": [{"$eq": ["$recipient_id", user_id]}, {"$eq": ["$read", False]}]}, 1, 0]}}
        }}
    ]
    conversations = await db.messages.aggregate(pipeline).to_list(50)
    return [{"user_id": c["_id"], "last_message": c["last_message"], "last_time": c["last_time"], "unread": c["unread"]} for c in conversations]

@api_router.post("/messages/read/{message_id}")
async def mark_message_read(message_id: str):
    await db.messages.update_one({"id": message_id}, {"$set": {"read": True}})
    return {"status": "read"}

# WebSocket endpoint for real-time messaging
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                msg = DirectMessage(
                    sender_id=user_id,
                    recipient_id=message_data["recipient_id"],
                    content=message_data["content"]
                )
                await db.messages.insert_one(msg.model_dump())
                
                # Send to recipient
                await manager.send_personal_message(
                    json.dumps({"type": "new_message", "message": msg.model_dump()}),
                    message_data["recipient_id"]
                )
                
                # Confirm to sender
                await websocket.send_text(json.dumps({"type": "sent", "message_id": msg.id}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# ========== ENHANCED NOVA AI CHAT ==========

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
        f"- {listing['title']}: {listing['bedrooms']}bd/{listing['bathrooms']}ba, ${listing['price']}/mo, {listing['address']}, {listing['city']}, {listing['sqft']}sqft, Pet-friendly: {listing['pet_friendly']}, Type: {listing['property_type']}"
        for listing in listings
    ])
    
    # Build conversation context from history
    history_context = ""
    prev_messages = session.get("messages", [])[-6:]
    if prev_messages:
        history_context = "\n\nRecent conversation:\n" + "\n".join([
            f"{'User' if m['role'] == 'user' else 'Nova'}: {m['content'][:200]}"
            for m in prev_messages
        ])
    
    # User context for personalization
    user_context = request.user_context or {}
    lifestyle_info = ""
    if user_context:
        lifestyle_info = f"""
User Context:
- Budget: ${user_context.get('budget', 'Not specified')}/month
- Occupation: {user_context.get('occupation', 'Not specified')}
- Has Pets: {user_context.get('has_pets', 'Unknown')}
- Commute To: {user_context.get('commute_location', 'Not specified')}
- Preferences: {user_context.get('preferences', 'None specified')}
"""
    
    system_message = f"""You are Nova, DOMMMA's advanced AI real estate assistant. You help users with ALL aspects of real estate:

🏠 PROPERTY SEARCH
- Natural language search
- Lifestyle-based recommendations
- Commute optimization
- Neighborhood insights

💰 FINANCIAL HELP  
- Budget breakdown calculator
- Rent negotiation tips
- Hidden costs analysis
- Affordability advice (30% rule: rent should be max 30% of gross income)

📄 APPLICATION SUPPORT
- Rental resume tips
- Application optimization
- Document guidance

🏘️ NEIGHBORHOOD INTEL
- Safety insights
- Local amenities
- Community vibes
- Transit access

👥 COMMUNICATION
- Help draft messages to landlords
- Conflict resolution advice
- Negotiation strategies

Available Properties:
{listings_context}
{lifestyle_info}
{history_context}

IMPORTANT CAPABILITIES:
1. Budget Calculator: If user gives income, calculate max affordable rent (30% of gross monthly)
2. Lifestyle Search: Match properties to lifestyle (e.g., "I bike to work" → near bike routes)
3. Commute Analysis: Estimate commute times to key locations
4. Proactive Suggestions: Offer relevant tips based on conversation
5. Multi-turn Memory: Reference previous parts of the conversation

Keep responses helpful, conversational, and concise (2-3 paragraphs max).
End responses with 1-2 proactive suggestions when relevant."""

    suggestions = []
    
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"{session_id}-{uuid.uuid4().hex[:8]}",
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
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
        
        # Find mentioned listings
        mentioned_listings = []
        for listing in listings:
            if listing['title'].lower() in response.lower() or listing['city'].lower() in response.lower():
                mentioned_listings.append(listing)
        
        # Generate proactive suggestions based on context
        if "budget" in request.message.lower() or "afford" in request.message.lower():
            suggestions.append("💡 Would you like me to show properties within your budget?")
        if "pet" in request.message.lower():
            suggestions.append("🐾 I can filter for pet-friendly properties only")
        if any(word in request.message.lower() for word in ["commute", "work", "office"]):
            suggestions.append("🚇 I can find places with the best commute to your workplace")
        
        return ChatResponse(
            session_id=session_id,
            response=response,
            listings=mentioned_listings[:5],
            suggestions=suggestions[:3]
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            session_id=session_id,
            response="I'm having a moment! Let me help you - try asking about apartments in Vancouver, budget advice, or neighborhood recommendations! 🏠",
            listings=[],
            suggestions=["Try asking: 'What can I afford on $70k salary?'", "Try: 'Show me pet-friendly apartments near downtown'"]
        )

@api_router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# User Preferences for Nova Memory
@api_router.post("/user/preferences/{user_id}")
async def save_user_preferences(user_id: str, preferences: Dict[str, Any]):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"preferences": preferences}}
    )
    return {"status": "saved"}

@api_router.get("/user/preferences/{user_id}")
async def get_user_preferences(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("preferences", {})

# ========== FCM PUSH NOTIFICATIONS ==========

@api_router.post("/notifications/register-token")
async def register_fcm_token(token_data: FCMTokenCreate):
    """Register or update FCM token for a user"""
    existing = await db.fcm_tokens.find_one({"user_id": token_data.user_id})
    
    if existing:
        await db.fcm_tokens.update_one(
            {"user_id": token_data.user_id},
            {"$set": {"token": token_data.token, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        fcm_token = FCMToken(user_id=token_data.user_id, token=token_data.token)
        await db.fcm_tokens.insert_one(fcm_token.model_dump())
    
    return {"status": "registered"}

@api_router.post("/notifications/send")
async def send_notification(notification: NotificationCreate):
    """Send push notification to a user (for internal use)"""
    # Store notification in database
    notif_doc = {
        "id": str(uuid.uuid4()),
        "user_id": notification.user_id,
        "title": notification.title,
        "body": notification.body,
        "type": notification.notification_type,
        "data": notification.data,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif_doc)
    
    # Get user's FCM token
    token_doc = await db.fcm_tokens.find_one({"user_id": notification.user_id})
    
    # Note: For FCM sending, you would need firebase-admin SDK
    # For now, we'll send via WebSocket if user is connected
    await manager.send_personal_message(
        json.dumps({
            "type": "notification",
            "notification": {
                "title": notification.title,
                "body": notification.body,
                "type": notification.notification_type,
                "data": notification.data
            }
        }),
        notification.user_id
    )
    
    return {"status": "sent", "fcm_token_available": token_doc is not None}

@api_router.get("/notifications/{user_id}")
async def get_notifications(user_id: str, unread_only: bool = False):
    """Get notifications for a user"""
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifications

@api_router.post("/notifications/mark-read/{notification_id}")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    return {"status": "read"}

# ========== RENTAL APPLICATIONS ==========

@api_router.post("/applications", response_model=dict)
async def create_application(user_id: str, application: ApplicationCreate):
    """Submit a rental application"""
    # Get the listing to find the landlord
    listing = await db.listings.find_one({"id": application.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    app_obj = RentalApplication(
        user_id=user_id,
        listing_id=application.listing_id,
        landlord_id=listing.get("landlord_id"),
        full_name=application.full_name,
        email=application.email,
        phone=application.phone,
        current_address=application.current_address,
        move_in_date=application.move_in_date,
        employer=application.employer,
        job_title=application.job_title,
        monthly_income=application.monthly_income,
        employment_length=application.employment_length,
        references=application.references,
        num_occupants=application.num_occupants,
        has_pets=application.has_pets,
        pet_details=application.pet_details,
        additional_notes=application.additional_notes
    )
    
    await db.applications.insert_one(app_obj.model_dump())
    
    # Send notification to landlord if exists
    if listing.get("landlord_id"):
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": listing["landlord_id"],
            "title": "New Rental Application",
            "body": f"{application.full_name} applied for {listing['title']}",
            "type": "application",
            "data": {"application_id": app_obj.id, "listing_id": application.listing_id},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"id": app_obj.id, "status": "submitted"}

@api_router.get("/applications/user/{user_id}")
async def get_user_applications(user_id: str):
    """Get all applications submitted by a user"""
    applications = await db.applications.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Enrich with listing details
    for app in applications:
        listing = await db.listings.find_one({"id": app["listing_id"]}, {"_id": 0, "title": 1, "address": 1, "price": 1, "images": 1})
        app["listing"] = listing
    
    return applications

@api_router.get("/applications/landlord/{landlord_id}")
async def get_landlord_applications(landlord_id: str, status: Optional[str] = None):
    """Get all applications for a landlord's properties"""
    query = {"landlord_id": landlord_id}
    if status:
        query["status"] = status
    
    applications = await db.applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with listing details
    for app in applications:
        listing = await db.listings.find_one({"id": app["listing_id"]}, {"_id": 0, "title": 1, "address": 1})
        app["listing"] = listing
    
    return applications

@api_router.put("/applications/{application_id}/status")
async def update_application_status(application_id: str, status: str, landlord_id: str):
    """Update application status (landlord only)"""
    if status not in ["pending", "under_review", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notify the applicant
    status_messages = {
        "under_review": "Your application is being reviewed",
        "approved": "Congratulations! Your application has been approved! 🎉",
        "rejected": "Your application status has been updated"
    }
    
    if status in status_messages:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": app["user_id"],
            "title": f"Application {status.replace('_', ' ').title()}",
            "body": status_messages[status],
            "type": "application",
            "data": {"application_id": application_id, "status": status},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"status": "updated"}

# ========== MAINTENANCE REQUESTS ==========

@api_router.post("/maintenance", response_model=dict)
async def create_maintenance_request(user_id: str, request: MaintenanceRequestCreate):
    """Submit a maintenance request"""
    maint_req = MaintenanceRequest(
        user_id=user_id,
        property_id=request.property_id,
        title=request.title,
        description=request.description,
        category=request.category,
        priority=request.priority,
        images=request.images
    )
    
    # Try to find the landlord from property
    if request.property_id:
        listing = await db.listings.find_one({"id": request.property_id}, {"_id": 0})
        if listing and listing.get("landlord_id"):
            maint_req.landlord_id = listing["landlord_id"]
            
            # Notify landlord
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": listing["landlord_id"],
                "title": f"New Maintenance Request - {request.priority.upper()}",
                "body": request.title,
                "type": "maintenance",
                "data": {"request_id": maint_req.id, "priority": request.priority},
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    await db.maintenance_requests.insert_one(maint_req.model_dump())
    
    return {"id": maint_req.id, "status": "submitted"}

@api_router.get("/maintenance/user/{user_id}")
async def get_user_maintenance_requests(user_id: str, status: Optional[str] = None):
    """Get maintenance requests submitted by a user"""
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    requests = await db.maintenance_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return requests

@api_router.get("/maintenance/landlord/{landlord_id}")
async def get_landlord_maintenance_requests(landlord_id: str, status: Optional[str] = None):
    """Get all maintenance requests for a landlord's properties"""
    query = {"landlord_id": landlord_id}
    if status:
        query["status"] = status
    
    requests = await db.maintenance_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return requests

@api_router.put("/maintenance/{request_id}")
async def update_maintenance_request(request_id: str, updates: Dict[str, Any]):
    """Update maintenance request status, assign contractor, etc."""
    allowed_fields = ["status", "assigned_contractor_id", "scheduled_date", "completed_date", "cost", "notes"]
    update_dict = {k: v for k, v in updates.items() if k in allowed_fields}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.maintenance_requests.update_one(
        {"id": request_id},
        {"$set": update_dict}
    )
    
    # Get request for notification
    req = await db.maintenance_requests.find_one({"id": request_id}, {"_id": 0})
    
    # Notify tenant of status change
    if req and "status" in updates:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": req["user_id"],
            "title": "Maintenance Update",
            "body": f"Your request '{req['title']}' is now {updates['status']}",
            "type": "maintenance",
            "data": {"request_id": request_id, "status": updates["status"]},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"status": "updated"}

# ========== CONTRACTOR JOBS ==========

@api_router.post("/jobs", response_model=dict)
async def create_contractor_job(landlord_id: str, job: ContractorJobCreate):
    """Create a job posting for contractors"""
    job_obj = ContractorJob(
        landlord_id=landlord_id,
        maintenance_request_id=job.maintenance_request_id,
        title=job.title,
        description=job.description,
        category=job.category,
        location=job.location,
        budget_min=job.budget_min,
        budget_max=job.budget_max,
        deadline=job.deadline
    )
    
    await db.contractor_jobs.insert_one(job_obj.model_dump())
    
    return {"id": job_obj.id, "status": "created"}

@api_router.get("/jobs")
async def get_contractor_jobs(
    category: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None
):
    """Get available contractor jobs"""
    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    else:
        query["status"] = "open"  # Default to open jobs
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    jobs = await db.contractor_jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return jobs

@api_router.get("/jobs/landlord/{landlord_id}")
async def get_landlord_jobs(landlord_id: str):
    """Get jobs posted by a landlord"""
    jobs = await db.contractor_jobs.find({"landlord_id": landlord_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return jobs

@api_router.get("/jobs/contractor/{contractor_id}")
async def get_contractor_assigned_jobs(contractor_id: str):
    """Get jobs assigned to a contractor"""
    jobs = await db.contractor_jobs.find({"contractor_id": contractor_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return jobs

@api_router.post("/jobs/{job_id}/bid")
async def submit_bid(job_id: str, bid: ContractorBid):
    """Submit a bid for a job"""
    job = await db.contractor_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is not accepting bids")
    
    bid_doc = {
        "id": str(uuid.uuid4()),
        "contractor_id": bid.contractor_id,
        "amount": bid.amount,
        "estimated_days": bid.estimated_days,
        "message": bid.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.contractor_jobs.update_one(
        {"id": job_id},
        {"$push": {"bids": bid_doc}}
    )
    
    # Notify landlord of new bid
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": job["landlord_id"],
        "title": "New Bid Received",
        "body": f"${bid.amount} bid on '{job['title']}'",
        "type": "bid",
        "data": {"job_id": job_id, "bid_id": bid_doc["id"], "amount": bid.amount},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"bid_id": bid_doc["id"], "status": "submitted"}

@api_router.post("/jobs/{job_id}/select-bid")
async def select_bid(job_id: str, bid_id: str, landlord_id: str):
    """Select a winning bid for a job"""
    job = await db.contractor_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["landlord_id"] != landlord_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Find the selected bid
    selected_bid = None
    for bid in job.get("bids", []):
        if bid["id"] == bid_id:
            selected_bid = bid
            break
    
    if not selected_bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    await db.contractor_jobs.update_one(
        {"id": job_id},
        {"$set": {
            "status": "assigned",
            "contractor_id": selected_bid["contractor_id"],
            "selected_bid_id": bid_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify the winning contractor
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": selected_bid["contractor_id"],
        "title": "Congratulations! Your bid was accepted! 🎉",
        "body": f"You won the job: {job['title']}",
        "type": "job",
        "data": {"job_id": job_id},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"status": "assigned", "contractor_id": selected_bid["contractor_id"]}

# ========== PROPERTY MANAGEMENT (LANDLORD) ==========

@api_router.post("/listings/create")
async def create_listing(landlord_id: str, listing: ListingCreate):
    """Create a new property listing (landlord only)"""
    listing_obj = Listing(
        **listing.model_dump(),
        landlord_id=landlord_id
    )
    
    await db.listings.insert_one(listing_obj.model_dump())
    
    return {"id": listing_obj.id, "status": "created"}

@api_router.get("/listings/landlord/{landlord_id}")
async def get_landlord_listings(landlord_id: str, status: Optional[str] = None):
    """Get all listings owned by a landlord"""
    query = {"landlord_id": landlord_id}
    if status:
        query["status"] = status
    
    listings = await db.listings.find(query, {"_id": 0}).to_list(100)
    return listings

@api_router.put("/listings/{listing_id}")
async def update_listing(listing_id: str, landlord_id: str, updates: Dict[str, Any]):
    """Update a listing (landlord only)"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.get("landlord_id") != landlord_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["title", "description", "price", "status", "available_date", "amenities", "images", "pet_friendly", "parking"]
    update_dict = {k: v for k, v in updates.items() if k in allowed_fields}
    
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": update_dict}
    )
    
    return {"status": "updated"}

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, landlord_id: str):
    """Delete a listing (landlord only)"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.get("landlord_id") != landlord_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Soft delete
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"status": "deleted"}}
    )
    
    return {"status": "deleted"}

# Seed Data Route
@api_router.post("/seed")
async def seed_data():
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
            "description": "Stunning views from this 25th floor condo. Near SkyTrain, gyms, and coffee shops. 10 min walk to Waterfront Station.",
            "amenities": ["Gym", "Rooftop Deck", "Concierge", "In-suite Laundry", "Bike Storage"],
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
            "description": "Beautiful character home in family-friendly Kitsilano. 5 min walk to Kits Beach, dog parks nearby. Great for remote workers with natural light.",
            "amenities": ["Backyard", "Garage", "Fireplace", "Washer/Dryer", "Home Office"],
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
            "description": "Industrial loft in trendy Yaletown. 16ft ceilings, exposed brick. Walk to seawall, restaurants. Perfect for young professionals.",
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
            "description": "Bright studio in hip Mount Pleasant. Steps to Main Street shops, breweries, and coffee. Great for students or minimalists.",
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
            "description": "Breathtaking water and mountain views! Steps to Stanley Park seawall. High-end finishes, perfect for executives.",
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
            "description": "Spacious townhouse near Commercial Drive. Italian cafes, indie shops nearby. Close to SkyTrain. Great for families!",
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
            "description": "Historic Gastown building. Exposed brick, high ceilings. Walk to Waterfront Station, nightlife, restaurants.",
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
            "description": "Spacious family home near UBC. Excellent schools, quiet street. 15 min to campus, close to Pacific Spirit Park.",
            "amenities": ["Large Yard", "Double Garage", "Fireplace", "Deck", "Home Office"],
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
            "description": "Bright corner unit in Olympic Village. On seawall, near Science World. Perfect for active lifestyle - bike paths everywhere!",
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
            "description": "Beach living in the West End! Walk to English Bay and Stanley Park. Incredible sunsets from balcony. Dog-friendly building!",
            "amenities": ["Ocean View", "Balcony", "Pool", "In-suite Laundry"],
            "images": ["https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800"],
            "available_date": "2026-03-01",
            "pet_friendly": True,
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
