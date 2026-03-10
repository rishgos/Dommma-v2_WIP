# DOMMMA - AI-First Real Estate Marketplace

A complete real estate platform with AI concierge chatbot, property listings, contractor marketplace, e-signing, payments, and more.

**Live Demo:** https://storage-migration-3.preview.emergentagent.com

## Key Features

| Feature | Description |
|---------|-------------|
| Nova AI Chatbot | Claude-powered assistant with voice input/output and tool calling |
| Property Listings | Browse, search, filter rentals & sales across Metro Vancouver |
| Contractor Marketplace | Find & book home service professionals |
| E-Sign Documents | DocuSign integration for digital lease signing |
| Lease Assignment Marketplace | Transfer/takeover leases with Stripe payments |
| Analytics Dashboard | Platform metrics for landlords/admins |
| Roommate Finder | AI-powered compatibility matching |
| Viewing Scheduler | Google Calendar integration |
| Bilingual | Full English/French support |
| PWA | Installable, works offline |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, Shadcn UI, i18next |
| Backend | Python FastAPI |
| Database | MongoDB Atlas |
| AI/LLM | Anthropic Claude Sonnet 4.5 (Direct API) |
| Voice | OpenAI Whisper (STT) + TTS |
| Maps | Google Maps API + Places Autocomplete |
| Payments | Stripe |
| E-Sign | DocuSign OAuth 2.0 |
| Email | Resend |

---

## Quick Start (Local Development)

### Prerequisites
- **Python 3.10+** (recommended, avoid 3.14+)
- **Node.js 18+**
- **MongoDB** (local or Atlas cloud)

### 1. Clone and Setup

```bash
git clone https://github.com/rishgos/Dommma-v2_WIP.git
cd Dommma-v2_WIP
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install bcrypt==4.0.1  # Fix for bcrypt compatibility

# Copy environment file and configure
cp .env.local .env
# Edit .env with your API keys (see Environment Variables section)

# Start backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 3. Frontend Setup (new terminal)

```bash
cd frontend

# Copy local env file
cp .env.local .env

# Install dependencies (legacy flag required for peer deps)
npm install --legacy-peer-deps

# Start frontend
npm start
```

### 4. Open Browser
Go to: **http://localhost:3000**

---

## Environment Variables

### backend/.env

```env
# Required - Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=dommma

# Required - AI Features
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# Optional - Google Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional - Payments
STRIPE_API_KEY=your_stripe_key

# Optional - DocuSign (for e-signing)
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_CLIENT_SECRET=your_client_secret
DOCUSIGN_AUTH_SERVER=account-d.docusign.com

# Optional - Email
RESEND_API_KEY=your_resend_key
```

### frontend/.env

```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key
```

---

## Project Structure

```
Dommma-v2_WIP/
├── backend/
│   ├── server.py              # Main FastAPI app (~4200 lines)
│   ├── db.py                  # MongoDB connection
│   ├── services/
│   │   ├── ai_tools.py        # AI tool definitions for Claude
│   │   ├── docusign_service.py # DocuSign OAuth integration
│   │   ├── nova_memory.py     # Long-term AI memory
│   │   ├── voice.py           # Whisper STT
│   │   └── tts.py             # OpenAI TTS
│   ├── models/                # Pydantic data models
│   ├── routers/               # Modular API routes
│   └── tests/                 # pytest test files
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main app with routing
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Homepage with AI search
│   │   │   ├── AnalyticsDashboard.jsx # Platform analytics
│   │   │   ├── ESign.jsx              # E-sign with DocuSign
│   │   │   ├── LeaseAssignments.jsx   # Lease marketplace
│   │   │   └── ...
│   │   └── components/
│   │       ├── chat/NovaChat.jsx      # AI chatbot
│   │       ├── ui/                    # Shadcn components
│   │       └── layout/
│   └── public/locales/        # EN/FR translations
│
├── memory/
│   ├── PRD.md                 # Product requirements
│   └── HANDOFF_PROMPT.md      # Development handoff doc
│
└── tests/e2e/                 # Playwright E2E tests
```

---

## API Keys Required

| Service | Purpose | Get it from |
|---------|---------|-------------|
| Anthropic | AI Chatbot (Claude) | console.anthropic.com |
| OpenAI | Voice (Whisper/TTS) | platform.openai.com |
| Google Maps | Maps & Geocoding | console.cloud.google.com |
| Stripe | Payments | dashboard.stripe.com |
| DocuSign | E-Sign | developers.docusign.com |
| Resend | Emails | resend.com |

---

## AI Tools (Claude Tool Calling)

Nova AI can execute these tools via natural language:

| Tool | Description |
|------|-------------|
| `create_listing` | Create property listings via conversation |
| `search_listings` | Search properties with natural language |
| `find_contractors` | Find plumbers, electricians, cleaners, etc. |
| `triage_maintenance` | Analyze maintenance requests with urgency |
| `calculate_budget` | Budget calculations using 30% rule |
| `schedule_viewing` | Book property viewings |
| `price_lease_assignment` | Calculate fair lease assignment fees |
| `build_renter_resume` | Create/update tenant profiles |
| `get_renter_resume` | Retrieve saved tenant profiles |

---

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend E2E tests
cd tests/e2e
npx playwright test
```

---

## Troubleshooting

### "MongoDB not running"
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Or run directly
mongod --dbpath /path/to/data
```

### "bcrypt error"
```bash
pip uninstall bcrypt passlib -y
pip install bcrypt==4.0.1 passlib
```

### "npm peer dependency warnings"
```bash
npm install --legacy-peer-deps
```

### "Listings not showing"
```bash
python seed_database.py
```

---

## Founders

- Jayraj Panchal
- Monika Aggarwal  
- Geoffrey Routledge
- Rishabh Goswami

---

## License

Proprietary - All rights reserved

---

*Built with React, FastAPI, MongoDB Atlas, Claude AI, OpenAI, DocuSign, and Stripe*
