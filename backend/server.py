from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json
import base64
from anthropic import AsyncAnthropic
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from passlib.context import CryptContext
import asyncio

# Shared modules
from db import db, client
from services.email import send_email, email_welcome, email_booking_confirmed, email_application_update, email_offer_received

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
    available_date: str = ""
    pet_friendly: bool = False
    parking: bool = False
    landlord_id: Optional[str] = None
    listing_type: str = "rent"  # rent, sale
    sale_price: Optional[int] = None
    year_built: Optional[int] = None
    lot_size: Optional[int] = None
    garage: Optional[int] = None
    mls_number: Optional[str] = None
    open_house_dates: List[str] = []
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
    available_date: str = ""
    pet_friendly: bool = False
    parking: bool = False
    listing_type: str = "rent"
    sale_price: Optional[int] = None
    year_built: Optional[int] = None
    lot_size: Optional[int] = None
    garage: Optional[int] = None
    mls_number: Optional[str] = None
    open_house_dates: List[str] = []
    lease_duration: Optional[int] = 12  # New: lease duration in months
    offers: List[str] = []  # New: special offers/promotions

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
    user_id: Optional[str] = None  # For logged-in users to enable long-term memory
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
    preferences_loaded: bool = False  # Whether user's saved preferences were loaded

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

# Contractor Profile Models
class ContractorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    business_name: str
    description: str = ""
    specialties: List[str] = []
    service_areas: List[str] = []
    hourly_rate: Optional[float] = None
    years_experience: int = 0
    license_number: Optional[str] = None
    insurance: bool = False
    portfolio_images: List[str] = []
    avatar: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0
    completed_jobs: int = 0
    verified: bool = False
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ContractorProfileCreate(BaseModel):
    business_name: str
    description: str = ""
    specialties: List[str] = []
    service_areas: List[str] = []
    hourly_rate: Optional[float] = None
    years_experience: int = 0
    license_number: Optional[str] = None
    insurance: bool = False
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

