"""
Backend tests for Analytics Dashboard, DocuSign OAuth, and Lease Assignment Payment APIs
Features:
- Analytics Dashboard: /api/analytics/overview, /api/analytics/activity, /api/analytics/revenue, /api/analytics/listings-performance
- DocuSign OAuth: /api/docusign/status, /api/docusign/auth-url
- Lease Assignments: GET /api/lease-assignments, POST /api/lease-assignments, POST /api/lease-assignments/{id}/payment
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def unique_id():
    """Generate unique test identifiers"""
    return f"TEST_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%H%M%S')}"


class TestAnalyticsOverviewEndpoint:
    """Test GET /api/analytics/overview"""
    
    def test_analytics_overview_returns_200(self, api_client):
        """Test that analytics overview endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/analytics/overview")
        assert response.status_code == 200
    
    def test_analytics_overview_has_users_section(self, api_client):
        """Test that overview includes user statistics"""
        response = api_client.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        assert "users" in data
        assert "total" in data["users"]
        assert "by_type" in data["users"]
        assert "new_last_7_days" in data["users"]
        assert isinstance(data["users"]["total"], int)
    
    def test_analytics_overview_has_listings_section(self, api_client):
        """Test that overview includes listing statistics"""
        response = api_client.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        assert "listings" in data
        assert "total_active" in data["listings"]
        assert "by_type" in data["listings"]
        assert "by_city" in data["listings"]
        assert "new_last_7_days" in data["listings"]
    
    def test_analytics_overview_has_transactions_section(self, api_client):
        """Test that overview includes transaction statistics"""
        response = api_client.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        assert "transactions" in data
        assert "total" in data["transactions"]
        assert "successful" in data["transactions"]
        assert "total_revenue" in data["transactions"]
        assert "success_rate" in data["transactions"]
    
    def test_analytics_overview_has_contractors_section(self, api_client):
        """Test that overview includes contractor statistics"""
        response = api_client.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        assert "contractors" in data
        assert "total" in data["contractors"]
        assert "verified" in data["contractors"]
        assert "verification_rate" in data["contractors"]
    
    def test_analytics_overview_has_documents_section(self, api_client):
        """Test that overview includes document statistics"""
        response = api_client.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        assert "documents" in data
        assert "total" in data["documents"]
        assert "signed" in data["documents"]
        assert "completion_rate" in data["documents"]
    
    def test_analytics_overview_has_timestamp(self, api_client):
        """Test that overview includes generated_at timestamp"""
        response = api_client.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        assert "generated_at" in data
        assert len(data["generated_at"]) > 0


class TestAnalyticsActivityEndpoint:
    """Test GET /api/analytics/activity"""
    
    def test_analytics_activity_returns_200(self, api_client):
        """Test that activity endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/analytics/activity?limit=10")
        assert response.status_code == 200
    
    def test_analytics_activity_returns_list(self, api_client):
        """Test that activity endpoint returns a list"""
        response = api_client.get(f"{BASE_URL}/api/analytics/activity?limit=10")
        data = response.json()
        
        assert isinstance(data, list)
    
    def test_analytics_activity_items_have_required_fields(self, api_client):
        """Test that activity items have type, title, description, timestamp"""
        response = api_client.get(f"{BASE_URL}/api/analytics/activity?limit=5")
        data = response.json()
        
        if len(data) > 0:
            item = data[0]
            assert "type" in item
            assert "title" in item
            assert "description" in item
            assert "timestamp" in item
            assert "icon" in item
    
    def test_analytics_activity_respects_limit(self, api_client):
        """Test that activity endpoint respects limit parameter"""
        response = api_client.get(f"{BASE_URL}/api/analytics/activity?limit=3")
        data = response.json()
        
        assert len(data) <= 3


class TestAnalyticsRevenueEndpoint:
    """Test GET /api/analytics/revenue"""
    
    def test_analytics_revenue_returns_200(self, api_client):
        """Test that revenue endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/analytics/revenue?period=30d")
        assert response.status_code == 200
    
    def test_analytics_revenue_has_required_fields(self, api_client):
        """Test that revenue response has required fields"""
        response = api_client.get(f"{BASE_URL}/api/analytics/revenue?period=30d")
        data = response.json()
        
        assert "period" in data
        assert "total_revenue" in data
        assert "total_transactions" in data
        assert "average_transaction" in data
        assert "daily_breakdown" in data
    
    def test_analytics_revenue_accepts_7d_period(self, api_client):
        """Test that revenue endpoint accepts 7d period"""
        response = api_client.get(f"{BASE_URL}/api/analytics/revenue?period=7d")
        data = response.json()
        
        assert response.status_code == 200
        assert data["period"] == "7d"
    
    def test_analytics_revenue_accepts_90d_period(self, api_client):
        """Test that revenue endpoint accepts 90d period"""
        response = api_client.get(f"{BASE_URL}/api/analytics/revenue?period=90d")
        data = response.json()
        
        assert response.status_code == 200
        assert data["period"] == "90d"


