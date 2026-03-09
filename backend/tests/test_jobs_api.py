"""
Test suite for Jobs API - bark.com-like contractor workflow
Tests: Job posting, job listing, and bidding functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestJobsAPI:
    """Tests for the Jobs API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.unique_id = f"TEST_{uuid.uuid4().hex[:8]}"
        
    def test_get_jobs_list_returns_success(self):
        """GET /api/jobs should return a list of open jobs"""
        response = self.session.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_jobs_with_category_filter(self):
        """GET /api/jobs?category=plumbing should filter by category"""
        response = self.session.get(f"{BASE_URL}/api/jobs?category=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for job in data:
            assert job.get("category") == "plumbing"
            
    def test_get_jobs_default_status_is_open(self):
        """GET /api/jobs should default to open jobs"""
        response = self.session.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        data = response.json()
        for job in data:
            assert job.get("status") == "open"

    def test_create_job_requires_user_id(self):
        """POST /api/jobs without user_id should fail"""
        job_data = {
            "title": f"Test Job {self.unique_id}",
            "category": "plumbing",
            "description": "Test description",
            "address": "123 Test St",
            "urgency": "flexible"
        }
        response = self.session.post(f"{BASE_URL}/api/jobs", json=job_data)
        # Should fail without user_id query param
        assert response.status_code in [400, 404, 422]

    def test_create_job_with_valid_user(self):
        """POST /api/jobs should create a new job with valid user"""
        # First login to get user ID
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@example.com",
            "password": "test123456"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login with test user")
            
        user_id = login_resp.json().get("id")
        
        job_data = {
            "title": f"Test Job {self.unique_id}",
            "category": "plumbing",
            "description": "Test plumbing job for testing purposes",
            "address": "123 Test Street, Vancouver, BC",
            "budget_min": 100,
            "budget_max": 500,
            "urgency": "flexible"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/jobs?user_id={user_id}",
            json=job_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("title") == job_data["title"]
        assert data.get("category") == "plumbing"
        assert data.get("status") == "open"
        assert "id" in data
        
        # Store job_id for cleanup or verification
        job_id = data.get("id")
        
        # Verify job appears in list
        list_resp = self.session.get(f"{BASE_URL}/api/jobs")
        assert list_resp.status_code == 200
        jobs = list_resp.json()
        job_ids = [j.get("id") for j in jobs]
        assert job_id in job_ids

    def test_get_specific_job(self):
        """GET /api/jobs/{job_id} should return job details"""
        # First get list of jobs
        list_resp = self.session.get(f"{BASE_URL}/api/jobs?limit=1")
        assert list_resp.status_code == 200
        jobs = list_resp.json()
        
        if not jobs:
            pytest.skip("No jobs available to test")
            
        job_id = jobs[0].get("id")
        
        response = self.session.get(f"{BASE_URL}/api/jobs/{job_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("id") == job_id
        assert "title" in data
        assert "bids" in data  # Should include bids array
        
    def test_get_nonexistent_job_returns_404(self):
        """GET /api/jobs/{job_id} with invalid ID should return 404"""
        fake_id = "nonexistent-job-id-12345"
        response = self.session.get(f"{BASE_URL}/api/jobs/{fake_id}")
        assert response.status_code == 404


class TestJobBidsAPI:
    """Tests for Job Bidding functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def test_get_bids_for_job(self):
        """GET /api/jobs/{job_id}/bids should return bids list"""
        # Get a job first
        list_resp = self.session.get(f"{BASE_URL}/api/jobs?limit=1")
        if list_resp.status_code != 200 or not list_resp.json():
            pytest.skip("No jobs available to test")
            
        job_id = list_resp.json()[0].get("id")
        
        response = self.session.get(f"{BASE_URL}/api/jobs/{job_id}/bids")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_submit_bid_requires_contractor_id(self):
        """POST /api/jobs/{job_id}/bids without contractor_id should fail"""
        # Get a job first
        list_resp = self.session.get(f"{BASE_URL}/api/jobs?limit=1")
        if list_resp.status_code != 200 or not list_resp.json():
            pytest.skip("No jobs available to test")
            
        job_id = list_resp.json()[0].get("id")
        
        bid_data = {
            "amount": 250.0,
            "message": "Test bid message"
        }
        
        response = self.session.post(f"{BASE_URL}/api/jobs/{job_id}/bids", json=bid_data)
        # Should fail without contractor_id
        assert response.status_code in [400, 404, 422]

    def test_submit_bid_requires_contractor_profile(self):
        """POST /api/jobs/{job_id}/bids should require contractor profile"""
        # Login as regular user (not contractor)
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@example.com",
            "password": "test123456"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login with test user")
            
        user_id = login_resp.json().get("id")
        
        # Get a job
        list_resp = self.session.get(f"{BASE_URL}/api/jobs?limit=1")
        if list_resp.status_code != 200 or not list_resp.json():
            pytest.skip("No jobs available to test")
            
        job_id = list_resp.json()[0].get("id")
        
        bid_data = {
            "amount": 250.0,
            "message": "Test bid from non-contractor"
        }
        
        # Should fail because user is not a contractor
        response = self.session.post(
            f"{BASE_URL}/api/jobs/{job_id}/bids?contractor_id={user_id}",
            json=bid_data
        )
        # Expect 404 for contractor profile not found
        assert response.status_code in [404, 400]
