# DOMMMA - Complete Project Handoff & Development Roadmap

## PROJECT OVERVIEW

**DOMMMA** is an AI-first real estate marketplace platform for Metro Vancouver. It serves Renters, Landlords, Buyers, Sellers, and Contractors with role-specific features. The platform is pivoting to an **AI-First Concierge Model** where users interact primarily through a conversational AI assistant (Nova) rather than traditional forms.

**Live Preview:** https://rental-ai-3.preview.emergentagent.com

---

## CURRENT TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, Shadcn UI, i18next (EN/FR) |
| Backend | Python FastAPI (modular structure) |
| Database | MongoDB Atlas (cloud, shared between local & preview) |
| Auth | JWT + passlib bcrypt |
| AI/LLM | Anthropic Claude Sonnet 4.5 (Direct API) |
| Voice STT | OpenAI Whisper (Direct API) |
| Voice TTS | OpenAI TTS (Direct API) |
| Maps | Google Maps API + Places Autocomplete |
| Payments | Stripe (test key available in environment) |
| Email | Resend |

**Key Environment Variables:**
- `ANTHROPIC_API_KEY` - Claude API (working)
- `OPENAI_API_KEY` - Whisper/TTS (working, credits added)
- `REACT_APP_GOOGLE_MAPS_KEY` - Maps & Places API
- `MONGO_URL` - MongoDB Atlas connection string
- `STRIPE_SECRET_KEY` - Stripe test key

---

## WHAT'S CURRENTLY WORKING (Verified)

### Core Platform
- [x] JWT authentication (renter/landlord/contractor/buyer/seller roles)
- [x] Property browsing with Google Maps, filters, favorites
- [x] Role-based dashboards with full navigation
- [x] Bilingual support (English/French toggle)
- [x] PWA support

### AI Features (Nova Chatbot)
- [x] **Homepage search bar** → Opens chat modal and sends query (JUST FIXED)
- [x] **Contractor link rendering** → Shows clickable links like "🔧 Plumbing Pro" (JUST FIXED)
- [x] Natural language property search
- [x] Natural language contractor search
- [x] Budget calculator via chat
- [x] Voice input (Web Speech API for real-time, Whisper fallback)
- [x] Voice output (OpenAI TTS)
- [x] Image analysis for properties
- [x] Long-term user memory/preferences

### Phase 0 Features (Verified Working)
- [x] **Google Places address autocomplete** in listing creation
- [x] **Lease duration field** (3-12 months dropdown)
- [x] **Special offers checkboxes** (1 month free, 2 months free, free parking, free WiFi)

### Other Features
- [x] Contractor marketplace with ratings/reviews
- [x] Viewing scheduler with Google Calendar integration
- [x] Moving quote calculator
- [x] Stripe payments
- [x] Document management
- [x] Roommate finder with AI compatibility scoring

---

## CODEBASE ARCHITECTURE

```
/app/
├── backend/
│   ├── .env                    # Production environment variables
│   ├── .env.local              # Template for local development
│   ├── server.py               # Main FastAPI app (~2900 lines)
│   ├── db.py                   # MongoDB connection
│   ├── services/
│   │   ├── nova_memory.py      # Long-term AI memory
│   │   ├── nova_insights.py    # User analytics
│   │   ├── image_analysis.py   # Property image AI
│   │   ├── voice.py            # Whisper STT
│   │   ├── tts.py              # OpenAI TTS
│   │   └── email.py            # Resend emails
│   ├── models/
│   │   └── listing_models.py   # Pydantic models
│   ├── routers/                # Modular API routes
│   ├── seed_database.py        # Database seeding script
│   └── setup_local.py          # Local setup automation
│
├── frontend/
│   ├── .env                    # REACT_APP_BACKEND_URL, Google Maps key
│   ├── .env.local              # Template for local development
│   ├── src/
│   │   ├── App.js              # Main app with auth context
│   │   ├── i18n.js             # i18next configuration
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   └── NovaChat.jsx    # AI chatbot (main component)
│   │   │   ├── ui/                 # Shadcn components
│   │   │   └── layout/
│   │   │       └── MainLayout.jsx
│   │   └── pages/
│   │       ├── Home.jsx            # Homepage with Nova search bar
│   │       ├── MyProperties.jsx    # Landlord listing management
│   │       ├── Browse.jsx          # Property listings
│   │       ├── Contractors.jsx     # Contractor marketplace
│   │       └── ...
│   └── public/
│       └── locales/            # EN/FR translation files
│
└── memory/
    ├── PRD.md                  # Product requirements
    └── HANDOFF_PROMPT.md       # This document
```

