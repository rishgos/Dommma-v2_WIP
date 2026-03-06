from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from .base import generate_uuid, utc_now

class Listing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
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
    # Featured listing fields
    featured: bool = False
    featured_enabled_at: Optional[str] = None
    featured_expires_at: Optional[str] = None
    featured_fee_pending: bool = False  # True if fee will be charged when rented
    boost_score: int = 0  # Higher = more visibility
    created_at: str = Field(default_factory=utc_now)

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

class PropertyOffer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
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
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class OfferCreate(BaseModel):
    listing_id: str
    offer_amount: int
    conditions: List[str] = []
    financing_type: str = "mortgage"
    closing_date: Optional[str] = None
    message: Optional[str] = None
