import requests
import sys
from datetime import datetime
import json

class DOMMMAPITester:
    def __init__(self, base_url="https://nova-properties.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                print(f"✅ Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Returned {len(response_data)} items")
                    elif isinstance(response_data, dict) and 'message' in response_data:
                        print(f"   Message: {response_data['message']}")
                except:
                    pass
            else:
                print(f"❌ Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")

            self.log_test(name, success, f"Status {response.status_code}" if not success else "")
            return success, response.json() if success and response.content else {}

        except requests.RequestException as e:
            print(f"❌ Request failed: {str(e)}")
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
            self.log_test(name, False, f"Test error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200
        )

    def test_seed_data(self):
        """Test seeding sample data"""
        return self.run_test(
            "Seed Data",
            "POST", 
            "seed",
            200
        )

    def test_get_listings(self):
        """Test getting all listings"""
        return self.run_test(
            "Get All Listings",
            "GET",
            "listings",
            200
        )

    def test_get_listings_with_filters(self):
        """Test listings with various filters"""
        # Test city filter
        success1, data1 = self.run_test(
            "Filter by City (Vancouver)",
            "GET",
            "listings",
            200,
            params={"city": "Vancouver"}
        )

        # Test bedroom filter  
        success2, data2 = self.run_test(
            "Filter by Bedrooms (2+)",
            "GET",
            "listings",
            200,
            params={"bedrooms": 2}
        )

        # Test price range
        success3, data3 = self.run_test(
            "Filter by Price Range ($2000-$3000)",
            "GET",
            "listings",
            200,
            params={"min_price": 2000, "max_price": 3000}
        )

        # Test pet friendly
        success4, data4 = self.run_test(
            "Filter Pet Friendly",
            "GET",
            "listings",
            200,
            params={"pet_friendly": True}
        )

        return success1 and success2 and success3 and success4

    def test_get_listings_for_map(self):
        """Test map listings endpoint"""
        return self.run_test(
            "Get Listings for Map",
            "GET",
            "listings/map",
            200,
            params={
                "north_east_lat": 49.3,
                "north_east_lng": -123.0,
                "south_west_lat": 49.2,
                "south_west_lng": -123.2
            }
        )

    def test_chat_functionality(self):
        """Test Nova AI chat functionality"""
        # Test chat without session ID
        success1, response1 = self.run_test(
            "Nova Chat - New Session",
            "POST",
            "chat",
            200,
            data={
                "message": "Hi Nova, I'm looking for a 2 bedroom apartment in Vancouver under $3000"
            }
        )

        session_id = None
        if success1 and response1:
            session_id = response1.get('session_id')
            print(f"   Session ID: {session_id}")
            print(f"   Response preview: {response1.get('response', '')[:100]}...")

        # Test chat with session ID if we got one
        if session_id:
            success2, response2 = self.run_test(
                "Nova Chat - Continuing Session",
                "POST",
                "chat", 
                200,
                data={
                    "session_id": session_id,
                    "message": "What about pet friendly options?"
                }
            )
            return success1 and success2
        
        return success1

    def test_chat_history(self):
        """Test getting chat history"""
        # First create a chat session
        success, response = self.run_test(
            "Chat for History Test",
            "POST",
            "chat",
            200,
            data={"message": "Test message for history"}
        )
        
        if success and response:
            session_id = response.get('session_id')
            if session_id:
                return self.run_test(
                    "Get Chat History",
                    "GET",
                    f"chat/{session_id}/history",
                    200
                )
        
        return False

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Create status check
        success1, response1 = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": "test_client"}
        )

        # Get status checks
        success2, response2 = self.run_test(
            "Get Status Checks",
            "GET", 
            "status",
            200
        )

        return success1 and success2

def main():
    """Run all backend API tests"""
    print("🚀 Starting DOMMMA Backend API Tests")
    print("=" * 50)
    
    tester = DOMMMAPITester()
    
    # Test sequence
    test_functions = [
        ("API Root", tester.test_api_root),
        ("Seed Data", tester.test_seed_data), 
        ("Status Endpoints", tester.test_status_endpoints),
        ("Get Listings", tester.test_get_listings),
        ("Listings with Filters", tester.test_get_listings_with_filters),
        ("Map Listings", tester.test_get_listings_for_map),
        ("Nova Chat", tester.test_chat_functionality),
        ("Chat History", tester.test_chat_history),
    ]

    print(f"\n📋 Running {len(test_functions)} test categories...")
    
    for test_name, test_func in test_functions:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test category '{test_name}' failed with error: {e}")
            tester.log_test(f"{test_name} (Category)", False, str(e))

    # Print final results
    print("\n" + "="*60)
    print("📊 BACKEND API TEST RESULTS")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")  
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")

    if tester.tests_passed < tester.tests_run:
        print("\n❌ FAILED TESTS:")
        for result in tester.test_results:
            if not result['success']:
                print(f"  - {result['test']}: {result['details']}")

    print(f"\n✅ Backend API testing complete!")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())