---

## KEY API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Main Nova AI chat endpoint |
| `/api/listings` | GET/POST | Property listings CRUD |
| `/api/contractors/search` | GET | Search contractors |
| `/api/nova/transcribe` | POST | Whisper STT |
| `/api/nova/tts` | POST | OpenAI TTS |
| `/api/nova/analyze-image` | POST | Property image analysis |
| `/api/nova/memory/{user_id}` | GET | Get user's saved preferences |
| `/api/auth/login` | POST | JWT authentication |
| `/api/auth/register` | POST | User registration |

---

## THE AI-FIRST PIVOT (MAIN ROADMAP)

The user wants DOMMMA to compete with liv.rent by making AI the primary interface. Instead of forms, users interact with Nova to perform all actions.

### Phase 1: AI Concierge Foundation (NEXT UP)
**Goal:** Make Nova the primary interface for all key actions

| Task | Status | Description |
|------|--------|-------------|
| Homepage search → chat | ✅ DONE | Search bar opens Nova chat |
| Contractor link rendering | ✅ DONE | Clickable contractor links in chat |
| `search_listings()` tool | ✅ DONE | Claude tool calling for property search |
| `find_contractors()` tool | ✅ DONE | Claude tool calling for contractor search |
| `create_listing()` tool | ✅ DONE | Claude tool calling for listing creation |
| `triage_maintenance()` tool | ✅ DONE | Claude tool calling for maintenance requests |
| `calculate_budget()` tool | ✅ DONE | Claude tool calling for budget calculations |
| `schedule_viewing()` tool | ✅ DONE | Claude tool calling for viewing appointments |

**Implementation: Option B (Full Tool Calling) - COMPLETED**
- Created `/app/backend/services/ai_tools.py` with 6 tool definitions
- Created `/api/ai/concierge` endpoint with Claude tool use API
- Frontend updated to use new endpoint with fallback to original

### Phase 2: liv.rent Feature Parity
| Feature | Description |
|---------|-------------|
| Reusable Renter Resume | Auto-build tenant profile from chat history |
| E-Sign & Payments | DocuSign integration for leases, Stripe for rent |
| AI Applicant Ranking | Dashboard where AI ranks applicants with match score |
| AI Listing Optimizer | AI suggests optimal pricing and descriptions |

### Phase 3: DOMMMA's Competitive Moat
| Feature | Description |
|---------|-------------|
| Lease Assignment Marketplace | Tenants can sell/transfer their leases |
| Maintenance AI | Photo analysis → urgency rating → auto-dispatch contractors |
| Video Tours | Cloudinary integration for video uploads |
| Trust Score / Verification | Persona for ID verification, AI for contractor document review |

### Phase 4: Advanced/Revenue Features
| Feature | Description |
|---------|-------------|
| In-House Financing | Line of Credit for landlords/contractors/renters |
| Listing Syndication | Auto-post to Craigslist, Kijiji |
| Tiered Subscriptions | Free/Growth/Pro plans + transaction fees |

---

## KNOWN ISSUES & TECHNICAL DEBT

### Currently Working (No Action Needed)
- Voice features (STT/TTS) - OpenAI credits added, working now

### Technical Debt
| Issue | Priority | Notes |
|-------|----------|-------|
| Frontend npm peer deps | P2 | Requires `--legacy-peer-deps` flag (react-day-picker/date-fns conflict) |
| server.py size | P3 | ~2900 lines, should be split into routers |
| No automated tests | P2 | Need pytest for backend, Playwright for frontend |

---

## HOW TO CONTINUE DEVELOPMENT

### Immediate Next Steps (Recommended Order)

