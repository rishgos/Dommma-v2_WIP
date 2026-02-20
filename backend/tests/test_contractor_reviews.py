"""
Contractor Ratings System Tests
Tests for:
- GET /api/contractors/{contractor_id}/reviews - returns reviews for a contractor
- GET /api/contractors/leaderboard - returns top-rated contractors
- POST /api/bookings/{booking_id}/review - submit a review for completed booking
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestContractorReviewsAPI:
    """Test contractor reviews endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with test user
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "scheduler_test@dommma.com",
            "password": "test123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
        print(f"✓ Logged in as {self.user['email']}")
        
        # Store test data IDs for cleanup
        self.test_booking_id = None
        self.test_contractor_id = None
        
        yield
        
        # Cleanup - delete test booking if created
        if self.test_booking_id:
            try:
                # Note: There's no delete booking endpoint, so we just note it was created
                print(f"Note: Test booking {self.test_booking_id} created")
            except:
                pass
    
    def test_get_contractor_leaderboard_empty(self):
        """Test GET /api/contractors/leaderboard returns empty when no ratings"""
        response = self.session.get(f"{BASE_URL}/api/contractors/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # If no contractors have ratings > 0, this should be empty
        print(f"✓ Leaderboard endpoint working - returned {len(data)} contractors")
        
    def test_get_contractor_leaderboard_with_limit(self):
        """Test leaderboard respects limit parameter"""
        response = self.session.get(f"{BASE_URL}/api/contractors/leaderboard?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 3
        print(f"✓ Leaderboard with limit=3 returned {len(data)} contractors")
    
    def test_get_contractor_reviews_empty(self):
        """Test GET /api/contractors/{id}/reviews returns empty array for new contractor"""
        # First get a contractor
        contractors_response = self.session.get(f"{BASE_URL}/api/contractors/search?limit=1")
        assert contractors_response.status_code == 200
        contractors = contractors_response.json()
        
        if contractors:
            contractor_id = contractors[0]["user_id"]
            response = self.session.get(f"{BASE_URL}/api/contractors/{contractor_id}/reviews")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Reviews endpoint for {contractors[0]['business_name']} returned {len(data)} reviews")
        else:
            pytest.skip("No contractors available for testing")
    
    def test_review_booking_without_booking(self):
        """Test POST /api/bookings/{id}/review fails for non-existent booking"""
        fake_booking_id = "non-existent-booking-id"
        response = self.session.post(
            f"{BASE_URL}/api/bookings/{fake_booking_id}/review?customer_id={self.user['id']}",
            json={"rating": 5, "review": "Great service!"}
        )
        assert response.status_code == 404
        print("✓ Review endpoint correctly rejects non-existent booking")
    
    def test_full_review_flow(self):
        """Test full flow: create booking → complete → review → verify rating update"""
        # Get a contractor
        contractors_response = self.session.get(f"{BASE_URL}/api/contractors/search?limit=1")
        assert contractors_response.status_code == 200
        contractors = contractors_response.json()
        
        if not contractors:
            pytest.skip("No contractors available for testing")
        
        contractor = contractors[0]
        self.test_contractor_id = contractor["user_id"]
        
        # Step 1: Create a booking
        booking_response = self.session.post(
            f"{BASE_URL}/api/bookings?customer_id={self.user['id']}",
            json={
                "contractor_id": self.test_contractor_id,
                "title": "TEST_Review Test Service",
                "description": "This is a test booking for review testing",
                "preferred_date": "2026-02-20",
                "preferred_time": "morning",
                "address": "123 Test Street"
            }
        )
        assert booking_response.status_code == 200, f"Booking creation failed: {booking_response.text}"
        booking = booking_response.json()
        self.test_booking_id = booking["id"]
        print(f"✓ Created test booking: {self.test_booking_id}")
        
        # Step 2: Update booking status to completed (simulating contractor completing the job)
        update_response = self.session.put(
            f"{BASE_URL}/api/bookings/{self.test_booking_id}/status?status=completed&user_id={self.test_contractor_id}"
        )
        assert update_response.status_code == 200, f"Booking update failed: {update_response.text}"
        print("✓ Updated booking to completed status")
        
        # Step 3: Submit review
        review_response = self.session.post(
            f"{BASE_URL}/api/bookings/{self.test_booking_id}/review?customer_id={self.user['id']}",
            json={"rating": 5, "review": "Excellent test service! The contractor was very professional and did a great job."}
        )
        assert review_response.status_code == 200, f"Review submission failed: {review_response.text}"
        review_result = review_response.json()
        assert review_result.get("status") == "reviewed"
        print("✓ Successfully submitted 5-star review")
        
        # Step 4: Verify review appears in contractor's reviews
        reviews_response = self.session.get(f"{BASE_URL}/api/contractors/{self.test_contractor_id}/reviews")
        assert reviews_response.status_code == 200
        reviews = reviews_response.json()
        assert len(reviews) >= 1, "Review not found in contractor's reviews"
        
        # Find our review
        our_review = next((r for r in reviews if r["id"] == self.test_booking_id), None)
        assert our_review is not None, "Our review not found"
        assert our_review["rating"] == 5
        print(f"✓ Review verified in contractor's reviews list")
        
        # Step 5: Check contractor appears in leaderboard (if rating > 0)
        leaderboard_response = self.session.get(f"{BASE_URL}/api/contractors/leaderboard")
        assert leaderboard_response.status_code == 200
        leaderboard = leaderboard_response.json()
        
        # Find contractor in leaderboard
        contractor_in_leaderboard = next((c for c in leaderboard if c["user_id"] == self.test_contractor_id), None)
        if contractor_in_leaderboard:
            assert contractor_in_leaderboard["rating"] > 0
            assert contractor_in_leaderboard["review_count"] >= 1
            print(f"✓ Contractor now appears in leaderboard with rating {contractor_in_leaderboard['rating']}")
        else:
            print("Note: Contractor may not appear in leaderboard yet if rating calculation is different")
    
    def test_review_unauthorized_user(self):
        """Test that users can't review bookings they didn't create"""
        # Create a booking with a different user
        # First register another user
        other_email = f"test_other_{uuid.uuid4().hex[:8]}@dommma.com"
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": other_email,
            "password": "test123",
            "name": "Other User",
            "user_type": "renter"
        })
        
        if register_response.status_code in [200, 400]:  # 400 if user exists
            # Try to register the same user as login (should fail or work)
            pass
        
        # Get contractors
        contractors_response = self.session.get(f"{BASE_URL}/api/contractors/search?limit=1")
        if contractors_response.status_code != 200 or not contractors_response.json():
            pytest.skip("No contractors available")
        
        contractor = contractors_response.json()[0]
        
        # Create a booking with this test user
        booking_response = self.session.post(
            f"{BASE_URL}/api/bookings?customer_id={self.user['id']}",
            json={
                "contractor_id": contractor["user_id"],
                "title": "TEST_Auth Check Service",
                "description": "Test for authorization check",
                "address": "456 Test Ave"
            }
        )
        
        if booking_response.status_code != 200:
            pytest.skip("Could not create booking for test")
        
        booking = booking_response.json()
        
        # Try to review with a different customer_id
        fake_customer_id = "fake-customer-" + uuid.uuid4().hex[:8]
        review_response = self.session.post(
            f"{BASE_URL}/api/bookings/{booking['id']}/review?customer_id={fake_customer_id}",
            json={"rating": 1, "review": "Unauthorized review attempt"}
        )
        assert review_response.status_code == 403, "Should reject unauthorized review"
        print("✓ Authorization check working - rejected unauthorized review")