class TestAnalyticsListingsPerformanceEndpoint:
    """Test GET /api/analytics/listings-performance"""
    
    def test_listings_performance_returns_200(self, api_client):
        """Test that listings-performance endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/analytics/listings-performance")
        assert response.status_code == 200
    
    def test_listings_performance_has_price_distribution(self, api_client):
        """Test that listings-performance includes price distribution"""
        response = api_client.get(f"{BASE_URL}/api/analytics/listings-performance")
        data = response.json()
        
        assert "price_distribution" in data
        assert isinstance(data["price_distribution"], list)
        if len(data["price_distribution"]) > 0:
            assert "range" in data["price_distribution"][0]
            assert "count" in data["price_distribution"][0]
    
    def test_listings_performance_has_property_types(self, api_client):
        """Test that listings-performance includes property types"""
        response = api_client.get(f"{BASE_URL}/api/analytics/listings-performance")
        data = response.json()
        
        assert "property_types" in data
        assert isinstance(data["property_types"], list)
    
    def test_listings_performance_has_avg_prices_by_city(self, api_client):
        """Test that listings-performance includes average prices by city"""
        response = api_client.get(f"{BASE_URL}/api/analytics/listings-performance")
        data = response.json()
        
        assert "avg_prices_by_city" in data
        assert isinstance(data["avg_prices_by_city"], list)


class TestDocuSignStatusEndpoint:
    """Test GET /api/docusign/status"""
    
    def test_docusign_status_returns_200(self, api_client):
        """Test that DocuSign status endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/docusign/status?user_id=test123")
        assert response.status_code == 200
    
    def test_docusign_status_has_connected_field(self, api_client):
        """Test that status response has connected field"""
        response = api_client.get(f"{BASE_URL}/api/docusign/status?user_id=test123")
        data = response.json()
        
        assert "connected" in data
        assert isinstance(data["connected"], bool)
    
    def test_docusign_status_has_integration_key_configured(self, api_client):
        """Test that status response indicates if integration key is configured"""
        response = api_client.get(f"{BASE_URL}/api/docusign/status?user_id=test123")
        data = response.json()
        
        # For unconnected user, should have integration_key_configured
        if not data.get("connected", False):
            assert "integration_key_configured" in data
    
    def test_docusign_status_requires_user_id(self, api_client):
        """Test that status endpoint requires user_id parameter"""
        response = api_client.get(f"{BASE_URL}/api/docusign/status")
        assert response.status_code in [400, 422]


class TestDocuSignAuthUrlEndpoint:
    """Test GET /api/docusign/auth-url"""
    
    def test_docusign_auth_url_returns_200(self, api_client):
        """Test that DocuSign auth-url endpoint is accessible"""
        response = api_client.get(
            f"{BASE_URL}/api/docusign/auth-url?user_id=test123",
            headers={"Origin": "https://rent-connect-25.preview.emergentagent.com"}
        )
        assert response.status_code == 200
    
    def test_docusign_auth_url_returns_auth_url(self, api_client):
        """Test that auth-url response contains auth_url"""
        response = api_client.get(
            f"{BASE_URL}/api/docusign/auth-url?user_id=test123",
            headers={"Origin": "https://rent-connect-25.preview.emergentagent.com"}
        )
        data = response.json()
        
        assert "auth_url" in data
        assert "account-d.docusign.com" in data["auth_url"]
    
    def test_docusign_auth_url_returns_state(self, api_client):
        """Test that auth-url response contains state for CSRF protection"""
        response = api_client.get(
            f"{BASE_URL}/api/docusign/auth-url?user_id=test123",
            headers={"Origin": "https://rent-connect-25.preview.emergentagent.com"}
        )
        data = response.json()
        
        assert "state" in data
        assert len(data["state"]) > 0


