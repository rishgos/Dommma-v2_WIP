# DOMMMA Product Roadmap

## Current Status: V21 (December 2025)

Platform is fully functional with AI chatbot (Nova), property listings, contractor marketplace, e-signing, payments, analytics, and comprehensive email verification.

---

## Immediate Priorities (P0)

### 1. Production Email Sending
- **Status:** ✅ COMPLETE
- **Description:** Resend integration fully configured with domain verification
- **What was done:** 
  - Added DKIM, SPF, MX, DMARC records in AWS Route 53
  - Updated sender email to noreply@dommma.com
  - New API key configured
- **Result:** All transactional emails now working in production

### 2. Featured Property Payment Flow
- **Status:** ✅ COMPLETE
- **Description:** Pay-per-success model for featured listings
- **What was done:**
  - Backend endpoints for enabling/disabling featured status
  - Automatic fee charge when property is marked as rented
  - Featured badge display on Browse and MyProperties pages
  - 30-day featured duration with expiry tracking

### 3. Role-Specific Analytics Dashboards
- **Status:** ✅ COMPLETE
- **Description:** Each user role has tailored analytics
- **What was done:**
  - Renter: Favorites, applications, profile completion tracking
  - Landlord: Properties, revenue, application funnel, maintenance
  - Contractor: Jobs, earnings, ratings, reviews
  - Platform view toggle for admin overview

### 4. Credit Card Management UI
- **Status:** ✅ COMPLETE
- **Description:** Users can save and manage payment methods
- **What was done:**
  - Payment Methods tab added to Settings
  - Stripe customer creation and payment method storage
  - Set default payment method
  - Delete saved cards

---

## Short-term Goals (P1)

### 4. Role-Specific Analytics Dashboards
- **Status:** PARTIAL - Platform analytics exists
- **Description:** Build dedicated dashboards for each user role
- **Files:** Create new pages under `frontend/src/pages/Analytics/`
- **Features:**
  - **Renters:** Search history, saved properties, application status
  - **Landlords:** Listing views, inquiries, revenue tracking
  - **Contractors:** Lead conversion, job completion rates, earnings

### 5. Real Competitor Scraping
- **Status:** MOCKED - Uses local DB data
- **Description:** Replace mocked scraping with real web scraping
- **Options:**
  - Bright Data
  - ScrapingBee
  - Custom scraper for FB Marketplace, Craigslist, Kijiji
- **Files:** `backend/services/ai_tools.py`, POST /api/ai/competitor-analysis

### 6. Credit Card Management UI
- **Status:** NOT STARTED
- **Description:** Allow users to save and manage payment methods
- **Files:** Create component in `frontend/src/pages/User/Settings.jsx`
- **Integration:** Stripe Customer Portal or custom implementation

---

## Medium-term Goals (P2)

### 7. DocuSign-like Document Builder
- **Status:** NOT STARTED
- **Description:** Enhance Documents section for full document lifecycle
- **Features:**
  - Upload BC tenancy agreements
  - Fill form fields in-browser
  - Send for signature
  - Store signed copies securely

### 8. Post-Reservation Upsells
- **Status:** COMPONENT EXISTS - Needs integration
- **Description:** Suggest services to renters after they reserve
- **Files:** `frontend/src/components/PostReservationUpsell.jsx`
- **Services:**
  - Moving companies
  - Internet providers
  - Home insurance
  - Utility setup

### 9. In-House Financing (Mocked)
- **Status:** NOT STARTED
- **Description:** Build UI mockups for financing features
- **Features (mocked):**
  - Rent-to-own programs
  - Deposit financing
  - Line of credit for landlords/contractors

---

## Long-term Vision (P3)

### 10. In-House Financing
- **Description:** Line of Credit for platform users
- **Targets:**
  - Landlords (property improvements)
  - Contractors (equipment purchases)
  - Renters (security deposits)

### 11. Native Mobile Apps
- **Description:** iOS and Android apps
- **Approach:**
  - React Native or Flutter
  - Push notification support
  - Offline capability
  - Native camera access

### 12. Advanced AI Features
- **Description:** Next-gen AI capabilities
- **Features:**
  - Multi-property comparison
  - Market trend predictions
  - Automated rent adjustments
  - Chatbot personality customization

---

## Technical Debt

### Code Quality
| Task | Priority | Effort |
|------|----------|--------|
| Split server.py into routers | P3 | Medium |
| Fix npm peer dependency warnings | P2 | Low |
| Add comprehensive test coverage | P2 | High |
| Implement proper error boundaries | P3 | Low |

### Infrastructure
| Task | Priority | Effort |
|------|----------|--------|
| Set up CI/CD pipeline | P2 | Medium |
| Add monitoring/alerting | P2 | Medium |
| Implement rate limiting | P2 | Low |
| Database backup automation | P1 | Low |

---

## Feature Completion Matrix

| Feature | Backend | Frontend | Testing | Docs |
|---------|---------|----------|---------|------|
| Auth + Email Verification | DONE | DONE | DONE | DONE |
| Listings + Search | DONE | DONE | DONE | DONE |
| Claim Listing Flow | DONE | DONE | DONE | DONE |
| Contractors + Ratings | DONE | DONE | DONE | DONE |
| AI Chat (Nova) | DONE | DONE | DONE | DONE |
| Voice STT/TTS | DONE | DONE | DONE | DONE |
| Payments (Stripe) | DONE | DONE | DONE | DONE |
| DocuSign E-Sign | DONE | DONE | DONE | DONE |
| Analytics Dashboard | DONE | DONE | DONE | DONE |
| Lease Assignments | DONE | DONE | DONE | DONE |
| E-Sign Documents | DONE | DONE | DONE | DONE |
| My Resume | DONE | DONE | DONE | DONE |
| AI Applicant Ranking | DONE | DONE | DONE | DONE |
| Video Tours | DONE | DONE | - | - |
| Syndication | DONE | DONE | - | - |
| Address Autocomplete | DONE | DONE | DONE | DONE |
| WCB/Insurance Verify | DONE | DONE | - | - |
| Featured Properties | DONE | DONE | - | DONE |
| Credit Card Mgmt | DONE | DONE | - | - |
| Role Analytics | DONE | DONE | - | DONE |
| Competitor Analysis | MOCKED | DONE | - | - |

---

## Success Metrics

### User Engagement
- Daily active users
- Chat messages per session
- Listings created via AI
- Contractor bookings

### Revenue
- Stripe transaction volume
- Lease assignment fees
- Premium subscriptions (future)

### Platform Health
- API response times
- Error rates
- User satisfaction scores

---

## Timeline (Estimated)

| Quarter | Focus |
|---------|-------|
| Q4 2025 | Complete P0 items (DNS, Featured Properties) |
| Q1 2026 | Role-specific Analytics, Credit Card UI |
| Q2 2026 | DocuSign-like builder, Post-reservation upsells |
| Q3 2026 | Mobile Apps MVP |
| Q4 2026 | In-House Financing, Scale |

---

## Known Blockers

| Blocker | Owner | Resolution |
|---------|-------|------------|
| ~~Resend Test Mode~~ | ~~User~~ | ✅ RESOLVED - DNS records added, domain verified |
| CDN Caching | Infrastructure | Platform limitation - use local bundle verification |

---

*Last updated: December 2025*
