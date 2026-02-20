"""
Test suite for Push Notifications feature in DOMMMA
Tests: FCM token registration, notification sending, fetching, and marking as read
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test user credentials
TEST_USER_EMAIL = "scheduler_test@dommma.com"
TEST_USER_PASSWORD = "test123"

@pytest.fixture(scope="module")
def test_user():
    """Login and get test user data"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "user_type": "renter"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()

class TestFCMTokenRegistration:
    """Tests for POST /api/notifications/register-token endpoint"""
    
    def test_register_fcm_token_success(self, test_user):
        """Test registering a new FCM token for a user"""
        test_token = f"test_fcm_token_{uuid.uuid4().hex}"
        
        response = requests.post(f"{API_URL}/notifications/register-token", json={
            "user_id": test_user["id"],
            "token": test_token
        })
        
        assert response.status_code == 200, f"Failed to register token: {response.text}"
        data = response.json()
        assert data.get("status") == "registered"
        print(f"[PASS] FCM token registered successfully for user {test_user['id']}")
    
    def test_update_fcm_token(self, test_user):
        """Test updating an existing FCM token"""
        # Register initial token
        initial_token = f"initial_token_{uuid.uuid4().hex}"
        response = requests.post(f"{API_URL}/notifications/register-token", json={
            "user_id": test_user["id"],
            "token": initial_token
        })
        assert response.status_code == 200
        
        # Update with new token
        new_token = f"updated_token_{uuid.uuid4().hex}"
        response = requests.post(f"{API_URL}/notifications/register-token", json={
            "user_id": test_user["id"],
            "token": new_token
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "registered"
        print("[PASS] FCM token updated successfully")
    
    def test_register_fcm_token_missing_fields(self):
        """Test registering token with missing required fields"""
        # Missing token
        response = requests.post(f"{API_URL}/notifications/register-token", json={
            "user_id": "test_user_123"
        })
        assert response.status_code == 422, "Should fail with missing token field"
        print("[PASS] Correctly rejected request with missing token field")
        
        # Missing user_id
        response = requests.post(f"{API_URL}/notifications/register-token", json={
            "token": "test_token_123"
        })
        assert response.status_code == 422, "Should fail with missing user_id field"
        print("[PASS] Correctly rejected request with missing user_id field")


class TestSendNotification:
    """Tests for POST /api/notifications/send endpoint"""
    
    def test_send_notification_success(self, test_user):
        """Test sending a notification to a user"""
        notification_data = {
            "user_id": test_user["id"],
            "title": "Test Notification",
            "body": "This is a test notification body",
            "notification_type": "system",
            "data": {"action": "test", "test_id": str(uuid.uuid4())}
        }
        
        response = requests.post(f"{API_URL}/notifications/send", json=notification_data)
        
        assert response.status_code == 200, f"Failed to send notification: {response.text}"
        data = response.json()
        assert data.get("status") == "sent"
        assert "fcm_token_available" in data
        print(f"[PASS] Notification sent successfully. FCM token available: {data.get('fcm_token_available')}")
    
    def test_send_notification_all_types(self, test_user):
        """Test sending notifications with different types"""
        notification_types = ["message", "payment", "document", "property", "booking", "review", "maintenance", "system"]
        
        for notif_type in notification_types:
            notification_data = {
                "user_id": test_user["id"],
                "title": f"Test {notif_type} Notification",
                "body": f"This is a test {notif_type} notification",
                "notification_type": notif_type,
                "data": {"type": notif_type}
            }
            
            response = requests.post(f"{API_URL}/notifications/send", json=notification_data)
            assert response.status_code == 200, f"Failed to send {notif_type} notification: {response.text}"
        
        print(f"[PASS] Successfully sent notifications of all types: {notification_types}")
    
    def test_send_notification_missing_required_fields(self):
        """Test sending notification with missing required fields"""
        # Missing title
        response = requests.post(f"{API_URL}/notifications/send", json={
            "user_id": "test_user_123",
            "body": "Test body",
            "notification_type": "system"
        })
        assert response.status_code == 422, "Should fail with missing title"
        print("[PASS] Correctly rejected notification with missing title")


class TestGetNotifications:
    """Tests for GET /api/notifications/{user_id} endpoint"""
    
    def test_get_notifications_success(self, test_user):
        """Test fetching notifications for a user"""
        # First send a notification
        notification_data = {
            "user_id": test_user["id"],
            "title": "Fetch Test Notification",
            "body": "This notification will be fetched",
            "notification_type": "system",
            "data": {"test": True}
        }
        send_response = requests.post(f"{API_URL}/notifications/send", json=notification_data)
        assert send_response.status_code == 200
        
        # Fetch notifications
        response = requests.get(f"{API_URL}/notifications/{test_user['id']}")
        
        assert response.status_code == 200, f"Failed to fetch notifications: {response.text}"
        notifications = response.json()
        
        assert isinstance(notifications, list), "Response should be a list"
        # Find our test notification
        test_notif = next((n for n in notifications if n.get("title") == "Fetch Test Notification"), None)
        assert test_notif is not None, "Test notification should be in the list"
        
        # Verify notification structure
        assert "id" in test_notif
        assert "title" in test_notif
        assert "body" in test_notif
        assert "type" in test_notif
        assert "read" in test_notif
        assert "created_at" in test_notif
        
        print(f"[PASS] Successfully fetched {len(notifications)} notifications")
    
    def test_get_notifications_unread_only(self, test_user):
        """Test fetching only unread notifications"""
        response = requests.get(f"{API_URL}/notifications/{test_user['id']}", params={
            "unread_only": True
        })
        
        assert response.status_code == 200, f"Failed to fetch unread notifications: {response.text}"
        notifications = response.json()
        
        # All returned notifications should be unread
        for notif in notifications:
            assert notif.get("read") == False, f"Found read notification when requesting unread_only"
        
        print(f"[PASS] Fetched {len(notifications)} unread notifications")
    
    def test_get_notifications_empty_user(self):
        """Test fetching notifications for a user with no notifications"""
        fake_user_id = f"fake_user_{uuid.uuid4().hex}"
        response = requests.get(f"{API_URL}/notifications/{fake_user_id}")
        
        assert response.status_code == 200
        notifications = response.json()
        assert notifications == [], "Should return empty list for user with no notifications"
        print("[PASS] Correctly returned empty list for user with no notifications")


class TestMarkNotificationRead:
    """Tests for POST /api/notifications/mark-read/{notification_id} endpoint"""
    
    def test_mark_notification_read_success(self, test_user):
        """Test marking a notification as read"""
        # Send a notification first
        notification_data = {
            "user_id": test_user["id"],
            "title": "Mark Read Test",
            "body": "This notification will be marked as read",
            "notification_type": "system",
            "data": {}
        }
        send_response = requests.post(f"{API_URL}/notifications/send", json=notification_data)
        assert send_response.status_code == 200
        
        # Fetch to get the notification ID
        fetch_response = requests.get(f"{API_URL}/notifications/{test_user['id']}")
        notifications = fetch_response.json()
        test_notif = next((n for n in notifications if n.get("title") == "Mark Read Test"), None)
        assert test_notif is not None, "Test notification not found"
        
        notif_id = test_notif["id"]
        
        # Mark as read
        response = requests.post(f"{API_URL}/notifications/mark-read/{notif_id}")
        
        assert response.status_code == 200, f"Failed to mark notification as read: {response.text}"
        data = response.json()
        assert data.get("status") == "read"
        
        # Verify it's marked as read by fetching again
        fetch_response = requests.get(f"{API_URL}/notifications/{test_user['id']}")
        notifications = fetch_response.json()
        updated_notif = next((n for n in notifications if n.get("id") == notif_id), None)
        assert updated_notif is not None, "Notification not found after marking as read"
        assert updated_notif.get("read") == True, "Notification should be marked as read"
        
        print(f"[PASS] Successfully marked notification {notif_id} as read")
    
    def test_mark_nonexistent_notification_read(self):
        """Test marking a non-existent notification as read"""
        fake_notif_id = f"fake_notif_{uuid.uuid4().hex}"
        response = requests.post(f"{API_URL}/notifications/mark-read/{fake_notif_id}")
        
        # Should still return 200 (endpoint doesn't validate existence)
        # This is acceptable behavior - the update just doesn't affect anything
        assert response.status_code == 200
        print("[PASS] Mark read endpoint handles non-existent notification gracefully")


class TestNotificationIntegration:
    """Integration tests for the full notification flow"""
    
    def test_full_notification_flow(self, test_user):
        """Test complete flow: register token -> send -> fetch -> mark read"""
        # Step 1: Register FCM token
        test_token = f"integration_test_token_{uuid.uuid4().hex}"
        register_response = requests.post(f"{API_URL}/notifications/register-token", json={
            "user_id": test_user["id"],
            "token": test_token
        })
        assert register_response.status_code == 200
        print("[STEP 1] FCM token registered")
        
        # Step 2: Send notification
        unique_title = f"Integration Test {uuid.uuid4().hex[:8]}"
        send_response = requests.post(f"{API_URL}/notifications/send", json={
            "user_id": test_user["id"],
            "title": unique_title,
            "body": "This is an integration test notification",
            "notification_type": "message",
            "data": {"integration_test": True}
        })
        assert send_response.status_code == 200
        assert send_response.json().get("fcm_token_available") == True, "FCM token should be available after registration"
        print("[STEP 2] Notification sent (FCM token available)")
        
        # Step 3: Fetch notifications
        fetch_response = requests.get(f"{API_URL}/notifications/{test_user['id']}")
        assert fetch_response.status_code == 200
        notifications = fetch_response.json()
        test_notif = next((n for n in notifications if n.get("title") == unique_title), None)
        assert test_notif is not None, "Notification should be in fetch response"
        assert test_notif.get("read") == False, "New notification should be unread"
        print(f"[STEP 3] Notification fetched (ID: {test_notif['id']}, unread)")
        
        # Step 4: Mark as read
        mark_response = requests.post(f"{API_URL}/notifications/mark-read/{test_notif['id']}")
        assert mark_response.status_code == 200
        print("[STEP 4] Notification marked as read")
        
        # Step 5: Verify read status
        verify_response = requests.get(f"{API_URL}/notifications/{test_user['id']}")
        notifications = verify_response.json()
        updated_notif = next((n for n in notifications if n.get("id") == test_notif['id']), None)
        assert updated_notif is not None
        assert updated_notif.get("read") == True, "Notification should now be read"
        print("[STEP 5] Verified notification is now read")
        
        print("[PASS] Full notification flow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
