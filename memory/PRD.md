# DOMMMA - Product Requirements Document

## Original Problem Statement
Build a comprehensive real estate marketplace platform for Metro Vancouver featuring AI-powered property search, contractor marketplace, rent payment system, document intelligence, and landlord management tools.

## User Personas
- **Renters:** Search apartments, apply for rentals, find roommates, pay rent, get AI lease reviews
- **Landlords:** List properties, manage tenants, collect rent, track earnings, find contractors, virtual staging
- **Buyers/Sellers:** Browse homes for sale, make offers, schedule viewings
- **Contractors:** Get hired for home services, submit bids, manage portfolio

## Technology Stack
- Frontend: React, Tailwind CSS, Shadcn UI, i18next, @vis.gl/react-google-maps
- Backend: Python FastAPI (modular router architecture - 19 routers)
- Database: MongoDB Atlas (24+ collections)
- Hosting: AWS EC2 (Ubuntu)
- Storage: Cloudflare R2
- AI: Anthropic Claude, Perplexity, OpenAI GPT Image 1 (virtual staging)
- Payments: Stripe (Elements + Connect)
- Emails: Resend
- E-Signatures: DocuSign
- Maps: Google Maps (AdvancedMarkerElement)
- Push: Web Push API (VAPID/pywebpush)
- Background Jobs: APScheduler
- CI/CD: GitHub Actions

## All Implemented Features

### Phase 1 - Core Platform
- User auth (register, login, email verification, password change)
- Property listings (CRUD, search, map, claim, featured)
- Nova AI chatbot (Anthropic Claude)
- Messaging system with WebSocket real-time delivery
- Applications, Contact form

### Phase 2 - Advanced Features
- Contractor marketplace (profiles, services, bookings, jobs, bids, reviews, leaderboard)
- Document builder with AI review, E-Sign (DocuSign)
- Rent payment system (Stripe checkout)
- Featured listings (pay-per-success), Renter resume, Lease takeover
- Financing applications, Analytics dashboard, Roommate finder
- Property compare/favorites, Image syndication

### Phase 3 - AI & Payments
- Rent Agreements (create, accept, counter, decline)
- Stripe Connect (landlord payouts)
- AI Document Intelligence (compliance review, risk analysis)
- AI Property Valuation & Neighborhood Comparison
- AI Property Search Chatbot (session history)
- Credit Check Simulator (enhanced deterministic scoring)
- Landlord Earnings Dashboard, Smart Rent Pricing
- Payment History & Receipts
- APScheduler (invoices, reminders, late fees, renewals)
- Multi-language (EN, FR, ZH), PWA Service Worker

### Phase 4 - Modularization & New Features
- 19 router modules extracted from server.py (auth, listings, contractors, web_push, virtual_staging, realtime_notifications, analytics_export, plus 12 from Phase 3)
- Shared auth utilities (services/auth_utils.py)
- Web Push Notifications (VAPID/pywebpush)
- 3D Matterport Viewer component
- Real-time WebSocket notifications (enhanced, notification center)
- Virtual Staging AI (OpenAI GPT Image 1)
- Advanced Analytics with CSV/JSON Export
- Enhanced Credit Check (deterministic scoring, affordability analysis)
- Google Maps AdvancedMarkerElement migration (@vis.gl/react-google-maps)
- Updated handover documentation (v2.0)

## Architecture
- Backend: ~7,500 lines in server.py + 19 modular routers
- Frontend: 40+ page components, Shadcn UI
- 24+ MongoDB collections including push_subscriptions, virtual_stagings
- 4 recurring background jobs (APScheduler)
- WebSocket for real-time messaging + notifications

## What's Mocked/Simulated
- Credit Check API (deterministic simulation based on tenant ID hash)
- Virtual Staging AI requires EMERGENT_LLM_KEY credits for actual generation

## Testing Status
- Backend: 38/38 tests passed (iterations 27 + 28)
- Frontend: All features working, all pages loading correctly
- 100% backend pass rate across all test iterations

## Stripe API Key
- Blocked on user providing live Stripe keys for production
