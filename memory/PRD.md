# DOMMMA V2 - Complete Real Estate Marketplace Platform

## Project Overview
DOMMMA V2 is a complete real estate marketplace platform for renting, buying, leasing, property management, strata management, contractor services, and tenant-landlord communications.

## Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI/Python
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 (Nova AI chatbot)
- **Maps**: Google Maps API
- **Payments**: Stripe

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
- Pay rent online (Stripe)
- Message landlords
- Sign documents
- Track applications

### 2. Landlord
- List properties
- Screen tenants
- Collect rent (Stripe)
- Track maintenance
- Document management
- Multi-property dashboard

### 3. Contractor
- Get job leads
- Manage projects
- Build reputation
- Connect with landlords
- Invoice clients

## Core Features Implemented

### Phase 1 - Foundation (Completed Jan 2026)
- [x] New architectural design with dark teal theme
- [x] Role-based authentication (Renter/Landlord/Contractor)
- [x] Role-specific dashboards with unique menus
- [x] Property browse with Google Maps integration
- [x] Advanced filters (beds, baths, price, pet-friendly)
- [x] 20 Vancouver property listings seeded
- [x] Property detail modals
- [x] Landing pages: Home, About, Properties, Services, Contact
- [x] Responsive navigation and footer

### Phase 2 - Core Marketplace Features (Completed Feb 2026)
- [x] **Stripe Payments Integration**
  - Payment checkout with Stripe
  - Quick payment options (Monthly Rent, Security Deposit, Utilities)
  - Payment history tracking
  - Payment status verification
  - Webhook handling

- [x] **Document Management System**
  - Document upload (PDF, DOC, DOCX, JPG, PNG)
  - Document categorization (Lease, Application, Receipt, ID, Other)
  - Digital document signing
  - Document search and filtering
  - Document download

- [x] **Real-Time Messaging**
  - WebSocket-based chat system
  - Conversation list with unread indicators
  - Demo contacts for onboarding
  - Message history
  - Read receipts

- [x] **Enhanced Nova AI Chatbot**
  - Budget calculator ("Can I afford $X on $Y salary?")
  - Lifestyle-based search ("I work from home and need natural light")
  - Rental application help (cover letters, rental resumes)
  - Neighborhood intelligence (safety, amenities, vibes)
  - Proactive suggestions
  - User preferences panel
  - Quick action buttons by category
  - Property listing recommendations

## Pages
1. **Home** - Hero with architectural background, featured properties, stats, team
2. **About** - Company story, values, team
3. **Properties** - Featured listings gallery
4. **Services** - 6 service cards
5. **Contact** - Form with email, phone, office info
6. **Browse** - Property search with Google Maps (split view)
7. **Login** - Role selection with features preview
8. **Dashboard** - Role-specific dashboard with stats
9. **Payments** - Stripe payments with quick actions, history
10. **Documents** - Document management with upload, sign, search
11. **Messages** - Real-time chat interface

## API Endpoints

### Core
- `GET /api/` - Health check
- `POST /api/seed` - Seed sample data

### Authentication
- `POST /api/auth/register` - User registration with role
- `POST /api/auth/login` - User login

### Listings
- `GET /api/listings` - Property listings with filters
- `GET /api/listings/map` - Map boundary search
- `GET /api/listings/{id}` - Single listing
- `POST /api/listings` - Create listing

### Payments (Stripe)
- `POST /api/payments/create-checkout` - Create Stripe checkout session
- `GET /api/payments/status/{session_id}` - Check payment status
- `GET /api/payments/history` - Get payment history
- `POST /api/webhook/stripe` - Stripe webhook handler

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/{user_id}` - Get user documents
- `GET /api/documents/download/{doc_id}` - Download document
- `POST /api/documents/sign/{doc_id}` - Sign document
- `DELETE /api/documents/{doc_id}` - Delete document

### Messaging
- `POST /api/messages/send` - Send message
- `GET /api/messages/{user_id}` - Get messages
- `GET /api/messages/conversations/{user_id}` - Get conversations
- `POST /api/messages/read/{message_id}` - Mark as read
- `WS /ws/{user_id}` - WebSocket for real-time chat

### Nova AI
- `POST /api/chat` - Chat with Nova AI (supports user_context)
- `GET /api/chat/{session_id}/history` - Get chat history
- `POST /api/user/preferences/{user_id}` - Save user preferences
- `GET /api/user/preferences/{user_id}` - Get user preferences

## Database Schema

### Users
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "user_type": "renter|landlord|contractor",
  "preferences": {},
  "created_at": "datetime"
}
```

### Listings
```json
{
  "id": "uuid",
  "title": "string",
  "address": "string",
  "city": "string",
  "province": "string",
  "postal_code": "string",
  "lat": "float",
  "lng": "float",
  "price": "int",
  "bedrooms": "int",
  "bathrooms": "float",
  "sqft": "int",
  "property_type": "string",
  "description": "string",
  "amenities": ["string"],
  "images": ["string"],
  "available_date": "string",
  "pet_friendly": "boolean",
  "parking": "boolean",
  "status": "active|inactive"
}
```

### Payment Transactions
```json
{
  "id": "uuid",
  "session_id": "stripe_session_id",
  "user_id": "string",
  "amount": "float",
  "currency": "cad",
  "description": "string",
  "payment_status": "pending|paid|failed",
  "created_at": "datetime"
}
```

### Documents
```json
{
  "id": "uuid",
  "user_id": "string",
  "name": "string",
  "type": "lease|application|receipt|id|other",
  "content": "base64_string",
  "signed": "boolean",
  "signed_at": "datetime",
  "created_at": "datetime"
}
```

### Messages
```json
{
  "id": "uuid",
  "sender_id": "string",
  "recipient_id": "string",
  "content": "string",
  "read": "boolean",
  "created_at": "datetime"
}
```

## Backlog

### P0 - Critical
- [x] Stripe payments integration ✅
- [x] Document management ✅
- [x] Real-time messaging ✅
- [ ] Password hashing for auth (currently plaintext for demo)
- [ ] Property creation flow for landlords

### P1 - Important
- [ ] Tenant application workflow
- [ ] Maintenance request system
- [ ] Contractor job marketplace
- [ ] Email notifications (SendGrid/Resend)

### P2 - Nice to Have
- [ ] Visual property search (image upload)
- [ ] Lease document AI analysis
- [ ] Commute optimizer integration
- [ ] Roommate finder
- [ ] Strata management module
- [ ] Property analytics dashboard
- [ ] Voice search with Nova
- [ ] Mobile app (React Native)

## Nova AI Chatbot Features

### Implemented
- Natural language property search
- Budget calculator (30% income rule)
- Lifestyle-based recommendations
- Rental application tips
- Neighborhood insights
- Proactive suggestions
- User preferences memory
- Quick action shortcuts
- Property listing cards in responses

### Future Enhancements
- Visual search (image upload)
- Lease document analysis
- Commute time optimization
- Roommate matching
- Virtual tour descriptions
- Rent negotiation drafts
- Moving cost estimates
- Credit score impact analysis

## Testing Status
- Backend: 100% (24/24 tests passed)
- Frontend: 100% (all features working)
- Last tested: Feb 2026

## Third-Party Integrations
- **Google Maps Platform**: Interactive property map
- **Claude Sonnet 4.5**: Nova AI chatbot (via Emergent LLM Key)
- **Stripe**: Payment processing (test mode)

## Notes
- Demo contacts in Messages are mocked for UI display
- Auth creates users on-the-fly for demo purposes
- Property listings are seeded with Vancouver data
