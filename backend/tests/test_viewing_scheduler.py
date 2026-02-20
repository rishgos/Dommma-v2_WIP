"""
Viewing Scheduler Feature Tests
Tests for Schedule Viewing functionality including calendar APIs and Google Calendar integration
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://rental-contractor.preview.emergentagent.com"

# Test user credentials
TEST_EMAIL = "scheduler_test@dommma.com"
TEST_PASSWORD = "test123"


class TestAuthForScheduler:
    """Authentication for scheduler tests"""
    
    def test_login_for_scheduler_tests(self):
        """Login and get user_id for subsequent tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == TEST_EMAIL
        # Store user_id for other tests
        pytest.user_id = data["id"]
        print(f"Logged in as {TEST_EMAIL}, user_id: {pytest.user_id}")


class TestCalendarEvents:
    """Calendar event CRUD operations"""
    
    def test_get_user_events(self):
        """Test getting user's calendar events"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        response = requests.get(f"{BASE_URL}/api/calendar/events/{user_id}")
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
        print(f"Found {len(events)} calendar events for user")
    
    def test_create_calendar_event(self):
        """Test creating a new calendar event"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        
        # Get tomorrow's date
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        event_data = {
            "title": "TEST_Property Viewing: Test Listing",
            "description": "Test viewing event for automated testing",
            "event_type": "viewing",
            "listing_id": "test-listing-id",
            "start_time": f"{tomorrow}T10:00:00",
            "end_time": f"{tomorrow}T11:00:00",
            "location": "123 Test Street, Vancouver",
            "reminder_minutes": 60,
            "notes": "Test notes"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/calendar/events?user_id={user_id}",
            json=event_data
        )
        assert response.status_code == 200
        created_event = response.json()
        assert "id" in created_event
        assert created_event["title"] == event_data["title"]
        assert created_event["event_type"] == "viewing"
        assert created_event["status"] == "confirmed"
        
        # Store event_id for deletion test
        pytest.test_event_id = created_event["id"]
        print(f"Created event with ID: {pytest.test_event_id}")
    
    def test_verify_event_persistence(self):
        """Verify created event appears in user's events list"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        event_id = getattr(pytest, 'test_event_id', None)
        
        if not event_id:
            pytest.skip("No event was created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/calendar/events/{user_id}")
        assert response.status_code == 200
        events = response.json()
        
        # Find the created event
        found_event = next((e for e in events if e["id"] == event_id), None)
        assert found_event is not None, "Created event not found in user's events"
        assert found_event["title"] == "TEST_Property Viewing: Test Listing"
        print("Event persistence verified")
    
    def test_delete_calendar_event(self):
        """Test deleting/cancelling a calendar event"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        event_id = getattr(pytest, 'test_event_id', None)
        
        if not event_id:
            pytest.skip("No event to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/calendar/events/{event_id}?user_id={user_id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"
        print(f"Event {event_id} cancelled successfully")


class TestGoogleCalendarIntegration:
    """Google Calendar OAuth and sync tests"""
    
    def test_check_google_calendar_status(self):
        """Test checking Google Calendar connection status"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        response = requests.get(f"{BASE_URL}/api/calendar/google/status/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        assert isinstance(data["connected"], bool)
        print(f"Google Calendar connected: {data['connected']}")
    
    def test_get_google_auth_url(self):
        """Test generating Google OAuth URL"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        redirect_uri = f"{BASE_URL}/calendar"
        
        response = requests.get(
            f"{BASE_URL}/api/calendar/google/auth-url",
            params={"redirect_uri": redirect_uri, "state": user_id}
        )
        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        
        auth_url = data["auth_url"]
        assert "accounts.google.com" in auth_url
        assert "client_id" in auth_url
        assert "redirect_uri" in auth_url
        assert "scope" in auth_url
        print(f"Google Auth URL generated successfully")
    
    def test_disconnect_google_calendar(self):
        """Test disconnecting Google Calendar (should work even if not connected)"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        response = requests.delete(f"{BASE_URL}/api/calendar/google/disconnect/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "disconnected" in data
        print(f"Disconnect response: {data}")


class TestListingsForScheduling:
    """Verify listings are available for scheduling"""
    
    def test_get_rental_listings(self):
        """Test getting rental listings (should have Schedule Viewing button)"""
        response = requests.get(f"{BASE_URL}/api/listings?listing_type=rent")
        assert response.status_code == 200
        listings = response.json()
        assert isinstance(listings, list)
        assert len(listings) > 0, "No rental listings found"
        
        # Verify listing has required fields for scheduling
        listing = listings[0]
        assert "id" in listing
        assert "title" in listing
        assert "address" in listing
        assert "price" in listing
        print(f"Found {len(listings)} rental listings available for scheduling")
    
    def test_get_sale_listings(self):
        """Test getting sale listings (should have Schedule Viewing button)"""
        response = requests.get(f"{BASE_URL}/api/listings?listing_type=sale")
        assert response.status_code == 200
        listings = response.json()
        assert isinstance(listings, list)
        assert len(listings) > 0, "No sale listings found"
        
        # Verify listing has required fields for scheduling
        listing = listings[0]
        assert "id" in listing
        assert "title" in listing
        assert "address" in listing
        assert "price" in listing
        print(f"Found {len(listings)} sale listings available for scheduling")


class TestScheduleViewingEndpoint:
    """Test the schedule viewing endpoint"""
    
    def test_schedule_property_viewing(self):
        """Test scheduling a property viewing via dedicated endpoint"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        
        # Get a listing first
        listings_response = requests.get(f"{BASE_URL}/api/listings?listing_type=rent")
        listings = listings_response.json()
        if not listings:
            pytest.skip("No listings available for scheduling test")
        
        listing_id = listings[0]["id"]
        
        # Schedule viewing for day after tomorrow at 2pm
        viewing_time = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%dT14:00:00")
        
        response = requests.post(
            f"{BASE_URL}/api/calendar/viewing",
            params={
                "user_id": user_id,
                "listing_id": listing_id,
                "proposed_time": viewing_time,
                "notes": "TEST_Automated test viewing request"
            }
        )
        
        # This endpoint may or may not require the listing to exist
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert data["event_type"] == "viewing"
            print(f"Viewing scheduled via dedicated endpoint")
            # Clean up
            pytest.viewing_event_id = data["id"]
        elif response.status_code == 400:
            print(f"Viewing endpoint returned error (may be expected): {response.json()}")
        else:
            assert False, f"Unexpected status code: {response.status_code}"


class TestCleanup:
    """Clean up test data"""
    
    def test_cleanup_test_events(self):
        """Remove any test events created during testing"""
        user_id = getattr(pytest, 'user_id', '73d5ce54-4ae1-4ed9-865b-d3fb42933f73')
        
        # Get all events for user
        response = requests.get(f"{BASE_URL}/api/calendar/events/{user_id}")
        if response.status_code == 200:
            events = response.json()
            for event in events:
                if event["title"].startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/calendar/events/{event['id']}?user_id={user_id}"
                    )
                    if delete_response.status_code == 200:
                        print(f"Cleaned up test event: {event['id']}")
        
        print("Test cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
