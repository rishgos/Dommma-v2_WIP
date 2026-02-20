# DOMMMA - Complete Real Estate Marketplace

A full-stack real estate platform with AI-powered features for rentals, property sales, contractor services, and more.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Shadcn UI
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 (via Emergent LLM Key)
- **Integrations**: Stripe, Google Calendar, Firebase, Resend

---

## Local Development Setup (Windows/Mac/Linux)

### Prerequisites

Install these on your computer:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Python** (v3.10 or v3.11 recommended) - [Download](https://python.org/)
   - ⚠️ Avoid Python 3.14+ due to compatibility issues
3. **MongoDB** - [Download](https://www.mongodb.com/try/download/community) OR use [MongoDB Atlas](https://www.mongodb.com/atlas) (free cloud option)
4. **Git** - [Download](https://git-scm.com/)
5. **VS Code** - [Download](https://code.visualstudio.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2: Setup Backend

Open a terminal in VS Code (`Ctrl + `` or `Terminal > New Terminal`)

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (use Python 3.11)
py -3.11 -m venv venv
# OR on Mac/Linux:
python3.11 -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install core dependencies first
pip install passlib bcrypt python-jose[cryptography] python-multipart motor pymongo

# Install all requirements
pip install -r requirements.txt

# Install emergentintegrations (for AI features)
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### Step 3: Configure Backend Environment

Create a file `backend/.env` with these contents:

```env
# MongoDB - Use your local MongoDB or Atlas connection string
MONGO_URL=mongodb://localhost:27017
DB_NAME=dommma

# Emergent LLM Key (REQUIRED for AI features) - Get from Emergent Platform
# Go to: https://emergentagent.com → Profile → Universal Key
EMERGENT_LLM_KEY=your_emergent_key_here

# Google OAuth (optional - for calendar integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe (optional - for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Resend (optional - for emails)
RESEND_API_KEY=your_resend_api_key
```

### Step 4: Start MongoDB (if running locally)

MongoDB must be running before starting the backend:

```bash
# Windows - Start MongoDB service
net start MongoDB

# Check if running
Get-Service MongoDB
```

### Step 5: Start Backend Server

```bash
# Make sure you're in the backend folder with venv activated
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

You should see: `Uvicorn running on http://0.0.0.0:8001`

### Step 6: Setup Frontend

Open a NEW terminal in VS Code:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (use yarn, not npm)
npm install -g yarn
yarn install
```

### Step 7: Configure Frontend Environment

Create a file `frontend/.env` with:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Step 8: Start Frontend Server

```bash
# Make sure you're in the frontend folder
cd frontend
yarn start
```

The app will open at `http://localhost:3000`

---

## Running Both Servers

You need **2 terminal windows** running simultaneously:

| Terminal 1 (Backend) | Terminal 2 (Frontend) |
|---------------------|----------------------|
| `cd backend` | `cd frontend` |
| `venv\Scripts\activate` | - |
| `uvicorn server:app --reload --port 8001` | `yarn start` |
| Runs on port 8001 | Runs on port 3000 |

---

## Quick Test

1. Open `http://localhost:3000` in your browser
2. Click "Sign Up" to create an account (try as **Landlord** to add properties)
3. As Landlord: Go to Dashboard → My Properties → Add listing
4. The listing will appear on the landing page and in Nova AI responses!

---

## Offline Support (PWA)

DOMMMA works offline! The app:
- Caches the UI for offline browsing
- Stores listings data locally when online
- Shows cached listings even without internet
- AI features require internet connection

To install as a PWA:
1. Open the app in Chrome/Edge
2. Look for "Install" button in the address bar
3. Or: Menu → Install DOMMMA

---

## Adding Test Data

The landing page shows **sample listings** when your database is empty. To see real data:

### Option 1: Add via UI
1. Register as a **Landlord**
2. Go to Dashboard → My Properties → Add Property
3. Fill in the details and save
4. Your listing appears on the landing page!

### Option 2: Seed Database (Advanced)
```bash
# Connect to MongoDB shell
mongosh

# Switch to database
use dommma

# Insert a test listing
db.listings.insertOne({
  id: "test-001",
  title: "Test Downtown Apartment",
  address: "123 Main St",
  city: "Vancouver",
  property_type: "Apartment",
  price: 2500,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 850,
  listing_type: "rent",
  status: "active",
  pet_friendly: true,
  images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],
  created_at: new Date()
})
```

---

## Project Structure

```
dommma/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── db.py              # MongoDB connection
│   ├── models/            # Pydantic data models
│   ├── routers/           # API route handlers
│   ├── services/          # Business logic & AI services
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables (create this)
│
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React app
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── lib/           # Utilities & Firebase
│   ├── public/
│   │   ├── service-worker.js  # PWA offline support
│   │   └── manifest.json      # PWA config
│   ├── package.json       # Node dependencies
│   └── .env               # Environment variables (create this)
│
└── memory/
    └── PRD.md             # Product requirements document
```

---

## Features

- **Property Marketplace**: Browse, search, filter rentals and sales
- **Contractor Services**: Find, book, and review contractors
- **AI Chatbot (Nova)**: Voice input, TTS, image analysis, **links to real listings**
- **Roommate Finder**: AI-powered compatibility scoring
- **Moving Calculator**: Cost estimates with AI tips
- **Calendar**: Google Calendar integration for viewings
- **Notifications**: Push notifications via Firebase
- **PWA**: Installable on mobile devices, **works offline**
- **Dynamic Landing Page**: Shows real listings from database (not hardcoded)

---

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `net start MongoDB` (Windows)
- OR use MongoDB Atlas (free): Create cluster, get connection string, update `MONGO_URL`

### "Module Not Found" Errors
```bash
# Install missing module
pip install <module_name>

# Common missing modules:
pip install passlib bcrypt motor pymongo python-jose
```

### Port Already in Use
```bash
# Kill process on port 8001 (Windows)
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### AI Features Not Working
- Make sure `EMERGENT_LLM_KEY` is set in `backend/.env`
- Get your key from: Emergent Platform → Profile → Universal Key
- If key balance is low: Profile → Universal Key → Add Balance

### Frontend Build Errors
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules
yarn install
```

### Python Version Issues
- Use Python 3.10 or 3.11 (not 3.14+)
- Create venv with specific version: `py -3.11 -m venv venv`

---

## Need Help?

- Check the `/memory/PRD.md` for detailed feature documentation
- Review test reports in `/test_reports/` folder

---

Built with Emergent AI Platform
