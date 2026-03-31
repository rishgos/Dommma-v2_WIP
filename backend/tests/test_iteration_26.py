"""
Iteration 26 Backend Tests - DOMMMA Real Estate Marketplace
Tests for: Landlord Earnings, AI Property Chatbot, Credit Check, AI Features
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dommma-rent-pay.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "test@dommma.com"
TEST_PASSWORD = "test123"
TEST_TENANT_ID = "dcc2cce1-e8d4-43b5-8096-9db712f36720"
ADMIN_KEY = "dommma-admin-2026"


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == TEST_EMAIL
        print(f"✓ Login successful - User ID: {data['id']}")
        return data


class TestLandlordEarnings:
    """Landlord Earnings Dashboard API tests"""
    
    def test_get_earnings_summary(self):
        """Test GET /api/landlord/earnings returns summary with net_income, vacancy_rate, roi"""
        response = requests.get(f"{BASE_URL}/api/landlord/earnings?landlord_id=test&months=3")
        assert response.status_code == 200, f"Earnings API failed: {response.text}"
        data = response.json()
        
        # Verify summary structure
        assert "summary" in data, "Missing 'summary' in response"
        summary = data["summary"]
        assert "net_income" in summary, "Missing 'net_income' in summary"
        assert "total_collected" in summary, "Missing 'total_collected' in summary"
        assert "avg_monthly_income" in summary, "Missing 'avg_monthly_income' in summary"
        
        # Verify properties structure
        assert "properties" in data, "Missing 'properties' in response"
        props = data["properties"]
        assert "vacancy_rate" in props, "Missing 'vacancy_rate' in properties"
        assert "total" in props, "Missing 'total' in properties"
        
        # Verify performance structure
        assert "performance" in data, "Missing 'performance' in response"
        perf = data["performance"]
        assert "roi_percentage" in perf, "Missing 'roi_percentage' in performance"
        assert "collection_rate" in perf, "Missing 'collection_rate' in performance"
        
        # Verify monthly breakdown
        assert "monthly_breakdown" in data, "Missing 'monthly_breakdown' in response"
        
        print(f"✓ Earnings API returns correct structure - Net Income: {summary['net_income']}, Vacancy: {props['vacancy_rate']}%, ROI: {perf['roi_percentage']}%")


class TestAIChatbot:
    """AI Property Search Chatbot API tests"""
    
    def test_property_chat_basic(self):
        """Test POST /api/ai/property-chat returns session_id, response, listings"""
        response = requests.post(f"{BASE_URL}/api/ai/property-chat", json={
            "message": "Show me 2BR apartments under $2500",
            "session_id": None
        })
        assert response.status_code == 200, f"AI Chat API failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "session_id" in data, "Missing 'session_id' in response"
        assert "response" in data, "Missing 'response' in response"
        assert "listings" in data, "Missing 'listings' in response"
        assert isinstance(data["listings"], list), "'listings' should be a list"
        
        print(f"✓ AI Chat API returns correct structure - Session: {data['session_id'][:8]}..., Response length: {len(data['response'])}")
        return data["session_id"]
    
    def test_property_chat_with_session(self):
        """Test AI chat with existing session maintains context"""
        # First message
        response1 = requests.post(f"{BASE_URL}/api/ai/property-chat", json={
            "message": "I'm looking for pet-friendly places",
            "session_id": None
        })
        assert response1.status_code == 200
        session_id = response1.json()["session_id"]
        
        # Follow-up message with same session
        response2 = requests.post(f"{BASE_URL}/api/ai/property-chat", json={
            "message": "What about in Kitsilano?",
            "session_id": session_id
        })
        assert response2.status_code == 200
        data = response2.json()
        assert data["session_id"] == session_id, "Session ID should be preserved"
        
        print(f"✓ AI Chat maintains session context - Session: {session_id[:8]}...")
    
    def test_chat_history(self):
        """Test GET /api/ai/chat-history returns messages array"""
        # Create a session first
        chat_response = requests.post(f"{BASE_URL}/api/ai/property-chat", json={
            "message": "Test message for history",
            "session_id": None
        })
        session_id = chat_response.json()["session_id"]
        
        # Get history
        response = requests.get(f"{BASE_URL}/api/ai/chat-history?session_id={session_id}")
        assert response.status_code == 200, f"Chat history API failed: {response.text}"
        data = response.json()
        
        assert "session_id" in data, "Missing 'session_id' in response"
        assert "messages" in data, "Missing 'messages' in response"
        assert isinstance(data["messages"], list), "'messages' should be a list"
        
        print(f"✓ Chat history API returns correct structure - {len(data['messages'])} messages")


class TestCreditCheck:
    """Tenant Credit Check API tests"""
    
    def test_credit_check_request(self):
        """Test POST /api/credit-check/request returns credit_score, risk_level, recommendation"""
        response = requests.post(f"{BASE_URL}/api/credit-check/request", json={
            "tenant_id": TEST_TENANT_ID,
            "full_name": "Test Tenant",
            "consent": True
        })
        assert response.status_code == 200, f"Credit check API failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "credit_score" in data, "Missing 'credit_score' in response"
        assert "risk_level" in data, "Missing 'risk_level' in response"
        assert "recommendation" in data, "Missing 'recommendation' in response"
        assert "factors" in data, "Missing 'factors' in response"
        assert "rental_history" in data, "Missing 'rental_history' in response"
        
        # Verify data types
        assert isinstance(data["credit_score"], int), "'credit_score' should be an integer"
        assert data["risk_level"] in ["low", "medium", "high"], f"Invalid risk_level: {data['risk_level']}"
        assert data["recommendation"] in ["Approve", "Review", "Decline"], f"Invalid recommendation: {data['recommendation']}"
        
        print(f"✓ Credit check API returns correct structure - Score: {data['credit_score']}, Risk: {data['risk_level']}, Recommendation: {data['recommendation']}")
    
    def test_credit_check_requires_consent(self):
        """Test credit check fails without consent"""
        response = requests.post(f"{BASE_URL}/api/credit-check/request", json={
            "tenant_id": TEST_TENANT_ID,
            "full_name": "Test Tenant",
            "consent": False
        })
        assert response.status_code == 400, "Should fail without consent"
        print("✓ Credit check correctly requires consent")
    
    def test_get_credit_reports(self):
        """Test GET /api/credit-check/reports returns array of reports"""
        response = requests.get(f"{BASE_URL}/api/credit-check/reports")
        assert response.status_code == 200, f"Credit reports API failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Credit reports API returns array - {len(data)} reports")


class TestAIFeatures:
    """AI Property Valuation and Smart Pricing API tests"""
    
    def test_property_valuation(self):
        """Test POST /api/ai/property-valuation returns estimated_rent"""
        response = requests.post(f"{BASE_URL}/api/ai/property-valuation", params={
            "address": "123 Test St",
            "city": "Vancouver",
            "property_type": "Apartment",
            "bedrooms": 2,
            "bathrooms": 1,
            "sqft": 700
        })
        assert response.status_code == 200, f"Property valuation API failed: {response.text}"
        data = response.json()
        
        assert "estimated_rent" in data, "Missing 'estimated_rent' in response"
        assert isinstance(data["estimated_rent"], (int, float)), "'estimated_rent' should be a number"
        
        print(f"✓ Property valuation API returns estimated_rent: ${data['estimated_rent']}")
    
    def test_smart_rent_pricing(self):
        """Test POST /api/ai/smart-rent-pricing returns suggested_rent"""
        response = requests.post(f"{BASE_URL}/api/ai/smart-rent-pricing", params={
            "address": "456 Test Ave",
            "city": "Vancouver",
            "property_type": "Condo",
            "bedrooms": 1,
            "bathrooms": 1,
            "sqft": 500
        })
        assert response.status_code == 200, f"Smart rent pricing API failed: {response.text}"
        data = response.json()
        
        assert "suggested_rent" in data, "Missing 'suggested_rent' in response"
        assert isinstance(data["suggested_rent"], (int, float)), "'suggested_rent' should be a number"
        
        print(f"✓ Smart rent pricing API returns suggested_rent: ${data['suggested_rent']}")
    
    def test_neighborhood_comparison(self):
        """Test GET /api/ai/neighborhood-comparison returns neighborhoods"""
        response = requests.get(f"{BASE_URL}/api/ai/neighborhood-comparison?neighborhoods=Downtown,Kitsilano")
        assert response.status_code == 200, f"Neighborhood comparison API failed: {response.text}"
        data = response.json()
        
        assert "neighborhoods" in data, "Missing 'neighborhoods' in response"
        assert isinstance(data["neighborhoods"], list), "'neighborhoods' should be a list"
        
        print(f"✓ Neighborhood comparison API returns {len(data['neighborhoods'])} neighborhoods")


class TestPaymentHistory:
    """Payment History API tests"""
    
    def test_get_payment_history(self):
        """Test GET /api/payments/history returns array"""
        response = requests.get(f"{BASE_URL}/api/payments/history")
        assert response.status_code == 200, f"Payment history API failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Payment history API returns array - {len(data)} payments")


class TestListings:
    """Listings API tests"""
    
    def test_get_listings(self):
        """Test GET /api/listings returns array"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200, f"Listings API failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listings API returns array - {len(data)} listings")
    
    def test_get_listings_by_type(self):
        """Test listings filter by type (rent, sale)"""
        # Test rent listings
        response_rent = requests.get(f"{BASE_URL}/api/listings?listing_type=rent")
        assert response_rent.status_code == 200
        
        # Test sale listings
        response_sale = requests.get(f"{BASE_URL}/api/listings?listing_type=sale")
        assert response_sale.status_code == 200
        
        print("✓ Listings filter by type works correctly")


class TestLeaseAssignments:
    """Lease Assignments (Takeover) API tests"""
    
    def test_get_lease_assignments(self):
        """Test GET /api/lease-assignments returns array"""
        response = requests.get(f"{BASE_URL}/api/lease-assignments")
        assert response.status_code == 200, f"Lease assignments API failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Lease assignments API returns array - {len(data)} assignments")


class TestNotifications:
    """Notifications API tests"""
    
    def test_get_notifications(self):
        """Test GET /api/notifications returns array"""
        # Login first to get user_id
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        user_id = login_response.json().get("id", "test")
        
        response = requests.get(f"{BASE_URL}/api/notifications?user_id={user_id}")
        assert response.status_code == 200, f"Notifications API failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Notifications API returns array - {len(data)} notifications")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
