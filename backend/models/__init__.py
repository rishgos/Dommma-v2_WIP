# Models package
from .base import generate_uuid, utc_now
from .user import User, UserCreate, UserLogin
from .listing import Listing, ListingCreate, PropertyOffer, OfferCreate
from .contractor import (
    ContractorProfile, ContractorProfileCreate,
    ContractorService, ContractorServiceCreate,
    ServiceBooking, ServiceBookingCreate, ReviewCreate,
    ContractorJob, ContractorJobCreate, ContractorBid,
    PortfolioProject, PortfolioProjectCreate
)
from .social import RoommateProfile, RoommateProfileCreate, RoommateConnection, Favorite
from .messaging import (
    ChatMessage, ChatSession, ChatRequest, ChatResponse,
    DirectMessage, MessageCreate,
    FCMToken, FCMTokenCreate, NotificationCreate
)
from .rental import (
    RentalApplication, ApplicationCreate,
    MaintenanceRequest, MaintenanceRequestCreate,
    Document
)
from .payment import PaymentCreate, PaymentTransaction
from .ai import IssueAnalysisRequest, DocumentAnalysisRequest, CommuteSearchRequest, RoommateCompatibilityRequest
from .calendar import (
    CalendarEvent, CalendarEventCreate, GoogleCalendarToken,
    MovingQuoteRequest, MovingQuote
)

__all__ = [
    # Base
    "generate_uuid", "utc_now",
    # User
    "User", "UserCreate", "UserLogin",
    # Listing
    "Listing", "ListingCreate", "PropertyOffer", "OfferCreate",
    # Contractor
    "ContractorProfile", "ContractorProfileCreate",
    "ContractorService", "ContractorServiceCreate",
    "ServiceBooking", "ServiceBookingCreate", "ReviewCreate",
    "ContractorJob", "ContractorJobCreate", "ContractorBid",
    "PortfolioProject", "PortfolioProjectCreate",
    # Social
    "RoommateProfile", "RoommateProfileCreate", "RoommateConnection", "Favorite",
    # Messaging
    "ChatMessage", "ChatSession", "ChatRequest", "ChatResponse",
    "DirectMessage", "MessageCreate",
    "FCMToken", "FCMTokenCreate", "NotificationCreate",
    # Rental
    "RentalApplication", "ApplicationCreate",
    "MaintenanceRequest", "MaintenanceRequestCreate",
    "Document",
    # Payment
    "PaymentCreate", "PaymentTransaction",
    # AI
    "IssueAnalysisRequest", "DocumentAnalysisRequest", "CommuteSearchRequest", "RoommateCompatibilityRequest",
    # Calendar
    "CalendarEvent", "CalendarEventCreate", "GoogleCalendarToken",
    "MovingQuoteRequest", "MovingQuote",
]
