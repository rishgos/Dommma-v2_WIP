# DOMMMA - Product Requirements Document (PRD)

## Document Information
- **Version:** 4.0
- **Last Updated:** December 2025
- **Status:** Active Development
- **Product Owner:** DOMMMA Team

---

## 1. Executive Summary

### 1.1 Product Vision
DOMMMA is a comprehensive AI-first real estate marketplace platform serving the Metro Vancouver area. The platform connects Renters, Landlords, Buyers, Sellers, and Contractors through an intelligent AI concierge named "Nova" that handles property searches, listing creation, maintenance requests, and contractor matching through natural conversation.

### 1.2 Mission Statement
To revolutionize the real estate experience by providing an AI-powered platform that simplifies property transactions, tenant-landlord interactions, and home service connections for all users in the Vancouver market.

### 1.3 Target Market
- **Primary:** Metro Vancouver (Vancouver, Burnaby, Richmond, Surrey, Coquitlam, New Westminster)
- **User Types:** Renters, Landlords, Property Buyers, Sellers, Contractors/Service Providers

---

## 2. User Personas

### 2.1 Renter
- Looking for apartments, condos, or houses to rent
- Needs budget calculation assistance
- Wants to compare properties and save favorites
- May need roommate matching services
- Requires commute optimization to workplace

### 2.2 Landlord
- Manages one or multiple rental properties
- Needs tenant screening and application management
- Requires maintenance request tracking
- Wants listing optimization and syndication tools
- Needs rent collection and payment processing

### 2.3 Contractor
- Provides home services (plumbing, electrical, cleaning, etc.)
- Manages job requests and bidding
- Builds portfolio and reputation
- Tracks earnings and invoicing
- Needs WCB/Insurance verification

### 2.4 Buyer/Seller
- Looking to buy or sell residential property
- Needs market analysis and pricing assistance
- Requires offer management and document handling

---

## 3. Core Features

### 3.1 Authentication & Security
| Feature | Status | Description |
|---------|--------|-------------|
| Email/Password Registration | ✅ Complete | JWT-based authentication with bcrypt |
| Email Verification | ✅ Complete | Required for new registrations via Resend |
| Role-Based Access | ✅ Complete | Renter, Landlord, Contractor, Buyer, Seller |
| Password Security | ✅ Complete | Hashed passwords with migration support |
| Legacy User Support | ✅ Complete | Users before verification can still login |

