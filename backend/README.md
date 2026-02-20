# DOMMMA Backend

FastAPI backend for the DOMMMA real estate marketplace.

## Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Create .env file (see Environment Variables below)

# Start server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

API docs available at `http://localhost:8001/docs`

## Requirements

- Python 3.10+
- MongoDB (local or Atlas)
- Virtual environment recommended

## Environment Variables

Create `.env` file in this folder:

```env
# Required
MONGO_URL=mongodb://localhost:27017
DB_NAME=dommma

# AI Features (required for AI to work)
EMERGENT_LLM_KEY=your_key_here

# Optional Integrations
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
RESEND_API_KEY=
```

## Key Folders

- `server.py` - Main FastAPI application
- `db.py` - MongoDB connection
- `models/` - Pydantic data models
- `routers/` - API route handlers
- `services/` - Business logic & AI services

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth/*` | Authentication |
| `/api/listings/*` | Property listings |
| `/api/bookings/*` | Contractor bookings |
| `/api/roommates/*` | Roommate finder |
| `/api/moving/*` | Moving quotes |
| `/api/nova/*` | AI chatbot |
| `/api/calendar/*` | Calendar & Google OAuth |
| `/api/notifications/*` | Push notifications |

Full API docs: `http://localhost:8001/docs`
