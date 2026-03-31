"""
Test suite for DOMMMA Rent Agreements, AI Intelligence, and Stripe Connect features
Tests: User search, Rent agreements, AI document review, Lease comparison, Stripe Connect status, Admin stats
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserSearch:
    """User search endpoint tests"""
    
    def test_user_search_returns_results(self):
        """GET /api/users/search?q=test returns user results"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=test")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"User search returned {len(data)} results")
    
    def test_user_search_with_type_filter(self):
        """GET /api/users/search?q=test&type=renter filters by user type"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=test&type=renter")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"User search with type=renter returned {len(data)} results")


class TestRentAgreements:
    """Rent agreements API tests"""
    
    def test_get_rent_agreements_as_tenant(self):
        """GET /api/rent/agreements?user_id=test&role=tenant returns empty array or agreements"""
        response = requests.get(f"{BASE_URL}/api/rent/agreements?user_id=test&role=tenant")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Rent agreements (tenant) returned {len(data)} agreements")
    
    def test_get_rent_agreements_as_landlord(self):
        """GET /api/rent/agreements?user_id=test&role=landlord returns empty array or agreements"""
        response = requests.get(f"{BASE_URL}/api/rent/agreements?user_id=test&role=landlord")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Rent agreements (landlord) returned {len(data)} agreements")


class TestAIDocumentReview:
    """AI Document Intelligence tests"""
    
    def test_tenant_document_review_with_content(self):
        """POST /api/ai/tenant-document-review with content param returns AI review"""
        test_content = "Monthly rent: $2000. Security deposit: $1000. Late fee: $50 after 5 days. Lease term: 12 months starting Jan 1, 2026."
        response = requests.post(
            f"{BASE_URL}/api/ai/tenant-document-review",
            params={"content": test_content, "tenant_id": "test"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should have summary and risk_score at minimum
        assert "summary" in data or "risk_score" in data
        print(f"AI document review returned: summary={data.get('summary', 'N/A')[:100]}...")
    
    def test_lease_comparison(self):
        """GET /api/ai/lease-comparison?tenant_id=test&document_id=test returns comparison data"""
        response = requests.get(
            f"{BASE_URL}/api/ai/lease-comparison",
            params={"tenant_id": "test", "document_id": "test"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should have document_id and analysis sections
        assert "document_id" in data
        print(f"Lease comparison returned: {list(data.keys())}")


class TestStripeConnect:
    """Stripe Connect status tests"""
    
    def test_stripe_connect_status_nonexistent_user(self):
        """GET /api/stripe-connect/status?landlord_id=nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/stripe-connect/status?landlord_id=nonexistent_user_12345")
        # Should return 404 for non-existent user
        assert response.status_code == 404
        print("Stripe Connect status correctly returns 404 for non-existent user")
    
    def test_stripe_connect_status_test_user(self):
        """GET /api/stripe-connect/status?landlord_id=test returns connect status"""
        # First get a real user ID
        user_response = requests.get(f"{BASE_URL}/api/users/search?q=test")
        if user_response.status_code == 200 and user_response.json():
            user_id = user_response.json()[0].get("id", "test")
            response = requests.get(f"{BASE_URL}/api/stripe-connect/status?landlord_id={user_id}")
            # Should return 200 with status or 404 if user not found
            assert response.status_code in [200, 404]
            if response.status_code == 200:
                data = response.json()
                assert "status" in data
                print(f"Stripe Connect status: {data.get('status')}")
        else:
            pytest.skip("No test user found for Stripe Connect test")


class TestAdminStats:
    """Admin database stats tests"""
    
    def test_admin_database_stats(self):
        """GET /api/admin/database-stats?admin_key=dommma-admin-2026 returns stats"""
        response = requests.get(f"{BASE_URL}/api/admin/database-stats?admin_key=dommma-admin-2026")
        assert response.status_code == 200
        data = response.json()
        # Should have collection counts
        assert isinstance(data, dict)
        print(f"Admin stats returned: {list(data.keys())[:5]}...")
    
    def test_admin_database_stats_wrong_key(self):
        """GET /api/admin/database-stats with wrong key returns 403"""
        response = requests.get(f"{BASE_URL}/api/admin/database-stats?admin_key=wrongkey")
        assert response.status_code == 403
        print("Admin stats correctly rejects wrong admin key")


class TestBrowseListings:
    """Browse page listings tests"""
    
    def test_get_listings_rent(self):
        """GET /api/listings?listing_type=rent returns rental listings"""
        response = requests.get(f"{BASE_URL}/api/listings?listing_type=rent")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Rent listings returned {len(data)} properties")
    
    def test_get_listings_sale(self):
        """GET /api/listings?listing_type=sale returns sale listings"""
        response = requests.get(f"{BASE_URL}/api/listings?listing_type=sale")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Sale listings returned {len(data)} properties")
    
    def test_get_lease_assignments(self):
        """GET /api/lease-assignments returns lease takeover listings"""
        response = requests.get(f"{BASE_URL}/api/lease-assignments")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Lease assignments returned {len(data)} listings")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
