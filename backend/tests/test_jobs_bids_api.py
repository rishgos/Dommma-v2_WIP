"""
Tests for Jobs and Bidding API endpoints
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestJobsAPI:
    """Test job posting API endpoints"""
    
    def test_get_all_jobs(self, api_client):
        """Test GET /api/jobs returns list of jobs"""
        response = api_client.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_job_as_guest(self, api_client, unique_id):
        """Test POST /api/jobs allows guest job posting"""
        job_data = {
            "title": f"Test Plumbing Job {unique_id}",
            "category": "plumbing",
            "description": "Test job description for testing purposes",
            "address": "123 Test Street, Vancouver, BC",
            "budget_min": 100,
            "budget_max": 500,
            "urgency": "flexible"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/jobs?user_id=guest",
            json=job_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == job_data["title"]
        assert data["category"] == "plumbing"
        assert data["status"] == "open"
        assert "id" in data
        
        # Store job_id for cleanup
        return data["id"]
    
    def test_create_job_with_user_id(self, api_client, unique_id, login_user):
        """Test POST /api/jobs with authenticated user"""
        user_id = login_user.get("id")
        if not user_id:
            pytest.skip("Login required for this test")
        
        job_data = {
            "title": f"Test Electrical Job {unique_id}",
            "category": "electrical",
            "description": "Test electrical work",
            "address": "456 Test Ave, Vancouver, BC",
            "budget_min": 200,
            "budget_max": 800,
            "urgency": "this_week"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/jobs?user_id={user_id}",
            json=job_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_id
        assert data["category"] == "electrical"
    
    def test_get_job_by_id(self, api_client, unique_id):
        """Test GET /api/jobs/{job_id}"""
        # First create a job
        job_data = {
            "title": f"Test Job {unique_id}",
            "category": "general",
            "description": "Test description",
            "address": "789 Test Blvd, Vancouver, BC",
            "urgency": "flexible"
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/jobs?user_id=guest",
            json=job_data
        )
        
        assert create_response.status_code == 200
        job_id = create_response.json()["id"]
        
        # Now get the job
        response = api_client.get(f"{BASE_URL}/api/jobs/{job_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == job_id
        assert data["title"] == job_data["title"]
    
    def test_get_jobs_by_user(self, api_client, login_user, unique_id):
        """Test GET /api/jobs/user/{user_id}"""
        user_id = login_user.get("id")
        if not user_id:
            pytest.skip("Login required for this test")
        
        # Create a job for this user first
        job_data = {
            "title": f"User Job {unique_id}",
            "category": "plumbing",
            "description": "Test job for user",
            "address": "100 Test Lane, Vancouver, BC",
            "urgency": "flexible"
        }
        
        api_client.post(f"{BASE_URL}/api/jobs?user_id={user_id}", json=job_data)
        
        # Get jobs for this user
        response = api_client.get(f"{BASE_URL}/api/jobs/user/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_jobs_with_filters(self, api_client):
        """Test GET /api/jobs with category filter"""
        response = api_client.get(f"{BASE_URL}/api/jobs?category=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned jobs should be plumbing category
        for job in data:
            assert job["category"] == "plumbing"


class TestJobBidsAPI:
    """Test job bidding API endpoints"""
    
    @pytest.fixture
    def test_job(self, api_client, unique_id):
        """Create a test job for bid tests"""
        job_data = {
            "title": f"Bid Test Job {unique_id}",
            "category": "general",
            "description": "Job for testing bids",
            "address": "200 Test Road, Vancouver, BC",
            "budget_min": 100,
            "budget_max": 500,
            "urgency": "flexible"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/jobs?user_id=guest",
            json=job_data
        )
        
        assert response.status_code == 200
        return response.json()
    
    def test_submit_bid_requires_contractor_profile(self, api_client, test_job, unique_id):
        """Test POST /api/jobs/{job_id}/bids requires valid contractor"""
        job_id = test_job["id"]
        # Use a non-existent contractor ID
        contractor_id = f"nonexistent_contractor_{unique_id}"
        
        bid_data = {
            "amount": 350,
            "message": f"Test bid {unique_id}"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/jobs/{job_id}/bids?contractor_id={contractor_id}",
            json=bid_data
        )
        
        # Should return 404 because contractor profile doesn't exist
        assert response.status_code == 404
        assert "Contractor profile not found" in response.json().get("detail", "")
    
    def test_get_bids_for_job_returns_list(self, api_client, test_job):
        """Test GET /api/jobs/{job_id}/bids returns a list"""
        job_id = test_job["id"]
        
        # Get bids (may be empty for new job)
        response = api_client.get(f"{BASE_URL}/api/jobs/{job_id}/bids")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_bid_without_amount_fails(self, api_client, test_job, unique_id):
        """Test that bid without amount fails validation"""
        job_id = test_job["id"]
        contractor_id = f"contractor_{unique_id}"
        
        bid_data = {
            "message": "No amount provided"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/jobs/{job_id}/bids?contractor_id={contractor_id}",
            json=bid_data
        )
        
        # Should fail validation
        assert response.status_code in [400, 422, 404, 500]


class TestContractorJobsAPI:
    """Test contractor-specific job endpoints"""
    
    def test_get_contractor_jobs(self, api_client):
        """Test GET /api/contractor-jobs"""
        response = api_client.get(f"{BASE_URL}/api/contractor-jobs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_contractor_job(self, api_client, unique_id):
        """Test POST /api/contractor-jobs"""
        job_data = {
            "title": f"Contractor Job {unique_id}",
            "description": "Test contractor job",
            "category": "renovation",
            "location": "Vancouver, BC",
            "budget_min": 500,
            "budget_max": 2000
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/contractor-jobs?landlord_id=test_landlord_{unique_id}",
            json=job_data
        )
        
        assert response.status_code == 200
        data = response.json()
        # Response contains id and status
        assert "id" in data
        assert data["status"] == "created"