# Contractor Service Models
class ContractorService(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contractor_id: str
    title: str
    description: str
    category: str
    price_type: str = "fixed"  # fixed, hourly, quote
    price: Optional[float] = None
    duration_estimate: Optional[str] = None
    images: List[str] = []
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ContractorServiceCreate(BaseModel):
    title: str
    description: str
    category: str
    price_type: str = "fixed"
    price: Optional[float] = None
    duration_estimate: Optional[str] = None

# Service Booking Models
class ServiceBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    contractor_id: str
    service_id: Optional[str] = None
    title: str
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address: str = ""
    status: str = "pending"  # pending, confirmed, in_progress, completed, cancelled
    amount: Optional[float] = None
    payment_status: str = "unpaid"  # unpaid, paid, refunded
    payment_session_id: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ServiceBookingCreate(BaseModel):
    contractor_id: str
    service_id: Optional[str] = None
    title: str
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address: str = ""
    notes: Optional[str] = None

class ReviewCreate(BaseModel):
    rating: int
    review: str

# Property Offer Model (Buy/Sell)
class PropertyOffer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    buyer_id: str
    seller_id: str
    offer_amount: int
    conditions: List[str] = []
    financing_type: str = "mortgage"  # mortgage, cash, pre-approved
    closing_date: Optional[str] = None
    message: Optional[str] = None
    status: str = "pending"  # pending, accepted, rejected, countered, withdrawn
    counter_amount: Optional[int] = None
    counter_message: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OfferCreate(BaseModel):
    listing_id: str
    offer_amount: int
    conditions: List[str] = []
    financing_type: str = "mortgage"
    closing_date: Optional[str] = None
    message: Optional[str] = None

# Roommate Finder Models
class RoommateProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str = ""
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    budget_min: int = 500
    budget_max: int = 2000
    move_in_date: Optional[str] = None
    preferred_areas: List[str] = []
    lifestyle: List[str] = []  # early_bird, night_owl, quiet, social, clean, etc.
    pets: bool = False
    smoking: bool = False
    bio: str = ""
    avatar: Optional[str] = None
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RoommateProfileCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    budget_min: int = 500
    budget_max: int = 2000
    move_in_date: Optional[str] = None
    preferred_areas: List[str] = []
    lifestyle: List[str] = []
    pets: bool = False
    smoking: bool = False
    bio: str = ""

# ========== ROUTES ==========

@api_router.get("/")
async def root():
    return {"message": "DOMMMA V3 API - Complete Real Estate Marketplace"}

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
    pet_friendly: Optional[bool] = None,
    parking: Optional[bool] = None,
    listing_type: Optional[str] = None,
    q: Optional[str] = None
):
    query = {"status": "active"}
    if listing_type:
        query["listing_type"] = listing_type
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
    if parking is not None:
        query["parking"] = parking
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"address": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]
    
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
    user_doc['password_hash'] = hash_password(user_data.password)
    user_doc['preferences'] = {}  # For Nova's memory
    await db.users.insert_one(user_doc)
    
    # Send welcome email (non-blocking)
    asyncio.create_task(send_email(
        user.email,
        "Welcome to DOMMMA!",
        email_welcome(user.name, user.user_type)
    ))
    
    return {"id": user.id, "email": user.email, "name": user.name, "user_type": user.user_type}

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        # Create new user with hashed password
        user = User(
            email=login_data.email,
            name=login_data.email.split('@')[0],
            user_type=login_data.user_type or 'renter'
        )
        user_doc = user.model_dump()
        user_doc['password_hash'] = hash_password(login_data.password)
        user_doc['preferences'] = {}
        await db.users.insert_one(user_doc)
        return {"id": user.id, "email": user.email, "name": user.name, "user_type": user.user_type}
    
    # Verify password (supports both hashed and legacy plaintext)
    stored_password = user.get('password_hash') or user.get('password', '')
    if not verify_password(login_data.password, stored_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Migrate old plaintext password to hashed if needed
    if 'password' in user and 'password_hash' not in user:
        await db.users.update_one(
            {"email": login_data.email},
            {"$set": {"password_hash": hash_password(login_data.password)}, "$unset": {"password": ""}}
        )
    
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
    user_id = request.user_id  # Get user_id if logged in
    
    # Get or create chat session
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        session = {"id": session_id, "messages": [], "created_at": datetime.now(timezone.utc).isoformat(), "user_id": user_id}
        await db.chat_sessions.insert_one(session)
    
    # Get available listings for context - fetch ALL active listings
    listings = await db.listings.find({"status": "active"}, {"_id": 0}).to_list(200)
    
    # Build clear context with CITY, OFFERS prominently displayed
    listings_context = "\n".join([
        f"- ID:{listing['id']} | CITY: {listing.get('city', 'Vancouver')} | {listing['title']}: {listing.get('bedrooms', 0)}bd/{listing.get('bathrooms', 1)}ba, ${listing.get('price', 0)}/mo, {listing.get('address', '')}, {listing.get('sqft', 0)}sqft, Pet-friendly: {listing.get('pet_friendly', False)}, Type: {listing.get('property_type', 'Apartment')}, Listing: {listing.get('listing_type', 'rent')}, Lease: {listing.get('lease_duration', 12)} months, OFFERS: {', '.join(listing.get('offers', [])) if listing.get('offers') else 'None'}"
        for listing in listings
    ])
    
    # Get contractors for context
    contractors = await db.contractor_profiles.find({"status": "active"}, {"_id": 0}).to_list(50)
    contractors_context = "\n".join([
        f"- CONTRACTOR ID:{c['id']} | {c.get('company_name', 'Unknown')} | Specialties: {', '.join(c.get('specialties', []))} | Rate: ${c.get('hourly_rate', 0)}/hr | Rating: {c.get('rating', 0)}/5 | Verified: {c.get('verified', False)}"
        for c in contractors
    ])
    
    # Log for debugging
    cities = {}
    for l in listings:
        c = l.get('city', 'Unknown')
        cities[c] = cities.get(c, 0) + 1
    logger.info(f"Chat context: {len(listings)} listings, cities: {cities}, {len(contractors)} contractors")
    
    # Build conversation context from history
    history_context = ""
    prev_messages = session.get("messages", [])[-6:]
    if prev_messages:
        history_context = "\n\nRecent conversation:\n" + "\n".join([
            f"{'User' if m['role'] == 'user' else 'Nova'}: {m['content'][:200]}"
            for m in prev_messages
        ])
    
    # Load long-term user memory if logged in
    long_term_memory = ""
    user_preferences_loaded = False
    if user_id:
        from services.nova_memory import NovaMemoryService
        memory_service = NovaMemoryService(db)
        memory_context = await memory_service.get_context_summary(user_id)
        if memory_context:
            long_term_memory = f"\n\n{memory_context}"
            user_preferences_loaded = True
    
    # User context for personalization (from manual input)
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

🔧 CONTRACTOR/SERVICE SEARCH
- Find plumbers, electricians, painters, cleaners, etc.
- Match users with verified contractors
- Provide contractor recommendations based on specialty

🎁 SPECIAL OFFERS
- Highlight listings with special offers (free rent, free wifi, etc.)
- When user asks about deals/offers, show listings with OFFERS field filled

Available Properties in Database (include ID when recommending):
{listings_context if listings_context else "No listings currently available."}

Available Contractors in Database (include ID when recommending):
{contractors_context if contractors_context else "No contractors currently available."}
{lifestyle_info}
{long_term_memory}
{history_context}

IMPORTANT CAPABILITIES:
1. Budget Calculator: If user gives income, calculate max affordable rent (30% of gross monthly)
2. Lifestyle Search: Match properties to lifestyle (e.g., "I bike to work" → near bike routes)
3. Commute Analysis: Estimate commute times to key locations
4. Proactive Suggestions: Offer relevant tips based on conversation
5. Multi-turn Memory: Reference previous parts of the conversation
6. Long-term Memory: If user context shows saved preferences, USE THEM to personalize recommendations
7. Contractor Search: When user needs a plumber, electrician, cleaner, etc., search the contractors list and recommend

CRITICAL - LOCATION AWARENESS:
- We have listings in MULTIPLE CITIES: Vancouver, Coquitlam, Burnaby, Richmond, Surrey, and other Metro Vancouver areas
- When user asks about a specific city (e.g., "anything in Coquitlam?"), search the listings above by the CITY field
- ALWAYS check the CITY field in each listing - it's clearly marked as "CITY: [city name]"
- If we have properties in that city, SHOW THEM. If not, be honest and suggest nearby areas.

CRITICAL - OFFERS/DEALS:
- When user asks for "deals", "offers", "promotions", or "specials", look for listings with OFFERS field
- Highlight listings that have offers like "1 month free rent", "Free WiFi", etc.
- Example: "Here's a great deal: [Yaletown Loft](property:123) - 1 month free rent!"

CRITICAL - CONTRACTOR SEARCH:
- When user says "I need a plumber" or "looking for electrician", search the contractors list
- Recommend contractors by specialty, rating, and hourly rate
- Format: "[Company Name](contractor:ID)" to make it clickable
- Example: "I found [Plumbing Pro](contractor:abc) - $80/hr, 4.8★, verified"

CRITICAL - WHEN RECOMMENDING PROPERTIES:
- Always reference the property ID from the database above
- Format property recommendations with their ID like: "[Property Name](property:ID)"
- Example: "I recommend [Modern Downtown Condo](property:abc123) - it's perfect for your needs"
- This allows users to click and view the property directly
- If no properties match, say so honestly and suggest broadening the search
- If user has saved preferences (pet-friendly, budget, area), prioritize those matches

Keep responses helpful, conversational, and concise (2-3 paragraphs max).
End responses with 1-2 proactive suggestions when relevant."""

    suggestions = []
    
    try:
        # Use direct Anthropic SDK
        anthropic_client = AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        
        # Build messages array with conversation history
        messages = []
        prev_messages = session.get("messages", [])[-6:]
        for m in prev_messages:
            messages.append({"role": m['role'] if m['role'] != 'assistant' else 'assistant', "content": m['content'][:500]})
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})
        
        # Call Claude API
        claude_response = await anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=system_message,
            messages=messages
        )
        
        response = claude_response.content[0].text
        
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
        
        # Store interaction and extract preferences for logged-in users
        if user_id:
            from services.nova_memory import NovaMemoryService
            memory_service = NovaMemoryService(db)
            await memory_service.store_interaction(
                user_id=user_id,
                message=request.message,
                response=response,
                context=user_context
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
            suggestions=suggestions[:3],
            preferences_loaded=user_preferences_loaded
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            session_id=session_id,
            response="I'm having a moment! Let me help you - try asking about apartments in Vancouver, budget advice, or neighborhood recommendations! 🏠",
            listings=[],
            suggestions=["Try asking: 'What can I afford on $70k salary?'", "Try: 'Show me pet-friendly apartments near downtown'"],
            preferences_loaded=False
        )

@api_router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ========== AI CONCIERGE WITH TOOL CALLING ==========

class ConciergeRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    user_id: Optional[str] = None
    user_context: Optional[Dict[str, Any]] = None

class ConciergeResponse(BaseModel):
    session_id: str
    response: str
    tool_results: Optional[List[Dict[str, Any]]] = None
    listings: Optional[List[Dict[str, Any]]] = None
    contractors: Optional[List[Dict[str, Any]]] = None
    suggestions: Optional[List[str]] = None

@api_router.post("/ai/concierge", response_model=ConciergeResponse)
async def ai_concierge(request: ConciergeRequest):
    """
    AI Concierge endpoint with Claude tool calling.
    Handles structured actions like creating listings, searching, scheduling viewings.
    """
    from services.ai_tools import AIToolsService, NOVA_TOOLS
    
    session_id = request.session_id or str(uuid.uuid4())
    user_id = request.user_id
    
    # Get or create chat session
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        session = {
            "id": session_id, 
            "messages": [], 
            "created_at": datetime.now(timezone.utc).isoformat(), 
            "user_id": user_id,
            "mode": "concierge"
        }
        await db.chat_sessions.insert_one(session)
    
    # Initialize tools service
    tools_service = AIToolsService(db)
    
    # Get context for system prompt
    listings = await db.listings.find({"status": "active"}, {"_id": 0}).to_list(50)
    contractors = await db.contractor_profiles.find({"status": "active"}, {"_id": 0}).to_list(30)
    
    # Build context summaries
    listings_summary = f"Currently {len(listings)} active listings in database."
    contractors_summary = f"Currently {len(contractors)} active contractors available."
    
    # Get user info if logged in
    user_info = ""
    if user_id:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user:
            user_info = f"\nUser: {user.get('name', 'Unknown')} ({user.get('role', 'renter')})"
    
    system_message = f"""You are Nova, DOMMMA's AI real estate concierge. You help users with all aspects of real estate through natural conversation.

You have access to tools that let you take real actions:
- **create_listing**: Create property listings for landlords
- **search_listings**: Find properties based on criteria
- **find_contractors**: Find plumbers, electricians, cleaners, etc.
- **triage_maintenance**: Handle maintenance requests
- **calculate_budget**: Help users understand what they can afford
- **schedule_viewing**: Book property viewings

WHEN TO USE TOOLS:
- User says "I want to list my apartment" → Use create_listing (gather details first if needed)
- User says "Find me a 2 bedroom under $2500" → Use search_listings
- User says "I need a plumber" → Use find_contractors
- User says "My sink is leaking" → Use triage_maintenance
- User says "What can I afford on $80k" → Use calculate_budget
- User says "I want to see this property" → Use schedule_viewing

RESPONSE FORMAT:
- After using create_listing, format the result as: [Listing Title](property:LISTING_ID)
- After using find_contractors, format each as: [Contractor Name](contractor:CONTRACTOR_ID)
- Be conversational and helpful
- If you need more info to use a tool, ask for it naturally

{user_info}
{listings_summary}
{contractors_summary}

Keep responses concise and action-oriented. You're a helpful concierge that gets things done!"""

    try:
        anthropic_client = AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        
        # Build messages from history (only text content, skip tool results to avoid tool_use/tool_result pairing issues)
        messages = []
        prev_messages = session.get("messages", [])[-6:]  # Reduced to avoid long context issues
        for m in prev_messages:
            # Only include simple text messages
            content = m.get('content', '')
            if isinstance(content, str) and content:
                messages.append({
                    "role": m['role'], 
                    "content": content[:500]
                })
        
        # Add current message
        messages.append({"role": "user", "content": request.message})
        
        # Initial Claude call with tools
        response = await anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2048,
            system=system_message,
            tools=NOVA_TOOLS,
            messages=messages
        )
        
        tool_results = []
        final_response = ""
        result_listings = []
        result_contractors = []
        
        # Process response - may include tool calls
        max_tool_iterations = 5  # Prevent infinite loops
        iteration = 0
        
        while response.stop_reason == "tool_use" and iteration < max_tool_iterations:
            iteration += 1
            # Find ALL tool use blocks in this response
            tool_use_blocks = []
            text_content = ""
            
            for block in response.content:
                if block.type == "tool_use":
                    tool_use_blocks.append(block)
                elif block.type == "text":
                    text_content = block.text
            
            if tool_use_blocks:
                # Build assistant content with all tool uses
                assistant_content = []
                if text_content:
                    assistant_content.append({"type": "text", "text": text_content})
                
                tool_result_content = []
                
                for tool_use_block in tool_use_blocks:
                    # Add tool use to assistant content
                    assistant_content.append({
                        "type": "tool_use",
                        "id": tool_use_block.id,
                        "name": tool_use_block.name,
                        "input": tool_use_block.input
                    })
                    
                    # Execute the tool
                    tool_name = tool_use_block.name
                    tool_input = tool_use_block.input
                    tool_id = tool_use_block.id
                    
                    logger.info(f"Executing tool: {tool_name}")
                    result = await tools_service.execute_tool(tool_name, tool_input, user_id)
                    tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "result": result
                    })
                    
                    # Collect listings/contractors from results
                    if result.get("listings"):
                        result_listings.extend(result["listings"])
                    if result.get("contractors"):
                        result_contractors.extend(result["contractors"])
                    if result.get("listing"):
                        result_listings.append(result["listing"])
                    if result.get("suggested_contractors"):
                        for c in result["suggested_contractors"]:
                            result_contractors.append(c)
                    
                    # Add tool result
                    tool_result_content.append({
                        "type": "tool_result",
                        "tool_use_id": tool_id,
                        "content": json.dumps(result)
                    })
                
                # Add assistant message with all tool uses
                messages.append({"role": "assistant", "content": assistant_content})
                # Add user message with all tool results
                messages.append({"role": "user", "content": tool_result_content})
                
                # Get Claude's interpretation of the result
                response = await anthropic_client.messages.create(
                    model="claude-sonnet-4-5-20250929",
                    max_tokens=2048,
                    system=system_message,
                    tools=NOVA_TOOLS,
                    messages=messages
                )
        
        # Extract final text response
        for block in response.content:
            if hasattr(block, 'text'):
                final_response = block.text
                break
        
        # Save messages to session
        await db.chat_sessions.update_one(
            {"id": session_id},
            {"$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
                        {"role": "assistant", "content": final_response, "timestamp": datetime.now(timezone.utc).isoformat(), "tool_results": tool_results}
                    ]
                }
            }}
        )
        
        # Generate suggestions
        suggestions = []
        if not tool_results:
            if "list" in request.message.lower() or "rent out" in request.message.lower():
                suggestions.append("💡 I can help you create a listing - just say 'I want to list my property'")
            if "find" in request.message.lower() or "search" in request.message.lower():
                suggestions.append("🏠 Tell me your requirements and I'll search for matching properties")
        
        return ConciergeResponse(
            session_id=session_id,
            response=final_response,
            tool_results=tool_results if tool_results else None,
            listings=result_listings if result_listings else None,
            contractors=result_contractors if result_contractors else None,
            suggestions=suggestions if suggestions else None
        )
        
    except Exception as e:
        logger.error(f"Concierge error: {e}")
        import traceback
        traceback.print_exc()
        return ConciergeResponse(
            session_id=session_id,
            response="I'm having a moment! Let me help you - try asking me to find apartments, create a listing, or connect you with a contractor.",
            tool_results=None,
            listings=None,
            contractors=None,
            suggestions=["Try: 'I want to list my 2 bedroom apartment'", "Try: 'Find me a plumber'"]
        )

