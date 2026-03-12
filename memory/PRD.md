# DOMMMA - Product Requirements Document (PRD)

## Document Information
- **Version:** 5.2
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

### 2.1 Latest Session Updates (March 12, 2026)

#### Production Deployment Fix ✅ COMPLETE
- **Issue:** Website at https://dommma.com was showing a blank white page
- **Root Cause:** Missing `.env` file on EC2 server, causing `REACT_APP_BACKEND_URL` to be undefined
- **Fix Applied:**
  1. Fixed `Messages.jsx` line 12 to safely handle undefined environment variable
  2. Created frontend `.env` on EC2 with correct `REACT_APP_BACKEND_URL=https://dommma.com`
  3. Rebuilt frontend with `yarn build`
  4. Fixed file permissions for Nginx
- **Status:** Website is now LIVE at https://dommma.com ✅

#### Complete Handover Documentation ✅ NEW
- Created comprehensive technical handover guide at `/app/downloads/DOMMMA_COMPLETE_HANDOVER_GUIDE.docx`
- Includes: Architecture diagrams, deployment commands, troubleshooting guide, all credentials locations
- Non-technical friendly documentation for project handover

### 2.2 Previous Session Updates (March 10, 2026)

#### ALL TASKS COMPLETED ✅

##### 1. Cloudflare R2 Storage Integration ✅ COMPLETE
- All upload endpoints now use R2 storage with base64 fallback
- Extended document types to include: PDF, Word, Excel, text, CSV, JSON

##### 2. In-House Financing UI ✅ NEW
- New `/financing` page with three financing options:
  - **Rent-to-Own**: Build equity while renting with purchase option
  - **Deposit Financing**: Spread deposit over 3-6 monthly payments
  - **First Month Free**: Landlord-sponsored first month waiver
- Features:
  - Interactive financing calculator
  - Application form modal with validation
  - FAQ section
  - How it works guide
- Backend API: `POST /api/financing/applications`, `GET /api/financing/applications`

##### 3. DocuSign-like Functionality Enhancements ✅ NEW
- Added audit trail for all e-sign documents
- New endpoints:
  - `GET /api/esign/documents/{doc_id}/audit` - Get document audit trail
  - `POST /api/esign/documents/{doc_id}/audit` - Add audit event
  - `POST /api/esign/templates` - Create reusable templates
  - `GET /api/esign/templates` - List user's templates
- Automatic audit event on document creation

##### 4. Advanced Analytics Expansion ✅ NEW
- New analytics endpoints:
  - `GET /api/analytics/trends/{user_id}` - Trend data over time
  - `GET /api/analytics/insights/{user_id}` - AI-generated performance insights
- Insights include:
  - Landlord: Inactive listings alerts, application boost tips, market updates
  - Contractor: Verification prompts, reputation building, high demand alerts
  - Renter: Pending application alerts, property comparison tips, new listing notifications

##### 5. Cloudflare CDN & DDoS Protection ✅ DOCUMENTED
- Comprehensive setup guide created at `/app/documents/CLOUDFLARE_CDN_DDOS_GUIDE.md`
- Covers: DNS setup, SSL/TLS, caching rules, DDoS protection, WAF, rate limiting

##### 6. Full Platform Audit ✅ COMPLETE
- Verified all 44 pages and 181+ API endpoints
- Fixed bugs found during testing
- Homepage "Our Story" link removed

### 2.2 Previous Bug Fixes Completed
- ✅ Removed "Our Story" section from homepage (confusing arrow)
- ✅ Fixed oversized "Featured Listing" text
- ✅ Fixed double sidebar on Pay & Invoices page
- ✅ Fixed duplicate `/api/jobs` route conflict
- ✅ Email verification flow confirmed working
- ✅ Fixed Financing modal Send icon import
- ✅ Fixed E-Sign document creation ObjectId serialization

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

### All Major Tasks Complete! ✅

The following tasks have been completed:
- [x] ~~Cloudflare R2 integration~~ ✅ COMPLETE
- [x] ~~Full platform audit~~ ✅ COMPLETE
- [x] ~~Display star ratings on user profiles~~ ✅ COMPLETE
- [x] ~~DocuSign-like functionality enhancements~~ ✅ COMPLETE
- [x] ~~In-house financing UI~~ ✅ COMPLETE
- [x] ~~Advanced analytics expansion~~ ✅ COMPLETE
- [x] ~~Cloudflare CDN & DDoS Protection guide~~ ✅ COMPLETE

### Future Enhancements (P3)
- [ ] Mobile app version
- [ ] Multi-language support expansion
- [ ] AI-powered property valuation
- [ ] Virtual property tours integration
- [ ] Blockchain-based lease verification

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

### New/Modified Files (March 10, 2026)
- `/app/backend/services/r2_storage.py` - Cloudflare R2 storage service (UPDATED)
- `/app/backend/server.py` - Updated upload endpoints to use R2
- `/app/frontend/src/pages/Dashboard.jsx` - Added UserRatingCard to all dashboards

### Previous Files
- `/app/frontend/src/pages/ServiceRequestWizard.jsx` - Bark.com-style wizard
- `/app/frontend/src/components/ratings/StarRating.jsx` - Star rating component
- `/app/frontend/src/components/ratings/UserRatingCard.jsx` - User rating card
- `/app/frontend/src/components/jobs/JobComponents.jsx` - Job posting components
- `/app/frontend/src/pages/SettingsPage.jsx` - Enhanced notifications
- `/app/frontend/src/pages/Home.jsx` - Homepage
- `/app/frontend/src/pages/Payments.jsx` - Fixed sidebar

---

## 7. Test Credentials

- **Email:** test@dommma.com
- **Password:** test123
- **User Type:** Renter (verified)

---

*This document should be updated as features are added or modified.*
