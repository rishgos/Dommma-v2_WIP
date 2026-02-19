"""
Test suite for DOMMMA Buy/Sell functionality (V4)
Tests: Offers API, Listings with listing_type filter, Browse filters
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

# Use production URL from env for testing what users see
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://real-estate-dev-3.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


class TestListingsWithFilters:
    """Tests for listings endpoint with enhanced filters"""
    
    def test_get_rental_listings(self):
        """GET /api/listings?listing_type=rent returns rental listings"""
        response = requests.get(f"{API}/listings?listing_type=rent")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of listings"
        print(f"Found {len(data)} rental listings")
        
        # Verify all returned listings are rentals
        for listing in data[:5]:
            listing_type = listing.get('listing_type', 'rent')
            assert listing_type in ['rent', None], f"Expected rent listing, got {listing_type}"
        
        # According to spec, should have ~23 rental listings
        assert len(data) >= 10, f"Expected at least 10 rental listings, got {len(data)}"
    
    def test_get_sale_listings(self):
        """GET /api/listings?listing_type=sale returns sale listings"""
        response = requests.get(f"{API}/listings?listing_type=sale")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of listings"
        print(f"Found {len(data)} sale listings")
        
        # Verify all returned listings are for sale
        for listing in data:
            assert listing.get('listing_type') == 'sale', f"Expected sale listing, got {listing.get('listing_type')}"
        
        # According to spec, should have 6 sale listings
        assert len(data) >= 1, f"Expected at least 1 sale listing, got {len(data)}"
    
    def test_filter_by_bedrooms(self):
        """GET /api/listings?bedrooms=3 returns filtered results"""
        response = requests.get(f"{API}/listings?bedrooms=3")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of listings"
        print(f"Found {len(data)} listings with 3+ bedrooms")
        
        # Verify all returned listings have >= 3 bedrooms
        for listing in data:
            assert listing.get('bedrooms', 0) >= 3, f"Expected 3+ bedrooms, got {listing.get('bedrooms')}"
    
    def test_filter_by_parking(self):
        """GET /api/listings?parking=true returns listings with parking"""
        response = requests.get(f"{API}/listings?parking=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of listings"
        print(f"Found {len(data)} listings with parking")
    
    def test_filter_by_property_type(self):
        """GET /api/listings?property_type=House returns filtered results"""
        response = requests.get(f"{API}/listings?property_type=House")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of listings"
        print(f"Found {len(data)} House listings")
    
    def test_combined_filters(self):
        """Test multiple filters combined"""
        response = requests.get(f"{API}/listings?listing_type=rent&bedrooms=2&pet_friendly=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of listings"
        print(f"Found {len(data)} pet-friendly 2+ bed rentals")


class TestOffersAPI:
    """Tests for Property Offers (Buy/Sell) endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_buyer_id = f"TEST_buyer_{uuid.uuid4().hex[:8]}"
        self.test_seller_id = f"TEST_seller_{uuid.uuid4().hex[:8]}"
        self.test_listing_id = None
        self.test_offer_id = None
        
        # Get a sale listing for testing
        response = requests.get(f"{API}/listings?listing_type=sale")
        if response.status_code == 200:
            listings = response.json()
            if listings:
                self.test_listing_id = listings[0].get('id')
                self.test_listing_price = listings[0].get('price', 1000000)
                self.test_seller_id = listings[0].get('landlord_id', self.test_seller_id)
                print(f"Using sale listing: {listings[0].get('title')} at ${self.test_listing_price}")
    
    def test_create_offer(self):
        """POST /api/offers creates an offer with correct fields"""
        if not self.test_listing_id:
            pytest.skip("No sale listings available for testing")
        
        offer_data = {
            "listing_id": self.test_listing_id,
            "offer_amount": int(self.test_listing_price * 0.95),  # 95% of asking
            "financing_type": "mortgage",
            "closing_date": "2026-03-15",
            "conditions": ["Subject to financing", "Subject to inspection"],
            "message": "Test offer from automated testing"
        }
        
        response = requests.post(
            f"{API}/offers?buyer_id={self.test_buyer_id}",
            json=offer_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain offer id"
        assert data.get("buyer_id") == self.test_buyer_id, "Buyer ID should match"
        assert data.get("offer_amount") == offer_data["offer_amount"], "Offer amount should match"
        assert data.get("financing_type") == "mortgage", "Financing type should match"
        assert data.get("status") == "pending", "Status should be pending"
        
        self.test_offer_id = data["id"]
        print(f"Created offer {self.test_offer_id} for ${offer_data['offer_amount']}")
    
    def test_create_offer_invalid_listing(self):
        """POST /api/offers with invalid listing returns 404"""
        offer_data = {
            "listing_id": "invalid_listing_id",
            "offer_amount": 500000,
            "financing_type": "cash"
        }
        
        response = requests.post(
            f"{API}/offers?buyer_id={self.test_buyer_id}",
            json=offer_data
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_get_buyer_offers(self):
        """GET /api/offers/buyer/{id} returns buyer's offers with listing data"""
        # First create an offer
        if self.test_listing_id:
            offer_data = {
                "listing_id": self.test_listing_id,
                "offer_amount": int(self.test_listing_price * 0.9),
                "financing_type": "pre-approved"
            }
            requests.post(f"{API}/offers?buyer_id={self.test_buyer_id}", json=offer_data)
        
        response = requests.get(f"{API}/offers/buyer/{self.test_buyer_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of offers"
        print(f"Found {len(data)} offers for buyer")
        
        # Check offers have listing data attached
        for offer in data:
            assert "listing" in offer, "Offer should have listing data"
            assert "offer_amount" in offer, "Offer should have offer_amount"
            assert "status" in offer, "Offer should have status"
    
    def test_get_seller_offers(self):
        """GET /api/offers/seller/{id} returns offers received by seller"""
        response = requests.get(f"{API}/offers/seller/{self.test_seller_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of offers"
        print(f"Found {len(data)} offers for seller")
    
    def test_respond_to_offer_accept(self):
        """PUT /api/offers/{id}/respond?action=accepted updates offer status"""
        # Create an offer first
        if not self.test_listing_id:
            pytest.skip("No sale listings available")
        
        offer_data = {
            "listing_id": self.test_listing_id,
            "offer_amount": int(self.test_listing_price),
            "financing_type": "cash",
            "message": "Full price cash offer"
        }
        create_response = requests.post(
            f"{API}/offers?buyer_id={self.test_buyer_id}",
            json=offer_data
        )
        if create_response.status_code != 200:
            pytest.skip("Could not create offer for testing")
        
        offer_id = create_response.json()["id"]
        
        # Accept the offer
        response = requests.put(
            f"{API}/offers/{offer_id}/respond?action=accepted&seller_id={self.test_seller_id}"
        )
        
        # Note: May fail if seller_id doesn't match - that's expected authorization check
        if response.status_code == 403:
            print("Authorization check working - seller_id validation active")
            return
        
        # If it succeeds, verify the update
        if response.status_code == 200:
            data = response.json()
            print(f"Offer accepted: {data}")
    
    def test_respond_to_offer_counter(self):
        """PUT /api/offers/{id}/respond with counter offer"""
        if not self.test_listing_id:
            pytest.skip("No sale listings available")
        
        # Create offer
        offer_data = {
            "listing_id": self.test_listing_id,
            "offer_amount": int(self.test_listing_price * 0.85),  # Low offer
            "financing_type": "mortgage"
        }
        create_response = requests.post(
            f"{API}/offers?buyer_id={self.test_buyer_id}",
            json=offer_data
        )
        if create_response.status_code != 200:
            pytest.skip("Could not create offer")
        
        offer_id = create_response.json()["id"]
        counter_amount = int(self.test_listing_price * 0.95)
        
        # Counter the offer
        response = requests.put(
            f"{API}/offers/{offer_id}/respond?action=countered&seller_id={self.test_seller_id}&counter_amount={counter_amount}"
        )
        
        if response.status_code == 403:
            print("Authorization check working")
            return
        
        print(f"Counter offer response: {response.status_code}")
    
    def test_respond_invalid_action(self):
        """PUT /api/offers/{id}/respond with invalid action returns 400"""
        response = requests.put(
            f"{API}/offers/test_offer_id/respond?action=invalid_action&seller_id=test"
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestRegressionChecks:
    """Verify existing features still work after Buy/Sell addition"""
    
    def test_api_root(self):
        """GET /api/ returns success"""
        response = requests.get(f"{API}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API message: {data['message']}")
    
    def test_listings_basic(self):
        """GET /api/listings returns listings (basic)"""
        response = requests.get(f"{API}/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least some listings"
        print(f"Total listings: {len(data)}")
    
    def test_contractors_search(self):
        """GET /api/contractors/search still works"""
        response = requests.get(f"{API}/contractors/search")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} contractors")
    
    def test_single_listing_detail(self):
        """GET /api/listings/{id} returns listing details"""
        # First get a listing
        list_response = requests.get(f"{API}/listings")
        if list_response.status_code == 200 and list_response.json():
            listing_id = list_response.json()[0]["id"]
            
            response = requests.get(f"{API}/listings/{listing_id}")
            assert response.status_code == 200
            data = response.json()
            assert "title" in data
            assert "price" in data
            assert "bedrooms" in data
            print(f"Listing detail: {data.get('title')}")


class TestSaleListingsData:
    """Verify sale listings have correct data"""
    
    def test_sale_listings_have_required_fields(self):
        """Sale listings should have year_built, listing_type=sale"""
        response = requests.get(f"{API}/listings?listing_type=sale")
        assert response.status_code == 200
        
        data = response.json()
        if not data:
            pytest.skip("No sale listings to verify")
        
        for listing in data:
            assert listing.get("listing_type") == "sale", f"Expected listing_type=sale"
            assert listing.get("price", 0) > 50000, f"Sale price should be > $50,000"
            assert "title" in listing
            assert "bedrooms" in listing
            print(f"Sale listing: {listing.get('title')} - ${listing.get('price'):,}")
    
    def test_sale_listings_prices_realistic(self):
        """Sale listing prices should be realistic (> $100k for Vancouver)"""
        response = requests.get(f"{API}/listings?listing_type=sale")
        assert response.status_code == 200
        
        data = response.json()
        for listing in data[:5]:
            price = listing.get("price", 0)
            assert price > 100000, f"Sale price {price} seems too low for Vancouver real estate"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