# Nova Memory endpoint - Get saved preferences for a user
@api_router.get("/nova/memory/{user_id}")
async def get_nova_memory(user_id: str):
    """Get Nova's memory of user preferences for display in chat"""
    from services.nova_memory import NovaMemoryService
    memory_service = NovaMemoryService(db)
    memory = await memory_service.get_user_memory(user_id)
    context_summary = await memory_service.get_context_summary(user_id)
    return {
        "preferences": memory.get("preferences", {}),
        "context_summary": context_summary,
        "has_preferences": bool(memory.get("preferences"))
    }

# User Preferences for Nova Memory
@api_router.post("/user/preferences/{user_id}")
async def save_user_preferences(user_id: str, preferences: Dict[str, Any]):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"preferences": preferences}}
    )
    return {"status": "saved"}

# ========== RENTER RESUME ENDPOINTS ==========

class RenterResumeInput(BaseModel):
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    employment: Optional[Dict[str, Any]] = None
    rental_history: Optional[Dict[str, Any]] = None
    household: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None

@api_router.get("/renter-resume/{user_id}")
async def get_renter_resume(user_id: str):
    """Get a renter's resume/profile"""
    resume = await db.renter_resumes.find_one({"user_id": user_id}, {"_id": 0})
    
    if not resume:
        return {
            "has_resume": False,
            "message": "No renter resume found"
        }
    
    return {
        "has_resume": True,
        "resume": resume
    }

