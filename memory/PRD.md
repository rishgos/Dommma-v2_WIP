# DOMMMA - Complete Real Estate Marketplace Platform

## Original Problem Statement
Build a complete real estate marketplace called "DOMMMA" for Renters, Landlords, Buyers, Sellers, and Contractors with role-specific features, dark teal theme, AI chatbot (Nova), Stripe payments, and full marketplace functionality.

**Latest Direction (AI-First Pivot):** The platform is pivoting to an AI-first concierge model where users interact with a persistent chatbot (Nova) to perform all key actions via natural language (searching, listing, booking, maintenance requests).

**Related Documentation:**
- `CHANGELOG.md` - Version history with dates
- `ROADMAP.md` - Prioritized backlog and future plans
- `HANDOFF_PROMPT.md` - Complete developer handoff document

---

## V17 Updates (March 3, 2026) - LATEST

### DocuSign OAuth Complete ✅
- Client Secret configured: `61c64029-286f-4434-b258-fb5b34716145`
- Full OAuth flow now working end-to-end

### My Resume Page ✅
- Full renter profile with employment, rental history, references
- Completeness score calculation (0-100%)
- Edit/Save functionality
- Tips for improving profile

### AI Applicant Ranking ✅
- Property selector for landlord's listings
- AI scoring algorithm (income ratio, employment, rental history)
- Strengths/concerns analysis
- Approve/Reject actions
- Filter by qualification level

### Backend Enhancements ✅
- GET /api/applications?listing_id=X with AI scoring
- PATCH /api/applications/{id} for status updates
- calculate_applicant_score() function
- generate_applicant_analysis() function

### Test Results
- Backend: 54/54 tests pass (100%)
- Frontend: 18/18 E2E tests pass (100%)

---

## V16 Updates (March 2, 2026)

### DocuSign OAuth 2.0 Integration ✅
- [x] Full OAuth authorization code grant flow
- [x] Connect/disconnect DocuSign account from E-Sign page
- [x] Send documents via DocuSign for legally binding signatures
- [x] Envelope status tracking
- [x] New endpoints: `/api/docusign/*`
- [ ] **NEEDS:** DocuSign Client Secret from user

### Stripe Payment Processing ✅
- [x] Lease assignment fee payments via Stripe Checkout
- [x] "Pay $X" button on marketplace cards
- [x] Transaction tracking in database
- [x] New endpoints: `/api/lease-assignments/{id}/payment`

### Advanced Analytics Dashboard ✅
- [x] Platform overview with real-time stats
- [x] 5 stat cards: Users, Listings, Revenue, Contractors, Documents
- [x] Charts: Users by Type, Listings by City, Price Distribution
- [x] Recent activity feed
- [x] Available at `/analytics` (landlord sidebar)
- [x] New endpoints: `/api/analytics/*`

### Bug Fixes ✅
- [x] MongoDB _id serialization error in POST /api/lease-assignments
- [x] Pydantic validation error when owner_id was null

---

## Claude Tool Calling Implementation ✅
- [x] **AI Concierge Endpoint** - New `/api/ai/concierge` with Claude tool calling
- [x] **9 AI Tools Implemented:**
  - `create_listing` - Create property listings via conversation
  - `search_listings` - Search properties with natural language
  - `find_contractors` - Find plumbers, electricians, cleaners, etc.
  - `triage_maintenance` - Handle maintenance requests with urgency
  - `calculate_budget` - Budget calculations using 30% rule
  - `schedule_viewing` - Book property viewings
  - `price_lease_assignment` - Calculate fair lease assignment fees
  - `build_renter_resume` - Create/update tenant profiles
  - `get_renter_resume` - Retrieve saved tenant profiles
- [x] **Multiple Tool Support** - Claude can call multiple tools in one response
- [x] **Frontend Integration** - NovaChat uses new endpoint with fallback

### Sticky AI Concierge ✅
- [x] Nova AI button now appears on ALL pages (not just homepage)
- [x] Enhanced button with pulsing animation
- [x] Shows capabilities on hover: Search, Contractors, Maintenance, Budget

