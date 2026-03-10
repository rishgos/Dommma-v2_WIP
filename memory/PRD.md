# DOMMMA - Product Requirements Document (PRD)

## Document Information
- **Version:** 5.1
- **Last Updated:** March 10, 2026
- **Status:** Active Development
- **Product Owner:** DOMMMA Team

---

## 1. Executive Summary

### 1.1 Product Vision
DOMMMA is a comprehensive AI-first real estate marketplace platform serving the Metro Vancouver area. The platform connects Renters, Landlords, Buyers, Sellers, and Contractors through an intelligent AI concierge named "Nova" that handles property searches, listing creation, maintenance requests, and contractor matching through natural conversation.

### 1.2 Mission Statement
To revolutionize the real estate experience by providing an AI-powered platform that simplifies property transactions, tenant-landlord interactions, and home service connections for all users in the Vancouver market.

### 1.3 Target Market
- **Primary:** Metro Vancouver (Vancouver, Burnaby, Richmond, Surrey, Coquitlam, New Westminster)
- **User Types:** Renters, Landlords, Property Buyers, Sellers, Contractors/Service Providers

---

## 2. Recent Updates (March 2026)

### 2.1 Latest Session Updates (March 10, 2026)

#### Cloudflare R2 Storage Integration ✅ COMPLETE
- **Status:** FULLY WORKING
- **What was done:**
  - Fixed R2 connection (issue was permission-based, not credentials)
  - All upload endpoints now use R2 storage with base64 fallback
  - Updated endpoints:
    - `POST /api/upload/image` - Now uses R2
    - `POST /api/upload/property-image` - R2 with property organization
    - `POST /api/upload/document` - R2 for documents
    - `POST /api/upload/avatar` - R2 for avatars
    - `POST /api/upload/contractor-portfolio` - R2 for portfolios
    - `POST /api/documents/upload` - Legacy endpoint now uses R2
    - `GET /api/storage/status` - Check R2 configuration
  - Extended document types to include: PDF, Word, Excel, text, CSV, JSON

#### Star Rating Display on Dashboards ✅ NEW
- `UserRatingCard` component now integrated into all user dashboards:
  - Renter Dashboard
  - Landlord Dashboard  
  - Contractor Dashboard
- Shows rating summary, distribution, and recent reviews

### 2.2 Previous Bug Fixes Completed
- ✅ Removed "Our Story" section from homepage (confusing arrow)
- ✅ Fixed oversized "Featured Listing" text - now compact with 2 property rows visible
- ✅ Fixed double sidebar on Pay & Invoices page for Renters/Contractors
- ✅ Fixed duplicate `/api/jobs` route conflict (renamed old routes to `/api/contractor-jobs`)
- ✅ Email verification flow confirmed working

### 2.3 Features Implemented

#### Bark.com-Style Service Request Wizard (`/get-quotes`)
A guided job posting flow inspired by bark.com:
- **Hero search page** with service autocomplete and postal code input
- **Dynamic question flow** based on service category:
  - Plumbing: Property type → Work type → Materials → Quantity
  - Electrical: Property type → Work type → Outlets count
  - Painting: Property type → Area type → Rooms count
  - And more category-specific flows
- **Additional details** free text step
- **Contact collection** (email, name, phone)
- **Success confirmation** with professional notification
- **Guest posting** supported (no login required)

#### Email Notifications for Job Flow
- **Customer confirmation email** - Sent when job request is posted
- **Contractor lead notification** - Sent to matching contractors with new lead details
- **Bid received notification** - Customer receives email when contractor submits quote
- All emails use professional DOMMMA branding with clear CTAs

#### Universal Star Rating System
- All user roles (Renters, Landlords, Contractors) can receive ratings
- Rating endpoints: POST/GET `/api/ratings/user`, `/api/ratings/summary/{user_id}`
- Rating distribution visualization
- Self-rating prevention
- Context-based ratings (rental, service, etc.)

#### Enhanced Notifications Settings (Wise-style)
- Categorized notification preferences:
  - Account & Security (with locked "Always on" items)
  - Messages & Communication
  - Property & Listings
  - Payments & Billing
  - Delivery Methods (Push, SMS, Weekly digest)
