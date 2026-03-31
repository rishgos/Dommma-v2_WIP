# DOMMMA Changelog

## [v4.0] - 2026-03-31
### Backend Modularization (Phase 4 Complete)
- Extracted auth routes into `/routers/auth.py` (register, login, verify-email, change-password)
- Extracted listing routes into `/routers/listings.py` (CRUD, map, claim, featured, mark-rented)
- Extracted contractor routes into `/routers/contractors.py` (profiles, services, bookings, jobs, bids, reviews, leaderboard)
- Created shared auth utilities module (`/services/auth_utils.py`)
- Reduced server.py from ~8,900 lines to ~7,400 lines

### Web Push Notifications
- Added Web Push API backend router (`/routers/web_push.py`)
- VAPID key generation and configuration
- Subscribe/unsubscribe endpoints
- Individual and bulk push notification sending
- Frontend push subscription utility (`/lib/pushNotifications.js`)
- Integrated push toggle in Settings page notifications tab

### 3D Matterport Viewer
- Created `MatterportViewer.jsx` component with fullscreen support
- Placeholder state when no Matterport ID available
- Integrated into Browse page listing detail modal
- Supports both raw Matterport IDs and full URLs

### Documentation
- Updated handover guide (`DOMMMA_COMPLETE_HANDOVER_GUIDE.md`) to v2.0
- Documented all 16 router modules, new API endpoints, environment variables
- Updated architecture diagram with push notifications and Matterport

## [v3.0] - 2026-03 (Earlier in session)
### Rent Agreements & Payments
- Rent agreement create/accept/counter/decline flow
- Stripe Connect landlord onboarding and payouts
- AI document intelligence (compliance review, risk analysis)
- APScheduler background jobs for invoices, reminders, late fees, renewals

### AI Features
- AI Property Valuation with neighborhood comparison
- AI Property Search Chatbot with session history
- Credit Check Simulator (demo/simulated)
- Landlord Earnings Dashboard with ROI projections
- Smart Rent Pricing

### Multi-language & PWA
- i18n support (English, French, Mandarin Chinese)
- PWA Service Worker with offline caching
- Language toggle in navigation

### Backend Modularization (12+ routers)
- admin, stripe_connect, ai_intelligence, ai_valuation, ai_chatbot
- scheduler, receipts, landlord_earnings, calendar, moving
- compatibility, portfolio, nova

## [v2.0] - 2026-02
### Core Features
- Contractor marketplace with bidding system
- Document builder with e-sign
- Rent payment system (Stripe checkout)
- Featured listings (pay-per-success)
- Renter resume builder
- Lease takeover system
- Analytics dashboard

## [v1.0] - 2026-01
### Initial Platform
- User authentication with email verification
- Property listings with Google Maps
- Nova AI chatbot (Anthropic Claude)
- Messaging system
- Contact form
- Cloudflare R2 storage

---
*Maintained by DOMMMA Development Team*
