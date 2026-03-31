# DOMMMA - AI-First Real Estate Marketplace

A complete real estate platform with AI concierge, property listings, rent collection, contractor marketplace, e-signing, document intelligence, and landlord analytics.

**Live Website:** https://dommma.com

---

## Features

### Core Platform
| Feature | Description |
|---------|-------------|
| Nova AI Chatbot | Claude-powered assistant with voice input/output and tool calling |
| Property Listings | Browse, search, filter rentals, sales & lease takeovers across Metro Vancouver |
| Contractor Marketplace | 16-category marketplace for home service professionals |
| E-Sign Documents | DocuSign integration for digital lease signing |
| AI Document Builder | AI-assisted lease document creation with BC RTA guidance |
| Analytics Dashboard | Platform metrics for landlords/admins |
| Roommate Finder | AI-powered compatibility matching |
| Viewing Scheduler | Google Calendar integration |

### Rent Payment System (Phase 2)
| Feature | Description |
|---------|-------------|
| Rent Agreements | Landlords create agreements, tenants accept/counter/decline |
| Stripe Elements | Secure credit card storage for automatic rent payments |
| Stripe Connect | Landlord onboarding for direct payout receiving (2.5% platform fee) |
| Recurring Billing | APScheduler generates monthly invoices on due dates |
| Payment Reminders | Automated email reminders 3 days before due via Resend |
| Late Fee Automation | Grace period tracking with automatic late fee application |
| PDF Receipts | Professional receipt generation with ReportLab |
| Payment History | Filterable payment history with receipt downloads |

### AI Intelligence (Phases 3 & 5)
| Feature | Description |
|---------|-------------|
| Tenant Document Review | AI reviews leases highlighting payment terms, late fees, critical clauses |
| BC RTA Compliance | Checks against BC Residential Tenancy Act standards |
| AI Property Valuation | Comparable-based valuation with AI market insights |
| Neighborhood Comparison | Side-by-side area comparison (rent, sale prices, amenities) |
| Smart Rent Pricing | Market-based price suggestions (competitive/suggested/premium) |
| AI Property Search | Natural language property search chatbot with session history |

### Landlord Tools (Phase 6)
| Feature | Description |
|---------|-------------|
| Earnings Dashboard | Monthly income charts, vacancy rates, ROI projections, collection rates |
| Credit Check | Tenant screening with credit scores, risk levels, rental history (simulated) |
| Smart Pricing | AI-powered rent price recommendations based on comparable data |
| Property Performance | Per-property income tracking with on-time payment rates |

### Platform
| Feature | Description |
|---------|-------------|
| Multi-language | English, French (Français), Mandarin Chinese (中文) |
| PWA | Installable, offline support, push notifications |
| Notifications | In-app notifications for payment reminders, lease renewals, late fees |
| CI/CD | GitHub Actions automated deployment to AWS EC2 |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, Shadcn UI, Stripe Elements, i18next |
| Backend | Python FastAPI, APScheduler, ReportLab |
| Database | MongoDB Atlas |
| AI/LLM | Anthropic Claude Sonnet 4 |
| Voice | OpenAI Whisper (STT) + TTS |
| Maps | Google Maps API + Places Autocomplete |
| Payments | Stripe (Elements + Connect) |
| E-Sign | DocuSign OAuth 2.0 |
| Email | Resend |
| Storage | Cloudflare R2 |
| CI/CD | GitHub Actions |
| Hosting | AWS EC2 |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone

