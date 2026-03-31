# Test Credentials for DOMMMA Platform

## User Accounts
- **Test User (Renter)**: test@dommma.com / test123
- **Test Landlord**: testlandlord@dommma.com / test123

## Admin Access
- Admin key: `dommma-admin-2026` (passed as `admin_key` query parameter)
- Note: Server uses ADMIN_SECRET_KEY env var with fallback to 'dommma-admin-2026'

## API Keys
- Stripe API Key: configured in backend .env
- Anthropic API Key: configured in backend .env

## Test Endpoints
- Login: POST /api/auth/login
- Browse listings: GET /api/listings
- User search: GET /api/users/search?q=test
- Admin stats: GET /api/admin/database-stats?admin_key=pray1234
- AI Document Review: POST /api/ai/tenant-document-review
- Stripe Connect Status: GET /api/stripe-connect/status?landlord_id={id}
- Rent Agreements: GET /api/rent/agreements?user_id={id}&role=tenant