1. **Implement `create_listing()` AI Tool**
   - Add conversational flow for landlords to create listings via chat
   - Nova asks for: title, address (with autocomplete), price, bedrooms, etc.
   - On completion, creates listing in database
   - Returns confirmation with link to view listing

2. **Implement `triage_maintenance()` AI Tool**
   - Accept maintenance request description + optional photo
   - Use Claude vision to analyze issue
   - Determine urgency (low/medium/high/emergency)
   - Suggest matching contractors from database
   - Optionally auto-create maintenance ticket

3. **Add Sticky AI Concierge Component**
   - Create persistent chat button on all pages (currently only on homepage)
   - Auto-open chat for first-time users with onboarding flow
   - Remember context across page navigation

4. **Testing & Quality**
   - Add Playwright tests for chat flows
   - Add pytest tests for AI endpoints
   - Fix npm peer dependency warnings

### Code Patterns to Follow

**Backend (FastAPI):**
```python
# Chat endpoint pattern (see server.py line 967)
@api_router.post("/chat")
async def chat_with_nova(request: ChatRequest):
    # 1. Get/create session
    # 2. Load context (listings, contractors, user memory)
    # 3. Build system prompt
    # 4. Call Claude API
    # 5. Save to session
    # 6. Return response with suggestions
```

**Frontend (React):**
```jsx
// NovaChat accepts props for external control
<NovaChat 
  isOpenProp={true}           // Control open state externally
  onClose={() => {}}          // Callback when closed
  initialQuery="search query" // Auto-send this query on open
/>
```

**AI Response Format:**
```
// Property links in AI response
[Property Name](property:PROPERTY_ID)

// Contractor links in AI response  
[Contractor Name](contractor:CONTRACTOR_ID)
```

---

## CREDENTIALS FOR TESTING

| Role | Email | Password |
|------|-------|----------|
| Landlord | landlord@test.com | password123 |
| Renter | renter@test.com | password123 |
| Contractor | contractor@test.com | password123 |

**Note:** These are seeded test accounts. Real user data is in MongoDB Atlas.

---

## IMPORTANT CONTEXT

1. **Database is Cloud-Based:** MongoDB Atlas is shared between local and preview. Changes persist.

2. **API Keys in .env:** All keys are in `/app/backend/.env`. Don't commit to git.

3. **Hot Reload:** Both frontend (React) and backend (FastAPI) have hot reload. Only restart supervisor for .env changes or new dependencies.

4. **Shadcn UI:** Components are in `/app/frontend/src/components/ui/`. Use these, don't create new base components.

5. **Translations:** Add new UI text to `/app/frontend/public/locales/en/translation.json` and `fr/translation.json`.

---

## SUMMARY FOR CLAUDE

**You are continuing development on DOMMMA, an AI-first real estate platform.**

**What's done:**
- Full-stack app with React/FastAPI/MongoDB
- Working AI chatbot (Nova) with voice, image analysis, memory
- Homepage search → chat flow (fixed)
- Contractor links rendering (fixed)
- Phase 0 features (address autocomplete, lease duration, offers)
- **Claude Tool Calling (NEW):** Full implementation with 6 tools:
  - `create_listing` - Create property listings via conversation
  - `search_listings` - Search properties with natural language
  - `find_contractors` - Find plumbers, electricians, etc.
  - `triage_maintenance` - Handle maintenance requests
  - `calculate_budget` - Budget calculations (30% rule)
  - `schedule_viewing` - Book property viewings

**Key New Files:**
- `/app/backend/services/ai_tools.py` - Tool definitions and execution logic
- `/api/ai/concierge` endpoint in `server.py` - Claude tool calling implementation

**What's next:**
1. Add more AI tools (e.g., lease assignment pricing)
2. Improve tool responses with richer data (images, maps)
3. Add liv.rent parity features (renter resume, e-sign, AI ranking)
4. Build persistent AI concierge sticky button across all pages

**The vision:** Users should be able to do EVERYTHING through conversation with Nova - searching, listing properties, booking viewings, submitting maintenance requests, finding contractors. Forms are secondary, AI is primary.