**API Endpoints:**
- `POST /api/auth/register` - Create account (sends verification email)
- `POST /api/auth/login` - Login (validates email verification)
- `GET /api/auth/verify-email?token=X` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/change-password` - Change password

### 3.2 Nova AI Concierge (Primary Interface)
| Feature | Status | Description |
|---------|--------|-------------|
| Natural Language Chat | ✅ Complete | Claude Sonnet 4.5 powered conversations |
| Voice Input (STT) | ✅ Complete | OpenAI Whisper transcription |
| Voice Output (TTS) | ✅ Complete | OpenAI TTS with 9 voice options |
| Long-Term Memory | ✅ Complete | Remembers user preferences across sessions |
| Tool Calling | ✅ Complete | 10 AI tools for structured actions |
| Proactive Suggestions | ✅ Complete | Context-aware recommendations |

**AI Tools Available:**
1. `create_listing` - Create property listings via conversation
2. `search_listings` - Search properties with natural language
3. `find_contractors` - Find service providers by specialty
4. `triage_maintenance` - Handle maintenance requests
5. `calculate_budget` - Budget calculations (30% rule)
6. `schedule_viewing` - Book property viewings
7. `price_lease_assignment` - Calculate lease assignment fees
8. `build_renter_resume` - Create tenant profiles
9. `get_renter_resume` - Retrieve saved profiles
10. `analyze_document` - Analyze lease documents for fairness

**API Endpoints:**
- `POST /api/chat` - Basic chat endpoint
- `POST /api/ai/concierge` - Advanced tool-calling endpoint
- `POST /api/nova/tts` - Text-to-speech
- `POST /api/nova/transcribe` - Voice transcription
- `GET /api/nova/insights/{user_id}` - User analytics
- `GET /api/nova/memory/{user_id}` - Saved preferences

### 3.3 Property Management
| Feature | Status | Description |
|---------|--------|-------------|
| Listing Creation | ✅ Complete | Via AI or manual form |
| Property Search | ✅ Complete | Filters, map view, text search |
| Favorites System | ✅ Complete | Save and manage favorite properties |
| Property Comparison | ✅ Complete | Side-by-side comparison tool |
| Claim Listing Flow | ✅ Complete | For unauthenticated users via email |
| Video Tours | ✅ Complete | Cloudinary-powered uploads |
| Featured Listings | 🔄 Partial | Model exists, payment flow pending |

**Listing Filters:**
- City, price range, bedrooms, bathrooms
- Property type (apartment, condo, house, etc.)
- Pet-friendly, parking available
- Listing type (rent/sale)
- Lease duration (3/6/9/12 months)
- Has special offers/deals

**API Endpoints:**
- `GET /api/listings` - Get listings with filters
- `GET /api/listings/{id}` - Get single listing
- `POST /api/listings` - Create listing
- `GET /api/listings/map` - Map bounds query
- `GET /api/listings/claim` - Claim listing info
- `POST /api/listings/claim` - Complete claim process
- `POST /api/listings/optimize` - AI listing optimization

### 3.4 Rental Applications
| Feature | Status | Description |
|---------|--------|-------------|
| Application Submission | ✅ Complete | Full rental application form |
| AI Applicant Ranking | ✅ Complete | Scoring algorithm + analysis |
| Application Status | ✅ Complete | Pending, Under Review, Approved, Rejected |
| Landlord Dashboard | ✅ Complete | View/manage all applications |
| Email Notifications | ✅ Complete | Status update emails |

**Scoring Criteria:**
- Income-to-rent ratio (max 35 pts)
- Employment stability (max 25 pts)
- Rental history (max 25 pts)
- Profile completeness (max 15 pts)

**API Endpoints:**
- `POST /api/applications` - Submit application
- `GET /api/applications?listing_id=X` - Get with AI scoring
- `PATCH /api/applications/{id}` - Update status
- `GET /api/applications/user/{user_id}` - User's applications
- `GET /api/applications/landlord/{landlord_id}` - Landlord's applications

### 3.5 Contractor Marketplace
| Feature | Status | Description |
|---------|--------|-------------|
| Contractor Profiles | ✅ Complete | Business info, specialties, portfolio |
| Service Listings | ✅ Complete | Services with pricing |
| Job Posting | ✅ Complete | Post jobs for bidding |
| Bidding System | ✅ Complete | Contractors bid on jobs |
| Service Booking | ✅ Complete | Direct booking flow |
| Ratings & Reviews | ✅ Complete | 5-star system with reviews |
| Leaderboard | ✅ Complete | Top-rated contractors |
| WCB/Insurance Verification | ✅ Complete | AI-powered document verification |

**Contractor Specialties:**
- Plumbing, Electrical, HVAC
- Painting, Renovation, Carpentry
- Cleaning, Landscaping, Roofing
- General Maintenance

**API Endpoints:**
- `GET /api/contractors` - List contractors
- `GET /api/contractors/{id}` - Profile details
- `POST /api/contractors/profile` - Create/update profile
- `POST /api/contractors/verify-document` - AI document verification
- `GET /api/contractor-jobs` - Available jobs
- `POST /api/contractor-jobs/{id}/bid` - Submit bid
- `POST /api/service-bookings` - Book service
- `POST /api/reviews` - Submit review

### 3.6 Payments & Transactions
| Feature | Status | Description |
|---------|--------|-------------|
| Stripe Integration | ✅ Complete | Checkout sessions |
| Lease Assignment Payments | ✅ Complete | Marketplace fee payments |
| Payment History | ✅ Complete | Transaction tracking |
| Role-Specific Options | ✅ Complete | Different options per user type |

**Payment Types by Role:**
- **Renters:** Pay Rent, Security Deposit, Utilities
- **Landlords:** Collect Rent, Accept Deposit, Send Invoice
- **Contractors:** Send Invoice, Request Payment, View Earnings

**API Endpoints:**
- `POST /api/payments/create-checkout` - Create Stripe session
- `GET /api/payments/status/{session_id}` - Check payment status
- `GET /api/payments/history` - Transaction history
- `POST /api/lease-assignments/{id}/payment` - Lease assignment payment

### 3.7 Document Management
| Feature | Status | Description |
|---------|--------|-------------|
| Document Upload | ✅ Complete | Base64 storage |
| Document Signing | ✅ Complete | In-app signing |
| DocuSign Integration | ✅ Complete | OAuth 2.0 flow |
| AI Document Analysis | ✅ Complete | Lease fairness scoring |
| BC Government Forms | ✅ Complete | RTB-1, RTB-7, RTB-26, RTB-30 |

**API Endpoints:**
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/{user_id}` - User's documents
- `POST /api/documents/sign/{doc_id}` - Sign document
- `GET /api/esign/documents/{user_id}` - E-sign documents
- `POST /api/docusign/send-envelope` - Send via DocuSign
- `POST /api/ai/analyze-document` - AI analysis
- `POST /api/ai/analyze-document-file` - Upload & analyze

