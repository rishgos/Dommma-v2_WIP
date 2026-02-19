# DOMMMA V3 - Complete Real Estate Marketplace Platform

## Original Problem Statement
Build a complete real estate marketplace called "DOMMMA" for Renters, Landlords, and Contractors with role-specific features, dark teal theme, AI chatbot (Nova), Stripe payments, and full marketplace functionality.

## Tech Stack
- **Frontend**: React.js with Tailwind CSS, Shadcn UI
- **Backend**: Python FastAPI
- **Database**: MongoDB (Motor async driver)
- **Auth**: JWT + passlib bcrypt
- **Payments**: Stripe (test key)
- **AI/LLM**: Claude Sonnet 4.5 (Emergent LLM Key)
- **Maps**: Google Maps API
- **Notifications**: Firebase Cloud Messaging
- **Analytics**: Firebase Analytics
- **Email**: Resend (transactional emails)

## User Personas
1. **Renter** - Search properties, apply, message landlords, hire contractors, pay rent, analyze leases, optimize commute
2. **Landlord** - Manage properties (CRUD + photos), review applications, track maintenance
3. **Contractor** - Create profile, post services, manage bookings, get paid

## Core Architecture
```
/app/
├── backend/
│   ├── server.py           # All API routes (needs refactoring)
│   ├── fcm_utils.py        # Firebase messaging
│   └── .env                # MONGO_URL, EMERGENT_LLM_KEY, STRIPE_API_KEY, RESEND_API_KEY
├── frontend/src/
│   ├── App.js              # Router + Auth context
│   ├── pages/
│   │   ├── Home.jsx                    # Landing page with AI tools & leaderboard
│   │   ├── Browse.jsx                  # Property search + map + Apply/Message
│   │   ├── Login.jsx                   # Auth (register/login)
│   │   ├── Dashboard.jsx               # Role-based dashboard
│   │   ├── MyProperties.jsx            # Landlord property CRUD with photos
│   │   ├── ContractorMarketplace.jsx   # Browse/search/book contractors
│   │   ├── ContractorProfile.jsx       # Contractor dashboard
│   │   ├── SmartIssueReporter.jsx      # AI issue analysis + contractor matching
│   │   ├── DocumentAnalyzer.jsx        # AI lease/document analysis
│   │   ├── CommuteOptimizer.jsx        # AI commute-based property search
│   │   ├── Applications.jsx            # Rental applications
│   │   ├── Maintenance.jsx             # Maintenance requests
│   │   ├── Jobs.jsx                    # Contractor jobs
│   │   ├── Messages.jsx                # Messaging
│   │   ├── Payments.jsx                # Payment history
│   │   └── Documents.jsx               # Document management
│   └── components/
│       ├── chat/NovaChat.js            # AI chatbot
│       └── notifications/NotificationBell.js
└── memory/PRD.md
```

## What's Been Implemented

### Phase 1 - Core Platform ✅
- [x] JWT auth with passlib bcrypt (register/login for 3 roles)
- [x] Homepage with hero, Nova AI search, property grid
- [x] Property browsing with Google Maps integration
- [x] Dashboard with role-based navigation
- [x] Firebase Analytics + Cloud Messaging
- [x] "Made with Emergent" badge hidden

### Phase 2 - Full Renter/Landlord ✅
- [x] Browse properties → Apply Now + Message Landlord buttons
- [x] Applications page (submit/track for renters, review for landlords)
- [x] Maintenance requests (submit/track)
- [x] Messaging system (WebSocket real-time)
- [x] Payments page with Stripe checkout
- [x] Documents management (upload, view, sign)
- [x] Landlord My Properties - Full CRUD with photo upload

### Phase 3 - Full Contractor Marketplace ✅
- [x] Contractor Profiles - Business info, specialties, service areas, rates
- [x] Service Listings - Contractors post services with pricing
- [x] Contractor Search - Browse by category, search by name/specialty
- [x] Service Booking - Customers book contractors
- [x] Booking Management - Contractors confirm/start/complete bookings
- [x] Review System - Auto-calculated ratings
- [x] Payment for Bookings - Stripe integration
- [x] Image upload for property photos and portfolios

### Phase 4 - Email & AI Features ✅ (Feb 19, 2026)
- [x] **Resend Email Integration** - Welcome emails, booking confirmations, application updates
- [x] **Smart Issue Reporter** - AI analyzes home issues from description, matches contractors
- [x] **Document Analyzer** - AI reviews leases for fairness score, red/green flags, recommendations
- [x] **Commute Optimizer** - AI ranks properties by commute time to work
- [x] **Contractor Leaderboard** - Top-rated contractors featured on homepage
- [x] **Homepage AI Tools Section** - 3 cards linking to AI features
- [x] **Homepage Contractor Services** - 6 category cards
- [x] **Updated Dashboard Sidebar** - AI tools for renters/landlords

### Key API Endpoints
- Auth: `POST /api/auth/register`, `/api/auth/login`
- Listings: `GET/POST/PUT/DELETE /api/listings/*`
- Contractors: `GET/POST /api/contractors/*`
- Services: `GET/POST/DELETE /api/contractors/services/*`
- Bookings: `POST/GET/PUT /api/bookings/*`
- AI: `POST /api/ai/analyze-issue`, `/api/ai/analyze-document`, `/api/ai/commute-search`
- Upload: `POST /api/upload/image`
- Email: Triggered automatically on register, booking confirm, application update

### DB Collections
users, listings, contractor_profiles, contractor_services, bookings, rental_applications, maintenance_requests, payment_transactions, images, notifications, fcm_tokens

## Prioritized Backlog

### P0 - Next Up
- [ ] Backend refactoring - split monolithic server.py into routers/models/services
- [ ] Resend domain verification for production emails

### P1 - Important
- [ ] Enhanced Nova AI features (more conversational, property recommendations)
- [ ] Application approve/reject workflow with detailed notifications
- [ ] Contractor portfolio image gallery
- [ ] Search filters on Browse (price range, bedrooms, pet-friendly)

### P2 - Nice to Have
- [ ] Roommate Finder system
- [ ] Google Calendar for property viewings
- [ ] Moving company API integration
- [ ] Advanced social features (community, reviews for properties)

### P3 - Future
- [ ] iOS & Android mobile apps (React Native)
- [ ] Progressive Web App (PWA) features
- [ ] Real-time location tracking for contractor arrivals

## Test Reports
- `/app/test_reports/iteration_6.json` - V2 features (100% pass)
- `/app/test_reports/iteration_7.json` - V3 AI features + email (100% pass)

## 3rd Party Integrations
- Google Maps: Property browsing maps
- Claude Sonnet 4.5: Nova chatbot + AI analysis features
- Stripe: Payments (test key)
- Firebase Analytics: User tracking
- Firebase Cloud Messaging: Push notifications
- Resend: Transactional emails (test mode)
