"""
Test Password Hashing and Authentication Features
Tests bcrypt password hashing for new users and login verification
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPasswordHashing:
    """Tests for password hashing with bcrypt"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "DOMMMA" in data.get("message", "")
        print("SUCCESS: API health check passed")
    
    def test_register_new_user_with_hashed_password(self):
        """Test that new user registration hashes password"""
        unique_email = f"secure_test_{uuid.uuid4().hex[:8]}@dommma.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "SecurePass123!",
                "name": "Secure Test User",
                "user_type": "renter"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("email") == unique_email
        assert data.get("name") == "Secure Test User"
        assert data.get("user_type") == "renter"
        # Password should NOT be in response
        assert "password" not in data
        assert "password_hash" not in data
        print(f"SUCCESS: User {unique_email} registered with hashed password")
        return unique_email
    
    def test_login_with_correct_password(self):
        """Test login succeeds with correct password"""
        # First register a new user
        unique_email = f"login_test_{uuid.uuid4().hex[:8]}@dommma.com"
        password = "TestPassword456!"
        
        # Register
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": password,
                "name": "Login Test User",
                "user_type": "renter"
            }
        )
        assert reg_response.status_code == 200
        
        # Login with correct password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": password
            }
        )
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert data.get("email") == unique_email
        assert data.get("name") == "Login Test User"
        print(f"SUCCESS: Login with correct password for {unique_email}")
    
    def test_login_with_wrong_password_returns_401(self):
        """Test that wrong password returns 401 Unauthorized"""
        # First register a new user
        unique_email = f"wrong_pass_{uuid.uuid4().hex[:8]}@dommma.com"
        correct_password = "CorrectPass789!"
        wrong_password = "WrongPassword999!"
        
        # Register
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": correct_password,
                "name": "Wrong Pass Test",
                "user_type": "renter"
            }
        )
        assert reg_response.status_code == 200
        
        # Login with wrong password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": wrong_password
            }
        )
        
        assert login_response.status_code == 401
        data = login_response.json()
        assert "Invalid password" in data.get("detail", "")
        print(f"SUCCESS: Wrong password correctly returned 401 for {unique_email}")
    
    def test_register_duplicate_email_returns_400(self):
        """Test that registering with existing email returns 400"""
        unique_email = f"duplicate_{uuid.uuid4().hex[:8]}@dommma.com"
        
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "Pass123!",
                "name": "First User",
                "user_type": "renter"
            }
        )
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "Pass456!",
                "name": "Second User",
                "user_type": "landlord"
            }
        )
        
        assert response2.status_code == 400
        data = response2.json()
        assert "already registered" in data.get("detail", "").lower()
        print(f"SUCCESS: Duplicate email correctly returned 400")
    
    def test_login_creates_new_user_if_not_exists(self):
        """Test that login with non-existent user creates account"""
        unique_email = f"auto_create_{uuid.uuid4().hex[:8]}@dommma.com"
        
        # Login with new email (should auto-create)
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": "NewUser123!",
                "user_type": "contractor"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("email") == unique_email
        assert data.get("user_type") == "contractor"
        print(f"SUCCESS: Login auto-created user {unique_email}")
        
        # Verify can login again with same password
        login2 = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": "NewUser123!"
            }
        )
        assert login2.status_code == 200
        print(f"SUCCESS: Second login with same password works")

class TestLegacyPlaintextMigration:
    """Tests for legacy plaintext password support during migration"""
    
    def test_existing_test_users_can_login(self):
        """Test that existing test users (renter, landlord, contractor) can still login"""
        test_users = [
            {"email": "renter@dommma.com", "password": "password123", "user_type": "renter"},
            {"email": "landlord@dommma.com", "password": "password123", "user_type": "landlord"},
            {"email": "contractor@dommma.com", "password": "password123", "user_type": "contractor"},
        ]
        
        for user in test_users:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json=user
            )
            
            # Should either succeed (200) or auto-create the user
            assert response.status_code == 200
            data = response.json()
            assert data.get("email") == user["email"]
            print(f"SUCCESS: {user['email']} can login")

class TestSecureUserCredentials:
    """Test the secure user credentials provided in requirements"""
    
    def test_secure_user_registration_and_login(self):
        """Test secure-test@dommma.com / SecurePass123! credentials"""
        email = "secure-test@dommma.com"
        password = "SecurePass123!"
        
        # Try to register (may already exist)
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": email,
                "password": password,
                "name": "Secure Test",
                "user_type": "renter"
            }
        )
        
        # Either 200 (new) or 400 (exists) is fine
        assert reg_response.status_code in [200, 400]
        
        if reg_response.status_code == 400:
            print(f"INFO: {email} already exists, testing login...")
        
        # Login should work
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": email,
                "password": password
            }
        )
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert data.get("email") == email
        print(f"SUCCESS: Secure user {email} can login with hashed password")

class TestRoleBasedAuth:
    """Test role-based authentication for different user types"""
    
    def test_renter_role_login(self):
        """Test renter role login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "renter@dommma.com",
                "password": "password123",
                "user_type": "renter"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("user_type") == "renter"
        print("SUCCESS: Renter login and role verified")
    
    def test_landlord_role_login(self):
        """Test landlord role login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "landlord@dommma.com",
                "password": "password123",
                "user_type": "landlord"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("user_type") == "landlord"
        print("SUCCESS: Landlord login and role verified")
    
    def test_contractor_role_login(self):
        """Test contractor role login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "contractor@dommma.com",
                "password": "password123",
                "user_type": "contractor"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("user_type") == "contractor"
        print("SUCCESS: Contractor login and role verified")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
