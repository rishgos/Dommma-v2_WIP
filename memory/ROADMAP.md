# DOMMMA Product Roadmap

## Current Status: V21 (December 2025)

Platform is fully functional with:
- AI chatbot (Nova) with voice
- Property listings & search
- Contractor marketplace
- Document builder & e-signing
- Universal payments & invoicing
- Role-specific analytics
- Featured listings
- Post-reservation upsells
- Real-time competitor analysis
- Production email system

---

## ✅ COMPLETED (This Session)

### Production Email Sending
- Resend integration with dommma.com domain
- DNS records (DKIM, SPF, MX, DMARC) configured
- Emails from noreply@dommma.com

### Featured Property Payment Flow
- Pay-per-success model ($49.99 when rented)
- Featured badge on property cards
- 30-day duration with auto-expiry

### Role-Specific Analytics Dashboards
- Renter: Favorites, applications, profile completion
- Landlord: Properties, revenue, application funnel
- Contractor: Jobs, earnings, ratings

### Credit Card Management UI
- Payment Methods tab in Settings
- Stripe customer creation
- Add/remove/set default cards

### Universal Pay & Invoices
- Role-specific payment types
- Automatic invoice generation
- PDF download

### Document Builder
- BC RTB forms (RTB-1, RTB-7, RTB-26, RTB-30)
- Step-by-step wizard
- PDF generation & e-signature

### Post-Reservation Upsells
- Local service providers API
- 6 categories (movers, internet, etc.)
- Quote request system

### Real Competitor Scraping
- Perplexity API integration
- Live data from Craigslist, FB, Kijiji
- AI-powered price suggestions

---

## Short-term Goals (P1)

### 1. Integrate Upsells into Booking Flow
- **Status:** API complete, UI integration pending
- **Description:** Show upsells after property reservation confirmed
- **Files:** Integrate `PostReservationOffers.jsx` into reservation confirmation
- **Priority:** HIGH

### 2. Document Signing Flow
- **Status:** Email sending complete, signing page needed
- **Description:** Create `/sign-document/{id}` page for recipients
- **Features:**
  - View document details
  - Digital signature capture
  - Signed document storage
- **Priority:** HIGH

### 3. Mobile Optimization
- **Status:** Responsive but not mobile-first
- **Description:** Optimize key flows for mobile users
- **Pages:** Browse, Document Builder, Payments
- **Priority:** MEDIUM

---

## Medium-term Goals (P2)

### 4. Notification Center Enhancements
- Push notification preferences
- Email digest options (daily/weekly)
- In-app notification grouping

### 5. Landlord Tenant Portal
- Dedicated portal for existing tenants
- Maintenance request submission
- Rent payment history
- Lease document access

### 6. Contractor Scheduling
- Calendar integration for job booking
- Availability management
- Automatic reminder emails

---

## Future Goals (P3)

### 7. iOS/Android Native Apps
- React Native or Flutter
- Push notifications
- Offline support for key features

### 8. Multi-Language Support
- French Canadian
- Mandarin
- Punjabi (Vancouver demographics)

### 9. AI Enhancements
- Property photo analysis
- Virtual staging suggestions
- Automated lease clause review

### 10. In-House Financing (Mocked)
- Rent-to-own programs UI
- Deposit financing calculator
- Credit score integration mockup

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
| My Resume | DONE | DONE | DONE | DONE |
| AI Applicant Ranking | DONE | DONE | DONE | DONE |
| Video Tours | DONE | DONE | - | - |
| Syndication | DONE | DONE | - | - |
| Address Autocomplete | DONE | DONE | DONE | DONE |
| WCB/Insurance Verify | DONE | DONE | - | - |
| **Featured Properties** | DONE | DONE | DONE | DONE |
| **Credit Card Mgmt** | DONE | DONE | DONE | DONE |
| **Role Analytics** | DONE | DONE | DONE | DONE |
| **Document Builder** | DONE | DONE | DONE | DONE |
| **Pay & Invoices** | DONE | DONE | DONE | DONE |
| **Upsells API** | DONE | PARTIAL | DONE | DONE |
| **Competitor Scraping** | DONE | DONE | DONE | DONE |

---

## API Keys Configured

| Service | Status | Notes |
|---------|--------|-------|
| Anthropic (Claude) | ✅ Active | AI chatbot |
| OpenAI | ✅ Active | Whisper + TTS |
| Stripe | ✅ Active | Live key |
| Resend | ✅ Active | Domain verified |
| Google Maps | ✅ Active | Places + Maps |
| DocuSign | ✅ Active | OAuth configured |
| Perplexity | ✅ Active | Web scraping |
| MongoDB Atlas | ✅ Active | Production DB |

---

## Known Blockers

| Blocker | Owner | Resolution |
|---------|-------|------------|
| CDN Caching | Infrastructure | Platform limitation - code deploys correctly |

---

*Last updated: December 6, 2025*
