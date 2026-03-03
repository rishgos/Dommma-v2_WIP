"""
Backend tests for Renter Resume and Applicant Ranking with AI Scoring
Features:
- Renter Resume: GET /api/renter-resume/{user_id}, POST /api/renter-resume
- Applications: GET /api/applications?listing_id=X, PATCH /api/applications/{id}
- AI Scoring: calculate_applicant_score, generate_applicant_analysis
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


class TestRenterResumeGetEndpoint:
    """Test GET /api/renter-resume/{user_id}"""
    
    def test_renter_resume_returns_200_for_valid_user(self, api_client, unique_id):
        """Test that renter-resume endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/renter-resume/{unique_id}")
        assert response.status_code == 200
    
    def test_renter_resume_returns_has_resume_field(self, api_client, unique_id):
        """Test that response contains has_resume boolean"""
        response = api_client.get(f"{BASE_URL}/api/renter-resume/{unique_id}")
        data = response.json()
        
        assert "has_resume" in data
        assert isinstance(data["has_resume"], bool)
    
    def test_renter_resume_returns_false_for_new_user(self, api_client, unique_id):
        """Test that new user has no resume"""
        response = api_client.get(f"{BASE_URL}/api/renter-resume/{unique_id}")
        data = response.json()
        
        assert data["has_resume"] == False
        assert "message" in data


class TestRenterResumePostEndpoint:
    """Test POST /api/renter-resume"""
    
    def test_create_renter_resume_returns_200(self, api_client, unique_id):
        """Test creating a new renter resume"""
        resume_data = {
            "user_id": unique_id,
            "full_name": "Test User Resume",
            "email": f"test-{unique_id}@example.com",
            "phone": "604-555-1234"
        }
        
        response = api_client.post(f"{BASE_URL}/api/renter-resume", json=resume_data)
        assert response.status_code == 200
    
    def test_create_renter_resume_returns_status(self, api_client, unique_id):
        """Test that response contains status field"""
        resume_data = {
            "user_id": unique_id,
            "full_name": "Test Status User"
        }
        
        response = api_client.post(f"{BASE_URL}/api/renter-resume", json=resume_data)
        data = response.json()
        
        assert "status" in data
        assert data["status"] == "saved"
    
    def test_create_renter_resume_returns_completeness_score(self, api_client, unique_id):
        """Test that response contains completeness_score"""
        resume_data = {
            "user_id": unique_id,
            "full_name": "Test Complete User",
            "email": f"complete-{unique_id}@example.com",
            "phone": "604-555-9999"
        }
        
        response = api_client.post(f"{BASE_URL}/api/renter-resume", json=resume_data)
        data = response.json()
        
        assert "completeness_score" in data
        assert isinstance(data["completeness_score"], int)
        assert 0 <= data["completeness_score"] <= 100
    
    def test_create_resume_then_get_resume(self, api_client, unique_id):
        """Test create then verify via GET"""
        resume_data = {
            "user_id": unique_id,
            "full_name": "Test Get After Create",
            "email": f"getafter-{unique_id}@example.com",
            "phone": "778-555-0000",
            "employment": {
                "status": "employed",
                "employer": "Test Corp",
                "annual_income": 75000
            }
        }
        
        # Create
        create_response = api_client.post(f"{BASE_URL}/api/renter-resume", json=resume_data)
        assert create_response.status_code == 200
        
        # Verify via GET
        get_response = api_client.get(f"{BASE_URL}/api/renter-resume/{unique_id}")
        get_data = get_response.json()
        
        assert get_data["has_resume"] == True
        assert "resume" in get_data
        assert get_data["resume"]["full_name"] == "Test Get After Create"
        assert get_data["resume"]["email"] == f"getafter-{unique_id}@example.com"
    
    def test_completeness_score_increases_with_more_fields(self, api_client, unique_id):
        """Test that completeness score increases with more data"""
        # First create with minimal data
        minimal_resume = {
            "user_id": unique_id,
            "full_name": "Minimal User"
        }
        
        response1 = api_client.post(f"{BASE_URL}/api/renter-resume", json=minimal_resume)
        score1 = response1.json()["completeness_score"]
        
        # Update with more data
        fuller_resume = {
            "user_id": unique_id,
            "full_name": "Fuller User",
            "email": "fuller@example.com",
            "phone": "604-555-1111",
            "employment": {
                "status": "employed",
                "employer": "Big Corp",
                "annual_income": 80000
            }
        }
        
        response2 = api_client.post(f"{BASE_URL}/api/renter-resume", json=fuller_resume)
        score2 = response2.json()["completeness_score"]
        
        assert score2 > score1, f"Fuller resume score {score2} should be greater than minimal {score1}"
    
    def test_create_resume_without_user_id_fails(self, api_client):
        """Test that user_id is required"""
        resume_data = {
            "full_name": "No User ID"
        }
        
        response = api_client.post(f"{BASE_URL}/api/renter-resume", json=resume_data)
        # Should fail with 400 or 422
        assert response.status_code in [400, 422]


