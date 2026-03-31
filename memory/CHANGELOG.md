# DOMMMA Changelog

## [v5.0] - 2026-03-31
### Google Maps AdvancedMarkerElement Migration
- Replaced `@react-google-maps/api` (MarkerF/InfoWindowF) with `@vis.gl/react-google-maps` (AdvancedMarker/InfoWindow)
- Browse page map now uses HTML-based price labels in AdvancedMarker instead of deprecated SVG icon approach
- Added `mapId` prop for vector map support
- No more deprecated Marker console warnings

### Real-time WebSocket Notifications
- Enhanced WebSocket endpoint to send unread notification count on connect
- WebSocket now broadcasts notifications on new messages, applications, bids, etc.
- Created NotificationCenter component (replaced old NotificationBell)
- Dropdown notification panel with mark-read, mark-all-read, clear-all
- Real-time unread badge count with reconnection logic
- Created `/routers/realtime_notifications.py` with full CRUD (get, count, mark-read, mark-all-read, delete, clear)

### Virtual Staging AI
- Created `/routers/virtual_staging.py` with GPT Image 1 integration (OpenAI via emergentintegrations)
- 6 room types (living room, bedroom, kitchen, dining, office, bathroom)
- 6 design styles (modern, traditional, contemporary, industrial, coastal, luxury)
- Virtual staging page at `/virtual-staging` with upload, preview, download
- Staging history tracking per user
- Added to landlord sidebar navigation

### Advanced Analytics with Export
- Created `/routers/analytics_export.py` with CSV and JSON export
- 5 report types: payments, listings, bookings, rent_agreements, overview
- Export dropdown on Analytics Dashboard page
- Added "Analytics & Export" link to all user type sidebars

### Enhanced Credit Check
- Replaced random scoring with deterministic algorithm (consistent scores per tenant)
- Added score_breakdown with weighted factors (payment_history 35%, utilization 30%, etc.)
- Added affordability analysis (estimated income, max rent, debt-to-income ratio)
- Added recommendation_notes with actionable guidance
- Frontend updated to show affordability section and recommendation notes

## [v4.0] - 2026-03-31
### Backend Modularization (Phase 4)
- Extracted auth, listings, contractors routes into dedicated routers
- Created shared auth utilities, Web Push, 3D Matterport, Documentation v2.0

## [v3.0] - 2026-03 (Earlier)
- Rent Agreements, Stripe Connect, AI Intelligence, APScheduler, i18n, PWA
- AI Valuation, Chatbot, Credit Check, Landlord Earnings, Smart Pricing

## [v2.0] - 2026-02
- Contractor marketplace, Document builder, Payments, Featured listings, Analytics

## [v1.0] - 2026-01
- Core platform: Auth, Listings, Nova AI, Maps, Messaging

---
*Maintained by DOMMMA Development Team*
