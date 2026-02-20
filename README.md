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
2. **Python** (v3.10 or higher) - [Download](https://python.org/)
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

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
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

# Emergent LLM Key (for AI features) - Get from Emergent Platform
EMERGENT_LLM_KEY=your_emergent_key_here

# Google OAuth (optional - for calendar integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe (optional - for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Resend (optional - for emails)
RESEND_API_KEY=your_resend_api_key
```

### Step 4: Start Backend Server

```bash
# Make sure you're in the backend folder with venv activated
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

You should see: `Uvicorn running on http://0.0.0.0:8001`

### Step 5: Setup Frontend

Open a NEW terminal in VS Code:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (use yarn, not npm)
npm install -g yarn
yarn install
```

### Step 6: Configure Frontend Environment

Create a file `frontend/.env` with:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Step 7: Start Frontend Server

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
2. Click "Sign Up" to create an account
3. Explore the dashboard!

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
│   ├── public/            # Static files & PWA config
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
- **AI Chatbot (Nova)**: Voice input, TTS, image analysis
- **Roommate Finder**: AI-powered compatibility scoring
- **Moving Calculator**: Cost estimates with AI tips
- **Calendar**: Google Calendar integration for viewings
- **Notifications**: Push notifications via Firebase
- **PWA**: Installable on mobile devices

---

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running locally, OR
- Use MongoDB Atlas (free): Create cluster, get connection string, update `MONGO_URL`

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
- Get your key from the Emergent Platform

### Frontend Build Errors
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules
yarn install
```

---

## Need Help?

- Check the `/memory/PRD.md` for detailed feature documentation
- Review test reports in `/test_reports/` folder

---

Built with Emergent AI Platform