### 3.8 Messaging & Notifications
| Feature | Status | Description |
|---------|--------|-------------|
| Direct Messaging | ✅ Complete | User-to-user messages |
| WebSocket Real-time | ✅ Complete | Instant message delivery |
| Push Notifications | ✅ Complete | Firebase Cloud Messaging |
| In-App Notifications | ✅ Complete | Notification center |
| Email Notifications | ✅ Complete | Via Resend |

**API Endpoints:**
- `POST /api/messages/send` - Send message
- `GET /api/messages/{user_id}` - Get messages
- `GET /api/messages/conversations/{user_id}` - Conversation list
- `POST /api/notifications/register-token` - Register FCM token
- `GET /api/notifications/{user_id}` - Get notifications
- `POST /api/notifications/mark-read/{id}` - Mark as read

### 3.9 Additional Features
| Feature | Status | Description |
|---------|--------|-------------|
| Roommate Finder | ✅ Complete | AI compatibility scoring |
| Moving Quote Calculator | ✅ Complete | Real cost estimates + AI tips |
| Commute Optimizer | ✅ Complete | Find properties by commute |
| Lease Assignment Marketplace | ✅ Complete | Transfer leases |
| Listing Syndication | ✅ Complete | Post to external platforms |
| AI Competitor Analysis | ✅ Complete | Real-time price scraping via Perplexity |
| Calendar Integration | ✅ Complete | Google Calendar OAuth |
| Address Autocomplete | ✅ Complete | Google Places API |
| Analytics Dashboard | ✅ Complete | Role-specific metrics |
| Settings Management | ✅ Complete | User preferences + payment methods |

### 3.10 Document Builder (NEW)
| Feature | Status | Description |
|---------|--------|-------------|
| BC Form Templates | ✅ Complete | RTB-1, RTB-7, RTB-26, RTB-30 |
| Step-by-Step Wizard | ✅ Complete | Section-based form filling |
| Auto-fill | ✅ Complete | Pre-populates landlord info |
| PDF Generation | ✅ Complete | Download completed forms |
| Send for Signature | ✅ Complete | Email documents for e-sign |
| Document Preview | ✅ Complete | Review before sending |

**API Endpoints:**
- `POST /api/document-builder/save` - Save draft document
- `POST /api/document-builder/send` - Send for signature
- `POST /api/document-builder/pdf` - Generate PDF
- `GET /api/document-builder/list/{user_id}` - List user documents

### 3.11 Universal Payments & Invoices (NEW)
| Feature | Status | Description |
|---------|--------|-------------|
| Role-Specific Payment Types | ✅ Complete | Rent, utilities, contractors, etc. |
| Stripe Integration | ✅ Complete | Secure card processing |
| Invoice Generation | ✅ Complete | Auto-generated per payment |
| PDF Invoice Download | ✅ Complete | Professional invoices |
| Payment History | ✅ Complete | Full transaction log |
| Credit Card Management | ✅ Complete | Save/manage payment methods |

**API Endpoints:**
- `POST /api/payments/create` - Create payment + invoice
- `GET /api/invoices/{user_id}` - Get user invoices
- `GET /api/invoices/{invoice_id}/pdf` - Download invoice PDF
- `GET /api/payments/types/{user_type}` - Get role payment types
- `POST /api/stripe/checkout-setup` - Add new card

### 3.12 Post-Reservation Upsells (NEW)
| Feature | Status | Description |
|---------|--------|-------------|
| Service Categories | ✅ Complete | Movers, internet, insurance, etc. |
| Local Providers | ✅ Complete | Vancouver-area curated list |
| Quote Requests | ✅ Complete | Request service quotes |

**API Endpoints:**
- `GET /api/upsells/services/{city}` - Get local service providers
- `POST /api/upsells/request-quote` - Request service quote

### 3.13 Featured Listings (NEW)
| Feature | Status | Description |
|---------|--------|-------------|
| Boost Listing | ✅ Complete | Landlord can feature properties |
| Pay-Per-Success | ✅ Complete | $49.99 fee when rented |
| Featured Badge | ✅ Complete | Visual indicator on cards |
| Priority Sorting | ✅ Complete | Featured appear first |

