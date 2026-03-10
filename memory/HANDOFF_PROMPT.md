# DOMMMA - Complete Project Handoff Document for Claude

**Last Updated:** March 2, 2026  
**Version:** V16  
**Live Preview:** https://storage-migration-3.preview.emergentagent.com

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Current Tech Stack](#current-tech-stack)
3. [What's Currently Working](#whats-currently-working)
4. [Recent Implementations (V16)](#recent-implementations-v16)
5. [Full Development History](#full-development-history)
6. [Codebase Architecture](#codebase-architecture)
7. [Key API Endpoints](#key-api-endpoints)
8. [AI Tools (Claude Tool Calling)](#ai-tools-claude-tool-calling)
9. [Database Schema](#database-schema)
10. [Known Issues & Technical Debt](#known-issues--technical-debt)
11. [Roadmap & Future Plans](#roadmap--future-plans)
12. [Action Items](#action-items)
13. [Credentials for Testing](#credentials-for-testing)
14. [Important Context](#important-context)
15. [Discussion History & Decisions](#discussion-history--decisions)

---

## PROJECT OVERVIEW

**DOMMMA** is an AI-first real estate marketplace platform for Metro Vancouver. It serves:
- **Renters** - Find apartments, roommates, analyze leases
- **Landlords** - List properties, manage tenants, collect rent
- **Buyers/Sellers** - Buy/sell properties
- **Contractors** - Get hired for home services

### The AI-First Pivot

The platform pivoted to an **AI-First Concierge Model** where users interact primarily through a conversational AI assistant (Nova) rather than traditional forms. The goal is to compete with liv.rent by making AI the primary interface for all key actions.

**Key Differentiators:**
1. Conversational property search and listing creation
2. AI-powered maintenance triage with photo analysis
3. Lease assignment marketplace (unique to DOMMMA)
4. AI renter resume generation
5. Contractor matching with AI recommendations

---

## CURRENT TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, Shadcn UI, i18next (EN/FR) |
| Backend | Python FastAPI (~4200 lines in server.py) |
| Database | MongoDB Atlas (cloud, shared between local & preview) |
| Auth | JWT + passlib bcrypt |
| AI/LLM | Anthropic Claude Sonnet 4.5 (Direct API with Tool Calling) |
| Voice STT | OpenAI Whisper (Direct API) |
| Voice TTS | OpenAI TTS (Direct API) |
| Maps | Google Maps API + Places Autocomplete |
| Payments | Stripe (test key in environment) |
| E-Sign | DocuSign OAuth 2.0 |
| Email | Resend |
| Analytics | Firebase Analytics |
| PWA | Service Worker + Manifest |

### Key Environment Variables (backend/.env)
```env
MONGO_URL=mongodb+srv://...          # MongoDB Atlas
DB_NAME=dommma                        # Database name
ANTHROPIC_API_KEY=sk-ant-...         # Claude API
OPENAI_API_KEY=sk-...                # Whisper/TTS
STRIPE_API_KEY=sk_test_...           # Stripe test key
DOCUSIGN_INTEGRATION_KEY=8442b058-...# DocuSign
DOCUSIGN_CLIENT_SECRET=              # NEEDS USER INPUT
GOOGLE_CLIENT_ID=...                 # Google Calendar OAuth
GOOGLE_CLIENT_SECRET=...             # Google Calendar OAuth
RESEND_API_KEY=...                   # Email service
```

---

## WHAT'S CURRENTLY WORKING

### Core Platform (100% Working)
- [x] JWT authentication (renter/landlord/contractor/buyer/seller roles)
- [x] Property browsing with Google Maps, filters, favorites
- [x] Role-based dashboards with full navigation
- [x] Bilingual support (English/French toggle)
- [x] PWA support (installable, offline capable)

### AI Features (Nova Chatbot) (100% Working)
- [x] Natural language property search
- [x] Natural language contractor search
- [x] Budget calculator via chat
- [x] Voice input (Web Speech API + Whisper fallback)
- [x] Voice output (OpenAI TTS with 9 voices)
- [x] Image analysis for properties
- [x] Long-term user memory/preferences
- [x] Claude Tool Calling with 9 tools

### Property Features (100% Working)
- [x] Google Places address autocomplete in listing creation
- [x] Lease duration field (3-12 months)
- [x] Special offers checkboxes (free month, parking, WiFi)
- [x] Dynamic featured listings on homepage
- [x] Property image uploads

### Marketplace Features (100% Working)
- [x] Contractor marketplace with ratings/reviews
- [x] Contractor leaderboard
- [x] Viewing scheduler with Google Calendar integration
- [x] Moving quote calculator with AI tips
- [x] Stripe payments integration
- [x] Document management

### Social Features (100% Working)
- [x] Roommate finder with AI compatibility scoring
- [x] Favorites and comparison tool
- [x] Push notifications (Firebase FCM)

### New Features (V16) (100% Working)
- [x] DocuSign OAuth 2.0 integration
- [x] Stripe payments for lease assignments
- [x] Advanced Analytics Dashboard
- [x] Lease Assignment Marketplace
- [x] E-Sign Documents page
- [x] Listing Syndication page (scaffolded)

---

## RECENT IMPLEMENTATIONS (V16)

### 1. DocuSign OAuth 2.0 Integration
**Files:** `/app/backend/services/docusign_service.py`, `/app/frontend/src/pages/ESign.jsx`

- Full OAuth authorization code grant flow
- Async implementation using httpx (no SDK dependency)
- Connect/disconnect DocuSign account from E-Sign page
- Send documents via DocuSign for legally binding signatures
- Get envelope status tracking

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/docusign/status` | GET | Check connection status |
| `/api/docusign/auth-url` | GET | Generate OAuth URL with CSRF state |
| `/api/docusign/callback` | POST | Exchange code for tokens |
| `/api/docusign/disconnect` | POST | Disconnect account |
| `/api/docusign/send-envelope` | POST | Send document for signature |
| `/api/docusign/envelope-status/{id}` | GET | Track envelope status |

**Note:** User needs to provide DocuSign Client Secret from DocuSign Developer Console for OAuth to complete token exchange.

### 2. Stripe Payment Processing for Lease Assignments
**Files:** `/app/backend/server.py`, `/app/frontend/src/pages/LeaseAssignments.jsx`

- Integrated with emergentintegrations Stripe library
- "Pay $X" button on lease assignment marketplace cards
- Creates Stripe Checkout session
- Transaction tracking in database
- Success/cancel URL handling

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lease-assignments/{id}/payment` | POST | Create Stripe checkout |
| `/api/lease-assignments/{id}/payment-complete` | POST | Confirm payment |

### 3. Advanced Analytics Dashboard
**Files:** `/app/backend/server.py`, `/app/frontend/src/pages/AnalyticsDashboard.jsx`

- Platform overview with real-time stats
- 5 stat cards: Users, Listings, Revenue, Contractors, Documents
- Bar charts: Users by Type, Listings by City
- Price distribution chart
- Property types breakdown
- Recent activity feed
- Quick stats footer (success rates)
- Available to landlord role in sidebar

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/overview` | GET | User, listing, revenue stats |
| `/api/analytics/activity` | GET | Recent platform activity |
| `/api/analytics/revenue` | GET | Revenue by period (7d/30d/90d) |
| `/api/analytics/listings-performance` | GET | Price & type distributions |

---

## FULL DEVELOPMENT HISTORY

### V1-V3: Core Platform
- JWT authentication with role-based access
- Property browsing with Google Maps
- Basic dashboard UI

### V4-V5: Buy/Sell & Contractor Marketplace
- Rent/Buy toggle, sale listings, offers
- Contractor profiles, services, booking, reviews
- Stripe payments
- Favorites, Comparison Tool, Roommate Finder
- AI Compatibility Scoring

### V6: Calendar & Moving
- In-app calendar with property viewings
- Google Calendar OAuth integration
- Moving quote calculator with 3-step wizard
- Contractor Portfolio with before/after images

### V7: Nova AI Enhancements
- Voice Input (STT) - OpenAI Whisper
- Voice Output (TTS) - OpenAI TTS with 9 voices
- Nova Insights Dashboard
- Long-Term Memory
- Proactive Suggestions
- Property Image Analysis (Claude Vision)

### V8: Viewing Scheduler
- Schedule Viewing button on all listing modals
- 4-step wizard (date, time, confirmation, success)
- Google Calendar sync

### V9: Contractor Ratings System
- Review submission modal
- Reviews display with distribution
- Contractor leaderboard
- Dashboard integration

### V10: Push Notifications
- NotificationBell component
- Firebase FCM integration
- Backend notification APIs

### V11: AI Roommate Compatibility
- Multi-factor scoring algorithm
- Claude-powered insights
- Strengths/challenges/tips

### V12: AI Moving Assistant
- Real cost calculator with distance
- Claude-powered moving tips
- Preparation checklists

### V13: Dynamic Landing Page
- Featured listings from database
- Property links in AI responses
- Enhanced PWA support

### V14: Nova AI Memory & UX
- Long-term user preference memory
- Persistent dashboard sidebar
- 4-column property grid
- Homepage improvements

### V15: Direct API Migration
- Removed Emergent LLM Key dependency
- Direct Anthropic SDK for Claude
- Direct OpenAI SDK for Whisper/TTS

### V16: DocuSign, Stripe, Analytics (CURRENT)
- DocuSign OAuth 2.0 integration
- Stripe payments for lease assignments
- Advanced Analytics Dashboard
- Bug fixes for MongoDB serialization

---

## CODEBASE ARCHITECTURE

```
/app/
├── backend/
│   ├── .env                    # Environment variables
│   ├── server.py               # Main FastAPI app (~4200 lines)
│   ├── db.py                   # MongoDB connection
│   ├── services/
│   │   ├── ai_tools.py         # AI tool definitions
│   │   ├── docusign_service.py # DocuSign OAuth
│   │   ├── nova_memory.py      # Long-term AI memory
│   │   ├── nova_insights.py    # User analytics
│   │   ├── image_analysis.py   # Property image AI
│   │   ├── voice.py            # Whisper STT
│   │   ├── tts.py              # OpenAI TTS
│   │   └── email.py            # Resend emails
│   ├── models/
│   │   ├── listing_models.py   # Property models
│   │   └── assignment_models.py# Lease assignment models
│   ├── routers/
│   │   ├── calendar.py         # Calendar & Google OAuth
│   │   ├── moving.py           # Moving quotes
│   │   ├── compatibility.py    # Roommate matching
│   │   ├── portfolio.py        # Contractor portfolio
│   │   └── nova.py             # Nova AI (TTS, Insights)
│   └── tests/                  # pytest test files
│
├── frontend/
│   ├── .env                    # REACT_APP_BACKEND_URL
│   ├── src/
│   │   ├── App.js              # Main app with auth context
│   │   ├── i18n.js             # i18next configuration
│   │   ├── components/
│   │   │   ├── chat/NovaChat.jsx    # AI chatbot
│   │   │   ├── ui/                  # Shadcn components
│   │   │   └── layout/
│   │   │       ├── MainLayout.jsx
│   │   │       └── DashboardLayout.jsx
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── AnalyticsDashboard.jsx
│   │       ├── ESign.jsx
│   │       ├── LeaseAssignments.jsx
│   │       └── ...
│   └── public/locales/         # EN/FR translations
│
├── memory/
│   ├── PRD.md                  # Product requirements
│   └── HANDOFF_PROMPT.md       # This document
│
└── tests/e2e/                  # Playwright E2E tests
```

---

## KEY API ENDPOINTS

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | JWT authentication |

### AI / Nova Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main Nova AI chat |
| `/api/ai/concierge` | POST | AI with tool calling |
| `/api/nova/transcribe` | POST | Whisper STT |
| `/api/nova/tts` | POST | OpenAI TTS |
| `/api/nova/analyze-image` | POST | Property image analysis |
| `/api/nova/memory/{user_id}` | GET | User preferences |

### Properties
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/listings` | GET/POST | Property CRUD |
| `/api/listings/{id}` | GET | Single listing |

### Lease Assignments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lease-assignments` | GET/POST | Assignment CRUD |
| `/api/lease-assignments/{id}/payment` | POST | Stripe checkout |

### DocuSign
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/docusign/status` | GET | Connection status |
| `/api/docusign/auth-url` | GET | OAuth URL |
| `/api/docusign/callback` | POST | Token exchange |
| `/api/docusign/send-envelope` | POST | Send for signature |

### Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/overview` | GET | Platform stats |
| `/api/analytics/activity` | GET | Activity feed |
| `/api/analytics/revenue` | GET | Revenue data |

---

## AI TOOLS (CLAUDE TOOL CALLING)

The `/api/ai/concierge` endpoint supports these Claude tools:

| Tool | Description |
|------|-------------|
| `create_listing` | Create property listings via conversation |
| `search_listings` | Search properties with natural language |
| `find_contractors` | Find plumbers, electricians, cleaners |
| `triage_maintenance` | Analyze maintenance requests with urgency |
| `calculate_budget` | Budget calculations using 30% rule |
| `schedule_viewing` | Book property viewings |
| `price_lease_assignment` | Calculate fair lease assignment fees |
| `build_renter_resume` | Create/update tenant profiles |
| `get_renter_resume` | Retrieve saved tenant profiles |

**Implementation:** `/app/backend/services/ai_tools.py`

---

## DATABASE SCHEMA

### Key Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts with roles |
| `listings` | Property listings |
| `lease_assignments` | Lease transfer marketplace |
| `contractor_profiles` | Contractor information |
| `contractor_services` | Services offered |
| `bookings` | Contractor bookings |
| `reviews` | Contractor reviews |
| `esign_documents` | E-sign documents |
| `docusign_connections` | DocuSign OAuth tokens |
| `docusign_oauth_states` | CSRF state tokens |
| `payment_transactions` | Stripe transactions |
| `chat_sessions` | AI chat history |
| `renter_resumes` | Tenant profiles |
| `notifications` | Push notifications |

---

## KNOWN ISSUES & TECHNICAL DEBT

### Issues to Address

| Issue | Priority | Description |
|-------|----------|-------------|
| npm peer deps | P2 | Requires `--legacy-peer-deps` (react-day-picker/date-fns conflict) |
| server.py size | P3 | ~4200 lines, should be split into routers |
| DocuSign Client Secret | P1 | User needs to provide from DocuSign Developer Console |

### Working Fine (No Action Needed)
- Voice features (STT/TTS) - OpenAI credits working
- MongoDB Atlas connection - stable
- Stripe payments - working in test mode
- Google Calendar OAuth - working

---

## ROADMAP & FUTURE PLANS

### Immediate Action Items (P0)
1. **Get DocuSign Client Secret from user** - Required to complete OAuth flow
2. **Build out My Resume page** - Currently a placeholder
3. **Implement AI Applicant Ranking functionality** - Page exists but needs logic

### Short-term (P1)
1. **Video Tours with Cloudinary** - SDK installed, needs integration
2. **Listing Syndication** - Deep Facebook Marketplace integration
3. **Renter Resume from Chat** - Auto-build profile from conversation

### Medium-term (P2)
1. **Verification System (Trust Score)** - Persona for ID, AI for documents
2. **AI Listing Optimizer** - Suggest pricing and descriptions
3. **Moving company API integration** - Replace calculation-based quotes

### Long-term (P3)
1. **In-House Financing** - Line of Credit for users
2. **Native mobile apps** - iOS & Android
3. **Multi-image property comparison**

---

## ACTION ITEMS

### For Current Session
1. [ ] Request DocuSign Client Secret from user
2. [ ] Implement My Resume page functionality
3. [ ] Implement AI Applicant Ranking logic
4. [ ] Integrate Cloudinary for video tours

### For User
1. [ ] Provide DocuSign Client Secret (from DocuSign Developer Console)
2. [ ] Test DocuSign OAuth flow end-to-end
3. [ ] Test Stripe payment flow on lease assignments
4. [ ] Review Analytics Dashboard metrics

### Technical Debt
1. [ ] Split server.py into separate routers
2. [ ] Fix npm peer dependency warnings properly
3. [ ] Add more comprehensive test coverage

---

## CREDENTIALS FOR TESTING

| Role | Email | Password |
|------|-------|----------|
| Landlord | testlandlord@test.com | test123 |
| Renter | renter@test.com | password123 |
| Contractor | contractor@test.com | password123 |

**Note:** These are seeded test accounts. Real user data is in MongoDB Atlas (dommma database).

---

## IMPORTANT CONTEXT

### Database
- **MongoDB Atlas** is cloud-hosted and shared between local and preview environments
- Changes persist across sessions
- Database name is `dommma` (not `rental_app`)

### API Keys
- All keys are in `/app/backend/.env`
- Never commit .env files to git
- Stripe uses test mode (sk_test_...)
- DocuSign uses demo environment (account-d.docusign.com)

### Development Environment
- Hot reload enabled for both frontend and backend
- Only restart supervisor for .env changes or new dependencies
- Use `--legacy-peer-deps` for npm install

### UI Components
- Shadcn UI components in `/app/frontend/src/components/ui/`
- Use these, don't create new base components
- Follow existing patterns for consistency

### Translations
- Add new UI text to `/app/frontend/public/locales/en/translation.json`
- Add French translations to `fr/translation.json`

---

## DISCUSSION HISTORY & DECISIONS

### AI-First Pivot Decision
**Discussion:** User wanted DOMMMA to compete with liv.rent by making AI the primary interface.
**Decision:** Implemented Claude tool calling to allow Nova to execute actions like creating listings, searching properties, and more.

### DocuSign vs In-House E-Sign
**Discussion:** Whether to build custom e-sign or integrate DocuSign.
**Decision:** Implemented DocuSign OAuth for legally binding signatures, with fallback in-house signing for simpler documents.

### Stripe for Lease Assignments
**Discussion:** How to handle payments for lease assignment marketplace.
**Decision:** Integrated Stripe Checkout for secure payment processing with transaction tracking.

### Analytics Dashboard Scope
**Discussion:** What metrics to show in analytics.
**User Choice:** "All" - user signups & activity, listing performance, revenue/transactions.
**Decision:** Built comprehensive dashboard with all metrics, available to landlord role.

### Syndication Approach
**Discussion:** Whether to auto-post to external platforms or provide content/links.
**Decision:** Implement both - generate formatted content AND deep links to post on Facebook Marketplace, Craigslist, Kijiji.

### Feature Order Priority
**User Request:** "lets do these first - Full DocuSign OAuth integration, Payment processing for lease assignments, Advanced analytics dashboard"
**Decision:** Implemented all three in V16 session.

---

## SUMMARY FOR NEW CLAUDE SESSION

**You are continuing development on DOMMMA, an AI-first real estate platform.**

**What's done:**
- Full-stack app with React/FastAPI/MongoDB Atlas
- Working AI chatbot (Nova) with voice, image analysis, memory, tool calling
- DocuSign OAuth 2.0 integration (needs client secret)
- Stripe payments for lease assignments
- Advanced Analytics Dashboard
- All tests passing (35 backend, 13 frontend E2E)

**What needs immediate attention:**
1. Get DocuSign Client Secret from user to complete OAuth
2. Build out My Resume page functionality
3. Implement AI Applicant Ranking logic
4. Video Tours with Cloudinary

**The vision:** Users should be able to do EVERYTHING through conversation with Nova - searching, listing properties, booking viewings, submitting maintenance requests, finding contractors. Forms are secondary, AI is primary.

---

*Document maintained by development team. Last tested: March 2, 2026*
