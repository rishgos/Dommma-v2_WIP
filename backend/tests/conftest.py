import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def unique_id():
    """Generate unique ID for test data isolation"""
    return f"TEST_{uuid.uuid4().hex[:8]}"

@pytest.fixture
def test_user_credentials():
    """Test user credentials"""
    return {
        "email": "test_renter@example.com",
        "password": "test123456"
    }

@pytest.fixture
def login_user(api_client, test_user_credentials):
    """Login and return user data"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=test_user_credentials)
    if response.status_code == 200:
        return response.json()
    pytest.skip("Could not login with test credentials")
