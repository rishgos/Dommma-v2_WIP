"""
Backend tests for DOMMMA AI Features (V3)
- Smart Issue Reporter API (/api/ai/analyze-issue)
- Document Analyzer API (/api/ai/analyze-document)
- Commute Optimizer API (/api/ai/commute-search)
- Resend Email Integration (verify no server errors)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAPIHealth:
    """Test basic API health"""
    
    def test_api_root(self):
        """API root returns DOMMMA V2 message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "DOMMMA" in data.get("message", "")
        print(f"✓ API root returns: {data['message']}")


class TestSmartIssueReporter:
    """Test /api/ai/analyze-issue endpoint"""
    
    def test_analyze_plumbing_issue(self):
        """AI analyzes plumbing issue and returns matched contractors"""
        response = requests.post(f"{BASE_URL}/api/ai/analyze-issue", json={
            "image_data": "",
            "description": "Water leaking from under the kitchen sink, the pipe seems loose"
        }, timeout=60)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify analysis structure
        assert "analysis" in data
        analysis = data["analysis"]
        assert "issue_type" in analysis
        assert "urgency" in analysis
        assert "description" in analysis
        assert analysis["issue_type"].lower() in ["plumbing", "general"]
        print(f"✓ Issue analyzed: {analysis['issue_type']} ({analysis['urgency']} urgency)")
        
        # Verify matched contractors
        assert "matched_contractors" in data
        contractors = data["matched_contractors"]
        print(f"✓ Matched {len(contractors)} contractors")
        
    def test_analyze_electrical_issue(self):
        """AI analyzes electrical issue"""
        response = requests.post(f"{BASE_URL}/api/ai/analyze-issue", json={
            "image_data": "",
            "description": "Light switch not working, outlet sparking"
        }, timeout=60)
        
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        print(f"✓ Electrical issue analyzed: {data['analysis'].get('issue_type', 'N/A')}")
        
    def test_analyze_with_empty_description(self):
        """AI handles minimal input with fallback"""
        response = requests.post(f"{BASE_URL}/api/ai/analyze-issue", json={
            "image_data": "data:image/png;base64,test",
            "description": ""
        }, timeout=60)
        
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        print("✓ Empty description handled with fallback")


class TestDocumentAnalyzer:
    """Test /api/ai/analyze-document endpoint"""
    
    def test_analyze_lease_document(self):
        """AI analyzes lease document and returns fairness score"""
        lease_text = """
        RESIDENTIAL TENANCY AGREEMENT
        Monthly Rent: $2,500 CAD
        Security Deposit: $2,500 (full month)
        Lease Term: 12 months
        Early Termination: 3 months rent penalty
        Utilities: Tenant pays all
        Pets: Not allowed
        Parking: 1 spot included
        """
        
        response = requests.post(f"{BASE_URL}/api/ai/analyze-document", json={
            "document_text": lease_text,
            "document_type": "lease"
        }, timeout=90)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify analysis structure
        assert "analysis" in data
        analysis = data["analysis"]
        assert "fairness_score" in analysis or "summary" in analysis
        
        if "fairness_score" in analysis:
            score = analysis["fairness_score"]
            assert 0 <= score <= 10
            print(f"✓ Lease fairness score: {score}/10")
        
        if "red_flags" in analysis:
            print(f"✓ Found {len(analysis['red_flags'])} red flags")
            
        if "green_flags" in analysis:
            print(f"✓ Found {len(analysis['green_flags'])} green flags")
            
        if "recommendations" in analysis:
            print(f"✓ Provided {len(analysis['recommendations'])} recommendations")
    
    def test_analyze_rental_agreement(self):
        """AI analyzes rental agreement"""
        rental_text = """
        RENTAL AGREEMENT
        Property: 123 Main St, Vancouver
        Monthly Rent: $1,800
        Deposit: Half month rent ($900)
        Move-in Date: March 1, 2026
        """
        
        response = requests.post(f"{BASE_URL}/api/ai/analyze-document", json={
            "document_text": rental_text,
            "document_type": "rental agreement"
        }, timeout=90)
        
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        print("✓ Rental agreement analyzed successfully")


class TestCommuteOptimizer:
    """Test /api/ai/commute-search endpoint"""
    
    def test_commute_search_single_address(self):
        """AI ranks properties by commute to single work address"""
        response = requests.post(f"{BASE_URL}/api/ai/commute-search", json={
            "work_addresses": ["200 Granville St, Vancouver"],
            "max_commute_minutes": 45,
            "transport_mode": "transit"
        }, timeout=90)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "ranked_properties" in data
        properties = data["ranked_properties"]
        print(f"✓ Found {len(properties)} properties ranked by commute")
        
        # Verify property ranking structure
        if len(properties) > 0:
            first = properties[0]
            assert "title" in first
            assert "estimated_commute" in first or "commute_score" in first
            print(f"✓ Top property: {first.get('title', 'N/A')} - {first.get('estimated_commute', 'N/A')}")
            
        if "tips" in data:
            print(f"✓ Provided {len(data['tips'])} commute tips")
    
    def test_commute_search_multiple_addresses(self):
        """AI handles multiple work addresses"""
        response = requests.post(f"{BASE_URL}/api/ai/commute-search", json={
            "work_addresses": ["200 Granville St, Vancouver", "Broadway-City Hall Station"],
            "max_commute_minutes": 30,
            "transport_mode": "transit"
        }, timeout=90)
        
        assert response.status_code == 200
        data = response.json()
        assert "ranked_properties" in data
        print("✓ Multiple work addresses handled")
    
    def test_commute_search_driving_mode(self):
        """AI handles driving transport mode"""
        response = requests.post(f"{BASE_URL}/api/ai/commute-search", json={
            "work_addresses": ["UBC, Vancouver"],
            "max_commute_minutes": 60,
            "transport_mode": "driving"
        }, timeout=90)
        
        assert response.status_code == 200
        data = response.json()
        assert "ranked_properties" in data
        print("✓ Driving mode commute search works")


class TestEmailIntegration:
    """Test Resend email integration (verify no server errors)"""
    
    def test_registration_email_triggered(self):
        """Registration triggers welcome email (Resend test mode)"""
        # Note: Resend is in test mode, emails only go to owner email
        unique_email = f"test_email_{int(time.time())}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test Email User",
            "user_type": "renter"
        })
        
        # Registration should succeed even if email fails (non-blocking)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == unique_email
        print(f"✓ Registration completed (email triggered in background)")
        print("  Note: Resend in test mode - emails only sent to owner email")


class TestExistingV2Features:
    """Regression tests for existing V2 features"""
    
    def test_listings_endpoint(self):
        """GET /api/listings returns properties"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listings endpoint: {len(data)} properties")
    
    def test_contractors_search(self):
        """GET /api/contractors/search returns contractors"""
        response = requests.get(f"{BASE_URL}/api/contractors/search")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Contractors search: {len(data)} contractors")
    
    def test_login_existing_user(self):
        """Login with existing user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "renter@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        # May create new user if not exists (by design)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "user_type" in data
        print(f"✓ Login successful: {data['email']} ({data['user_type']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
