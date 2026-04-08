# DOMMMA - Product Requirements Document

## Original Problem Statement
Build a comprehensive real estate marketplace platform for Metro Vancouver featuring AI-powered property search, contractor marketplace, rent payment system, document intelligence, and landlord management tools.

## Technology Stack
- Frontend: React, Tailwind CSS, Shadcn UI, i18next, @vis.gl/react-google-maps
- Backend: Python FastAPI (modular router architecture - 21 routers)
- Database: MongoDB Atlas (28+ collections)
- Hosting: AWS EC2 (Ubuntu)
- Storage: Cloudflare R2
- AI: Anthropic Claude, Perplexity, OpenAI GPT Image 1 (virtual staging)
- Payments: Stripe (Elements + Connect)
- Push: Web Push API (VAPID/pywebpush)
- CI/CD: GitHub Actions

## All Implemented Features

### Core Platform
- User auth (register, login, email verification, password change)
- Property listings (CRUD, search, map, claim, featured, flexible pricing)
- Nova AI chatbot, Messaging with WebSocket, Applications, Contact form

### Contractor Marketplace
- Profiles, services, bookings, job postings, bidding system, reviews, leaderboard
- Lead generation flow (email notifications to relevant contractors)
- Credit-based monetization (5 free leads, then purchase credits)

### Payments & Rentals
- Stripe checkout, Stripe Connect (landlord payouts)
- Rent Agreements (create/accept/counter/decline)
- Flexible lease-duration pricing (month-to-month, 3, 6, 9, 12 months)
- Short-term rental support, Featured listings (pay-per-success)

### AI Features
- AI Listing Description Generator (4 tones: professional, casual, luxury, concise)
- AI Document Intelligence (compliance review, risk analysis)
- AI Property Valuation & Neighborhood Comparison
- AI Property Search Chatbot (session history)
- Virtual Staging AI (6 room types x 6 styles, GPT Image 1)
- Credit Check Simulator (enhanced deterministic scoring with affordability)

### Marketing & Growth
- Social Sharing (Facebook, FB Marketplace, Twitter, LinkedIn, WhatsApp, Craigslist, Email)
- Campaign-based Promotion Dashboard (Boost/Featured/Premium tiers)
- Role-based landing content (landlord/renter/contractor quick actions)

### Platform Features
- Multi-language (EN, FR, ZH), PWA Service Worker
- Real-time WebSocket notifications (NotificationCenter)
- Web Push Notifications (VAPID)
- 3D Matterport Viewer, Advanced Analytics with CSV/JSON Export
- Landlord Earnings Dashboard, Smart Rent Pricing
- Calendar, Moving quotes, Roommate finder

### Architecture
- 21 modular routers in /routers/
- 28+ MongoDB collections
- 4 recurring background jobs (APScheduler)
- Google Maps AdvancedMarkerElement (modern API)

## What's Mocked/Simulated
- Credit Check (deterministic simulation)
- Virtual Staging & AI Description require API keys
- Campaigns currently track but don't charge (Stripe integration pending)

### Landing Page
- Animated 4-column Service Showcase (Rentals, Buy/Sell, Lease, Services)
  - 3D tilt cards with glassmorphism, live data, staggered entrance animations
  - Integrated between Nova Search and Featured Properties sections

## Testing: 100% Pass Rate
- Iteration 27: Backend 20/20
- Iteration 28: Backend 18/18
- Iteration 29: Backend 15/15, Frontend 100% (17 feature tests all passed)