**API Endpoints:**
- `POST /api/listings/{id}/featured` - Enable featured
- `DELETE /api/listings/{id}/featured` - Disable featured
- `POST /api/listings/{id}/mark-rented` - Mark rented + charge fee

---

## 4. Technical Architecture

### 4.1 Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, Shadcn UI |
| Backend | Python FastAPI (async) |
| Database | MongoDB Atlas (Motor driver) |
| AI/LLM | Claude Sonnet 4.5 (Anthropic) |
| Voice STT | OpenAI Whisper |
| Voice TTS | OpenAI TTS |
| Maps | Google Maps Platform |
| Payments | Stripe |
| Email | Resend |
| E-Sign | DocuSign OAuth 2.0 |
| Storage | Cloudinary (videos) |
| Notifications | Firebase Cloud Messaging |
| Analytics | Firebase Analytics |
| PWA | Service Worker + Manifest |

### 4.2 File Structure
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI app (~5000 lines)
│   ├── db.py              # MongoDB connection
│   ├── models/            # Pydantic models
│   │   ├── user.py
│   │   ├── listing.py
│   │   ├── contractor.py
│   │   └── ...
│   ├── routers/           # Route handlers
│   │   ├── calendar.py
│   │   ├── nova.py
│   │   └── ...
│   └── services/          # Business logic
│       ├── ai_tools.py    # AI tool implementations
│       ├── email.py       # Email service
│       ├── docusign_service.py
│       └── ...
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main routes
│   │   ├── pages/         # 40+ page components
│   │   ├── components/
│   │   │   ├── chat/      # NovaChat
│   │   │   ├── ui/        # Shadcn components
│   │   │   └── ...
│   │   └── lib/           # Utilities
│   └── public/
└── memory/
    ├── PRD.md             # This document
    ├── CHANGELOG.md       # Version history
    └── ROADMAP.md         # Future plans
```

### 4.3 Database Collections
| Collection | Purpose |
|------------|---------|
| users | User accounts and preferences |
| listings | Property listings |
| applications | Rental applications |
| maintenance_requests | Maintenance tickets |
| contractor_profiles | Contractor info |
| contractor_jobs | Job postings |
| service_bookings | Service appointments |
| reviews | Ratings and reviews |
| documents | Uploaded documents |
| esign_documents | E-signature documents |
| messages | Direct messages |
| notifications | User notifications |
| chat_sessions | AI chat history |
| renter_resumes | Tenant profiles |
| lease_assignments | Lease transfer listings |
| payment_transactions | Payment records |
| viewings | Scheduled viewings |
| fcm_tokens | Push notification tokens |

---

## 5. Frontend Pages (42 Total)

### 5.1 Public Pages
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with Nova search |
| About | `/about` | Company information |
| Properties | `/properties` | Featured listings |
| Services | `/services` | Platform services |
| Contact | `/contact` | Contact form |
| Browse | `/browse` | Property search |
| Contractors | `/contractors` | Contractor marketplace |
| Contractor Portfolio | `/portfolio/:id` | Public portfolio view |
| Lease Assignments | `/lease-assignments` | Lease transfer marketplace |
| Login | `/login` | Authentication |
| Verify Email | `/verify-email` | Email verification |
| Claim Listing | `/claim-listing` | Claim listing flow |

### 5.2 Dashboard Pages (Authenticated)
| Page | Route | Roles | Description |
|------|-------|-------|-------------|
| Dashboard | `/dashboard` | All | Role-specific home |
| Payments | `/payments` | All | Payment management |
| Documents | `/documents` | All | Document storage |
| Messages | `/messages` | All | Direct messaging |
| Applications | `/applications` | R/L | Rental applications |
| Maintenance | `/maintenance` | R/L | Maintenance requests |
| Jobs | `/jobs` | C | Contractor job board |
| My Properties | `/my-properties` | L | Landlord properties |
| Contractor Profile | `/contractor-profile` | C | Profile management |
| Report Issue | `/report-issue` | All | AI issue reporter |
| Document Analyzer | `/document-analyzer` | All | AI document analysis |
| Commute Optimizer | `/commute-optimizer` | R | Commute-based search |
| Offers | `/offers` | L/B/S | Offer management |
| Favorites | `/favorites` | R/B | Saved properties |
| Compare | `/compare` | R/B | Property comparison |
| Roommates | `/roommates` | R | Roommate finder |
| Moving Quote | `/moving-quote` | R | Moving calculator |
| Calendar | `/calendar` | All | Scheduling + Google sync |
| Portfolio | `/portfolio` | C | Contractor portfolio |
| Nova Insights | `/nova-insights` | All | AI analytics |
| My Resume | `/my-resume` | R | Renter profile |
| Applicant Ranking | `/applicant-ranking` | L | AI applicant scoring |
| E-Sign | `/esign` | L | Digital signatures |
| Syndication | `/syndication` | L | Cross-platform posting |
| Analytics | `/analytics` | L | Platform metrics |
| Listing Optimizer | `/listing-optimizer` | L | AI listing optimization |
| Settings | `/settings` | All | User preferences |

*R=Renter, L=Landlord, C=Contractor, B=Buyer, S=Seller*

---

## 6. Third-Party Integrations

### 6.1 Active Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| Anthropic Claude | AI chatbot & analysis | ✅ Active |
| OpenAI Whisper | Voice transcription | ✅ Active |
| OpenAI TTS | Text-to-speech | ✅ Active |
| Google Maps | Address autocomplete & maps | ✅ Active |
| Google Calendar | Calendar sync | ✅ Active |
| Stripe | Payment processing | ✅ Active |
| Resend | Transactional emails | ⚠️ Test Mode |
| DocuSign | E-signatures | ✅ Active |
| Cloudinary | Video storage | ✅ Active |
| Firebase | Analytics & Push notifications | ✅ Active |
| MongoDB Atlas | Database | ✅ Active |

### 6.2 Required API Keys
```env
# Backend (.env)
ANTHROPIC_API_KEY=     # Claude AI
OPENAI_API_KEY=        # Whisper & TTS
GOOGLE_MAPS_API_KEY=   # Maps & Places
STRIPE_API_KEY=        # Payments
RESEND_API_KEY=        # Email
DOCUSIGN_*             # E-signatures
CLOUDINARY_*           # Video storage
MONGO_URL=             # Database