```bash
git clone https://github.com/rishgos/Dommma-v2_WIP.git
cd Dommma-v2_WIP
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.local .env
# Edit .env with your API keys
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 3. Frontend (new terminal)

```bash
cd frontend
cp .env.local .env
npm install --legacy-peer-deps
npm start
```

### 4. Open http://localhost:3000

---

## Project Structure

```
DOMMMA/
├── backend/
│   ├── server.py                    # Main FastAPI app
│   ├── routers/                     # Modular API routers
│   │   ├── admin.py                 # Admin endpoints
│   │   ├── ai_chatbot.py            # AI property search chatbot + credit check
│   │   ├── ai_intelligence.py       # Tenant document review + lease comparison
│   │   ├── ai_valuation.py          # Property valuation + neighborhood + smart pricing
│   │   ├── landlord_earnings.py     # Earnings dashboard + property performance
│   │   ├── receipts.py              # Payment history + PDF receipt generation
│   │   ├── scheduler.py             # Recurring jobs + notifications
│   │   ├── stripe_connect.py        # Stripe Connect onboarding + payouts
│   │   ├── calendar.py              # Google Calendar integration
│   │   ├── moving.py                # Moving quote calculator
│   │   ├── compatibility.py         # Roommate compatibility
│   │   ├── portfolio.py             # Renter portfolio/resume
│   │   └── nova.py                  # Nova AI chatbot
│   ├── services/
│   │   ├── email.py                 # Resend email service
│   │   ├── ai_tools.py              # AI tool definitions for Claude
│   │   ├── docusign_service.py      # DocuSign OAuth
│   │   ├── nova_memory.py           # Long-term AI memory
│   │   ├── voice.py                 # Whisper STT
│   │   └── tts.py                   # OpenAI TTS
│   └── tests/                       # pytest test files
│
├── frontend/
│   ├── src/
│   │   ├── App.js                   # Main app with 35+ routes
│   │   ├── i18n.js                  # i18next config (EN/FR/ZH)
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Browse.jsx           # Property browsing (Rent/Buy/Lease Takeover)
│   │   │   ├── RentAgreements.jsx   # Rent agreement management
│   │   │   ├── PaymentHistory.jsx   # Payment history + receipts
│   │   │   ├── LandlordEarnings.jsx # Earnings dashboard
│   │   │   ├── PropertyValuation.jsx # AI property valuation
│   │   │   ├── NeighborhoodComparison.jsx # Area comparison
│   │   │   ├── SmartRentPricing.jsx # Smart pricing tool
│   │   │   ├── PropertyChatbot.jsx  # AI property search
│   │   │   ├── CreditCheck.jsx      # Tenant credit screening
│   │   │   ├── TenantDocReview.jsx  # AI document intelligence
│   │   │   ├── DocumentBuilder.jsx  # Lease document builder
│   │   │   └── ...                  # 20+ more pages
│   │   ├── components/
│   │   │   ├── layout/              # MainLayout, DashboardLayout
│   │   │   ├── chat/NovaChat.jsx    # AI chatbot widget
│   │   │   ├── ui/                  # Shadcn components
│   │   │   └── LanguageToggle.jsx   # EN/FR/ZH selector
│   │   └── locales/
│   │       ├── en.json              # English
│   │       ├── fr.json              # French
│   │       └── zh.json              # Mandarin Chinese
│   └── public/
│       ├── manifest.json            # PWA manifest
│       └── sw.js                    # Service worker
│
├── memory/
│   ├── PRD.md                       # Product requirements
│   ├── CHANGELOG.md                 # Development changelog
│   ├── ROADMAP.md                   # Feature roadmap
│   └── test_credentials.md          # Test account credentials
│
├── .github/workflows/
│   └── deploy.yml                   # CI/CD pipeline
│
└── downloads/
    └── DOMMMA_COMPLETE_HANDOVER_GUIDE.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/google` | Google OAuth |

### Property Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Browse properties (supports `listing_type`, `bedrooms`, etc.) |
| POST | `/api/listings` | Create listing |
| GET | `/api/lease-assignments` | Lease takeover listings |
| GET | `/api/users/search` | Search users by name/email |

### Rent Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rent/agreements` | Create rent agreement |
| GET | `/api/rent/agreements` | Get user's agreements |
| POST | `/api/rent/agreements/{id}/accept` | Tenant accepts agreement |
| POST | `/api/rent/agreements/{id}/decline` | Tenant declines |
| POST | `/api/rent/agreements/{id}/counter` | Tenant counter-proposes |
| POST | `/api/rent/payments/{id}/pay` | Process rent payment |
| POST | `/api/rent/save-payment-method` | Save credit card via Stripe |