- Toggle switches with descriptions

---

## 3. Architecture

### 3.1 Tech Stack
- **Frontend:** React 18, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI (Python 3.11+)
- **Database:** MongoDB Atlas
- **AI:** Anthropic Claude (Nova chatbot)
- **Payments:** Stripe (Live key)
- **Email:** Resend (production-ready)
- **Maps:** Google Maps Platform (address autocomplete)
- **Analytics:** Perplexity AI (competitor scraping)
- **Storage:** Cloudflare R2 (object storage for images/documents) ✅ NEW

### 3.2 Key Routes
- `/` - Homepage
- `/get-quotes` - Bark.com-style service request wizard (NEW)
- `/contractors` - Contractor marketplace with job posting/bidding
- `/settings` - User settings with enhanced notifications
- `/payments` - Pay & Invoices page (fixed sidebar)
- `/dashboard` - Role-specific dashboard

### 3.3 Key API Endpoints
- `POST /api/jobs` - Create job post (bark.com-style)
- `GET /api/jobs` - List open jobs
- `POST /api/jobs/{id}/bids` - Submit contractor bid
- `PUT /api/jobs/{id}/bids/{bid_id}/accept` - Accept bid
- `POST /api/ratings/user` - Create user rating
- `GET /api/ratings/user/{id}` - Get user ratings
- `GET /api/ratings/summary/{id}` - Get rating distribution

---

## 4. Upcoming Tasks (Priority Order)

### P0 - Critical
- [x] ~~Answer user's rent collection questions~~ ✅ Guide created at /app/memory/RENT_COLLECTION_GUIDE.md
- [x] ~~Cloudflare R2 integration~~ ✅ COMPLETE - All uploads now use R2

### P1 - High
- [ ] Full platform audit (test all links/features)
- [x] ~~Payment recipient verification documentation~~ ✅ Included in rent guide
- [x] ~~Signed documents permanent storage confirmation~~ ✅ Documented in rent guide
- [x] ~~Display star ratings on user profiles~~ ✅ Added to all dashboards

### P2 - Medium
- [ ] DocuSign-like functionality enhancements
- [ ] In-house financing UI
- [ ] Advanced analytics expansion
- [ ] Cloudflare CDN & DDoS Protection (user configuration needed)

---

## 5. Database Schema Additions

### user_ratings Collection
```json
{
  "id": "uuid",
  "rated_user_id": "uuid",
  "rated_user_type": "renter|landlord|contractor",
  "rater_user_id": "uuid",
  "rater_name": "string",
  "rater_type": "string",
  "rating": 1-5,
  "review": "string (optional)",
  "context_type": "rental|service|landlord|contractor|renter",
  "context_id": "uuid (optional)",
  "created_at": "datetime"
}
```

### job_posts Collection (Bark.com-style)
```json
{
  "id": "uuid",
  "user_id": "uuid|guest",
  "user_name": "string",
  "title": "string",
  "category": "plumbing|electrical|painting|...",
  "description": "string",
  "address": "string",
  "budget_min": "float (optional)",
  "budget_max": "float (optional)",
  "urgency": "flexible|this_week|urgent",
  "status": "open|in_progress|completed|cancelled",
  "bid_count": "int",
  "contact_email": "string",
  "contact_name": "string",
  "contact_phone": "string (optional)",
  "answers": "object (questionnaire responses)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## 6. Files Reference

### New/Modified Files
- `/app/frontend/src/pages/ServiceRequestWizard.jsx` - Bark.com-style wizard (NEW)
- `/app/frontend/src/components/ratings/StarRating.jsx` - Star rating component (NEW)
- `/app/frontend/src/components/ratings/UserRatingCard.jsx` - User rating card (NEW)
- `/app/frontend/src/components/jobs/JobComponents.jsx` - Job posting components (NEW)
- `/app/frontend/src/pages/SettingsPage.jsx` - Enhanced notifications
- `/app/frontend/src/pages/Home.jsx` - Removed "Our Story", fixed Featured text
- `/app/frontend/src/pages/Payments.jsx` - Fixed double sidebar
- `/app/backend/server.py` - Rating system, job posting APIs, route fixes

---

*This document should be updated as features are added or modified.*