# Frontend (.env)
REACT_APP_BACKEND_URL= # API URL
REACT_APP_GOOGLE_MAPS_API_KEY=
REACT_APP_FIREBASE_*   # Firebase config
```

---

## 7. Current Status & Known Issues

### 7.1 Fully Functional
- All authentication flows (registration, login, verification)
- Property browsing and search
- AI chatbot with tool calling
- Contractor marketplace and ratings
- Rental applications with AI scoring
- Document management and e-signing
- Messaging and notifications
- Payment processing via Stripe
- Calendar integration with Google

### 7.2 Known Issues
| Issue | Priority | Status |
|-------|----------|--------|
| CDN Caching on Preview | P0 | Infrastructure limitation |
| Resend Test Mode | P1 | Pending DNS verification |

### 7.3 Mocked/Simulated Features
| Feature | Notes |
|---------|-------|
| Competitor Price Scraping | Uses local DB data + AI analysis |
| In-House Financing | UI mockups pending |

---

## 8. Upcoming Features (Roadmap)

### P0 - Critical
- Complete "Featured" property payment flow
- Enable production email sending (DNS setup)

### P1 - High Priority
- Real competitor scraping (Bright Data integration)
- Credit card management UI
- Enhanced analytics dashboards by role

### P2 - Medium Priority
- DocuSign-like document building
- Post-reservation upsells (movers, wifi)
- In-house financing mockups

### P3 - Future
- iOS/Android native apps
- Multi-language support
- SMS notifications via Twilio

---

## 9. Testing Status

### 9.1 Test Reports
- **Backend:** 54/54 tests passing (100%)
- **Frontend E2E:** 18/18 tests passing (100%)
- **Test Framework:** Pytest (backend), Playwright (frontend)
- **Location:** `/app/test_reports/iteration_*.json`

### 9.2 Test Coverage
- Authentication flows
- Listing CRUD operations
- Application submission and ranking
- Contractor booking flow
- Payment processing
- AI chat functionality
- Document upload/signing

---

## 10. Appendices

### A. API Reference
Full API documentation available in `/app/backend/server.py` with detailed docstrings.

### B. Environment Setup
See `/app/downloads/LOCAL_SETUP_INSTRUCTIONS.md` for local development setup.

### C. Design System
- **Primary Color:** #1A2F3A (Dark Teal)
- **Background:** #F5F5F0 (Cream)
- **Font:** Cormorant Garamond (headings), System (body)
- **Components:** Shadcn UI library

### D. Related Documents
- `CHANGELOG.md` - Version history with dates
- `ROADMAP.md` - Prioritized feature backlog
- `HANDOFF_PROMPT.md` - Developer handoff document

---

*This PRD is a living document and should be updated as features are added or modified.*