### New Features (Mar 2026) ✅
- [x] **My Resume Page** (`/my-resume`) - Visual dashboard for renters to create/edit profiles
  - Employment, income, rental history, references
  - Completeness score with tips to strengthen profile
  - Accessible from renter sidebar
- [x] **AI Applicant Ranking** (`/applicant-ranking`) - Landlord dashboard with AI-scored applicants
  - Match percentage based on income, employment, rental history
  - Strengths & concerns analysis
  - Approve/Reject actions
- [x] **Lease Assignment Marketplace** (`/lease-assignments`) - Public marketplace for lease transfers
  - Search and filter lease takeover opportunities
  - Create new assignment listings
  - Savings calculations (current vs market rent)
  - Accessible from main navigation
- [x] **E-Sign Documents** (`/esign`) - Digital document signing for landlords
  - BC Government rental forms (RTB-1, RTB-7, RTB-26, RTB-30)
  - Create, send, and sign documents digitally
  - Track document status (pending/signed)
  - Signature capture with legal agreement
- [x] **Listing Syndication** (`/syndication`) - Cross-post to external platforms
  - Facebook Marketplace, Craigslist, Kijiji support
  - One-click formatted content generation
  - Deep links to post on each platform
  - Copy-ready titles, descriptions, and hashtags
  - Syndication tracking and stats
- [x] **Video Tours** - Cloudinary-powered video uploads
  - VideoTourUploader component for listings
  - VideoTourPlayer component for display
  - Progress tracking during upload
  - Backend signature generation for secure uploads

### Bug Fixes
- [x] **Homepage Chat Search** - Fixed search bar to open chat modal
- [x] **Contractor Link Rendering** - Clickable links in chat responses
- [x] **Missing lat/lng Fix** - Added default coordinates for AI-created listings

## Tech Stack
- **Frontend**: React.js with Tailwind CSS, Shadcn UI
- **Backend**: Python FastAPI (modular structure)
- **Database**: MongoDB (Motor async driver)
- **Auth**: JWT + passlib bcrypt
- **Payments**: Stripe (test key)
- **AI/LLM**: Claude Sonnet 4.5 (Direct Anthropic API)
- **Voice STT**: OpenAI Whisper (Direct OpenAI API)
- **Voice TTS**: OpenAI TTS (Direct OpenAI API)
- **Maps**: Google Maps API
- **Calendar**: Google Calendar OAuth2
- **Notifications**: Firebase Cloud Messaging
- **Analytics**: Firebase Analytics
- **Email**: Resend
- **PWA**: Service Worker + Manifest

## Architecture
```
/app/backend/
├── models/         # Pydantic models
├── routers/        # API routes
│   ├── calendar.py    # Calendar & Google OAuth
│   ├── moving.py      # Moving quotes
│   ├── compatibility.py # Roommate matching
│   ├── portfolio.py   # Contractor portfolio
│   └── nova.py        # Nova AI (TTS, Insights)
├── services/       # Business logic
│   ├── calendar.py       # Local calendar
│   ├── google_calendar.py # Google OAuth
│   ├── moving.py         # Moving calculator
│   ├── compatibility.py  # Compatibility scoring
│   ├── voice.py          # Whisper STT
│   ├── tts.py            # OpenAI TTS
│   ├── nova_memory.py    # Long-term memory
│   ├── nova_insights.py  # User analytics
│   ├── image_analysis.py # Property image AI
│   └── email.py          # Resend email
├── db.py           # MongoDB connection
└── server.py       # Main FastAPI app

/app/frontend/src/
├── components/
│   ├── chat/NovaChat.jsx    # AI chatbot with TTS, voice input
│   ├── ui/                  # Shadcn components
│   └── layout/              # Layout components
├── pages/
│   ├── NovaInsights.jsx     # AI analytics dashboard
│   ├── CalendarPage.jsx     # Calendar & scheduling
│   ├── Browse.jsx           # Property listings
│   ├── Dashboard.jsx        # Role-based dashboard
│   └── ...                  # Other pages
└── App.js
```

## What's Been Implemented

