"""
Backend Tests for DOMMMA V2 - Contractor Marketplace, Landlord Properties, and Bookings
Tests: Contractor profiles/services/search, Landlord listings CRUD, Service bookings, Image upload
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data['message']}")

class TestContractorProfile:
    """Tests for contractor profile endpoints"""
    
    @pytest.fixture
    def contractor_user(self):
        """Create a test contractor user"""
        email = f"TEST_contractor_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "test123",
            "name": "Test Contractor",
            "user_type": "contractor"
        })
        assert response.status_code == 200, f"Failed to create contractor: {response.text}"
        return response.json()
    
    def test_create_contractor_profile(self, contractor_user):
        """POST /api/contractors/profile creates a contractor profile"""
        user_id = contractor_user["id"]
        profile_data = {
            "business_name": "TEST Pro Plumbing Services",
            "description": "Professional plumbing services for all your needs",
            "specialties": ["plumbing", "renovation"],
            "service_areas": ["Vancouver", "Burnaby"],
            "hourly_rate": 75.0,
            "years_experience": 10,
            "license_number": "PLB-12345",
            "insurance": True,
            "phone": "604-555-1234",
            "email": contractor_user["email"]
        }
        
        response = requests.post(f"{BASE_URL}/api/contractors/profile?user_id={user_id}", json=profile_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["business_name"] == "TEST Pro Plumbing Services"
        assert data["hourly_rate"] == 75.0
        assert "plumbing" in data["specialties"]
        assert "Vancouver" in data["service_areas"]
        print(f"✓ Created contractor profile: {data['business_name']}")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/contractors/profile/{user_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["business_name"] == "TEST Pro Plumbing Services"
        print("✓ Verified profile persistence with GET")
        
        return data

class TestContractorSearch:
    """Tests for contractor search endpoint"""
    
    def test_search_contractors_returns_list(self):
        """GET /api/contractors/search returns contractors"""
        response = requests.get(f"{BASE_URL}/api/contractors/search")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of contractors"
        print(f"✓ Contractor search returned {len(data)} contractors")
        
    def test_search_contractors_by_specialty(self):
        """Search contractors by specialty filter"""
        response = requests.get(f"{BASE_URL}/api/contractors/search?specialty=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Specialty filter returned {len(data)} contractors")
        
    def test_search_contractors_by_query(self):
        """Search contractors by query string"""
        response = requests.get(f"{BASE_URL}/api/contractors/search?q=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Query search returned {len(data)} contractors")

class TestContractorServices:
    """Tests for contractor services endpoints"""
    
    @pytest.fixture
    def contractor_with_profile(self):
        """Create contractor with profile for service tests"""
        email = f"TEST_svc_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "test123", "name": "Service Contractor", "user_type": "contractor"
        })
        user = reg_response.json()
        
        # Create profile
        requests.post(f"{BASE_URL}/api/contractors/profile?user_id={user['id']}", json={
            "business_name": "TEST Service Co",
            "specialties": ["plumbing"],
            "service_areas": ["Vancouver"]
        })
        return user
    
    def test_create_contractor_service(self, contractor_with_profile):
        """POST /api/contractors/services creates a service"""
        contractor_id = contractor_with_profile["id"]
        service_data = {
            "title": "TEST Pipe Repair Service",
            "description": "Expert pipe repair and replacement",
            "category": "plumbing",
            "price_type": "fixed",
            "price": 150.0,
            "duration_estimate": "2-4 hours"
        }
        
        response = requests.post(f"{BASE_URL}/api/contractors/services?contractor_id={contractor_id}", json=service_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["title"] == "TEST Pipe Repair Service"
        assert data["price"] == 150.0
        assert data["category"] == "plumbing"
        assert "id" in data
        print(f"✓ Created service: {data['title']} (${data['price']})")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/contractors/{contractor_id}/services")
        assert get_response.status_code == 200
        services = get_response.json()
        assert any(s["title"] == "TEST Pipe Repair Service" for s in services)
        print("✓ Service visible in contractor's services list")
        
        return data

class TestServiceSearch:
    """Tests for service search endpoint"""
    
    def test_search_services_returns_list(self):
        """GET /api/services/search returns services"""
        response = requests.get(f"{BASE_URL}/api/services/search")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of services"
        print(f"✓ Service search returned {len(data)} services")
        
    def test_search_services_by_category(self):
        """Search services by category"""
        response = requests.get(f"{BASE_URL}/api/services/search?category=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Category filter returned {len(data)} services")

class TestBookings:
    """Tests for service booking endpoints"""
    
    @pytest.fixture
    def booking_users(self):
        """Create a customer and contractor for booking tests"""
        customer_email = f"TEST_customer_{uuid.uuid4().hex[:8]}@test.com"
        contractor_email = f"TEST_contractor_{uuid.uuid4().hex[:8]}@test.com"
        
        customer = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": customer_email, "password": "test123", "name": "Test Customer", "user_type": "renter"
        }).json()
        
        contractor = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": contractor_email, "password": "test123", "name": "Test Contractor", "user_type": "contractor"
        }).json()
        
        # Create contractor profile
        requests.post(f"{BASE_URL}/api/contractors/profile?user_id={contractor['id']}", json={
            "business_name": "TEST Booking Contractor",
            "specialties": ["plumbing"],
            "service_areas": ["Vancouver"]
        })
        
        return {"customer": customer, "contractor": contractor}
    
    def test_create_booking(self, booking_users):
        """POST /api/bookings creates a booking"""
        customer_id = booking_users["customer"]["id"]
        contractor_id = booking_users["contractor"]["id"]
        
        booking_data = {
            "contractor_id": contractor_id,
            "service_id": None,
            "title": "TEST Kitchen Faucet Repair",
            "description": "Leaky faucet needs replacement",
            "preferred_date": "2026-02-15",
            "preferred_time": "morning",
            "address": "123 Test St, Vancouver",
            "notes": "Please call before arriving"
        }
        
        response = requests.post(f"{BASE_URL}/api/bookings?customer_id={customer_id}", json=booking_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["title"] == "TEST Kitchen Faucet Repair"
        assert data["status"] == "pending"
        assert "id" in data
        print(f"✓ Created booking: {data['title']} (status: {data['status']})")
        
        # Verify customer can see booking
        customer_bookings = requests.get(f"{BASE_URL}/api/bookings/customer/{customer_id}")
        assert customer_bookings.status_code == 200
        assert any(b["title"] == "TEST Kitchen Faucet Repair" for b in customer_bookings.json())
        print("✓ Booking visible in customer's bookings")
        
        # Verify contractor can see booking
        contractor_bookings = requests.get(f"{BASE_URL}/api/bookings/contractor/{contractor_id}")
        assert contractor_bookings.status_code == 200
        assert any(b["title"] == "TEST Kitchen Faucet Repair" for b in contractor_bookings.json())
        print("✓ Booking visible in contractor's bookings")
        
        return data

class TestLandlordListings:
    """Tests for landlord property listings"""
    
    @pytest.fixture
    def landlord_user(self):
        """Create a test landlord user"""
        email = f"TEST_landlord_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "test123", "name": "Test Landlord", "user_type": "landlord"
        })
        assert response.status_code == 200
        return response.json()
    
    def test_create_listing_for_landlord(self, landlord_user):
        """POST /api/listings/create creates a listing for a landlord"""
        landlord_id = landlord_user["id"]
        listing_data = {
            "title": "TEST Modern Downtown Apartment",
            "address": "456 Test Ave",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6B 1A1",
            "lat": 49.2827,
            "lng": -123.1207,
            "price": 2500,
            "bedrooms": 2,
            "bathrooms": 1.5,
            "sqft": 950,
            "property_type": "Apartment",
            "description": "Beautiful modern apartment in downtown",
            "amenities": ["Gym", "Rooftop Deck"],
            "images": [],
            "available_date": "2026-03-01",
            "pet_friendly": True,
            "parking": True
        }
        
        response = requests.post(f"{BASE_URL}/api/listings/create?landlord_id={landlord_id}", json=listing_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data["status"] == "created"
        print(f"✓ Created listing ID: {data['id']}")
        
        # Verify with landlord's listings endpoint
        landlord_listings = requests.get(f"{BASE_URL}/api/listings/landlord/{landlord_id}")
        assert landlord_listings.status_code == 200
        listings = landlord_listings.json()
        assert any(l["title"] == "TEST Modern Downtown Apartment" for l in listings)
        print("✓ Listing visible in landlord's listings")
        
        # Verify listing details
        for l in listings:
            if l["title"] == "TEST Modern Downtown Apartment":
                assert l["price"] == 2500
                assert l["bedrooms"] == 2
                assert l["pet_friendly"] == True
                assert l["landlord_id"] == landlord_id
        print("✓ Listing data verified")
        
        return data
    
    def test_get_landlord_listings(self, landlord_user):
        """GET /api/listings/landlord/{id} returns landlord listings"""
        landlord_id = landlord_user["id"]
        
        # First create a listing
        requests.post(f"{BASE_URL}/api/listings/create?landlord_id={landlord_id}", json={
            "title": "TEST Get Listings Test",
            "address": "789 Test Blvd",
            "city": "Vancouver", "province": "BC", "postal_code": "V6B 2B2",
            "lat": 49.28, "lng": -123.12, "price": 1800, "bedrooms": 1, "bathrooms": 1,
            "sqft": 600, "property_type": "Condo", "description": "Test listing"
        })
        
        response = requests.get(f"{BASE_URL}/api/listings/landlord/{landlord_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Landlord has {len(data)} listings")

class TestImageUpload:
    """Tests for image upload endpoint"""
    
    def test_upload_image(self):
        """POST /api/upload/image uploads an image"""
        # Create a simple test image (1x1 pixel PNG)
        import io
        # Minimal PNG file (1x1 transparent pixel)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  # IEND chunk
            0x42, 0x60, 0x82
        ])
        
        files = {"file": ("test_image.png", io.BytesIO(png_data), "image/png")}
        response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert "url" in data
        assert data["url"].startswith("data:image/png;base64,")
        print(f"✓ Image uploaded: ID={data['id'][:8]}...")

class TestListingsPublic:
    """Tests for public listings endpoints"""
    
    def test_get_listings(self):
        """GET /api/listings returns public listings"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Public listings returned {len(data)} properties")
        
    def test_get_listings_with_filters(self):
        """GET /api/listings with filters"""
        response = requests.get(f"{BASE_URL}/api/listings?min_price=1000&max_price=3000&bedrooms=1")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Filtered listings returned {len(data)} properties")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