class TestApplicationsWithAIScoringEndpoint:
    """Test GET /api/applications?listing_id=X with AI scoring"""
    
    def test_applications_endpoint_returns_200(self, api_client, unique_id):
        """Test that applications endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/applications?listing_id={unique_id}")
        assert response.status_code == 200
    
    def test_applications_endpoint_returns_list(self, api_client, unique_id):
        """Test that response is a list"""
        response = api_client.get(f"{BASE_URL}/api/applications?listing_id={unique_id}")
        data = response.json()
        
        assert isinstance(data, list)
    
    def test_applications_sorted_by_ai_score(self, api_client):
        """Test that applications have AI scoring fields and are sorted"""
        # Try to find a listing with applications
        listings_response = api_client.get(f"{BASE_URL}/api/listings")
        listings = listings_response.json()
        
        if not listings:
            pytest.skip("No listings available to test applications")
        
        # Try each listing until we find one with applications
        for listing in listings[:5]:
            response = api_client.get(f"{BASE_URL}/api/applications?listing_id={listing['id']}")
            apps = response.json()
            
            if len(apps) > 1:
                # Verify apps have ai_score and are sorted descending
                scores = [app.get("ai_score", 0) for app in apps]
                assert scores == sorted(scores, reverse=True), "Applications should be sorted by AI score descending"
                return
        
        pytest.skip("No listings with multiple applications found")


class TestApplicationStatusPatchEndpoint:
    """Test PATCH /api/applications/{id} for status updates"""
    
    def test_patch_application_requires_valid_status(self, api_client, unique_id):
        """Test that invalid status returns error"""
        response = api_client.patch(
            f"{BASE_URL}/api/applications/{unique_id}?status=invalid_status"
        )
        # Should return 400 for invalid status
        assert response.status_code == 400
    
    def test_patch_nonexistent_application_returns_404(self, api_client, unique_id):
        """Test that patching nonexistent application returns 404"""
        response = api_client.patch(
            f"{BASE_URL}/api/applications/{unique_id}?status=approved"
        )
        assert response.status_code == 404
    
    def test_patch_application_valid_statuses(self, api_client):
        """Test that valid statuses are accepted (would need real application)"""
        # We just verify the endpoint validates statuses correctly
        valid_statuses = ["pending", "under_review", "approved", "rejected"]
        
        for status in valid_statuses:
            response = api_client.patch(
                f"{BASE_URL}/api/applications/nonexistent?status={status}"
            )
            # Should be 404 (not found), not 400 (invalid status)
            assert response.status_code == 404, f"Status '{status}' should be valid"


class TestUserApplicationsEndpoint:
    """Test GET /api/applications/user/{user_id}"""
    
    def test_user_applications_returns_200(self, api_client, unique_id):
        """Test user applications endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/applications/user/{unique_id}")
        assert response.status_code == 200
    
    def test_user_applications_returns_list(self, api_client, unique_id):
        """Test user applications returns a list"""
        response = api_client.get(f"{BASE_URL}/api/applications/user/{unique_id}")
        data = response.json()
        
        assert isinstance(data, list)


class TestLandlordApplicationsEndpoint:
    """Test GET /api/applications/landlord/{landlord_id}"""
    
    def test_landlord_applications_returns_200(self, api_client, unique_id):
        """Test landlord applications endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/applications/landlord/{unique_id}")
        assert response.status_code == 200
    
    def test_landlord_applications_returns_list(self, api_client, unique_id):
        """Test landlord applications returns a list"""
        response = api_client.get(f"{BASE_URL}/api/applications/landlord/{unique_id}")
        data = response.json()
        
        assert isinstance(data, list)
    
    def test_landlord_applications_accepts_status_filter(self, api_client, unique_id):
        """Test landlord applications accepts status filter"""
        response = api_client.get(f"{BASE_URL}/api/applications/landlord/{unique_id}?status=pending")
        assert response.status_code == 200


class TestAIScoreCalculation:
    """Test AI scoring logic with real data"""
    
    def test_ai_score_fields_in_application(self, api_client):
        """Test that applications include AI scoring fields when available"""
        # Get listings
        listings_response = api_client.get(f"{BASE_URL}/api/listings")
        listings = listings_response.json()
        
        if not listings:
            pytest.skip("No listings available")
        
        # Check applications for each listing
        for listing in listings[:3]:
            response = api_client.get(f"{BASE_URL}/api/applications?listing_id={listing['id']}")
            apps = response.json()
            
            for app in apps:
                if "ai_score" in app:
                    assert isinstance(app["ai_score"], int)
                    assert 0 <= app["ai_score"] <= 100
                    
                    if "ai_analysis" in app:
                        assert "strengths" in app["ai_analysis"]
                        assert "concerns" in app["ai_analysis"]
                        assert isinstance(app["ai_analysis"]["strengths"], list)
                        assert isinstance(app["ai_analysis"]["concerns"], list)
                    return
        
        pytest.skip("No applications with AI scoring found")
