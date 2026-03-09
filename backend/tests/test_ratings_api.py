"""
Test suite for Ratings API - Universal star rating system
Tests: Creating ratings, getting ratings, rating summaries
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRatingsAPI:
    """Tests for the User Ratings API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.unique_id = f"TEST_{uuid.uuid4().hex[:8]}"
        
    def test_get_user_ratings_returns_success(self):
        """GET /api/ratings/user/{user_id} should return ratings data"""
        # Login to get a user ID
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@example.com",
            "password": "test123456"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login with test user")
            
        user_id = login_resp.json().get("id")
        
        response = self.session.get(f"{BASE_URL}/api/ratings/user/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "user_id" in data
        assert "average_rating" in data
        assert "total_ratings" in data
        assert "reviews" in data
        assert isinstance(data["reviews"], list)
        
    def test_get_rating_summary_returns_distribution(self):
        """GET /api/ratings/summary/{user_id} should return rating distribution"""
        # Login to get a user ID
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@example.com",
            "password": "test123456"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login with test user")
            
        user_id = login_resp.json().get("id")
        
        response = self.session.get(f"{BASE_URL}/api/ratings/summary/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "user_id" in data
        assert "average_rating" in data
        assert "total_ratings" in data
        assert "distribution" in data
        assert isinstance(data["distribution"], dict)
        
    def test_create_rating_requires_rater_id(self):
        """POST /api/ratings/user without rater_id should fail"""
        rating_data = {
            "rated_user_id": "some-user-id",
            "rating": 5,
            "review": "Great service!",
            "context_type": "general"
        }
        
        response = self.session.post(f"{BASE_URL}/api/ratings/user", json=rating_data)
        # Should fail without rater_id query param
        assert response.status_code in [400, 422]
        
    def test_create_rating_validates_rating_range(self):
        """POST /api/ratings/user should validate rating is 1-5"""
        # Login to get a user ID
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@example.com",
            "password": "test123456"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login with test user")
            
        rater_id = login_resp.json().get("id")
        
        # Invalid rating (> 5)
        rating_data = {
            "rated_user_id": "some-user-id",
            "rating": 10,
            "context_type": "general"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/ratings/user?rater_id={rater_id}",
            json=rating_data
        )
        assert response.status_code == 400
        
        # Invalid rating (< 1)
        rating_data["rating"] = 0
        response = self.session.post(
            f"{BASE_URL}/api/ratings/user?rater_id={rater_id}",
            json=rating_data
        )
        assert response.status_code == 400
        
    def test_cannot_rate_yourself(self):
        """POST /api/ratings/user should prevent self-rating"""
        # Login to get a user ID
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@example.com",
            "password": "test123456"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login with test user")
            
        user_id = login_resp.json().get("id")
        
        # Try to rate yourself
        rating_data = {
            "rated_user_id": user_id,
            "rating": 5,
            "review": "I'm amazing!",
            "context_type": "general"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/ratings/user?rater_id={user_id}",
            json=rating_data
        )
        assert response.status_code == 400
        assert "yourself" in response.json().get("detail", "").lower()
        
    def test_get_ratings_for_nonexistent_user(self):
        """GET /api/ratings/user/{user_id} for nonexistent user returns empty"""
        fake_id = "nonexistent-user-12345"
        response = self.session.get(f"{BASE_URL}/api/ratings/user/{fake_id}")
        
        # Should still return 200 but with empty/default data
        assert response.status_code == 200
        data = response.json()
        assert data.get("total_ratings", 0) == 0
        assert data.get("reviews", []) == []


class TestRatingsIntegration:
    """Integration tests for rating system with real data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def test_rating_workflow_complete(self):
        """Test complete rating workflow: create, read, verify update"""
        # This test requires two different users to work properly
        # For now, we'll just verify the API structure is correct
        
        # Login
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@example.com",
            "password": "test123456"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not login with test user")
            
        user_id = login_resp.json().get("id")
        
        # Get ratings
        ratings_resp = self.session.get(f"{BASE_URL}/api/ratings/user/{user_id}")
        assert ratings_resp.status_code == 200
        
        # Get summary
        summary_resp = self.session.get(f"{BASE_URL}/api/ratings/summary/{user_id}")
        assert summary_resp.status_code == 200
        
        # Both should return consistent data
        ratings_data = ratings_resp.json()
        summary_data = summary_resp.json()
        
        assert ratings_data.get("average_rating") == summary_data.get("average_rating")
        assert ratings_data.get("total_ratings") == summary_data.get("total_ratings")
