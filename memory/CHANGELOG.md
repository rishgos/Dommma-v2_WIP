# DOMMMA Changelog

All notable changes to the DOMMMA platform are documented in this file.

## [V21] - 2025-12-XX (Current)

### Documentation
- **Comprehensive PRD Generated** - Full product requirements document reverse-engineered from codebase
  - 42 frontend pages documented
  - 18+ database collections catalogued
  - All API endpoints documented
  - Third-party integrations mapped
  - Feature status tracked

---

## [V20] - 2026-03-04

### Security
- **Email Verification System** - Full implementation for new user registrations
  - POST /api/auth/register now sends verification email
  - GET /api/auth/verify-email?token=X for email verification
  - POST /api/auth/resend-verification for resending emails
  - Legacy users (pre-verification) can still login
  - Login now properly rejects unverified emails

### Fixed
- **Critical Auth Vulnerability** - Login no longer creates accounts for any email/password
- **Nova Audio Stop** - Muting now properly stops audio playback immediately
- **Contractor Payments Page** - Shows role-appropriate payment options

### Added
- **Address Autocomplete Component** - Reusable component using Google Places
  - Integrated across 9 pages
  - Auto-fill city/province
  - Canadian address restriction
- **Claim Listing Flow** - Unauthenticated users can create and later claim listings
- **Contractor WCB/Insurance Verification** - AI-powered document verification
- **Renter Pay Rent Card** - Added to renter dashboard
- **Lease Duration Filters** - 3/6/9/12 month options on Browse
- **Special Offers Filter** - Find properties with deals
- **AI Competitor Analysis** - Price recommendations for landlords

---

## [V16] - 2026-03-02

### Added
- **DocuSign OAuth 2.0 Integration**
  - Full OAuth authorization code grant flow
  - Connect/disconnect DocuSign account from E-Sign page
  - Send documents via DocuSign for legally binding signatures
  - Envelope status tracking
  - New endpoints: `/api/docusign/status`, `/api/docusign/auth-url`, `/api/docusign/callback`, `/api/docusign/send-envelope`

- **Stripe Payment Processing for Lease Assignments**
  - "Pay $X" button on lease assignment marketplace cards
  - Stripe Checkout integration
  - Transaction tracking in database
  - New endpoints: `/api/lease-assignments/{id}/payment`, `/api/lease-assignments/{id}/payment-complete`

- **Advanced Analytics Dashboard**
  - Platform overview with real-time stats
  - 5 stat cards: Users, Listings, Revenue, Contractors, Documents
  - Bar charts: Users by Type, Listings by City
  - Price distribution and property types charts
  - Recent activity feed
  - Available at `/analytics` route
  - New endpoints: `/api/analytics/overview`, `/api/analytics/activity`, `/api/analytics/revenue`, `/api/analytics/listings-performance`

- **Renter Resume Endpoints**
  - GET/POST `/api/renter-resume` for tenant profile management
  - Completeness score calculation

### Fixed
- MongoDB _id serialization error in POST /api/lease-assignments
- Pydantic validation error when owner_id was null in lease assignment payment metadata

### Changed
- Added Analytics link to landlord sidebar navigation
- Updated DashboardLayout with BarChart3 icon

---

## [V15] - 2025-12-22

### Changed
- **Direct API Migration** - Removed Emergent LLM Key dependency
- Migrated to direct Anthropic SDK for Claude Sonnet 4.5
- Migrated to direct OpenAI SDK for Whisper/TTS
- Updated environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY)

---

## [V14] - 2025-12-20

### Added
- **Nova AI Long-Term Memory** - Remembers user preferences across sessions
- **Persistent Dashboard Sidebar** - Navigation stays visible
- **"Pros" Navigation Link** - Easy access to contractors

### Changed
- 4-column property grid on Browse page
- Homepage improvements (removed play button, added CTA)

---

## [V13] - 2025-12-18

### Added
- **Dynamic Featured Listings** - Landing page fetches from database
- **Nova AI Property Links** - Clickable property links in AI responses
- **Enhanced PWA Support** - Improved service worker caching

---

## [V12] - 2025-12-15

### Added
- **AI Moving Assistant** - Real cost calculator with Claude-powered tips
- Distance-based pricing using Haversine formula
- Special items surcharges, floor surcharges
- AI preparation checklists and moving day tips

---

## [V11] - 2025-12-12

### Added
- **AI Roommate Compatibility** - Multi-factor scoring algorithm
- Claude-powered compatibility insights
- Strengths/challenges/tips for living together

---

## [V10] - 2025-12-10

### Added
- **Push Notifications** - NotificationBell component
- Firebase FCM integration
- Notification CRUD APIs

---

## [V9] - 2025-12-08

### Added
- **Contractor Ratings System** - Review submission modal
- Reviews display with rating distribution
- Contractor leaderboard with medals
- Pending reviews on renter dashboard

---

## [V8] - 2025-12-05

### Added
- **Viewing Scheduler** - Schedule button on listing modals
- 4-step wizard (date, time, confirmation, success)
- Google Calendar sync for viewings

---

## [V7] - 2025-12-01

### Added
- **Voice Input (STT)** - OpenAI Whisper transcription
- **Voice Output (TTS)** - OpenAI TTS with 9 voices
- **Nova Insights Dashboard** - User analytics
- Long-term memory and proactive suggestions
- Property image analysis with Claude Vision

---

## [V6] - 2025-11-25

### Added
- In-app calendar with property viewings
- Google Calendar OAuth integration
- Moving quote calculator with 3-step wizard
- Contractor portfolio with before/after images

---

## [V5] - 2025-11-20

### Added
- Contractor marketplace with profiles, services, booking
- Stripe payments integration
- Favorites and comparison tool
- Roommate finder with AI compatibility scoring

---

## [V4] - 2025-11-15

### Added
- Rent/Buy toggle on listings
- Sale listings and offers
- Contractor search and discovery

---

## [V1-V3] - 2025-11-01

### Added
- Initial platform setup
- JWT authentication with role-based access
- Property browsing with Google Maps
- Basic dashboard UI
- Bilingual support (EN/FR)
- PWA support

---

## Test Reports

| Version | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| V16 | 100% (35/35) | 100% (13/13) | DocuSign, Stripe, Analytics |
| V15 | 95.5% | 100% | Direct API Migration |
| V14 | 100% | 100% | Memory & UX |
| V13 | 100% | 100% | Dynamic Landing |
| V12 | 100% | 100% | AI Moving |
| V11 | 100% | 100% | AI Roommate |
| V10 | 100% | 90% | Notifications |
| V9 | 100% | 100% | Contractor Ratings |
| V8 | 100% | 100% | Viewing Scheduler |

---

*Maintained by DOMMMA Development Team*