@api_router.post("/renter-resume")
async def save_renter_resume(data: RenterResumeInput):
    """Create or update a renter resume"""
    user_id = data.user_id
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    
    # Check if resume exists
    existing = await db.renter_resumes.find_one({"user_id": user_id})
    
    # Calculate completeness score
    fields_filled = 0
    total_fields = 10
    if data.full_name:
        fields_filled += 1
    if data.email:
        fields_filled += 1
    if data.phone:
        fields_filled += 1
    if data.employment and data.employment.get('status'):
        fields_filled += 1
    if data.employment and data.employment.get('employer'):
        fields_filled += 1
    if data.employment and data.employment.get('annual_income'):
        fields_filled += 1
    if data.rental_history and data.rental_history.get('current_address'):
        fields_filled += 1
    if data.rental_history and data.rental_history.get('previous_landlord', {}).get('name'):
        fields_filled += 1
    if data.household and data.household.get('num_occupants'):
        fields_filled += 1
    if data.preferences and data.preferences.get('move_in_date'):
        fields_filled += 1
    
    completeness_score = round((fields_filled / total_fields) * 100)
    
    resume_data = {
        "user_id": user_id,
        "full_name": data.full_name or "",
        "email": data.email or "",
        "phone": data.phone or "",
        "employment": data.employment or {},
        "rental_history": data.rental_history or {},
        "household": data.household or {"num_occupants": 1},
        "preferences": data.preferences or {},
        "completeness_score": completeness_score,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.renter_resumes.update_one(
            {"user_id": user_id},
            {"$set": resume_data}
        )
    else:
        resume_data["id"] = str(uuid.uuid4())
        resume_data["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.renter_resumes.insert_one(resume_data)
    
    return {"status": "saved", "completeness_score": completeness_score}

@api_router.get("/user/preferences/{user_id}")
async def get_user_preferences(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("preferences", {})

# ========== LEASE ASSIGNMENT MARKETPLACE ==========

class LeaseAssignmentInput(BaseModel):
    title: Optional[str] = None
    address: str
    city: str = "Vancouver"
    current_rent: float
    market_rent: Optional[float] = None
    assignment_fee: float
    remaining_months: int
    available_date: Optional[str] = None
    bedrooms: int = 1
    bathrooms: float = 1
    sqft: Optional[int] = None
    amenities: List[str] = []
    pet_friendly: bool = False
    description: Optional[str] = None
    reason: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    images: List[str] = []

@api_router.get("/lease-assignments")
async def get_lease_assignments(city: Optional[str] = None, min_savings: Optional[int] = None):
    """Get all active lease assignments"""
    query = {"status": "active"}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    assignments = await db.lease_assignments.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Calculate savings for each
    for assignment in assignments:
        if assignment.get("market_rent") and assignment.get("current_rent"):
            assignment["savings_per_month"] = assignment["market_rent"] - assignment["current_rent"]
        else:
            assignment["market_rent"] = assignment.get("current_rent", 0) * 1.05
            assignment["savings_per_month"] = assignment.get("current_rent", 0) * 0.05
    
    if min_savings:
        assignments = [a for a in assignments if a.get("savings_per_month", 0) >= min_savings]
    
    return assignments

@api_router.post("/lease-assignments")
async def create_lease_assignment(data: LeaseAssignmentInput):
    """Create a new lease assignment listing"""
    assignment_id = str(uuid.uuid4())
    
    market_rent = data.market_rent or (data.current_rent * 1.05)
    
    assignment = {
        "id": assignment_id,
        "title": data.title or f"{data.bedrooms}BR in {data.city}",
        "address": data.address,
        "city": data.city,
        "current_rent": data.current_rent,
        "market_rent": market_rent,
        "assignment_fee": data.assignment_fee,
        "remaining_months": data.remaining_months,
        "available_date": data.available_date or "Immediately",
        "bedrooms": data.bedrooms,
        "bathrooms": data.bathrooms,
        "sqft": data.sqft,
        "amenities": data.amenities,
        "pet_friendly": data.pet_friendly,
        "description": data.description,
        "reason": data.reason,
        "owner_id": data.owner_id,
        "owner": {"name": data.owner_name or "Anonymous", "avatar": (data.owner_name or "A")[0]},
        "images": data.images,
        "savings_per_month": market_rent - data.current_rent,
        "status": "active",
        "verified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.lease_assignments.insert_one(assignment)
    
    return assignment

@api_router.get("/lease-assignments/{assignment_id}")
async def get_lease_assignment(assignment_id: str):
    """Get a specific lease assignment"""
    assignment = await db.lease_assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

# ========== E-SIGN DOCUMENTS ==========

class ESignDocumentInput(BaseModel):
    title: str
    form_type: Optional[str] = None
    recipient_email: str
    recipient_name: str
    property_address: Optional[str] = None
    notes: Optional[str] = None
    creator_id: str
    creator_name: str
    creator_email: str

class SignatureInput(BaseModel):
    signature_data: str
    signer_id: str
    signer_name: str

@api_router.get("/esign/documents")
async def get_esign_documents(user_id: str):
    """Get all e-sign documents for a user"""
    # Get documents where user is creator or recipient
    documents = await db.esign_documents.find(
        {"$or": [{"creator_id": user_id}, {"recipient_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return documents

@api_router.post("/esign/documents")
async def create_esign_document(data: ESignDocumentInput):
    """Create a new document for e-signature"""
    doc_id = str(uuid.uuid4())
    
    document = {
        "id": doc_id,
        "title": data.title,
        "form_type": data.form_type,
        "recipient_email": data.recipient_email,
        "recipient_name": data.recipient_name,
        "property_address": data.property_address,
        "notes": data.notes,
        "creator_id": data.creator_id,
        "creator_name": data.creator_name,
        "creator_email": data.creator_email,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "signed_at": None,
        "signature_data": None,
        "signer_name": None
    }
    
    await db.esign_documents.insert_one(document)
    
    # TODO: Send email notification to recipient
    
    return document

@api_router.post("/esign/documents/{doc_id}/sign")
async def sign_document(doc_id: str, data: SignatureInput):
    """Sign a document"""
    document = await db.esign_documents.find_one({"id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document["status"] == "signed":
        raise HTTPException(status_code=400, detail="Document already signed")
    
    await db.esign_documents.update_one(
        {"id": doc_id},
        {"$set": {
            "status": "signed",
            "signed_at": datetime.now(timezone.utc).isoformat(),
            "signature_data": data.signature_data,
            "signer_id": data.signer_id,
            "signer_name": data.signer_name
        }}
    )
    
    return {"status": "signed", "message": "Document signed successfully"}

@api_router.post("/esign/documents/{doc_id}/remind")
async def send_reminder(doc_id: str):
    """Send a reminder to sign the document"""
    document = await db.esign_documents.find_one({"id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # TODO: Implement email sending via Resend
    
    return {"status": "sent", "message": "Reminder sent successfully"}

@api_router.get("/esign/documents/{doc_id}")
async def get_esign_document(doc_id: str):
    """Get a specific e-sign document"""
    document = await db.esign_documents.find_one({"id": doc_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

# ========== DOCUSIGN OAUTH 2.0 INTEGRATION ==========

from services.docusign_service import DocuSignService, DocuSignError

docusign_service = DocuSignService()

@api_router.get("/docusign/status")
async def get_docusign_status(user_id: str):
    """Check if user has connected their DocuSign account"""
    connection = await db.docusign_connections.find_one({"user_id": user_id}, {"_id": 0})
    
    if not connection:
        return {
            "connected": False,
            "integration_key_configured": bool(docusign_service.integration_key),
            "message": "DocuSign not connected. Click 'Connect DocuSign' to begin."
        }
    
    return {
        "connected": True,
        "email": connection.get("email"),
        "account_name": connection.get("account_name"),
        "connected_at": connection.get("connected_at")
    }

@api_router.get("/docusign/auth-url")
async def get_docusign_auth_url(request: Request, user_id: str):
    """Generate DocuSign OAuth authorization URL"""
    if not docusign_service.integration_key:
        raise HTTPException(status_code=503, detail="DocuSign not configured. Integration key missing.")
    
    # Build redirect URI from request
    origin = request.headers.get('origin', str(request.base_url).rstrip('/'))
    redirect_uri = f"{origin}/esign?docusign_callback=true"
    
    auth_url, state = docusign_service.generate_authorization_url(redirect_uri)
    
    # Store state for CSRF validation
    await db.docusign_oauth_states.insert_one({
        "state": state,
        "user_id": user_id,
        "redirect_uri": redirect_uri,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": datetime.now(timezone.utc).isoformat()  # 10 min expiry handled client-side
    })
    
    return {
        "auth_url": auth_url,
        "state": state
    }

@api_router.post("/docusign/callback")
async def docusign_oauth_callback(
    request: Request,
    code: str,
    state: str,
    user_id: str
):
    """Handle DocuSign OAuth callback - exchange code for tokens"""
    # Validate state
    stored_state = await db.docusign_oauth_states.find_one({"state": state, "user_id": user_id})
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter - possible CSRF attack")
    
    redirect_uri = stored_state.get("redirect_uri")
    
    try:
        # Exchange code for tokens
        token_data = await docusign_service.exchange_code_for_tokens(code, redirect_uri)
        
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)
        
        # Get user info including account ID
        user_info = await docusign_service.get_user_info(access_token)
        
        # Store connection
        connection = {
            "user_id": user_id,
            "account_id": user_info.get("account_id"),
            "account_name": user_info.get("account_name"),
            "base_uri": user_info.get("base_uri"),
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_expires_in": expires_in,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert connection
        await db.docusign_connections.update_one(
            {"user_id": user_id},
            {"$set": connection},
            upsert=True
        )
        
        # Clean up state
        await db.docusign_oauth_states.delete_one({"state": state})
        
        return {
            "success": True,
            "email": user_info.get("email"),
            "account_name": user_info.get("account_name"),
            "message": "DocuSign connected successfully!"
        }
        
    except DocuSignError as e:
        logger.error(f"DocuSign OAuth error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/docusign/disconnect")
async def disconnect_docusign(user_id: str):
    """Disconnect user's DocuSign account"""
    result = await db.docusign_connections.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No DocuSign connection found")
    
    return {"success": True, "message": "DocuSign disconnected"}

@api_router.post("/docusign/send-envelope")
async def send_docusign_envelope(
    request: Request,
    user_id: str,
    doc_id: str,
):
    """Send an existing e-sign document via DocuSign"""
    # Get DocuSign connection
    connection = await db.docusign_connections.find_one({"user_id": user_id})
    if not connection:
        raise HTTPException(status_code=401, detail="DocuSign not connected. Please connect your account first.")
    
    # Get the document
    document = await db.esign_documents.find_one({"id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Generate PDF content from the document
    pdf_content = generate_document_pdf(document)
    
    try:
        # Refresh token if needed (in production, check expiry)
        access_token = connection.get("access_token")
        account_id = connection.get("account_id")
        base_uri = connection.get("base_uri")
        
        # Send via DocuSign
        result = await docusign_service.create_and_send_envelope(
            access_token=access_token,
            account_id=account_id,
            base_uri=base_uri,
            subject=f"Please sign: {document.get('title')}",
            document_content=pdf_content,
            document_name=f"{document.get('title')}.pdf",
            signer_email=document.get("recipient_email"),
            signer_name=document.get("recipient_name"),
        )
        
        # Update document with DocuSign info
        await db.esign_documents.update_one(
            {"id": doc_id},
            {"$set": {
                "docusign_envelope_id": result.get("envelope_id"),
                "docusign_status": result.get("status"),
                "docusign_sent_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return result
        
    except DocuSignError as e:
        logger.error(f"DocuSign send error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/docusign/envelope-status/{envelope_id}")
async def get_docusign_envelope_status(user_id: str, envelope_id: str):
    """Get status of a DocuSign envelope"""
    connection = await db.docusign_connections.find_one({"user_id": user_id})
    if not connection:
        raise HTTPException(status_code=401, detail="DocuSign not connected")
    
    try:
        status = await docusign_service.get_envelope_status_async(
            access_token=connection.get("access_token"),
            account_id=connection.get("account_id"),
            base_uri=connection.get("base_uri"),
            envelope_id=envelope_id
        )
        return status
        
    except DocuSignError as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_document_pdf(document: Dict[str, Any]) -> bytes:
    """Generate a simple PDF from document data (placeholder)"""
    # In production, use reportlab or a proper PDF generation library
    content = f"""
    DOMMMA E-SIGN DOCUMENT
    =====================
    
    Document: {document.get('title', 'Untitled')}
    Form Type: {document.get('form_type', 'General')}
    
    Property Address: {document.get('property_address', 'N/A')}
    
    FROM:
    {document.get('creator_name', 'Unknown')}
    {document.get('creator_email', '')}
    
    TO:
    {document.get('recipient_name', 'Unknown')}
    {document.get('recipient_email', '')}
    
    Notes:
    {document.get('notes', 'None')}
    
    Created: {document.get('created_at', '')}
    
    
    SIGNATURE:
    
    /sig1/
    
    Date: _____________
    
    
    This document was sent via DOMMMA's e-signature platform.
    """
    return content.encode('utf-8')

# ========== LISTING SYNDICATION ==========

class SyndicationTrackInput(BaseModel):
    listing_id: str
    platform: str
    user_id: str
    timestamp: str

@api_router.post("/syndication/track")
async def track_syndication(data: SyndicationTrackInput):
    """Track when a listing is syndicated to an external platform"""
    track_id = str(uuid.uuid4())
    
    track_record = {
        "id": track_id,
        "listing_id": data.listing_id,
        "platform": data.platform,
        "user_id": data.user_id,
        "syndicated_at": data.timestamp,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.syndication_history.insert_one(track_record)
    
    # Update listing with syndication info
    await db.listings.update_one(
        {"id": data.listing_id},
        {"$addToSet": {"syndicated_to": data.platform}}
    )
    
    return {"status": "tracked", "id": track_id}

@api_router.get("/syndication/history/{listing_id}")
async def get_syndication_history(listing_id: str):
    """Get syndication history for a listing"""
    history = await db.syndication_history.find(
        {"listing_id": listing_id}, {"_id": 0}
    ).sort("syndicated_at", -1).to_list(50)
    return history

@api_router.get("/syndication/stats/{user_id}")
async def get_syndication_stats(user_id: str):
    """Get syndication stats for a user"""
    # Count by platform
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    stats = await db.syndication_history.aggregate(pipeline).to_list(10)
    
    total = sum(s["count"] for s in stats)
    
    return {
        "total_syndications": total,
        "by_platform": {s["_id"]: s["count"] for s in stats}
    }

# ========== VIDEO TOURS (Cloudinary) ==========

import time
import cloudinary
import cloudinary.utils
import cloudinary.uploader

# Initialize Cloudinary (if credentials are set)
cloudinary_configured = False
if os.environ.get('CLOUDINARY_CLOUD_NAME'):
    cloudinary.config(
        cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key=os.environ.get("CLOUDINARY_API_KEY"),
        api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
        secure=True
    )
    cloudinary_configured = True

@api_router.get("/cloudinary/signature")
async def generate_cloudinary_signature(
    resource_type: str = "video",
    folder: str = "dommma/tours"
):
    """Generate a signed upload signature for Cloudinary"""
    if not cloudinary_configured:
        raise HTTPException(status_code=503, detail="Cloudinary not configured. Please set CLOUDINARY credentials.")
    
    # Validate folder
    allowed_folders = ("dommma/", "users/", "listings/")
    if not folder.startswith(allowed_folders):
        raise HTTPException(status_code=400, detail="Invalid folder path")
    
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder,
        "resource_type": resource_type
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.environ.get("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": folder,
        "resource_type": resource_type
    }

@api_router.get("/cloudinary/status")
async def cloudinary_status():
    """Check if Cloudinary is configured"""
    return {
        "configured": cloudinary_configured,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME") if cloudinary_configured else None
    }

class VideoTourInput(BaseModel):
    listing_id: str
    video_url: str
    public_id: str
    duration: Optional[float] = None
    title: Optional[str] = None

@api_router.post("/listings/{listing_id}/video-tour")
async def add_video_tour(listing_id: str, data: VideoTourInput):
    """Add a video tour to a listing"""
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    video_tour = {
        "video_url": data.video_url,
        "public_id": data.public_id,
        "duration": data.duration,
        "title": data.title or "Property Tour",
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"video_tour": video_tour, "has_video_tour": True}}
    )
    
    return {"status": "success", "video_tour": video_tour}

@api_router.delete("/listings/{listing_id}/video-tour")
async def remove_video_tour(listing_id: str):
    """Remove a video tour from a listing"""
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Delete from Cloudinary if configured
    if cloudinary_configured and listing.get("video_tour", {}).get("public_id"):
        try:
            cloudinary.uploader.destroy(
                listing["video_tour"]["public_id"],
                resource_type="video",
                invalidate=True
            )
        except Exception as e:
            logger.error(f"Failed to delete video from Cloudinary: {e}")
    
    await db.listings.update_one(
        {"id": listing_id},
        {"$unset": {"video_tour": 1}, "$set": {"has_video_tour": False}}
    )
    
    return {"status": "deleted"}

# ========== AI-POWERED FEATURES ==========

class IssueAnalysisRequest(BaseModel):
    image_data: str  # base64 data URL
    description: Optional[str] = ""

class DocumentAnalysisRequest(BaseModel):
    document_text: str
    document_type: str = "lease"

class CommuteSearchRequest(BaseModel):
    work_addresses: List[str]
    max_commute_minutes: int = 45
    transport_mode: str = "transit"

@api_router.post("/ai/analyze-issue")
async def analyze_issue(req: IssueAnalysisRequest):
    """AI analyzes a home issue image and matches relevant contractors"""
    
    system_message = """You are a home maintenance expert AI. Analyze the described home issue and:
1. Identify the specific issue type (plumbing, electrical, painting, renovation, carpentry, landscaping, cleaning, HVAC, roofing, etc.)
2. Assess the urgency (low, medium, high, emergency)
3. Provide a brief description of the problem
4. Recommend the type of contractor needed
5. Estimate a rough cost range in CAD

Respond in valid JSON format only:
{
  "issue_type": "plumbing",
  "urgency": "high",
  "description": "Water leak from pipe joint under kitchen sink",
  "contractor_type": "plumber",
  "estimated_cost_range": "$150-$400",
  "recommended_specialties": ["plumbing", "pipe repair"],
  "immediate_steps": ["Turn off water supply under the sink", "Place a bucket under the leak"]
}"""

    try:
        anthropic_client = AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        
        message_text = f"Analyze this home issue. User description: {req.description or 'See image'}. The image has been uploaded showing the issue."
        if req.image_data and req.image_data.startswith("data:"):
            message_text += f"\n\n[Image uploaded - analyze based on description]"
        
        claude_response = await anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=system_message,
            messages=[{"role": "user", "content": message_text}]
        )
        
        response = claude_response.content[0].text
        
        # Parse AI response
        import re
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        analysis = {}
        if json_match:
            try:
                analysis = json.loads(json_match.group())
            except json.JSONDecodeError:
                analysis = {"issue_type": "general", "description": response, "urgency": "medium", "recommended_specialties": ["general"]}
        else:
            analysis = {"issue_type": "general", "description": response, "urgency": "medium", "recommended_specialties": ["general"]}
        
        # Match contractors based on AI analysis
        specialties = analysis.get("recommended_specialties", [analysis.get("issue_type", "general")])
        matched_contractors = []
        for specialty in specialties:
            contractors = await db.contractor_profiles.find(
                {"specialties": {"$regex": specialty, "$options": "i"}, "status": "active"},
                {"_id": 0}
            ).sort("rating", -1).to_list(5)
            for c in contractors:
                if c not in matched_contractors:
                    matched_contractors.append(c)
        
        return {
            "analysis": analysis,
            "matched_contractors": matched_contractors[:6],
            "total_matches": len(matched_contractors)
        }
    except Exception as e:
        logging.error(f"Issue analysis error: {e}")
        # Fallback: do keyword matching
        keywords_map = {
            "plumbing": ["water", "leak", "pipe", "faucet", "drain", "toilet", "sink"],
            "electrical": ["light", "switch", "outlet", "wire", "power", "circuit"],
            "painting": ["paint", "wall", "ceiling", "crack", "peel"],
            "cleaning": ["mold", "stain", "dirt", "mess"],
            "renovation": ["broken", "damage", "repair", "fix"],
        }
        desc_lower = (req.description or "").lower()
        matched_type = "general"
        for cat, keywords in keywords_map.items():
            if any(kw in desc_lower for kw in keywords):
                matched_type = cat
                break
        
        contractors = await db.contractor_profiles.find(
            {"specialties": {"$regex": matched_type, "$options": "i"}, "status": "active"},
            {"_id": 0}
        ).sort("rating", -1).to_list(6)
        
        return {
            "analysis": {
                "issue_type": matched_type,
                "description": f"Issue detected: {req.description}",
                "urgency": "medium",
                "recommended_specialties": [matched_type]
            },
            "matched_contractors": contractors,
            "total_matches": len(contractors)
        }

@api_router.post("/ai/analyze-document")
async def analyze_document(req: DocumentAnalysisRequest):
    """AI analyzes lease/rental documents for fairness and key terms"""
    
    system_message = f"""You are a {req.document_type} document analysis expert for Canadian real estate. Analyze the provided document and return a comprehensive review in valid JSON:
{{
  "summary": "Brief summary of the document",
  "key_terms": [
    {{"term": "Monthly Rent", "value": "$2,500", "assessment": "fair"}},
    {{"term": "Deposit", "value": "$2,500", "assessment": "standard"}}
  ],
  "fairness_score": 8,
  "red_flags": ["Unusual early termination penalty of 3 months rent"],
  "green_flags": ["Standard 12-month term", "Pet-friendly clause included"],
  "recommendations": ["Negotiate the early termination penalty", "Request clarification on utility responsibilities"],
  "legal_notes": ["All terms comply with BC Residential Tenancy Act"],
  "monthly_costs_breakdown": {{
    "rent": 2500,
    "utilities_estimate": 150,
    "parking": 0,
    "total_estimate": 2650
  }}
}}
Score fairness from 1-10 (10 = very renter-friendly). Be thorough but practical."""

    try:
        anthropic_client = AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        
        claude_response = await anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2048,
            system=system_message,
            messages=[{"role": "user", "content": f"Analyze this {req.document_type} document:\n\n{req.document_text[:5000]}"}]
        )
        
        response = claude_response.content[0].text
        
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                return {"analysis": json.loads(json_match.group())}
            except json.JSONDecodeError:
                pass
        return {"analysis": {"summary": response, "fairness_score": 0, "key_terms": [], "red_flags": [], "green_flags": [], "recommendations": []}}
    except Exception as e:
        logging.error(f"Document analysis error: {e}")
        raise HTTPException(status_code=500, detail="Document analysis failed")

@api_router.post("/ai/commute-search")
async def commute_search(req: CommuteSearchRequest):
    """Find properties optimized for commute to work locations"""
    
    # Get all active listings
    all_listings = await db.listings.find({"status": "active"}, {"_id": 0}).to_list(100)
    
    listings_text = "\n".join([
        f"- {l['title']} at {l['address']}, {l['city']} (${l['price']}/mo, {l['bedrooms']}bd/{l['bathrooms']}ba)"
        for l in all_listings[:30]
    ])
    
    system_message = """You are a commute optimization expert for Vancouver. Given work addresses and available properties, rank properties by estimated commute convenience. Return valid JSON:
{
  "ranked_properties": [
    {
      "title": "Property Name",
      "address": "Full address",
      "estimated_commute": "25 min by transit",
      "commute_score": 9,
      "notes": "Close to SkyTrain station"
    }
  ],
  "tips": ["Consider the Canada Line for fastest downtown access"]
}
Score commute from 1-10 (10 = shortest/most convenient)."""

    try:
        anthropic_client = AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        
        user_content = (f"Work addresses: {', '.join(req.work_addresses)}\n"
                       f"Max commute: {req.max_commute_minutes} min by {req.transport_mode}\n\n"
                       f"Available properties:\n{listings_text}")
        
        claude_response = await anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2048,
            system=system_message,
            messages=[{"role": "user", "content": user_content}]
        )
        
        response = claude_response.content[0].text
        
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group())
                # Enrich with full listing data
                for ranked in result.get("ranked_properties", []):
                    for l in all_listings:
                        if l["title"].lower() in ranked.get("title", "").lower() or ranked.get("address", "").lower() in l.get("address", "").lower():
                            ranked["listing"] = l
                            break
                return result
            except json.JSONDecodeError:
                pass
        return {"ranked_properties": [], "tips": [response]}
    except Exception as e:
        logging.error(f"Commute search error: {e}")
        raise HTTPException(status_code=500, detail="Commute search failed")

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
        
        # Send email notification
        applicant = await db.users.find_one({"id": app["user_id"]}, {"_id": 0})
        listing = await db.listings.find_one({"id": app.get("listing_id")}, {"_id": 0, "title": 1})
        if applicant and applicant.get("email"):
            asyncio.create_task(send_email(
                applicant["email"],
                f"Application Update - {listing.get('title', 'Your Property') if listing else 'Your Property'}",
                email_application_update(
                    applicant.get("name", ""),
                    listing.get("title", "the property") if listing else "the property",
                    status
                )
            ))
    
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
    
    allowed_fields = ["title", "address", "city", "province", "postal_code", "lat", "lng",
                      "description", "price", "bedrooms", "bathrooms", "sqft", "property_type",
                      "status", "available_date", "amenities", "images", "pet_friendly", "parking",
                      "listing_type", "sale_price", "year_built", "lot_size", "garage",
                      "mls_number", "open_house_dates"]
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

# ========== PROPERTY OFFERS (BUY/SELL) ==========

@api_router.post("/offers")
async def create_offer(buyer_id: str, offer: OfferCreate):
    """Submit an offer on a property for sale"""
    listing = await db.listings.find_one({"id": offer.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    offer_obj = PropertyOffer(
        buyer_id=buyer_id,
        seller_id=listing.get("landlord_id", ""),
        **offer.model_dump()
    )
    doc = offer_obj.model_dump()
    await db.offers.insert_one(doc)
    doc.pop("_id", None)
    
    # Notify seller
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": listing.get("landlord_id", ""),
        "title": "New Offer Received",
        "body": f"Offer of ${offer.offer_amount:,} on {listing['title']}",
        "type": "offer",
        "data": {"offer_id": offer_obj.id, "listing_id": offer.listing_id},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Email notification to seller
    seller = await db.users.find_one({"id": listing.get("landlord_id", "")}, {"_id": 0})
    if seller and seller.get("email"):
        html = f"""
        <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F5F5F0;padding:40px;">
          <div style="background:#1A2F3A;padding:30px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:white;font-family:'Georgia',serif;margin:0;">DOMMMA</h1>
          </div>
          <div style="background:white;padding:30px;border-radius:0 0 16px 16px;">
            <h2 style="color:#1A2F3A;">New Offer on {listing['title']}</h2>
            <div style="background:#F5F5F0;border-radius:12px;padding:20px;margin:20px 0;">
              <p style="margin:4px 0;color:#1A2F3A;font-size:24px;font-weight:bold;">${offer.offer_amount:,}</p>
              <p style="margin:4px 0;color:#555;">Financing: {offer.financing_type}</p>
              {f'<p style="margin:4px 0;color:#555;">Closing: {offer.closing_date}</p>' if offer.closing_date else ''}
            </div>
            <p style="color:#555;">Log in to review and respond to this offer.</p>
          </div>
        </div>"""
        asyncio.create_task(send_email(seller["email"], f"New Offer - {listing['title']}", html))
    
    return doc

@api_router.get("/offers/buyer/{buyer_id}")
async def get_buyer_offers(buyer_id: str):
    """Get offers made by a buyer"""
    offers = await db.offers.find({"buyer_id": buyer_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for o in offers:
        listing = await db.listings.find_one({"id": o["listing_id"]}, {"_id": 0, "title": 1, "address": 1, "city": 1, "price": 1, "images": 1})
        o["listing"] = listing or {}
    return offers

@api_router.get("/offers/seller/{seller_id}")
async def get_seller_offers(seller_id: str):
    """Get offers received by a seller"""
    offers = await db.offers.find({"seller_id": seller_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for o in offers:
        listing = await db.listings.find_one({"id": o["listing_id"]}, {"_id": 0, "title": 1, "address": 1, "city": 1, "price": 1, "images": 1})
        o["listing"] = listing or {}
        buyer = await db.users.find_one({"id": o["buyer_id"]}, {"_id": 0, "name": 1, "email": 1})
        o["buyer"] = buyer or {}
    return offers

@api_router.get("/offers/listing/{listing_id}")
async def get_listing_offers(listing_id: str):
    """Get all offers for a listing"""
    offers = await db.offers.find({"listing_id": listing_id}, {"_id": 0}).sort("offer_amount", -1).to_list(50)
    for o in offers:
        buyer = await db.users.find_one({"id": o["buyer_id"]}, {"_id": 0, "name": 1, "email": 1})
        o["buyer"] = buyer or {}
    return offers

@api_router.put("/offers/{offer_id}/respond")
async def respond_to_offer(offer_id: str, action: str, seller_id: str, counter_amount: Optional[int] = None, counter_message: Optional[str] = None):
    """Seller responds to an offer: accept, reject, or counter"""
    if action not in ["accepted", "rejected", "countered"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    offer = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer["seller_id"] != seller_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update = {"status": action, "updated_at": datetime.now(timezone.utc).isoformat()}
    if action == "countered" and counter_amount:
        update["counter_amount"] = counter_amount
        update["counter_message"] = counter_message
    
    await db.offers.update_one({"id": offer_id}, {"$set": update})
    
    # If accepted, mark listing as sold/pending
    if action == "accepted":
        await db.listings.update_one(
            {"id": offer["listing_id"]},
            {"$set": {"status": "pending_sale"}}
        )
    
    # Notify buyer
    status_text = {"accepted": "accepted!", "rejected": "declined.", "countered": f"countered with ${counter_amount:,}." if counter_amount else "countered."}
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": offer["buyer_id"],
        "title": f"Offer {action.title()}",
        "body": f"Your offer has been {status_text.get(action, action)}",
        "type": "offer",
        "data": {"offer_id": offer_id, "action": action},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Email buyer
    buyer = await db.users.find_one({"id": offer["buyer_id"]}, {"_id": 0})
    if buyer and buyer.get("email"):
        asyncio.create_task(send_email(
            buyer["email"],
            f"Offer {action.title()}",
            email_application_update(buyer.get("name", ""), "the property", action)
        ))
    
    return {"status": "updated"}

# ========== CONTRACTOR PROFILES ==========

@api_router.post("/contractors/profile")
async def create_contractor_profile(user_id: str, profile: ContractorProfileCreate):
    """Create or update contractor profile"""
    existing = await db.contractor_profiles.find_one({"user_id": user_id}, {"_id": 0})
    
    if existing:
        update_data = profile.model_dump()
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.contractor_profiles.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        updated = await db.contractor_profiles.find_one({"user_id": user_id}, {"_id": 0})
        return updated
    
    profile_obj = ContractorProfile(user_id=user_id, **profile.model_dump())
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user:
        profile_obj.email = profile.email or user.get("email")
    
    doc = profile_obj.model_dump()
    await db.contractor_profiles.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/contractors/profile/{user_id}")
async def get_contractor_profile(user_id: str):
    """Get contractor profile by user_id"""
    profile = await db.contractor_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.get("/contractors/search")
async def search_contractors(
    specialty: Optional[str] = None,
    area: Optional[str] = None,
    min_rating: Optional[float] = None,
    q: Optional[str] = None
):
    """Search contractors"""
    query = {"status": "active"}
    if specialty:
        query["specialties"] = {"$regex": specialty, "$options": "i"}
    if area:
        query["service_areas"] = {"$regex": area, "$options": "i"}
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    if q:
        query["$or"] = [
            {"business_name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"specialties": {"$regex": q, "$options": "i"}}
        ]
    
    profiles = await db.contractor_profiles.find(query, {"_id": 0}).to_list(100)
    
    # Enrich with user info
    for p in profiles:
        user = await db.users.find_one({"id": p["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        if user:
            p["user_name"] = user.get("name", "")
    
    return profiles

@api_router.put("/contractors/profile/{user_id}/images")
async def update_contractor_images(user_id: str, images: List[str]):
    """Update contractor portfolio images"""
    await db.contractor_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"portfolio_images": images, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

# ========== CONTRACTOR SERVICES ==========

@api_router.post("/contractors/services")
async def create_contractor_service(contractor_id: str, service: ContractorServiceCreate):
    """Create a service listing"""
    service_obj = ContractorService(contractor_id=contractor_id, **service.model_dump())
    doc = service_obj.model_dump()
    await db.contractor_services.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/contractors/{contractor_id}/services")
async def get_contractor_services(contractor_id: str):
    """Get services offered by a contractor"""
    services = await db.contractor_services.find(
        {"contractor_id": contractor_id, "status": "active"}, {"_id": 0}
    ).to_list(50)
    return services

@api_router.get("/services/search")
async def search_services(
    category: Optional[str] = None,
    q: Optional[str] = None,
    max_price: Optional[float] = None
):
    """Search all contractor services"""
    query = {"status": "active"}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]
    if max_price:
        query["price"] = {"$lte": max_price}
    
    services = await db.contractor_services.find(query, {"_id": 0}).to_list(100)
    
    # Enrich with contractor info
    for s in services:
        profile = await db.contractor_profiles.find_one(
            {"contractor_id": s["contractor_id"]},
            {"_id": 0, "business_name": 1, "rating": 1, "avatar": 1}
        )
        if not profile:
            profile = await db.contractor_profiles.find_one(
                {"user_id": s["contractor_id"]},
                {"_id": 0, "business_name": 1, "rating": 1, "avatar": 1}
            )
        s["contractor"] = profile or {}
    
    return services

@api_router.delete("/contractors/services/{service_id}")
async def delete_contractor_service(service_id: str, contractor_id: str):
    """Delete a service"""
    await db.contractor_services.update_one(
        {"id": service_id, "contractor_id": contractor_id},
        {"$set": {"status": "deleted"}}
    )
    return {"status": "deleted"}

# ========== SERVICE BOOKINGS ==========

@api_router.post("/bookings")
async def create_booking(customer_id: str, booking: ServiceBookingCreate):
    """Create a service booking"""
    booking_obj = ServiceBooking(customer_id=customer_id, **booking.model_dump())
    
    # If service_id provided, get price
    if booking.service_id:
        service = await db.contractor_services.find_one({"id": booking.service_id}, {"_id": 0})
        if service and service.get("price"):
            booking_obj.amount = service["price"]
    
    doc = booking_obj.model_dump()
    await db.bookings.insert_one(doc)
    
    # Notify contractor
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": booking.contractor_id,
        "title": "New Booking Request",
        "body": f"New booking: {booking.title}",
        "type": "booking",
        "data": {"booking_id": booking_obj.id},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    doc.pop("_id", None)
    return doc

@api_router.get("/bookings/customer/{customer_id}")
async def get_customer_bookings(customer_id: str):
    """Get bookings made by a customer"""
    bookings = await db.bookings.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for b in bookings:
        profile = await db.contractor_profiles.find_one({"user_id": b["contractor_id"]}, {"_id": 0, "business_name": 1, "avatar": 1})
        b["contractor"] = profile or {}
    return bookings

@api_router.get("/bookings/contractor/{contractor_id}")
async def get_contractor_bookings(contractor_id: str):
    """Get bookings for a contractor"""
    bookings = await db.bookings.find({"contractor_id": contractor_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for b in bookings:
        user = await db.users.find_one({"id": b["customer_id"]}, {"_id": 0, "name": 1, "email": 1})
        b["customer"] = user or {}
    return bookings

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str, user_id: str):
    """Update booking status"""
    valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notify the other party
    notify_user = booking["customer_id"] if user_id == booking["contractor_id"] else booking["contractor_id"]
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": notify_user,
        "title": f"Booking {status.replace('_', ' ').title()}",
        "body": f"Booking '{booking['title']}' is now {status.replace('_', ' ')}",
        "type": "booking",
        "data": {"booking_id": booking_id, "status": status},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email notification for confirmed bookings
    if status == "confirmed":
        customer = await db.users.find_one({"id": booking["customer_id"]}, {"_id": 0})
        contractor_profile = await db.contractor_profiles.find_one({"user_id": booking["contractor_id"]}, {"_id": 0})
        if customer and customer.get("email"):
            asyncio.create_task(send_email(
                customer["email"],
                f"Booking Confirmed - {booking['title']}",
                email_booking_confirmed(
                    customer.get("name", ""),
                    contractor_profile.get("business_name", "") if contractor_profile else "",
                    booking["title"],
                    booking.get("preferred_date", "")
                )
            ))
    
    return {"status": "updated"}

@api_router.post("/bookings/{booking_id}/pay")
async def pay_booking(request: Request, booking_id: str):
    """Create payment for a booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not booking.get("amount"):
        raise HTTPException(status_code=400, detail="No amount set for this booking")
    
    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    origin = request.headers.get('origin', host_url)
    success_url = f"{origin}/dashboard?payment=success&booking_id={booking_id}&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/dashboard?payment=cancelled"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(booking["amount"]),
        currency="cad",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"booking_id": booking_id, "contractor_id": booking["contractor_id"]}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    # Also create a payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        user_id=booking["customer_id"],
        amount=booking["amount"],
        currency="cad",
        description=f"Booking: {booking['title']}",
        recipient_id=booking["contractor_id"],
        payment_status="pending",
        status="initiated"
    )
    await db.payment_transactions.insert_one(transaction.model_dump())
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.post("/bookings/{booking_id}/review")
async def review_booking(booking_id: str, customer_id: str, review: ReviewCreate):
    """Leave a review for a completed booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"rating": review.rating, "review": review.review, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update contractor's average rating
    all_reviews = await db.bookings.find(
        {"contractor_id": booking["contractor_id"], "rating": {"$exists": True, "$ne": None}},
        {"_id": 0, "rating": 1}
    ).to_list(500)
    
    if all_reviews:
        avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        await db.contractor_profiles.update_one(
            {"user_id": booking["contractor_id"]},
            {"$set": {"rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
        )
    
    return {"status": "reviewed"}

@api_router.get("/contractors/{contractor_id}/reviews")
async def get_contractor_reviews(contractor_id: str, limit: int = 20):
    """Get reviews for a contractor"""
    reviews = await db.bookings.find(
        {"contractor_id": contractor_id, "rating": {"$exists": True, "$ne": None}},
        {"_id": 0, "id": 1, "customer_id": 1, "title": 1, "rating": 1, "review": 1, "created_at": 1, "updated_at": 1}
    ).sort("updated_at", -1).to_list(limit)
    
    # Add customer info
    for r in reviews:
        user = await db.users.find_one({"id": r["customer_id"]}, {"_id": 0, "name": 1, "avatar": 1})
        r["customer"] = user or {"name": "Anonymous"}
    
    return reviews

@api_router.get("/contractors/leaderboard")
async def get_contractor_leaderboard(limit: int = 10):
    """Get top-rated contractors"""
    contractors = await db.contractor_profiles.find(
        {"status": "active", "rating": {"$gt": 0}},
        {"_id": 0, "id": 1, "user_id": 1, "business_name": 1, "avatar": 1, "rating": 1, "review_count": 1, 
         "completed_jobs": 1, "specialties": 1, "verified": 1, "service_areas": 1}
    ).sort([("rating", -1), ("review_count", -1)]).to_list(limit)
    
    return contractors

# ========== USER PROFILE ==========

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, updates: Dict[str, Any]):
    """Update user profile"""
    allowed_fields = ["name", "phone", "avatar", "bio"]
    update_dict = {k: v for k, v in updates.items() if k in allowed_fields}
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    return {"status": "updated"}

# ========== IMAGE UPLOAD ==========

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image and return base64 data URL"""
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    content_type = file.content_type or "image/jpeg"
    b64 = base64.b64encode(content).decode("utf-8")
    data_url = f"data:{content_type};base64,{b64}"
    
    # Store in DB for persistence
    image_id = str(uuid.uuid4())
    await db.images.insert_one({
        "id": image_id,
        "filename": file.filename,
        "content_type": content_type,
        "data": data_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"id": image_id, "url": data_url}

@api_router.get("/images/{image_id}")
async def get_image(image_id: str):
    """Get an uploaded image"""
    img = await db.images.find_one({"id": image_id}, {"_id": 0})
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return img

# ========== ROOMMATE FINDER ==========

@api_router.post("/roommates/profile")
async def create_roommate_profile(user_id: str, profile: RoommateProfileCreate):
    """Create or update roommate profile"""
    existing = await db.roommate_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if existing:
        await db.roommate_profiles.update_one(
            {"user_id": user_id},
            {"$set": {**profile.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        updated = await db.roommate_profiles.find_one({"user_id": user_id}, {"_id": 0})
        return updated
    
    profile_obj = RoommateProfile(user_id=user_id, **profile.model_dump())
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user:
        profile_obj.name = profile.name or user.get("name", "")
    doc = profile_obj.model_dump()
    await db.roommate_profiles.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/roommates/profile/{user_id}")
async def get_roommate_profile(user_id: str):
    profile = await db.roommate_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.get("/roommates/search")
async def search_roommates(
    budget_min: Optional[int] = None,
    budget_max: Optional[int] = None,
    area: Optional[str] = None,
    lifestyle: Optional[str] = None,
    pets: Optional[bool] = None,
    smoking: Optional[bool] = None,
    user_id: Optional[str] = None
):
    """Search for compatible roommates"""
    query = {"status": "active"}
    if user_id:
        query["user_id"] = {"$ne": user_id}
    if budget_min:
        query["budget_max"] = {"$gte": budget_min}
    if budget_max:
        query["budget_min"] = {"$lte": budget_max}
    if area:
        query["preferred_areas"] = {"$regex": area, "$options": "i"}
    if lifestyle:
        query["lifestyle"] = {"$regex": lifestyle, "$options": "i"}
    if pets is not None:
        query["pets"] = pets
    if smoking is not None:
        query["smoking"] = smoking
    
    profiles = await db.roommate_profiles.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return profiles

@api_router.post("/roommates/{profile_id}/connect")
async def connect_roommate(profile_id: str, user_id: str, message: str = ""):
    """Send a connection request to a roommate"""
    target = await db.roommate_profiles.find_one({"id": profile_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    connection = {
        "id": str(uuid.uuid4()),
        "from_user_id": user_id,
        "to_user_id": target["user_id"],
        "profile_id": profile_id,
        "message": message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.roommate_connections.insert_one(connection)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": target["user_id"],
        "title": "New Roommate Request",
        "body": f"Someone wants to connect as a potential roommate!",
        "type": "roommate",
        "data": {"connection_id": connection["id"]},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    connection.pop("_id", None)
    return connection

@api_router.get("/roommates/connections/{user_id}")
async def get_roommate_connections(user_id: str):
    """Get roommate connections for a user"""
    connections = await db.roommate_connections.find(
        {"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    for c in connections:
        other_id = c["to_user_id"] if c["from_user_id"] == user_id else c["from_user_id"]
        profile = await db.roommate_profiles.find_one({"user_id": other_id}, {"_id": 0})
        c["other_profile"] = profile or {}
    return connections

# ========== FAVORITES ==========

@api_router.post("/favorites")
async def toggle_favorite(user_id: str, listing_id: str):
    """Toggle favorite on a listing"""
    existing = await db.favorites.find_one({"user_id": user_id, "listing_id": listing_id})
    if existing:
        await db.favorites.delete_one({"user_id": user_id, "listing_id": listing_id})
        return {"status": "removed", "favorited": False}
    else:
        await db.favorites.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "listing_id": listing_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"status": "added", "favorited": True}

@api_router.get("/favorites/{user_id}")
async def get_favorites(user_id: str):
    """Get user's favorited listings"""
    favs = await db.favorites.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    listings = []
    for f in favs:
        listing = await db.listings.find_one({"id": f["listing_id"]}, {"_id": 0})
        if listing:
            listing["favorited_at"] = f.get("created_at")
            listings.append(listing)
    return listings

@api_router.get("/favorites/{user_id}/ids")
async def get_favorite_ids(user_id: str):
    """Get just the IDs of favorited listings"""
    favs = await db.favorites.find({"user_id": user_id}, {"_id": 0, "listing_id": 1}).to_list(100)
    return [f["listing_id"] for f in favs]

# ========== PROPERTY COMPARISON ==========

@api_router.post("/compare")
async def compare_properties(listing_ids: List[str]):
    """Compare multiple properties side by side"""
    if len(listing_ids) < 2 or len(listing_ids) > 4:
        raise HTTPException(status_code=400, detail="Compare 2-4 properties")
    
    listings = []
    for lid in listing_ids:
        listing = await db.listings.find_one({"id": lid}, {"_id": 0})
        if listing:
            listings.append(listing)
    
    return {"listings": listings, "count": len(listings)}

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
    
    # Seed contractor profiles
    contractor_count = await db.contractor_profiles.count_documents({})
    if contractor_count == 0:
        sample_contractors = [
            {
                "id": str(uuid.uuid4()), "user_id": f"contractor-seed-{i}",
                "business_name": name, "description": desc,
                "specialties": specs, "service_areas": ["Vancouver", "Burnaby", "Richmond"],
                "hourly_rate": rate, "years_experience": exp,
                "insurance": True, "verified": True,
                "phone": f"604-555-{1000+i}", "email": f"{name.lower().replace(' ', '.')}@email.com",
                "rating": rating, "review_count": reviews, "completed_jobs": jobs,
                "portfolio_images": [img], "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            for i, (name, desc, specs, rate, exp, rating, reviews, jobs, img) in enumerate([
                ("Vancouver Plumbing Pros", "Expert plumbing services for residential and commercial properties. Available 24/7 for emergencies.", ["plumbing", "pipe repair", "drain cleaning"], 85, 12, 4.8, 47, 156, "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400"),
                ("Pacific Electrical Services", "Licensed electricians serving the Greater Vancouver area. Full residential and commercial electrical services.", ["electrical", "wiring", "panel upgrades"], 95, 15, 4.9, 62, 203, "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400"),
                ("West Coast Painters", "Professional painting crew. Interior, exterior, and specialty finishes. Color consultation included.", ["painting", "drywall", "wallpaper"], 65, 8, 4.7, 35, 98, "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400"),
                ("Mountain View Renovations", "Full-service renovation company. Kitchen, bathroom, and complete home remodels.", ["renovation", "carpentry", "flooring"], 110, 20, 4.9, 89, 312, "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400"),
                ("Green Thumb Landscaping", "Transform your outdoor space. Design, installation, and ongoing maintenance services.", ["landscaping", "gardening", "irrigation"], 55, 10, 4.6, 28, 134, "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400"),
                ("Clean Sweep Services", "Professional cleaning for move-in, move-out, and regular maintenance. Eco-friendly products.", ["cleaning", "deep cleaning", "move-out"], 45, 6, 4.8, 55, 245, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"),
            ])
        ]
        await db.contractor_profiles.insert_many(sample_contractors)
        
        # Seed contractor services
        sample_services = []
        for cp in sample_contractors:
            for j, (title, desc, cat, price, dur) in enumerate([
                (f"{cp['specialties'][0].title()} Inspection", f"Complete {cp['specialties'][0]} inspection and assessment", cp['specialties'][0], cp['hourly_rate'] * 2, "1-2 hours"),
                (f"{cp['specialties'][0].title()} Repair", f"Professional {cp['specialties'][0]} repair service", cp['specialties'][0], cp['hourly_rate'] * 4, "2-4 hours"),
            ]):
                sample_services.append({
                    "id": str(uuid.uuid4()), "contractor_id": cp["user_id"],
                    "title": title, "description": desc, "category": cat,
                    "price_type": "fixed", "price": price, "duration_estimate": dur,
                    "images": [], "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        await db.contractor_services.insert_many(sample_services)
    
    return {"message": f"Successfully seeded {len(sample_listings)} listings and contractor data"}

# ========== ANALYTICS DASHBOARD ==========

@api_router.get("/analytics/overview")
async def get_analytics_overview():
    """Get platform-wide analytics overview for admin dashboard"""
    
    # User stats
    total_users = await db.users.count_documents({})
    users_by_type = await db.users.aggregate([
        {"$group": {"_id": "$user_type", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    # Listing stats
    total_listings = await db.listings.count_documents({"status": "active"})
    listings_by_type = await db.listings.aggregate([
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$listing_type", "count": {"$sum": 1}}}
    ]).to_list(10)
    listings_by_city = await db.listings.aggregate([
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]).to_list(5)
    
    # Transaction stats
    total_transactions = await db.payment_transactions.count_documents({})
    successful_transactions = await db.payment_transactions.count_documents({"payment_status": "paid"})
    
    # Calculate total revenue
    revenue_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Contractor stats
    total_contractors = await db.contractor_profiles.count_documents({"status": "active"})
    verified_contractors = await db.contractor_profiles.count_documents({"status": "active", "verified": True})
    
    # Lease assignment stats  
    active_assignments = await db.lease_assignments.count_documents({"status": "active"})
    
    # Document stats
    total_documents = await db.esign_documents.count_documents({})
    signed_documents = await db.esign_documents.count_documents({"status": "signed"})
    
    # Recent activity (last 7 days)
    from datetime import timedelta
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    new_users_7d = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    new_listings_7d = await db.listings.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    return {
        "users": {
            "total": total_users,
            "by_type": {item["_id"]: item["count"] for item in users_by_type if item["_id"]},
            "new_last_7_days": new_users_7d
        },
        "listings": {
            "total_active": total_listings,
            "by_type": {item["_id"]: item["count"] for item in listings_by_type if item["_id"]},
            "by_city": {item["_id"]: item["count"] for item in listings_by_city if item["_id"]},
            "new_last_7_days": new_listings_7d
        },
        "transactions": {
            "total": total_transactions,
            "successful": successful_transactions,
            "total_revenue": round(total_revenue, 2),
            "success_rate": round((successful_transactions / total_transactions * 100) if total_transactions > 0 else 0, 1)
        },
        "contractors": {
            "total": total_contractors,
            "verified": verified_contractors,
            "verification_rate": round((verified_contractors / total_contractors * 100) if total_contractors > 0 else 0, 1)
        },
        "lease_assignments": {
            "active": active_assignments
        },
        "documents": {
            "total": total_documents,
            "signed": signed_documents,
            "completion_rate": round((signed_documents / total_documents * 100) if total_documents > 0 else 0, 1)
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/analytics/activity")
async def get_recent_activity(limit: int = 20):
    """Get recent platform activity feed"""
    
    activities = []
    
    # Recent users
    recent_users = await db.users.find(
        {}, {"_id": 0, "email": 1, "user_type": 1, "created_at": 1, "name": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    for user in recent_users:
        activities.append({
            "type": "user_signup",
            "title": f"New {user.get('user_type', 'user')} registered",
            "description": user.get("name", user.get("email", "Unknown")),
            "timestamp": user.get("created_at"),
            "icon": "user"
        })
    
    # Recent listings
    recent_listings = await db.listings.find(
        {"status": "active"}, {"_id": 0, "title": 1, "city": 1, "price": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    for listing in recent_listings:
        activities.append({
            "type": "new_listing",
            "title": "New listing created",
            "description": f"{listing.get('title')} in {listing.get('city')} - ${listing.get('price')}/mo",
            "timestamp": listing.get("created_at"),
            "icon": "home"
        })
    
    # Recent transactions
    recent_payments = await db.payment_transactions.find(
        {"payment_status": "paid"}, {"_id": 0, "amount": 1, "description": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    for payment in recent_payments:
        activities.append({
            "type": "payment",
            "title": "Payment completed",
            "description": f"${payment.get('amount', 0):.2f} - {payment.get('description', 'N/A')}",
            "timestamp": payment.get("created_at"),
            "icon": "dollar"
        })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return activities[:limit]

@api_router.get("/analytics/revenue")
async def get_revenue_analytics(period: str = "30d"):
    """Get revenue analytics over time"""
    
    from datetime import timedelta
    
    # Calculate date range
    if period == "7d":
        days = 7
    elif period == "30d":
        days = 30
    elif period == "90d":
        days = 90
    else:
        days = 30
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Daily revenue breakdown
    pipeline = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": start_date}}},
        {"$addFields": {
            "date": {"$substr": ["$created_at", 0, 10]}
        }},
        {"$group": {
            "_id": "$date",
            "revenue": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    daily_revenue = await db.payment_transactions.aggregate(pipeline).to_list(100)
    
    # Total for period
    total_revenue = sum(day["revenue"] for day in daily_revenue)
    total_transactions = sum(day["count"] for day in daily_revenue)
    
    return {
        "period": period,
        "total_revenue": round(total_revenue, 2),
        "total_transactions": total_transactions,
        "average_transaction": round(total_revenue / total_transactions, 2) if total_transactions > 0 else 0,
        "daily_breakdown": [
            {"date": day["_id"], "revenue": round(day["revenue"], 2), "count": day["count"]}
            for day in daily_revenue
        ]
    }

@api_router.get("/analytics/listings-performance")
async def get_listings_performance():
    """Get listing performance metrics"""
    
    # Price distribution
    price_ranges = [
        {"label": "Under $1,500", "min": 0, "max": 1499},
        {"label": "$1,500 - $2,000", "min": 1500, "max": 1999},
        {"label": "$2,000 - $2,500", "min": 2000, "max": 2499},
        {"label": "$2,500 - $3,000", "min": 2500, "max": 2999},
        {"label": "$3,000+", "min": 3000, "max": 999999},
    ]
    
    price_distribution = []
    for range_item in price_ranges:
        count = await db.listings.count_documents({
            "status": "active",
            "listing_type": "rent",
            "price": {"$gte": range_item["min"], "$lte": range_item["max"]}
        })
        price_distribution.append({
            "range": range_item["label"],
            "count": count
        })
    
    # Property type distribution
    property_types = await db.listings.aggregate([
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$property_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(10)
    
    # Average prices by city
    avg_prices_by_city = await db.listings.aggregate([
        {"$match": {"status": "active", "listing_type": "rent"}},
        {"$group": {"_id": "$city", "avg_price": {"$avg": "$price"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    return {
        "price_distribution": price_distribution,
        "property_types": [{"type": p["_id"] or "Unknown", "count": p["count"]} for p in property_types],
        "avg_prices_by_city": [
            {"city": c["_id"] or "Unknown", "avg_price": round(c["avg_price"], 0), "count": c["count"]}
            for c in avg_prices_by_city
        ]
    }


# Include the router
app.include_router(api_router)

# Include new modular routers
from routers import calendar_router, moving_router, compatibility_router, portfolio_router, nova_router
app.include_router(calendar_router, prefix="/api")
app.include_router(moving_router, prefix="/api")
app.include_router(compatibility_router, prefix="/api")
app.include_router(portfolio_router, prefix="/api")
app.include_router(nova_router, prefix="/api")

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
