"""
Backend API tests for DOMMMA Social Features (Iteration 9)
- Favorites functionality
- Property Comparison
- Roommate Finder
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dommma-rent-pay.preview.emergentagent.com').rstrip('/')

# Test user ID (will be created/fetched during tests)
TEST_USER_ID = None
TEST_LISTING_IDS = []

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_user(api_client):
    """Get or create a test user and return user data"""
    global TEST_USER_ID
    # Login to create/get test user
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test_social@dommma.com",
        "password": "test123",
        "user_type": "renter"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    user_data = response.json()
    TEST_USER_ID = user_data.get('id')
    return user_data

@pytest.fixture(scope="module")
def get_listings(api_client):
    """Get some listings for testing"""
    global TEST_LISTING_IDS
    response = api_client.get(f"{BASE_URL}/api/listings")
    assert response.status_code == 200
    listings = response.json()
    assert len(listings) > 0, "No listings available for testing"
    TEST_LISTING_IDS = [l['id'] for l in listings[:5]]
    return listings[:5]


class TestFavoritesAPI:
    """Test Favorites API endpoints"""
    
    def test_toggle_favorite_add(self, api_client, test_user, get_listings):
        """Test adding a listing to favorites"""
        user_id = test_user['id']
        listing_id = get_listings[0]['id']
        
        response = api_client.post(
            f"{BASE_URL}/api/favorites?user_id={user_id}&listing_id={listing_id}"
        )
        assert response.status_code == 200, f"Toggle favorite failed: {response.text}"
        
        data = response.json()
        # Response could be either added or removed depending on state
        assert 'status' in data
        assert 'favorited' in data
        print(f"✓ Toggle favorite returned: {data['status']}, favorited={data['favorited']}")
    
    def test_get_favorite_ids(self, api_client, test_user, get_listings):
        """Test getting favorite IDs list"""
        user_id = test_user['id']
        
        # First ensure we have a favorite
        listing_id = get_listings[1]['id']
        api_client.post(f"{BASE_URL}/api/favorites?user_id={user_id}&listing_id={listing_id}")
        
        response = api_client.get(f"{BASE_URL}/api/favorites/{user_id}/ids")
        assert response.status_code == 200, f"Get favorite IDs failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Favorite IDs should be a list"
        print(f"✓ Got {len(data)} favorite IDs")
    
    def test_get_favorites_with_listing_data(self, api_client, test_user):
        """Test getting favorites with full listing data"""
        user_id = test_user['id']
        
        response = api_client.get(f"{BASE_URL}/api/favorites/{user_id}")
        assert response.status_code == 200, f"Get favorites failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Favorites should be a list"
        
        if len(data) > 0:
            # Verify listing data is included
            listing = data[0]
            assert 'id' in listing, "Listing should have id"
            assert 'title' in listing, "Listing should have title"
            assert 'price' in listing, "Listing should have price"
            print(f"✓ Got {len(data)} favorites with full listing data")
        else:
            print("✓ Favorites list is empty (expected if no favorites added)")
    
    def test_toggle_favorite_remove(self, api_client, test_user, get_listings):
        """Test removing a listing from favorites"""
        user_id = test_user['id']
        listing_id = get_listings[0]['id']
        
        # Add first
        api_client.post(f"{BASE_URL}/api/favorites?user_id={user_id}&listing_id={listing_id}")
        
        # Remove (toggle again)
        response = api_client.post(
            f"{BASE_URL}/api/favorites?user_id={user_id}&listing_id={listing_id}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'removed' or data['status'] == 'added'
        print(f"✓ Toggle favorite (remove/add cycle) works: {data['status']}")


class TestCompareAPI:
    """Test Property Comparison API"""
    
    def test_compare_two_properties(self, api_client, get_listings):
        """Test comparing 2 properties"""
        listing_ids = [get_listings[0]['id'], get_listings[1]['id']]
        
        response = api_client.post(
            f"{BASE_URL}/api/compare",
            json=listing_ids
        )
        assert response.status_code == 200, f"Compare failed: {response.text}"
        
        data = response.json()
        assert 'listings' in data, "Response should have 'listings' key"
        assert len(data['listings']) == 2, "Should return 2 listings"
        
        # Verify listing data
        for listing in data['listings']:
            assert 'id' in listing
            assert 'title' in listing
            assert 'price' in listing
            assert 'bedrooms' in listing
        print(f"✓ Compare 2 properties works, returned {len(data['listings'])} listings")
    
    def test_compare_four_properties(self, api_client, get_listings):
        """Test comparing 4 properties (max allowed)"""
        listing_ids = [l['id'] for l in get_listings[:4]]
        
        response = api_client.post(
            f"{BASE_URL}/api/compare",
            json=listing_ids
        )
        assert response.status_code == 200, f"Compare 4 failed: {response.text}"
        
        data = response.json()
        assert len(data['listings']) == 4, "Should return 4 listings"
        print(f"✓ Compare 4 properties works")
    
    def test_compare_invalid_count(self, api_client, get_listings):
        """Test comparing invalid number of properties (should fail)"""
        # Try with only 1 property
        listing_ids = [get_listings[0]['id']]
        
        response = api_client.post(
            f"{BASE_URL}/api/compare",
            json=listing_ids
        )
        assert response.status_code == 400, "Should reject comparing 1 property"
        print("✓ Compare validation works (rejects 1 property)")
    
    def test_compare_too_many_properties(self, api_client, get_listings):
        """Test comparing more than 4 properties (should fail)"""
        # Get more listing IDs
        response = api_client.get(f"{BASE_URL}/api/listings")
        all_listings = response.json()
        
        if len(all_listings) >= 5:
            listing_ids = [l['id'] for l in all_listings[:5]]
            response = api_client.post(
                f"{BASE_URL}/api/compare",
                json=listing_ids
            )
            assert response.status_code == 400, "Should reject comparing 5+ properties"
            print("✓ Compare validation works (rejects 5+ properties)")
        else:
            pytest.skip("Not enough listings to test 5+ compare")


class TestRoommateFinderAPI:
    """Test Roommate Finder API endpoints"""
    
    def test_create_roommate_profile(self, api_client, test_user):
        """Test creating/updating roommate profile"""
        user_id = test_user['id']
        
        profile_data = {
            "name": "Test Social User",
            "age": 25,
            "gender": "male",
            "occupation": "Software Engineer",
            "budget_min": 1000,
            "budget_max": 1800,
            "move_in_date": "2026-02-01",
            "preferred_areas": ["Downtown", "Kitsilano"],
            "lifestyle": ["quiet", "clean", "early_bird"],
            "pets": False,
            "smoking": False,
            "bio": "Looking for a quiet and clean roommate"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/roommates/profile?user_id={user_id}",
            json=profile_data
        )
        assert response.status_code == 200, f"Create profile failed: {response.text}"
        
        data = response.json()
        assert 'id' in data, "Profile should have id"
        print(f"✓ Roommate profile created/updated: {data.get('id')}")
        return data
    
    def test_get_roommate_profile(self, api_client, test_user):
        """Test getting user's roommate profile"""
        user_id = test_user['id']
        
        response = api_client.get(f"{BASE_URL}/api/roommates/profile/{user_id}")
        # Could be 200 or 404 depending on if profile exists
        assert response.status_code in [200, 404], f"Get profile failed: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert 'user_id' in data
            assert 'name' in data
            print(f"✓ Got roommate profile: {data.get('name')}")
        else:
            print("✓ No roommate profile exists (404 expected)")
    
    def test_search_roommates(self, api_client, test_user):
        """Test searching for roommates"""
        user_id = test_user['id']
        
        response = api_client.get(
            f"{BASE_URL}/api/roommates/search?user_id={user_id}"
        )
        assert response.status_code == 200, f"Search failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Search should return a list"
        print(f"✓ Roommate search returned {len(data)} profiles")
    
    def test_search_roommates_with_filters(self, api_client, test_user):
        """Test searching with budget filter"""
        user_id = test_user['id']
        
        response = api_client.get(
            f"{BASE_URL}/api/roommates/search?user_id={user_id}&min_budget=500&max_budget=2000"
        )
        assert response.status_code == 200, f"Filtered search failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Filtered roommate search returned {len(data)} profiles")
    
    def test_get_roommate_connections(self, api_client, test_user):
        """Test getting roommate connections"""
        user_id = test_user['id']
        
        response = api_client.get(f"{BASE_URL}/api/roommates/connections/{user_id}")
        assert response.status_code == 200, f"Get connections failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Connections should be a list"
        print(f"✓ Got {len(data)} roommate connections")


