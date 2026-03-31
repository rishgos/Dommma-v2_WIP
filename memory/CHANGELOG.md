# DOMMMA Changelog

## Feb 2026 - Phase 2 & 3 Implementation

### Rent Payment System (Phase 2)
- Built `RentAgreements.jsx` with full tenant/landlord views
- Landlord: Create Agreement modal with property selection, tenant search, late fee settings
- Tenant: Accept/Counter/Decline agreement flow
- Stripe Elements integration for payment method setup
- Stripe Connect onboarding for landlord payouts (Express accounts)
- Platform fee (2.5%) on transfers
- Connected bank account status display

### AI Document Intelligence (Phase 3)
- Built `TenantDocReview.jsx` with document selection and manual paste input
- AI-powered lease review using Anthropic Claude:
  - Identifies excessive fees, non-compliant clauses
  - BC Residential Tenancy Act compliance checks
  - Risk scoring (low/medium/high) with explanations
  - Tenant action checklist generation
- Lease comparison against BC standards and market averages
- Deposit analysis (BC RTA limits at 50% of monthly rent)

### Browse Page Enhancements
- Added "Lease Takeover" as 3rd tab (Rent/Buy/Lease Takeover)
- Fetches from lease-assignments endpoint when tab active
- Dynamic search placeholder per tab

### Document Builder AI
- Added AI Assistant toggle panel with BC RTA guidance
- AI prompts for required lease clauses
- AI document review with highlights and concerns
- Quick tips for legal compliance

### Backend Refactoring
- Created `/app/backend/routers/` directory
- Extracted Stripe Connect into `routers/stripe_connect.py`
- Extracted AI Intelligence into `routers/ai_intelligence.py`
- Created Admin router template at `routers/admin.py`
- Added User Search endpoint: `GET /api/users/search`

### Sidebar Navigation Updates
- Added "Rent Agreements" to both renter and landlord navigation
- Added "AI Doc Review" to renter navigation
- Added CreditCard and Shield icons

---

## Dec 2025 - Initial Platform & Phase 1

### DevOps & Production
- Fixed EC2 blank page (missing frontend .env)
- Created GitHub Actions CI/CD pipeline
- Automated deployment on push to main

### Core Features
- Property browsing with advanced filters
- 16-category contractor marketplace
- AI concierge (Nova)
- E-signature document builder
- Admin endpoints (stats, clear data, contact messages)
- Hero height standardization across pages

### API Key Migration
- Updated MongoDB, Google Maps, Google OAuth, Anthropic, OpenAI, Perplexity, DocuSign, Resend keys on EC2

---

*Maintained by DOMMMA Development Team*