class TestLeaseAssignmentsEndpoints:
    """Test Lease Assignment endpoints"""
    
    def test_get_lease_assignments_returns_200(self, api_client):
        """Test that GET lease-assignments is accessible"""
        response = api_client.get(f"{BASE_URL}/api/lease-assignments")
        assert response.status_code == 200
    
    def test_get_lease_assignments_returns_list(self, api_client):
        """Test that GET lease-assignments returns a list"""
        response = api_client.get(f"{BASE_URL}/api/lease-assignments")
        data = response.json()
        
        assert isinstance(data, list)
    
    def test_create_lease_assignment(self, api_client, unique_id):
        """Test creating a new lease assignment"""
        assignment_data = {
            "title": f"Test Assignment {unique_id}",
            "address": "999 Test Ave",
            "city": "Vancouver",
            "current_rent": 2500,
            "assignment_fee": 750,
            "remaining_months": 10,
            "available_date": "2026-04-01",
            "bedrooms": 2,
            "bathrooms": 1.5,
            "sqft": 800,
            "amenities": ["Gym", "Pool"],
            "pet_friendly": True,
            "description": "Test assignment listing",
            "reason": "Testing",
            "owner_id": "test_owner_123",
            "owner_name": "Test Owner",
            "images": []
        }
        
        response = api_client.post(f"{BASE_URL}/api/lease-assignments", json=assignment_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["title"] == f"Test Assignment {unique_id}"
        assert data["current_rent"] == 2500
        assert data["status"] == "active"
        
        # Verify savings calculation
        assert "savings_per_month" in data
        assert "market_rent" in data
        
        return data["id"]
    
    def test_lease_assignment_has_calculated_savings(self, api_client, unique_id):
        """Test that created lease assignment has calculated savings"""
        assignment_data = {
            "title": f"Savings Test {unique_id}",
            "address": "888 Savings St",
            "city": "Vancouver",
            "current_rent": 2000,
            "market_rent": 2300,
            "assignment_fee": 500,
            "remaining_months": 6,
            "bedrooms": 1,
            "bathrooms": 1
        }
        
        response = api_client.post(f"{BASE_URL}/api/lease-assignments", json=assignment_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["savings_per_month"] == 300  # 2300 - 2000
    
    def test_get_single_lease_assignment(self, api_client, unique_id):
        """Test getting a specific lease assignment by ID"""
        # First create one
        assignment_data = {
            "title": f"Get Test {unique_id}",
            "address": "777 Get Ave",
            "city": "Burnaby",
            "current_rent": 1800,
            "assignment_fee": 400,
            "remaining_months": 4,
            "bedrooms": 1,
            "bathrooms": 1
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/lease-assignments", json=assignment_data)
        assert create_response.status_code == 200
        created_id = create_response.json()["id"]
        
        # Then get it
        get_response = api_client.get(f"{BASE_URL}/api/lease-assignments/{created_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["id"] == created_id
        assert data["title"] == f"Get Test {unique_id}"
    
    def test_lease_assignment_not_found(self, api_client):
        """Test that getting non-existent assignment returns 404"""
        response = api_client.get(f"{BASE_URL}/api/lease-assignments/nonexistent-id-12345")
        assert response.status_code == 404


class TestLeaseAssignmentPaymentEndpoint:
    """Test POST /api/lease-assignments/{id}/payment"""
    
    def test_payment_endpoint_creates_checkout(self, api_client, unique_id):
        """Test that payment endpoint creates Stripe checkout session"""
        # First create an assignment
        assignment_data = {
            "title": f"Payment Test {unique_id}",
            "address": "666 Payment St",
            "city": "Vancouver",
            "current_rent": 2200,
            "assignment_fee": 600,
            "remaining_months": 8,
            "bedrooms": 2,
            "bathrooms": 1
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/lease-assignments", json=assignment_data)
        assert create_response.status_code == 200
        assignment_id = create_response.json()["id"]
        
        # Now try to create payment
        payment_response = api_client.post(
            f"{BASE_URL}/api/lease-assignments/{assignment_id}/payment?buyer_id=test_buyer_123"
        )
        assert payment_response.status_code == 200
        
        data = payment_response.json()
        assert "url" in data
        assert "session_id" in data
        assert "stripe.com" in data["url"]
    
    def test_payment_returns_session_id(self, api_client, unique_id):
        """Test that payment endpoint returns a valid session_id"""
        assignment_data = {
            "title": f"Session Test {unique_id}",
            "address": "555 Session Ave",
            "city": "Vancouver",
            "current_rent": 1900,
            "assignment_fee": 450,
            "remaining_months": 5,
            "bedrooms": 1,
            "bathrooms": 1
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/lease-assignments", json=assignment_data)
        assignment_id = create_response.json()["id"]
        
        payment_response = api_client.post(
            f"{BASE_URL}/api/lease-assignments/{assignment_id}/payment?buyer_id=test_buyer_456"
        )
        
        data = payment_response.json()
        assert data["session_id"].startswith("cs_test_")
    
    def test_payment_fails_for_nonexistent_assignment(self, api_client):
        """Test that payment fails for non-existent assignment"""
        response = api_client.post(
            f"{BASE_URL}/api/lease-assignments/fake-id-99999/payment?buyer_id=test_buyer"
        )
        assert response.status_code == 404
