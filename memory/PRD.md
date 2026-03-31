# DOMMMA - Product Requirements Document

## Original Problem Statement
Build a complete real estate marketplace platform called "DOMMMA" featuring an AI concierge, property listings, e-signing, contractor services, rent payment collection, and AI document intelligence.

## Tech Stack
- **Frontend**: React (CRA), Tailwind CSS, Shadcn UI, Stripe Elements
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB Atlas
- **Storage**: Cloudflare R2
- **CI/CD**: GitHub Actions
- **Deployment**: AWS EC2
- **3rd Party**: Stripe (Payments + Connect), DocuSign, Anthropic Claude, OpenAI, Perplexity, Resend, Google Maps/OAuth

## Core Features (Implemented)

### Phase 1 - Foundation
- Property browsing with Rent/Buy/Lease Takeover tabs
- Advanced filters (bedrooms, bathrooms, price, property type, storage, lease term)
- Google Maps integration
- 16-category contractor marketplace
- AI concierge (Nova) with multi-model LLM
- E-signature document builder with AI assistance
- User auth (register/login/Google OAuth)
- Messaging system
- Renter resume builder
- Property analytics dashboard

### Phase 2 - Rent Payment System (Implemented Feb 2026)
- **Rent Agreements** - Landlords create agreements, tenants accept/counter/decline
- **Stripe Elements** - Tenants save payment methods for rent payments
- **Stripe Connect** - Landlord onboarding for automatic payout receiving
- **Platform Fee** - 2.5% platform fee on transfers
- **AI Document Builder** - AI assistant panel with BC RTA guidance
- **Lease Takeover Tab** - Consolidated into Browse page as 3rd tab

### Phase 3 - AI Document Intelligence (Implemented Feb 2026)
- **Tenant Document Review** - AI-powered lease analysis highlighting:
  - Payment terms, late fees, critical clauses
  - BC Residential Tenancy Act compliance checks
  - Risk scoring (low/medium/high)
  - Tenant action checklist
- **Lease Comparison** - Compare against BC standard terms & market averages
- **Deposit Analysis** - Verify deposit is within BC RTA limits

### Admin Panel
- Database stats endpoint
- Clear test data endpoint
- Contact message viewer
- Protected by admin_key parameter

## Architecture
- `/app/frontend/src/pages/` - React page components
- `/app/frontend/src/components/` - Shared UI components
- `/app/backend/server.py` - Main FastAPI application (~8600 lines)
- `/app/backend/routers/` - Modular routers (stripe_connect, ai_intelligence, admin, calendar, etc.)

## Key API Endpoints
- `POST /api/auth/login` - User login
- `GET /api/listings` - Browse properties
- `GET /api/lease-assignments` - Lease takeover listings
- `POST /api/rent/agreements` - Create rent agreement
- `GET /api/rent/agreements` - Get user's agreements
- `POST /api/rent/payments/{id}/pay` - Pay rent
- `POST /api/stripe-connect/create-account` - Landlord Stripe Connect setup
- `GET /api/stripe-connect/status` - Check Connect account status
- `POST /api/ai/tenant-document-review` - AI document analysis
- `GET /api/ai/lease-comparison` - BC RTA compliance comparison
- `POST /api/document-builder/ai-prompts` - AI lease writing prompts
- `POST /api/document-builder/ai-review` - AI document review

## Pending/Future Tasks
- **Mobile App (PWA/React Native)** - P2
- **Full Platform E2E Audit** - P2
- **Multi-language support** - P3
- **AI-powered property valuation** - P3
- **Virtual property tours integration** - P3
- **Further server.py modularization** - Ongoing refactoring

## Test Credentials
- Renter: test@dommma.com / test123
- Admin key: dommma-admin-2026