### Core Platform (V1-V3)
- [x] JWT auth with bcrypt (renter/landlord/contractor/buyer/seller)
- [x] Property browsing with Google Maps, filters, favorites
- [x] Role-based dashboard with full navigation
- [x] Firebase Analytics + Cloud Messaging
- [x] PWA Support

### Buy/Sell & Contractor Marketplace (V4-V5)
- [x] Rent/Buy toggle, sale listings, offers
- [x] Contractor profiles, services, booking, reviews
- [x] Stripe payments

### Social Features (V5)
- [x] Favorites, Comparison Tool, Roommate Finder
- [x] AI Compatibility Scoring

### Calendar & Moving (V6)
- [x] In-app calendar with property viewings
- [x] Google Calendar OAuth integration (real)
- [x] Moving quote calculator with 3-step wizard
- [x] Contractor Portfolio with before/after images

### Viewing Scheduler (V8) - NEW - VERIFIED WORKING
- [x] **Schedule Viewing Button** - Available on all listing modals (rent & sale)
- [x] **ViewingScheduler Modal** - 4-step wizard:
  - Date selection (next 14 days, excludes Sundays)
  - Time selection (9am-6pm, 30-min intervals)
  - Confirmation with optional notes
  - Success screen with calendar link
- [x] **Google Calendar Integration** - Optional sync when connected
- [x] **Calendar Page Updates** - OAuth callback handling, success/error banners

### Contractor Ratings System (V9) - NEW - VERIFIED WORKING
- [x] **Review Submission** - ContractorReview modal with:
  - 5-star rating selection with visual feedback
  - Review text input with character counter
  - Success confirmation screen
- [x] **Reviews Display** - ContractorReviews component with:
  - Overall rating summary
  - Rating distribution bars (1-5 stars)
  - Individual review cards with customer info
  - "No reviews yet" empty state
- [x] **Leaderboard** - ContractorLeaderboard component with:
  - Top-rated contractors list
  - Medal icons for top 3 (gold/silver/bronze)
  - Rating, review count, and completed jobs display
  - Sidebar on contractor marketplace (desktop)
- [x] **Dashboard Integration** - PendingReviews on renter dashboard:
  - Shows completed bookings needing reviews
  - One-click to open review modal
  - Auto-hides when no pending reviews

### Push Notifications (V10) - NEW - VERIFIED WORKING
- [x] **NotificationBell Component** - Enhanced dropdown with:
  - Fetches notifications from backend API
  - Compact "Enable push" banner (non-blocking)
  - Notification list with type-specific icons
  - Mark all read / individual mark as read
  - Unread count badge (animated pulse)
  - Refresh button
- [x] **NotificationPrompt Banner** - Dashboard banner for new users:
  - "Stay in the Loop" prompt
  - Enable/Later buttons
  - Session-based dismissal
- [x] **FCM Token Management** - Backend integration:
  - Token registration on permission grant
  - Token update for existing users
- [x] **Backend APIs** - Full notification CRUD:
  - POST /api/notifications/register-token
  - POST /api/notifications/send
  - GET /api/notifications/{user_id}
  - POST /api/notifications/mark-read/{id}

### AI Roommate Compatibility (V11) - NEW - VERIFIED WORKING - REAL AI
- [x] **Compatibility Scoring** - Multi-factor algorithm:
  - Budget overlap calculation (0-25 pts)
  - Location/area intersection (0-25 pts)
  - Lifestyle alignment + conflict detection (0-30 pts)
  - Habits matching (pets, smoking) (0-20 pts)
  - Compatibility levels: excellent/good/moderate/fair/low
- [x] **AI-Enhanced Insights** - Claude Sonnet 4.5 powered:
  - One-sentence compatibility summary
  - Strengths list (shared traits)
  - Potential challenges to discuss
  - Tips for living together
  - Conversation starters
- [x] **Frontend Integration** - RoommateFinder.jsx:
  - Percentage badges on profile cards with color coding
  - Full breakdown bars in profile modal
  - "Get AI Insights" button for on-demand analysis
  - AI insights display with strengths/challenges/tips

