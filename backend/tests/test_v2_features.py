"""
DOMMMA V2 New Features Backend Tests
Testing: Firebase/FCM, Rental Applications, Maintenance Requests, Contractor Jobs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://real-estate-dev-3.preview.emergentagent.com')

# Test user credentials
TEST_USERS = {
    "renter": {"email": "test_renter@dommma.com", "password": "password123", "user_type": "renter"},
    "landlord": {"email": "test_landlord@dommma.com", "password": "password123", "user_type": "landlord"},
    "contractor": {"email": "test_contractor@dommma.com", "password": "password123", "user_type": "contractor"},
}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def users(api_client):
    """Create test users and return their IDs"""
    user_ids = {}
    for role, user_data in TEST_USERS.items():
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=user_data)
        assert response.status_code == 200, f"Failed to login as {role}: {response.text}"
        user_ids[role] = response.json()["id"]
    return user_ids


@pytest.fixture(scope="module")
def listing_id(api_client, users):
    """Create a test listing and return its ID"""
    listing_data = {
        "title": f"TEST_Property_{uuid.uuid4().hex[:8]}",
        "address": "123 Test Street",
        "city": "Vancouver",
        "province": "BC",
        "postal_code": "V6B 1A1",
        "lat": 49.2827,
        "lng": -123.1207,
        "price": 2500,
        "bedrooms": 2,
        "bathrooms": 1,
        "sqft": 900,
        "property_type": "Apartment",
        "description": "Test property for testing",
        "amenities": ["Gym", "Parking"],
        "images": ["https://example.com/test.jpg"],
        "available_date": "2026-02-01",
        "pet_friendly": True,
        "parking": True
    }
    response = api_client.post(
        f"{BASE_URL}/api/listings/create?landlord_id={users['landlord']}", 
        json=listing_data
    )
    assert response.status_code == 200, f"Failed to create listing: {response.text}"
    return response.json()["id"]


class TestHealthEndpoints:
    """Basic API health tests"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "DOMMMA" in data.get("message", "")
        print("API root endpoint working")


