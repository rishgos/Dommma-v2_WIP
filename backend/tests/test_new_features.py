"""
Test suite for DOMMMA Iteration 10 new features:
- Moving Quote service (simulated pricing)
- Calendar/scheduling with Google Calendar integration
- Contractor Portfolio pages
- PWA manifest
- AI Roommate Compatibility scoring
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rental-contractor.preview.emergentagent.com').rstrip('/')


class TestMovingQuoteService:
    """Moving Quote API tests"""
    
    def test_get_pricing_info(self):
        """Test pricing info endpoint returns expected structure"""
        response = requests.get(f"{BASE_URL}/api/moving/pricing-info")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "home_sizes" in data
        assert "special_items" in data
        assert "services" in data
        assert "notes" in data
        
        # Verify home sizes data
        assert len(data["home_sizes"]) >= 6  # studio, 1br, 2br, 3br, 4br+, house
        for size in data["home_sizes"]:
            assert "value" in size
            assert "label" in size
            assert "estimated_hours" in size
    
    def test_generate_moving_quote_basic(self):
        """Test basic moving quote generation"""
        quote_request = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "Kitsilano Vancouver",
            "move_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "home_size": "2br",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False,
            "storage_duration_months": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=quote_request)
        assert response.status_code == 200
        data = response.json()
        
        # Verify quote structure
        assert "id" in data
        assert "estimated_cost_low" in data
        assert "estimated_cost_high" in data
        assert "estimated_hours" in data
        assert "distance_km" in data
        assert "truck_size" in data
        assert "crew_size" in data
        
        # Verify cost makes sense
        assert data["estimated_cost_low"] > 0
        assert data["estimated_cost_high"] > data["estimated_cost_low"]
        assert data["truck_size"] == "medium"  # 2br should be medium truck
        assert data["crew_size"] == 3  # medium truck has 3 crew
    
    def test_moving_quote_with_special_items(self):
        """Test quote with special items increases cost"""
        base_request = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "Burnaby",
            "move_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "home_size": "2br",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        # Get base quote
        response_base = requests.post(f"{BASE_URL}/api/moving/quote", json=base_request)
        assert response_base.status_code == 200
        base_cost = response_base.json()["estimated_cost_high"]
        
        # Get quote with special items
        request_with_items = base_request.copy()
        request_with_items["special_items"] = ["piano", "pool_table"]  # +$550
        
        response_items = requests.post(f"{BASE_URL}/api/moving/quote", json=request_with_items)
        assert response_items.status_code == 200
        items_cost = response_items.json()["estimated_cost_high"]
        
        # Cost with items should be higher
        assert items_cost > base_cost
    
    def test_moving_quote_with_packing_service(self):
        """Test quote with packing service multiplies cost"""
        base_request = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "Richmond",
            "move_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "home_size": "1br",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        response_base = requests.post(f"{BASE_URL}/api/moving/quote", json=base_request)
        assert response_base.status_code == 200
        base_cost = response_base.json()["estimated_cost_high"]
        
        # With packing service
        packing_request = base_request.copy()
        packing_request["packing_service"] = True
        
        response_packing = requests.post(f"{BASE_URL}/api/moving/quote", json=packing_request)
        assert response_packing.status_code == 200
        packing_cost = response_packing.json()["estimated_cost_high"]
        packing_data = response_packing.json()
        
        # Packing should increase cost significantly (40% per config)
        assert packing_cost > base_cost * 1.3
        assert packing_data["includes_packing"] == True
    
    def test_moving_quote_floor_surcharge(self):
        """Test floor surcharge applied for stairs without elevator"""
        base_request = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "West End",
            "move_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "home_size": "studio",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        # With elevators
        response_elevator = requests.post(f"{BASE_URL}/api/moving/quote", json=base_request)
        assert response_elevator.status_code == 200
        elevator_cost = response_elevator.json()["estimated_cost_high"]
        
        # Without elevator on 5th floor destination
        stairs_request = base_request.copy()
        stairs_request["has_elevator_destination"] = False
        stairs_request["floor_destination"] = 5  # 4 floors = $200 surcharge
        
        response_stairs = requests.post(f"{BASE_URL}/api/moving/quote", json=stairs_request)
        assert response_stairs.status_code == 200
        stairs_cost = response_stairs.json()["estimated_cost_high"]
        stairs_data = response_stairs.json()
        
        # Stairs should be more expensive
        assert stairs_cost > elevator_cost
        assert any("Stair carry" in note for note in stairs_data.get("notes", []))


class TestCalendarService:
    """Calendar/scheduling API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_user_id = f"test-calendar-{datetime.now().strftime('%H%M%S')}"
    
    def test_create_event(self, setup):
        """Test creating a calendar event"""
        event_data = {
            "title": "Property Viewing Test",
            "description": "Testing calendar API",
            "event_type": "viewing",
            "start_time": (datetime.now() + timedelta(days=3)).isoformat() + "Z",
            "end_time": (datetime.now() + timedelta(days=3, hours=1)).isoformat() + "Z",
            "location": "123 Test St, Vancouver"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            params={"user_id": self.test_user_id},
            json=event_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"]
        assert data["user_id"] == self.test_user_id
        assert data["title"] == "Property Viewing Test"
        assert data["event_type"] == "viewing"
        assert data["status"] == "confirmed"
    
    def test_get_user_events(self, setup):
        """Test fetching user events"""
        # First create an event
        event_data = {
            "title": "Test Event",
            "event_type": "meeting",
            "start_time": (datetime.now() + timedelta(days=5)).isoformat() + "Z",
            "end_time": (datetime.now() + timedelta(days=5, hours=1)).isoformat() + "Z",
            "location": "Office"
        }
        requests.post(
            f"{BASE_URL}/api/calendar/events",
            params={"user_id": self.test_user_id},
            json=event_data
        )
        
        # Then fetch events
        response = requests.get(f"{BASE_URL}/api/calendar/events/{self.test_user_id}")
        assert response.status_code == 200
        events = response.json()
        
        assert isinstance(events, list)
        assert len(events) >= 1
        assert events[0]["user_id"] == self.test_user_id
    
    def test_schedule_property_viewing(self, setup):
        """Test scheduling a property viewing"""
        # First get a listing ID
        listings = requests.get(f"{BASE_URL}/api/listings").json()
        if listings:
            listing_id = listings[0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/calendar/viewing",
                params={
                    "user_id": self.test_user_id,
                    "listing_id": listing_id,
                    "proposed_time": (datetime.now() + timedelta(days=7)).isoformat() + "Z",
                    "notes": "Test viewing"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["event_type"] == "viewing"
            assert data["listing_id"] == listing_id
            assert "Property Viewing" in data["title"]
    
    def test_cancel_event(self, setup):
        """Test cancelling an event"""
        # Create event first
        event_data = {
            "title": "Event to Cancel",
            "event_type": "meeting",
            "start_time": (datetime.now() + timedelta(days=10)).isoformat() + "Z",
            "end_time": (datetime.now() + timedelta(days=10, hours=1)).isoformat() + "Z"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            params={"user_id": self.test_user_id},
            json=event_data
        )
        event_id = create_response.json()["id"]
        
        # Cancel the event
        response = requests.delete(
            f"{BASE_URL}/api/calendar/events/{event_id}",
            params={"user_id": self.test_user_id}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"
    
    def test_google_calendar_status(self, setup):
        """Test Google Calendar connection status check"""
        response = requests.get(f"{BASE_URL}/api/calendar/google/status/{self.test_user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        assert isinstance(data["connected"], bool)
    
    def test_google_auth_url_not_configured(self):
        """Test Google auth URL returns proper error when not configured"""
        response = requests.get(
            f"{BASE_URL}/api/calendar/google/auth-url",
            params={"redirect_uri": "http://localhost/callback"}
        )
        # Should return 400 when Google OAuth not configured
        assert response.status_code == 400
        assert "not configured" in response.json()["detail"].lower()


class TestPortfolioService:
    """Contractor Portfolio API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_contractor_id = f"test-portfolio-{datetime.now().strftime('%H%M%S')}"
    
    def test_get_portfolio_categories(self):
        """Test getting portfolio categories"""
        response = requests.get(f"{BASE_URL}/api/portfolio/categories")
        assert response.status_code == 200
        categories = response.json()
        
        assert isinstance(categories, list)
        assert len(categories) >= 10  # Should have many categories
        
        category_values = [c["value"] for c in categories]
        assert "plumbing" in category_values
        assert "electrical" in category_values
        assert "kitchen" in category_values
        assert "renovation" in category_values
    
    def test_create_portfolio_project(self, setup):
        """Test creating a portfolio project"""
        project_data = {
            "title": "Test Kitchen Renovation",
            "description": "Complete kitchen remodel with modern finishes",
            "category": "kitchen",
            "duration": "2 weeks",
            "cost_range": "$15,000 - $20,000"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/portfolio/project",
            params={"contractor_id": self.test_contractor_id},
            json=project_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"]
        assert data["contractor_id"] == self.test_contractor_id
        assert data["title"] == "Test Kitchen Renovation"
        assert data["category"] == "kitchen"
        assert data["status"] == "active"
    
    def test_get_contractor_portfolio(self, setup):
        """Test getting contractor's portfolio"""
        # Create a project first
        project_data = {
            "title": "Bathroom Remodel",
            "description": "Full bathroom renovation",
            "category": "bathroom"
        }
        requests.post(
            f"{BASE_URL}/api/portfolio/project",
            params={"contractor_id": self.test_contractor_id},
            json=project_data
        )
        
        # Fetch portfolio
        response = requests.get(f"{BASE_URL}/api/portfolio/contractor/{self.test_contractor_id}")
        assert response.status_code == 200
        projects = response.json()
        
        assert isinstance(projects, list)
        assert len(projects) >= 1
        assert all(p["contractor_id"] == self.test_contractor_id for p in projects)
    
    def test_update_portfolio_project(self, setup):
        """Test updating a portfolio project"""
        # Create project
        create_response = requests.post(
            f"{BASE_URL}/api/portfolio/project",
            params={"contractor_id": self.test_contractor_id},
            json={"title": "Original Title", "description": "Original", "category": "plumbing"}
        )
        project_id = create_response.json()["id"]
        
        # Update project
        response = requests.put(
            f"{BASE_URL}/api/portfolio/project/{project_id}",
            params={"contractor_id": self.test_contractor_id},
            json={"title": "Updated Title", "client_testimonial": "Great work!"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "updated"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/portfolio/project/{project_id}")
        assert get_response.json()["title"] == "Updated Title"
        assert get_response.json()["client_testimonial"] == "Great work!"
    
    def test_toggle_featured_project(self, setup):
        """Test toggling featured status"""
        # Create project
        create_response = requests.post(
            f"{BASE_URL}/api/portfolio/project",
            params={"contractor_id": self.test_contractor_id},
            json={"title": "Feature Test", "description": "Test", "category": "painting"}
        )
        project_id = create_response.json()["id"]
        
        # Toggle featured
        response = requests.post(
            f"{BASE_URL}/api/portfolio/project/{project_id}/feature",
            params={"contractor_id": self.test_contractor_id}
        )
        assert response.status_code == 200
        assert response.json()["featured"] == True
        
        # Toggle again
        response = requests.post(
            f"{BASE_URL}/api/portfolio/project/{project_id}/feature",
            params={"contractor_id": self.test_contractor_id}
        )
        assert response.json()["featured"] == False
    
    def test_delete_portfolio_project(self, setup):
        """Test deleting (soft delete) a portfolio project"""
        # Create project
        create_response = requests.post(
            f"{BASE_URL}/api/portfolio/project",
            params={"contractor_id": self.test_contractor_id},
            json={"title": "To Delete", "description": "Will be deleted", "category": "other"}
        )
        project_id = create_response.json()["id"]
        
        # Delete project
        response = requests.delete(
            f"{BASE_URL}/api/portfolio/project/{project_id}",
            params={"contractor_id": self.test_contractor_id}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"
        
        # Verify soft delete - project should not appear in portfolio list
        portfolio = requests.get(f"{BASE_URL}/api/portfolio/contractor/{self.test_contractor_id}").json()
        project_ids = [p["id"] for p in portfolio]
        assert project_id not in project_ids


class TestAICompatibilityService:
    """AI Roommate Compatibility API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_user_1 = f"compat-test-a-{datetime.now().strftime('%H%M%S')}"
        self.test_user_2 = f"compat-test-b-{datetime.now().strftime('%H%M%S')}"
        self.profile_1_id = None
        self.profile_2_id = None
        
        # Create two test profiles
        profile1_data = {
            "name": "Alice Test",
            "age": 28,
            "gender": "female",
            "occupation": "Engineer",
            "budget_min": 1000,
            "budget_max": 1500,
            "preferred_areas": ["Downtown", "Kitsilano"],
            "lifestyle": ["early_bird", "quiet"],
            "pets": False,
            "smoking": False,
            "bio": "Quiet professional"
        }
        
        profile2_data = {
            "name": "Bob Test",
            "age": 30,
            "gender": "male",
            "occupation": "Designer",
            "budget_min": 1200,
            "budget_max": 1600,
            "preferred_areas": ["Downtown", "Yaletown"],
            "lifestyle": ["early_bird", "quiet"],
            "pets": False,
            "smoking": False,
            "bio": "Creative professional"
        }
        
        r1 = requests.post(
            f"{BASE_URL}/api/roommates/profile",
            params={"user_id": self.test_user_1},
            json=profile1_data
        )
        self.profile_1_id = r1.json().get("id")
        
        r2 = requests.post(
            f"{BASE_URL}/api/roommates/profile",
            params={"user_id": self.test_user_2},
            json=profile2_data
        )
        self.profile_2_id = r2.json().get("id")
    
    def test_calculate_compatibility(self, setup):
        """Test basic compatibility calculation"""
        if not self.profile_1_id:
            pytest.skip("Profile not created")
        
        response = requests.post(
            f"{BASE_URL}/api/compatibility/calculate/{self.profile_1_id}",
            params={"use_ai": False}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["profile_id"] == self.profile_1_id
        assert "matches" in data
        assert "total_matches" in data
        assert isinstance(data["matches"], list)
    
    def test_get_top_matches(self, setup):
        """Test getting top roommate matches"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/matches/{self.test_user_1}",
            params={"limit": 5}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == self.test_user_1
        assert "matches" in data
        assert "total_available" in data
    
    def test_compatibility_score_between_profiles(self, setup):
        """Test getting specific compatibility score"""
        if not self.profile_1_id or not self.profile_2_id:
            pytest.skip("Profiles not created")
        
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{self.profile_1_id}/{self.profile_2_id}",
            params={"use_ai": False}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "compatibility" in data
        assert "total_score" in data["compatibility"]
        assert "breakdown" in data["compatibility"]
        assert "reasons" in data["compatibility"]
        
        # Verify breakdown categories
        breakdown = data["compatibility"]["breakdown"]
        assert "budget" in breakdown
        assert "location" in breakdown
        assert "lifestyle" in breakdown
        assert "habits" in breakdown
    
    def test_compatibility_score_structure(self, setup):
        """Test compatibility score has correct structure"""
        if not self.profile_1_id or not self.profile_2_id:
            pytest.skip("Profiles not created")
        
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{self.profile_1_id}/{self.profile_2_id}",
            params={"use_ai": False}
        )
        data = response.json()
        
        compat = data["compatibility"]
        assert compat["max_score"] == 100
        assert 0 <= compat["total_score"] <= 100
        assert compat["compatibility_level"] in ["excellent", "good", "moderate", "fair", "low"]


class TestPWAManifest:
    """PWA Manifest tests"""
    
    def test_manifest_accessible(self):
        """Test manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
    
    def test_manifest_structure(self):
        """Test manifest has required PWA fields"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        
        # Required PWA fields
        assert "name" in data
        assert "short_name" in data
        assert "start_url" in data
        assert "display" in data
        assert "background_color" in data
        assert "theme_color" in data
        assert "icons" in data
        
        # DOMMMA specific
        assert "DOMMMA" in data["name"]
        assert data["display"] == "standalone"
    
    def test_manifest_icons(self):
        """Test manifest has required icons"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        
        assert len(data["icons"]) >= 2
        
        sizes = [icon["sizes"] for icon in data["icons"]]
        assert "192x192" in sizes
        assert "512x512" in sizes


class TestDashboardIntegration:
    """Test dashboard sidebar links for new features"""
    
    def test_login_and_get_user(self):
        """Test user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_iter10@dommma.com",
            "password": "test123",
            "user_type": "renter"
        })
        assert response.status_code == 200
        data = response.json()
        # Login returns user directly, not wrapped in "user" key
        assert data["email"] == "test_iter10@dommma.com"
        assert data["user_type"] == "renter"
        return data