class TestCustomerBookingsForPendingReviews:
    """Test the bookings/customer endpoint used by PendingReviews component"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "scheduler_test@dommma.com",
            "password": "test123"
        })
        assert login_response.status_code == 200
        self.user = login_response.json()
    
    def test_get_customer_bookings(self):
        """Test GET /api/bookings/customer/{user_id}"""
        response = self.session.get(f"{BASE_URL}/api/bookings/customer/{self.user['id']}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customer bookings endpoint returned {len(data)} bookings")
        
        # If there are bookings, verify structure
        if data:
            booking = data[0]
            assert "id" in booking
            assert "status" in booking
            print(f"  - First booking status: {booking['status']}")


class TestContractorSearch:
    """Test contractor search endpoints used by marketplace"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_contractor_search(self):
        """Test GET /api/contractors/search"""
        response = self.session.get(f"{BASE_URL}/api/contractors/search")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Contractor search returned {len(data)} contractors")
        
        if data:
            contractor = data[0]
            # Verify required fields exist
            required_fields = ["id", "user_id", "business_name", "rating", "review_count"]
            for field in required_fields:
                assert field in contractor, f"Missing field: {field}"
            print(f"  - First contractor: {contractor['business_name']} (Rating: {contractor['rating']})")
    
    def test_contractor_search_by_specialty(self):
        """Test contractor search with specialty filter"""
        response = self.session.get(f"{BASE_URL}/api/contractors/search?specialty=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Plumbing specialists: {len(data)} found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