### AI Moving Assistant (V12) - NEW - VERIFIED WORKING - REAL AI
- [x] **Real Cost Calculator** - Based on:
  - Distance (Haversine formula between Vancouver areas)
  - Home size → estimated hours + truck size + crew
  - Special items surcharges (piano $300, pool table $250, etc.)
  - Floor surcharges when no elevator ($50/floor)
  - Packing service (+40%), storage options
- [x] **AI-Powered Tips** - Claude Sonnet 4.5:
  - Move summary
  - 3 money-saving tips
  - 5-item preparation checklist
  - 3 moving day tips
  - Neighborhood information
  - Timing advice
- [x] **Frontend Updates** - MovingQuote.jsx:
  - "AI Moving Assistant" expandable section
  - All 6 tip categories displayed with icons
  - On-demand AI tips via button
  - Refresh compatibility scores button

### Nova AI Enhancements (V7) - VERIFIED WORKING
- [x] **Voice Input (STT)** - OpenAI Whisper transcription
  - Mic button in chat interface
  - Real-time speech-to-text
  - Auto-send after transcription
- [x] **Voice Output (TTS)** - OpenAI TTS
  - 9 voices: Alloy, Ash, Coral, Echo, Fable, Nova, Onyx, Sage, Shimmer
  - Speed control 0.25x - 4x
  - Toggle in chat header
  - Per-user voice preferences
- [x] **Nova Insights Dashboard**
  - Search history analysis
  - Preference evolution tracking
  - Personalized market trends
  - Moving timeline with phases
  - Property match scores
  - Activity summary
  - AI recommendations
  - Voice settings management
- [x] **Long-Term Memory** - User preference extraction
- [x] **Proactive Suggestions** - Smart notifications
- [x] **Property Image Analysis** - Claude Vision

## Test Reports
- iteration_9.json — V5 Social Features (100%)
- iteration_10.json — V6 Calendar + Moving (100%)
- iteration_11.json — V7 Nova AI Voice Input (100%)
- iteration_12.json — V7 TTS + Insights + OAuth (95.5% backend, 100% frontend)
- iteration_13.json — V8 Viewing Scheduler (100% backend, 100% frontend)
- iteration_14.json — V9 Contractor Ratings System (100% backend, 100% frontend)
- iteration_15.json — V10 Push Notifications (100% backend, 90% frontend)
- iteration_16.json — V11 AI Roommate Compatibility (100% backend, 100% frontend)
- iteration_17.json — V12 AI Moving Assistant (100% backend, 100% frontend)

## Key API Endpoints
### Nova AI
- `POST /api/nova/tts` - Text-to-speech
- `GET /api/nova/tts/voices` - Available voices
- `GET/POST /api/nova/tts/preferences/{user_id}` - Voice settings
- `POST /api/nova/transcribe` - Voice to text (STT)
- `GET /api/nova/insights/{user_id}` - Full analytics
- `GET /api/nova/insights/{user_id}/timeline` - Moving timeline
- `GET /api/nova/insights/{user_id}/matches` - Property matches
- `GET /api/nova/insights/{user_id}/trends` - Market trends
- `GET /api/nova/memory/{user_id}` - User memory
- `GET /api/nova/suggestions/{user_id}` - Proactive suggestions
- `POST /api/nova/analyze-image` - Property image analysis

### Google Calendar
- `GET /api/calendar/google/auth-url` - OAuth URL
- `POST /api/calendar/google/callback` - Token exchange
- `GET /api/calendar/google/status/{user_id}` - Connection status
- `DELETE /api/calendar/google/disconnect/{user_id}` - Disconnect
- `POST /api/calendar/google/sync/{event_id}` - Sync to Google
- `GET /api/calendar/google/events/{user_id}` - Google events
- `POST /api/calendar/google/create` - Create Google event

## Prioritized Backlog

### P0 - Immediate (Next)
- [x] ~~Implement Viewing Scheduler UI~~ ✅ COMPLETED

### P1 - Next Sprint
- [x] ~~Frontend Push Notifications~~ ✅ COMPLETED