class TestNotifications:
    """Push notification / FCM token endpoints"""
    
    def test_register_fcm_token(self, api_client, users):
        """Test registering FCM token for push notifications"""
        token_data = {
            "user_id": users["renter"],
            "token": f"TEST_FCM_TOKEN_{uuid.uuid4().hex}"
        }
        response = api_client.post(f"{BASE_URL}/api/notifications/register-token", json=token_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "registered"
        print("FCM token registration working")
    
    def test_register_fcm_token_update(self, api_client, users):
        """Test updating FCM token for existing user"""
        token_data = {
            "user_id": users["renter"],
            "token": f"TEST_FCM_TOKEN_UPDATED_{uuid.uuid4().hex}"
        }
        response = api_client.post(f"{BASE_URL}/api/notifications/register-token", json=token_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "registered"
        print("FCM token update working")
    
    def test_get_notifications(self, api_client, users):
        """Test getting notifications for a user"""
        response = api_client.get(f"{BASE_URL}/api/notifications/{users['renter']}")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("Get notifications endpoint working")
    
    def test_send_notification(self, api_client, users):
        """Test sending a notification"""
        notification_data = {
            "user_id": users["renter"],
            "title": "Test Notification",
            "body": "This is a test notification",
            "notification_type": "system",
            "data": {"test_key": "test_value"}
        }
        response = api_client.post(f"{BASE_URL}/api/notifications/send", json=notification_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "sent"
        print("Send notification endpoint working")


class TestRentalApplications:
    """Rental application workflow tests"""
    
    def test_create_application(self, api_client, users, listing_id):
        """Test submitting a rental application"""
        application_data = {
            "listing_id": listing_id,
            "full_name": "TEST_John Doe",
            "email": "testjohn@example.com",
            "phone": "604-555-1234",
            "current_address": "456 Current Street, Vancouver",
            "move_in_date": "2026-02-15",
            "employer": "Test Company",
            "job_title": "Software Engineer",
            "monthly_income": 8000,
            "employment_length": "2 years",
            "references": [{"name": "Jane Ref", "phone": "604-555-5678"}],
            "num_occupants": 2,
            "has_pets": True,
            "pet_details": "One small dog",
            "additional_notes": "Test application"
        }
        response = api_client.post(
            f"{BASE_URL}/api/applications?user_id={users['renter']}", 
            json=application_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data.get("status") == "submitted"
        print(f"Application created: {data['id']}")
        return data["id"]
    
    def test_get_user_applications(self, api_client, users):
        """Test getting applications for a user"""
        response = api_client.get(f"{BASE_URL}/api/applications/user/{users['renter']}")
        assert response.status_code == 200
        applications = response.json()
        assert isinstance(applications, list)
        print(f"User has {len(applications)} applications")
    
    def test_get_landlord_applications(self, api_client, users):
        """Test getting applications for a landlord"""
        response = api_client.get(f"{BASE_URL}/api/applications/landlord/{users['landlord']}")
        assert response.status_code == 200
        applications = response.json()
        assert isinstance(applications, list)
        print(f"Landlord has {len(applications)} applications")
    
    def test_update_application_status(self, api_client, users, listing_id):
        """Test updating application status by landlord"""
        # First create an application
        application_data = {
            "listing_id": listing_id,
            "full_name": "TEST_Status Test",
            "email": "statustest@example.com",
            "phone": "604-555-0000",
            "current_address": "789 Test Ave",
            "move_in_date": "2026-03-01"
        }
        create_response = api_client.post(
            f"{BASE_URL}/api/applications?user_id={users['renter']}", 
            json=application_data
        )
        assert create_response.status_code == 200
        app_id = create_response.json()["id"]
        
        # Update to under_review
        response = api_client.put(
            f"{BASE_URL}/api/applications/{app_id}/status?status=under_review&landlord_id={users['landlord']}"
        )
        assert response.status_code == 200
        assert response.json().get("status") == "updated"
        print(f"Application status updated to under_review")
        
        # Update to approved
        response = api_client.put(
            f"{BASE_URL}/api/applications/{app_id}/status?status=approved&landlord_id={users['landlord']}"
        )
        assert response.status_code == 200
        assert response.json().get("status") == "updated"
        print(f"Application status updated to approved")


class TestMaintenanceRequests:
    """Maintenance request system tests"""
    
    def test_create_maintenance_request(self, api_client, users):
        """Test creating a maintenance request"""
        request_data = {
            "title": "TEST_Leaky faucet in kitchen",
            "description": "The kitchen faucet has been dripping for 2 days",
            "category": "plumbing",
            "priority": "medium",
            "images": []
        }
        response = api_client.post(
            f"{BASE_URL}/api/maintenance?user_id={users['renter']}", 
            json=request_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data.get("status") == "submitted"
        print(f"Maintenance request created: {data['id']}")
        return data["id"]
    
    def test_create_emergency_maintenance(self, api_client, users):
        """Test creating an emergency maintenance request"""
        request_data = {
            "title": "TEST_No hot water",
            "description": "Hot water heater is not working",
            "category": "hvac",
            "priority": "emergency",
            "images": []
        }
        response = api_client.post(
            f"{BASE_URL}/api/maintenance?user_id={users['renter']}", 
            json=request_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"Emergency maintenance request created: {data['id']}")
    
    def test_get_user_maintenance_requests(self, api_client, users):
        """Test getting maintenance requests for a user"""
        response = api_client.get(f"{BASE_URL}/api/maintenance/user/{users['renter']}")
        assert response.status_code == 200
        requests = response.json()
        assert isinstance(requests, list)
        print(f"User has {len(requests)} maintenance requests")
    
    def test_get_landlord_maintenance_requests(self, api_client, users):
        """Test getting maintenance requests for landlord"""
        response = api_client.get(f"{BASE_URL}/api/maintenance/landlord/{users['landlord']}")
        assert response.status_code == 200
        requests = response.json()
        assert isinstance(requests, list)
        print(f"Landlord has {len(requests)} maintenance requests")
    
    def test_update_maintenance_status(self, api_client, users):
        """Test updating maintenance request status"""
        # First create a request
        request_data = {
            "title": "TEST_Status update test",
            "description": "Testing status updates",
            "category": "electrical",
            "priority": "low"
        }
        create_response = api_client.post(
            f"{BASE_URL}/api/maintenance?user_id={users['renter']}", 
            json=request_data
        )
        assert create_response.status_code == 200
        req_id = create_response.json()["id"]
        
        # Update to in_progress
        response = api_client.put(
            f"{BASE_URL}/api/maintenance/{req_id}", 
            json={"status": "in_progress"}
        )
        assert response.status_code == 200
        print(f"Maintenance request status updated to in_progress")
        
        # Update to completed
        response = api_client.put(
            f"{BASE_URL}/api/maintenance/{req_id}", 
            json={"status": "completed", "cost": 150.00}
        )
        assert response.status_code == 200
        print(f"Maintenance request completed with cost")


class TestContractorJobs:
    """Contractor job marketplace tests"""
    
    def test_create_job(self, api_client, users):
        """Test creating a contractor job posting"""
        job_data = {
            "title": "TEST_Kitchen Renovation",
            "description": "Need to renovate kitchen cabinets and countertops",
            "category": "carpentry",
            "location": "Vancouver, BC",
            "budget_min": 2000,
            "budget_max": 5000,
            "deadline": "2026-03-01"
        }
        response = api_client.post(
            f"{BASE_URL}/api/jobs?landlord_id={users['landlord']}", 
            json=job_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data.get("status") == "created"
        print(f"Job created: {data['id']}")
        return data["id"]
    
    def test_get_available_jobs(self, api_client):
        """Test getting available contractor jobs"""
        response = api_client.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        jobs = response.json()
        assert isinstance(jobs, list)
        print(f"Found {len(jobs)} available jobs")
        return jobs[0]["id"] if jobs else None
    
    def test_get_jobs_by_category(self, api_client):
        """Test filtering jobs by category"""
        response = api_client.get(f"{BASE_URL}/api/jobs?category=plumbing")
        assert response.status_code == 200
        jobs = response.json()
        assert isinstance(jobs, list)
        print(f"Found {len(jobs)} plumbing jobs")
    
    def test_get_landlord_jobs(self, api_client, users):
        """Test getting jobs posted by landlord"""
        response = api_client.get(f"{BASE_URL}/api/jobs/landlord/{users['landlord']}")
        assert response.status_code == 200
        jobs = response.json()
        assert isinstance(jobs, list)
        print(f"Landlord has {len(jobs)} posted jobs")
    
    def test_get_contractor_jobs(self, api_client, users):
        """Test getting jobs assigned to contractor"""
        response = api_client.get(f"{BASE_URL}/api/jobs/contractor/{users['contractor']}")
        assert response.status_code == 200
        jobs = response.json()
        assert isinstance(jobs, list)
        print(f"Contractor has {len(jobs)} assigned jobs")
    
    def test_submit_bid(self, api_client, users):
        """Test submitting a bid on a job"""
        # First create a job
        job_data = {
            "title": "TEST_Bid Test Job",
            "description": "Testing bid submission",
            "category": "plumbing",
            "location": "Vancouver, BC",
            "budget_min": 500,
            "budget_max": 1000
        }
        create_response = api_client.post(
            f"{BASE_URL}/api/jobs?landlord_id={users['landlord']}", 
            json=job_data
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["id"]
        
        # Submit a bid
        bid_data = {
            "contractor_id": users["contractor"],
            "amount": 750,
            "estimated_days": 3,
            "message": "I have 5 years of plumbing experience"
        }
        response = api_client.post(f"{BASE_URL}/api/jobs/{job_id}/bid", json=bid_data)
        assert response.status_code == 200
        data = response.json()
        assert "bid_id" in data
        assert data.get("status") == "submitted"
        print(f"Bid submitted: {data['bid_id']}")
        return job_id, data["bid_id"]
    
    def test_select_bid(self, api_client, users):
        """Test landlord selecting a winning bid"""
        # Create job
        job_data = {
            "title": "TEST_Select Bid Test",
            "description": "Testing bid selection",
            "category": "electrical",
            "location": "Vancouver, BC"
        }
        create_response = api_client.post(
            f"{BASE_URL}/api/jobs?landlord_id={users['landlord']}", 
            json=job_data
        )
        job_id = create_response.json()["id"]
        
        # Submit bid
        bid_data = {
            "contractor_id": users["contractor"],
            "amount": 500,
            "estimated_days": 2,
            "message": "Expert electrician here"
        }
        bid_response = api_client.post(f"{BASE_URL}/api/jobs/{job_id}/bid", json=bid_data)
        bid_id = bid_response.json()["bid_id"]
        
        # Select bid
        response = api_client.post(
            f"{BASE_URL}/api/jobs/{job_id}/select-bid?bid_id={bid_id}&landlord_id={users['landlord']}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "assigned"
        assert data.get("contractor_id") == users["contractor"]
        print(f"Bid selected, job assigned to contractor")


class TestListingManagement:
    """Landlord property listing management tests"""
    
    def test_get_landlord_listings(self, api_client, users):
        """Test getting landlord's listings"""
        response = api_client.get(f"{BASE_URL}/api/listings/landlord/{users['landlord']}")
        assert response.status_code == 200
        listings = response.json()
        assert isinstance(listings, list)
        print(f"Landlord has {len(listings)} listings")
    
    def test_update_listing(self, api_client, users, listing_id):
        """Test updating a listing"""
        updates = {
            "price": 2750,
            "description": "Updated description for testing"
        }
        response = api_client.put(
            f"{BASE_URL}/api/listings/{listing_id}?landlord_id={users['landlord']}", 
            json=updates
        )
        assert response.status_code == 200
        assert response.json().get("status") == "updated"
        print("Listing updated successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
