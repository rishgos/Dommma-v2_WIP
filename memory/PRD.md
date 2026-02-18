# DOMMMA V2 - Complete Real Estate Marketplace Platform

## Project Overview
DOMMMA V2 is a complete real estate marketplace platform for renting, buying, leasing, property management, strata management, contractor services, and tenant-landlord communications.

## Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI/Python
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 (Nova AI chatbot)
- **Maps**: Google Maps API

## Design System
- **Primary Color**: #1A2F3A (Dark Teal)
- **Secondary**: #2C4A52
- **Background**: #F5F5F0 (Cream)
- **Typography**: Cormorant Garamond (headings), Inter (body)
- **Style**: Architectural, minimalist, premium

## User Personas & Roles
### 1. Renter
- Search properties
- Apply for rentals
- Pay rent online
- Message landlords
- Sign documents
- Track applications

### 2. Landlord
- List properties
- Screen tenants
- Collect rent
- Track maintenance
- Document management
- Multi-property dashboard

### 3. Contractor
- Get job leads
- Manage projects
- Build reputation
- Connect with landlords
- Invoice clients

## Core Features Implemented (Jan 2026)
- [x] New architectural design with dark teal theme
- [x] Role-based authentication (Renter/Landlord/Contractor)
- [x] Role-specific dashboards with unique menus
- [x] Property browse with Google Maps
- [x] Advanced filters (beds, baths, price, pet-friendly)
- [x] Nova AI chatbot (Claude Sonnet 4.5)
- [x] 20 Vancouver property listings seeded
- [x] Property detail modals
- [x] Landing pages: Home, About, Properties, Services, Contact
- [x] Responsive navigation and footer
- [x] User authentication API

## Pages
1. Home - Hero with architectural background, featured properties, stats, team
2. About - Company story, values, team
3. Properties - Featured listings gallery
4. Services - 6 service cards (Listings, Lease, Payments, Strata, Contractors, Messaging)
5. Contact - Form with email, phone, office info
6. Browse - Property search with Google Maps
7. Login - Role selection with features preview
8. Dashboard - Role-specific dashboard

## API Endpoints
- GET /api/listings - Property listings with filters
- GET /api/listings/map - Map boundary search
- POST /api/chat - Nova AI conversations
- POST /api/auth/login - User authentication
- POST /api/auth/register - User registration
- POST /api/seed - Seed sample data

## Backlog

### P0 - Critical
- [ ] Password hashing for auth
- [ ] Property creation flow for landlords
- [ ] Rent payment integration (Stripe)
- [ ] Document upload/signing

### P1 - Important
- [ ] Tenant application workflow
- [ ] Maintenance request system
- [ ] Contractor job marketplace
- [ ] Real-time messaging (WebSockets)

### P2 - Nice to Have
- [ ] Strata management module
- [ ] Property analytics dashboard
- [ ] Voice search with Nova
- [ ] Mobile app (React Native)

## Next Tasks
1. Implement Stripe for rent payments
2. Build document management system
3. Add WebSocket messaging
4. Create property listing flow for landlords