### P2 - Future
- [ ] Moving company API integration (replace calculation-based)
- [ ] Video support in contractor portfolios
- [ ] Multi-image property comparison
- [ ] iOS & Android native apps

### V13 - Dynamic Landing Page & AI Property Links (Dec 2025)
- [x] **Dynamic Featured Listings** - Landing page now fetches from database:
  - Real listings displayed when database has data
  - Sample data fallback with "Sample" banner when empty
  - Loading skeleton during fetch
  - Clickable cards link to property details
- [x] **Nova AI Property Links** - AI returns clickable property links:
  - Format: `[Property Name](property:ID)` 
  - Frontend parses and renders as clickable links
  - Links open property in browse view
  - Listing cards below AI responses are also clickable
- [x] **Enhanced Offline Support (PWA)** - Service worker v2:
  - Caches listings API responses for offline viewing
  - Static assets cached on install
  - Graceful offline fallback
- [x] **Documentation Updates** - Comprehensive README:
  - Python 3.10/3.11 recommendation (avoid 3.14+)
  - MongoDB setup instructions
  - Step-by-step troubleshooting
  - Database seeding examples
  - Offline/PWA instructions

### V14 - Nova AI Memory & UX Improvements (Dec 2025)
- [x] **Nova AI Long-Term Memory** - Remembers user preferences across sessions:
  - Auto-extracts preferences from chat (budget, bedrooms, pets, areas)
  - Stores in database per user_id
  - Loads preferences when logged-in user opens chat
  - Shows "Picking up where we left off..." message
  - Displays saved preferences in chat header
- [x] **Persistent Dashboard Sidebar** - Navigation stays visible:
  - Created DashboardLayout wrapper component
  - All dashboard pages now use consistent layout
  - Sidebar highlights active page
  - Mobile-friendly with hamburger menu
- [x] **"Pros" Navigation Link** - Easy access to contractors:
  - Added "Pros" link in main navbar (after Properties)
  - Links to contractor marketplace
  - Updated footer links
- [x] **4-Column Property Grid** - Better Browse page layout:
  - Changed from 2-column list to 4-column card grid
  - More properties visible at once
  - Compact, professional design
- [x] **Homepage Improvements**:
  - Removed non-functional play button
  - Added "Browse Properties" CTA button
  - Reduced hero height (100vh → 75vh)
  - Nova search bar now visible without scrolling
- [x] **Contractors Page Navigation** - Added MainLayout wrapper:
  - Top navbar now visible on /contractors page
  - Consistent navigation across all public pages
- [x] **Updated Pitch Deck** - Reflects all new features:
  - Updated stats (55k+ lines, 15 features, 6 AI systems)
  - Added AI Memory section
  - Added UX improvements section
  - Updated competitive comparison table

### V15 - Direct API Migration (Dec 2025) - LATEST
- [x] **Removed Emergent LLM Key Dependency** - Full API control:
  - Migrated from emergentintegrations library to direct SDKs
  - User provides their own Anthropic & OpenAI API keys
  - Full control over billing, rate limits, and usage
- [x] **Direct Anthropic Integration** - Claude Sonnet 4.5:
  - Nova AI chatbot (main chat endpoint)
  - AI issue analysis for contractors
  - Document analysis (lease scanner)
  - Commute optimization search
  - Roommate compatibility AI insights
  - Moving tips generation
  - Property image analysis
- [x] **Direct OpenAI Integration**:
  - Whisper speech-to-text (voice input)
  - TTS text-to-speech (voice output)
- [x] **Updated Environment Variables**:
  - ANTHROPIC_API_KEY replaces EMERGENT_LLM_KEY for Claude
  - OPENAI_API_KEY for Whisper & TTS
- [x] **Documentation Updates**:
  - Updated backend README with new env vars
  - Updated pitch deck (removed Emergent LLM Key references)
  - Clarified direct API integration approach

