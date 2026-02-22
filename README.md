# DOMMMA - Real Estate Marketplace

Complete real estate platform with AI chatbot, property listings, contractor marketplace, and more.

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Python 3.10+** 
- **Node.js 18+**
- **MongoDB** (running locally)

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

# Run setup script (installs packages, configures env, seeds database)
python setup_local.py

# Start backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### 3. Frontend Setup (new terminal)

```bash
cd frontend

# Copy local env file
copy .env.local .env   # Windows
cp .env.local .env     # Mac/Linux

# Install dependencies
npm install

# Start frontend
npm start
```

### 4. Open Browser
Go to: **http://localhost:3000**

---

## 🔧 Manual Environment Setup

If the setup script doesn't work, manually create these files:

### backend/.env
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=dommma
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_key
RESEND_API_KEY=your_resend_key
```

### frontend/.env
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key
```

---

## 📁 Project Structure

```
Dommma-v2_WIP/
├── backend/
│   ├── server.py          # Main FastAPI app
│   ├── services/          # AI, voice, email services
│   ├── setup_local.py     # Local setup script
│   ├── seed_database.py   # Database seeder
│   └── .env.local         # Template for local env
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   └── components/    # React components
│   └── .env.local         # Template for local env
└── README.md
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏠 Property Listings | Browse, search, filter rentals & sales |
| 🤖 Nova AI Chatbot | Claude-powered assistant with voice |
| 🔧 Contractor Marketplace | Find & book home service pros |
| 👥 Roommate Finder | AI-powered compatibility matching |
| 📅 Viewing Scheduler | Google Calendar integration |
| 💳 Payments | Stripe integration |
| 📱 PWA | Installable, works offline |

---

## 🔑 API Keys Required

| Service | Purpose | Get it from |
|---------|---------|-------------|
| Anthropic | AI Chatbot | console.anthropic.com |
| OpenAI | Voice (Whisper/TTS) | platform.openai.com |
| Google Maps | Maps & Geocoding | console.cloud.google.com |
| Stripe | Payments | dashboard.stripe.com |
| Resend | Emails | resend.com |

---

## 🐛 Troubleshooting

### "MongoDB not running"
```bash
# Windows: Start MongoDB service
net start MongoDB

# Mac: 
brew services start mongodb-community

# Or run directly:
mongod --dbpath /path/to/data
```

### "bcrypt error"
```bash
pip uninstall bcrypt passlib -y
pip install bcrypt==4.0.1 passlib
```

### "Module not found"
```bash
pip install -r requirements.txt
```

### "Listings not showing"
```bash
python seed_database.py
```

---

## 📞 Support

For issues, create a GitHub issue or contact the development team.
