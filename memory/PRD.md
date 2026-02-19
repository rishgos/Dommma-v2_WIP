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
- **Analytics**: Firebase Analytics
- **Push Notifications**: Firebase Cloud Messaging (FCM)

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
- Submit maintenance requests
- Track applications

### 2. Landlord
- List properties
- Screen tenants (review applications)
- Collect rent (Stripe)
- Track maintenance requests
- Post contractor jobs
- Document management
- Multi-property dashboard

### 3. Contractor
- Browse job marketplace
- Submit bids on jobs
- Manage won projects
- Build reputation
- Connect with landlords
- Track earnings

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

### Phase 3 - Advanced Features (Completed Feb 2026)
- [x] **Firebase Analytics**
  - Page view tracking
  - Login/signup events
  - Property views
  - Payment tracking
  - Feature engagement metrics
  - User properties (role-based)

- [x] **Push Notifications (FCM)**
  - Notification bell component
  - Enable notifications flow
  - Service worker for background notifications
  - Notification types: message, payment, document, property, application, job
  - Action buttons on notifications

- [x] **Rental Applications Workflow**
  - Application form (personal info, employment, references)
  - Pet details support
  - Move-in date selection
  - Number of occupants
  - Application tracking with status (Pending, Under Review, Approved, Rejected)
  - Landlord review interface
  - Status update notifications

- [x] **Maintenance Request System**
  - Category-based requests (Plumbing, Electrical, Appliance, HVAC, Structural, Pest, Other)
  - Priority levels (Low, Medium, High, Emergency)
  - Photo attachments support
  - Status tracking (Open, In Progress, Scheduled, Completed)
  - Landlord notification on new requests
  - Tenant notification on status updates

- [x] **Contractor Job Marketplace**
  - Job posting (landlords)
  - Budget range and deadline
  - Category-based filtering
  - Bidding system (contractors)
  - Bid selection and contractor assignment
  - Job status tracking (Open, Assigned, In Progress, Completed)
  - Notifications for bids and job awards

- [x] **Property Management (Landlord)**
  - Create/edit property listings
  - Manage listing status (active/inactive)
  - View landlord's properties
  - Application management per property

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
12. **Applications** - Rental application workflow
13. **Maintenance** - Maintenance request system
14. **Jobs** - Contractor job marketplace

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
- `POST /api/listings` - Create listing (basic)
- `POST /api/listings/create` - Create listing (landlord)
- `GET /api/listings/landlord/{landlord_id}` - Landlord's listings
- `PUT /api/listings/{listing_id}` - Update listing
- `DELETE /api/listings/{listing_id}` - Delete listing

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

### Notifications
- `POST /api/notifications/register-token` - Register FCM token
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/{user_id}` - Get user notifications
- `POST /api/notifications/mark-read/{notification_id}` - Mark as read

### Rental Applications
- `POST /api/applications` - Submit application
- `GET /api/applications/user/{user_id}` - Get user's applications
- `GET /api/applications/landlord/{landlord_id}` - Get landlord's received applications
- `PUT /api/applications/{application_id}/status` - Update application status

### Maintenance Requests
- `POST /api/maintenance` - Create maintenance request
- `GET /api/maintenance/user/{user_id}` - Get user's requests
- `GET /api/maintenance/landlord/{landlord_id}` - Get landlord's property requests
- `PUT /api/maintenance/{request_id}` - Update request status

### Contractor Jobs
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - Get available jobs (with filters)
- `GET /api/jobs/landlord/{landlord_id}` - Get landlord's posted jobs
- `GET /api/jobs/contractor/{contractor_id}` - Get contractor's assigned jobs
- `POST /api/jobs/{job_id}/bid` - Submit bid
- `POST /api/jobs/{job_id}/select-bid` - Select winning bid

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
  "landlord_id": "string",
  "status": "active|inactive|deleted"
}
```

### Rental Applications
```json
{
  "id": "uuid",
  "user_id": "string",
  "listing_id": "string",
  "landlord_id": "string",
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "current_address": "string",
  "move_in_date": "string",
  "employer": "string",
  "job_title": "string",
  "monthly_income": "float",
  "employment_length": "string",
  "references": [{"name": "string", "phone": "string", "relationship": "string"}],
  "num_occupants": "int",
  "has_pets": "boolean",
  "pet_details": "string",
  "additional_notes": "string",
  "status": "pending|under_review|approved|rejected",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Maintenance Requests
```json
{
  "id": "uuid",
  "user_id": "string",
  "landlord_id": "string",
  "property_id": "string",
  "title": "string",
  "description": "string",
  "category": "plumbing|electrical|appliance|hvac|structural|pest|other",
  "priority": "low|medium|high|emergency",
  "images": ["string"],
  "status": "open|in_progress|scheduled|completed|cancelled",
  "assigned_contractor_id": "string",
  "scheduled_date": "string",
  "completed_date": "string",
  "cost": "float",
  "notes": [{"author": "string", "content": "string", "date": "datetime"}],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Contractor Jobs
```json
{
  "id": "uuid",
  "landlord_id": "string",
  "contractor_id": "string",
  "maintenance_request_id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "location": "string",
  "budget_min": "float",
  "budget_max": "float",
  "deadline": "string",
  "status": "open|assigned|in_progress|completed|cancelled",
  "bids": [{
    "id": "uuid",
    "contractor_id": "string",
    "amount": "float",
    "estimated_days": "int",
    "message": "string",
    "created_at": "datetime"
  }],
  "selected_bid_id": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Backlog

### P0 - Critical (Completed ✅)
- [x] Stripe payments integration
- [x] Document management
- [x] Real-time messaging
- [x] Rental applications workflow
- [x] Maintenance request system
- [x] Contractor job marketplace

### P1 - Important
- [ ] Password hashing for production auth security
- [ ] Email notifications (SendGrid/Resend integration)
- [ ] Calendar integration for viewing appointments
- [ ] Credit/background check integration

### P2 - Nice to Have
- [ ] Visual property search (image upload)
- [ ] Lease document AI analysis
- [ ] Commute optimizer integration
- [ ] Roommate finder
- [ ] Strata management module
- [ ] Property analytics dashboard
- [ ] Voice search with Nova
- [ ] Mobile app (React Native)

## Third-Party Integrations
- **Google Maps Platform**: Interactive property map
- **Claude Sonnet 4.5**: Nova AI chatbot (via Emergent LLM Key)
- **Stripe**: Payment processing (test mode)
- **Firebase**: Analytics + Push Notifications

### Firebase Configuration
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBgVjeQ_3HoeMDWRW81W5WFpgX5oG69rUM",
  authDomain: "dommma-6ee32.firebaseapp.com",
  projectId: "dommma-6ee32",
  storageBucket: "dommma-6ee32.firebasestorage.app",
  messagingSenderId: "858858950233",
  appId: "1:858858950233:web:9fcf3cff311d136e836b48",
  measurementId: "G-DGJPK7M8R7"
};
// VAPID Key: BFjJyNb3HUnxXdBRy6aSPqNkTQqfXF0XnXvd24c7wrraqabiRV43wTxwlt4AcVsTqlg4WyOqWTHcQgESIdZ0tj8
```

## Testing Status
- Backend: 100% (23/23 tests passed)
- Frontend: 100% (all features working)
- Last tested: Feb 2026

## Notes
- Demo contacts in Messages are mocked for UI display
- Auth creates users on-the-fly for demo purposes
- Property listings are seeded with Vancouver data
- All role-based features working (Renter/Landlord/Contractor)