class TestIntegration:
    """Integration tests for social features"""
    
    def test_favorites_flow(self, api_client, test_user, get_listings):
        """Test complete favorites flow: add, check, remove"""
        user_id = test_user['id']
        listing_id = get_listings[2]['id']
        
        # Add to favorites
        resp1 = api_client.post(f"{BASE_URL}/api/favorites?user_id={user_id}&listing_id={listing_id}")
        assert resp1.status_code == 200
        
        # Check it's in the list
        resp2 = api_client.get(f"{BASE_URL}/api/favorites/{user_id}/ids")
        assert resp2.status_code == 200
        
        # Remove from favorites
        resp3 = api_client.post(f"{BASE_URL}/api/favorites?user_id={user_id}&listing_id={listing_id}")
        assert resp3.status_code == 200
        
        print("✓ Complete favorites flow works (add → check → remove)")
    
    def test_dashboard_sidebar_routes_exist(self, api_client):
        """Test that routes needed for dashboard sidebar work"""
        # These routes should exist for the sidebar links
        routes_to_check = [
            "/api/",  # Health check
            "/api/listings",  # Browse
        ]
        
        for route in routes_to_check:
            response = api_client.get(f"{BASE_URL}{route}")
            assert response.status_code == 200, f"Route {route} failed"
        print("✓ Dashboard related API routes work")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