## Mocked/Simulated Features
- ~~Moving Quote: Simulated pricing~~ **NOW REAL** - Full cost calculator + AI tips
- ~~AI Roommate Compatibility: Simulated scoring~~ **NOW REAL** - Claude Sonnet 4.5
- ~~Landing Page Listings: Hardcoded~~ **NOW REAL** - Dynamic from database
- Google Calendar Sync: OAuth working, actual event sync requires user consent

**ALL FEATURES ARE NOW REAL - NO MOCKS!**

## Credentials
- **Google OAuth**: Configured in backend/.env
- **Anthropic API Key**: Direct Claude Sonnet 4.5 access
- **OpenAI API Key**: Direct access for Whisper & TTS

## Last Updated
March 2, 2026 - V16 DocuSign OAuth, Stripe Payments, Analytics Dashboard

## V16 - DocuSign OAuth, Stripe Payments & Analytics Dashboard (Mar 2026) - LATEST
- [x] **DocuSign OAuth 2.0 Integration** - Full OAuth flow for e-signing:
  - GET /api/docusign/status - Check connection status
  - GET /api/docusign/auth-url - Generate OAuth URL
  - POST /api/docusign/callback - Token exchange
  - POST /api/docusign/disconnect - Disconnect account
  - POST /api/docusign/send-envelope - Send document for signature
  - GET /api/docusign/envelope-status/{id} - Track envelope status
  - DocuSign integration card on E-Sign page
  - "Connect DocuSign" button with OAuth redirect
  - "Send via DocuSign" button on pending documents
  - Integration Key: 8442b058-47ce-4aa6-8842-ef31ef49c5c2
  
- [x] **Stripe Payment Processing** - Lease assignment payments:
  - POST /api/lease-assignments/{id}/payment - Create checkout session
  - POST /api/lease-assignments/{id}/payment-complete - Confirm payment
  - "Pay $X" button on lease assignment cards
  - Redirect to Stripe Checkout
  - Payment success/cancel URL handling
  - Transaction record creation

- [x] **Advanced Analytics Dashboard** - Platform metrics at /analytics:
  - GET /api/analytics/overview - User, listing, revenue, contractor stats
  - GET /api/analytics/activity - Recent platform activity feed
  - GET /api/analytics/revenue - Revenue by period (7d, 30d, 90d)
  - GET /api/analytics/listings-performance - Price distribution, property types
  - 5 stat cards: Users, Listings, Revenue, Contractors, Documents
  - Users by Type bar chart
  - Listings by City bar chart
  - Price Distribution chart
  - Property Types chart
  - Recent Activity feed
  - Quick Stats footer (success rates)
  - Refresh button
  - Added to landlord sidebar navigation

- [x] **Additional Bug Fixes**:
  - MongoDB _id serialization error in POST /api/lease-assignments
  - Pydantic validation error when owner_id was null in payment metadata

## Test Reports (Continued)
- iteration_18.json — Previous test run
- iteration_19.json — V16 DocuSign OAuth, Stripe Payments, Analytics (100% backend - 35/35, 100% frontend - 13/13)

---

## Quick Reference

### Documentation Files
- `CHANGELOG.md` - Version history with dates
- `ROADMAP.md` - Prioritized backlog (P0/P1/P2)
- `HANDOFF_PROMPT.md` - Complete developer handoff

### Key Backend Files
- `/app/backend/server.py` (~4200 lines) - Main FastAPI app
- `/app/backend/services/ai_tools.py` - AI tool definitions
- `/app/backend/services/docusign_service.py` - DocuSign OAuth

### Key Frontend Files
- `/app/frontend/src/components/chat/NovaChat.jsx` - AI chatbot
- `/app/frontend/src/pages/AnalyticsDashboard.jsx` - Analytics
- `/app/frontend/src/pages/ESign.jsx` - E-sign with DocuSign
- `/app/frontend/src/pages/LeaseAssignments.jsx` - Marketplace

### Test Credentials
- Landlord: testlandlord@test.com / test123
- Database: MongoDB Atlas (dommma)

### Immediate Action Items
1. Get DocuSign Client Secret from user
2. Build out My Resume page functionality
3. Implement AI Applicant Ranking logic
4. Integrate Cloudinary for video tours