### Stripe Connect
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe-connect/create-account` | Create Express account |
| POST | `/api/stripe-connect/onboarding-link` | Get onboarding URL |
| GET | `/api/stripe-connect/status` | Check Connect status |
| GET | `/api/stripe-connect/dashboard-link` | Stripe Express dashboard |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/tenant-document-review` | AI lease review |
| GET | `/api/ai/lease-comparison` | BC RTA compliance comparison |
| POST | `/api/ai/property-valuation` | AI property valuation |
| POST | `/api/ai/smart-rent-pricing` | Smart rent pricing |
| GET | `/api/ai/neighborhood-comparison` | Neighborhood comparison |
| POST | `/api/ai/property-chat` | AI search chatbot |
| GET | `/api/ai/chat-history` | Chat session history |
| GET | `/api/ai/virtual-tours` | Virtual tour data |

### Landlord
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landlord/earnings` | Earnings dashboard data |
| GET | `/api/landlord/property-performance` | Per-property metrics |

### Payments & Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/history` | Payment history |
| GET | `/api/payments/{id}/receipt` | Download PDF receipt |

### Credit Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/credit-check/request` | Run credit check (simulated) |
| GET | `/api/credit-check/reports` | Get credit reports |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| POST | `/api/notifications/{id}/read` | Mark as read |
| POST | `/api/notifications/mark-all-read` | Mark all read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/database-stats?admin_key=KEY` | Database statistics |
| DELETE | `/api/admin/clear-test-data?admin_key=KEY` | Clear test data |
| GET | `/api/admin/contact-messages?admin_key=KEY` | Contact form submissions |

### Scheduler (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scheduler/run-invoices?admin_key=KEY` | Trigger invoice generation |
| POST | `/api/scheduler/run-reminders?admin_key=KEY` | Trigger reminders + late fees + renewals |

---

## Background Jobs (APScheduler)

| Job | Schedule | Description |
|-----|----------|-------------|
| Invoice Generation | Daily 8am UTC | Creates rent invoices for active agreements on due day |
| Payment Reminders | Daily 9am UTC | Sends email reminders 3 days before due via Resend |
| Late Fee Check | Daily 10am UTC | Applies late fees after grace period expires |
| Lease Renewals | Monday 8am UTC | Sends reminders for leases expiring within 60 days |

---

## Environment Variables

### backend/.env

```env
# Database (required)
MONGO_URL=mongodb+srv://...
DB_NAME=dommma

# AI (required for AI features)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...

# Payments
STRIPE_API_KEY=sk_live_...

# Email
RESEND_API_KEY=re_...
CONTACT_EMAIL=support@dommma.com

# Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_MAPS_API_KEY=...

# DocuSign
DOCUSIGN_INTEGRATION_KEY=...
DOCUSIGN_CLIENT_SECRET=...
DOCUSIGN_AUTH_SERVER=account-d.docusign.com

# Admin
ADMIN_SECRET_KEY=your_admin_key
```

### frontend/.env

```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_MAPS_KEY=your_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Testing

```bash
# Backend unit tests
cd backend && pytest tests/ -v

# E2E tests
cd tests && npx playwright test

# Manual API testing
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@dommma.com","password":"test123"}'
```

---

## Deployment

### CI/CD (GitHub Actions)
Push to `main` triggers automatic deployment via `.github/workflows/deploy.yml`:
1. SSH into EC2
2. Pull latest code
3. Install dependencies
4. Restart services

### Manual Deployment
```bash
ssh ec2-user@your-server
cd /app
git pull origin main
cd backend && pip install -r requirements.txt
cd ../frontend && npm install --legacy-peer-deps && npm run build
sudo systemctl restart dommma
```

---

## Founders

- Jayraj Panchal
- Monika Aggarwal
- Geoffrey Routledge
- Rishabh Goswami

## License

Proprietary - All rights reserved

---

*Built with React, FastAPI, MongoDB Atlas, Claude AI, Stripe, DocuSign, and Resend*
