# DOMMMA - Product Requirements Document

## Original Problem Statement
Build a comprehensive real estate marketplace platform for Metro Vancouver featuring AI-powered property search, contractor marketplace, rent payment system, document intelligence, and landlord management tools.

## User Personas
- **Renters:** Search apartments, apply for rentals, find roommates, pay rent, get AI lease reviews
- **Landlords:** List properties, manage tenants, collect rent, track earnings, find contractors
- **Buyers/Sellers:** Browse homes for sale, make offers, schedule viewings
- **Contractors:** Get hired for home services, submit bids, manage portfolio

## Core Requirements
1. AI Concierge (Nova) - powered by Anthropic Claude
2. Property listings with Google Maps integration
3. Contractor marketplace with bidding system
4. E-Sign documents (DocuSign)
5. Rent payment system (Stripe Elements + Connect)
6. AI Document Intelligence (lease review, compliance check)
7. Multi-language support (EN, FR, ZH)
8. PWA with offline support and push notifications
9. Background job scheduler for payments/reminders

## Technology Stack
- Frontend: React, Tailwind CSS, Shadcn UI, i18next
- Backend: Python FastAPI (modular router architecture)
- Database: MongoDB Atlas
- Hosting: AWS EC2 (Ubuntu)
- Storage: Cloudflare R2
- AI: Anthropic Claude, Perplexity
- Payments: Stripe (Elements + Connect)
- Emails: Resend
- E-Signatures: DocuSign
- Maps: Google Maps Platform
- Push: Web Push API (VAPID)
- CI/CD: GitHub Actions

## Implemented Features (Complete)

### Phase 1 - Core Platform
- User auth (register, login, email verification)
- Property listings (CRUD, search, map, claim)
- Nova AI chatbot
- Messaging system
- Applications system
- Contact form

### Phase 2 - Advanced Features
- Contractor marketplace (profiles, services, bookings, jobs, bids, reviews)
- Document builder with AI review
- E-Sign (DocuSign integration)
- Rent payment system (Stripe checkout)
- Featured listings (pay-per-success)
- Renter resume builder
- Lease takeover system
- Financing applications
- Analytics dashboard
- Roommate finder
- Property compare/favorites
- Image syndication

### Phase 3 - AI & Payments
- Rent Agreements (create, accept, counter, decline)
- Stripe Connect (landlord payouts)
- AI Document Intelligence (compliance review, risk analysis)
- AI Property Valuation & Neighborhood Comparison
- AI Property Search Chatbot (with session history)
- Credit Check Simulator (MOCKED)
- Landlord Earnings Dashboard
- Smart Rent Pricing
- Payment History & Receipts
- APScheduler background jobs (invoices, reminders, late fees, renewals)
- Resend email reminders

### Phase 4 - Modularization & New Features
- Extracted 16 router modules from server.py:
  - admin, auth, listings, contractors, stripe_connect, ai_intelligence, ai_valuation, ai_chatbot, scheduler, receipts, landlord_earnings, web_push, calendar, moving, compatibility, portfolio, nova
- Shared auth utilities module (services/auth_utils.py)
- Web Push Notifications (VAPID/pywebpush)
- 3D Matterport Viewer component
- Multi-language support (EN, FR, ZH)
- PWA Service Worker with push handler
- Updated handover documentation (v2.0)

## Architecture
- Backend: ~7,400 lines in server.py + 16 modular routers in /routers/
- Frontend: 40+ page components, Shadcn UI components
- 24+ MongoDB collections
- 4 recurring background jobs (APScheduler)

## What's Mocked
- Credit Check API (simulated scores for demo)

## 3rd Party Integrations
- MongoDB Atlas, Anthropic Claude, Perplexity, Stripe, Resend, DocuSign, Google Maps, Cloudflare R2, Web Push (VAPID)

## All Features Tested - 100% Pass Rate
- Backend: 20/20 tests passed (modular routers)
- Frontend: All features working
- 45+ features tested in earlier iterations
