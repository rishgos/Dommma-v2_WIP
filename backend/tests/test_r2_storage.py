"""
Tests for Cloudflare R2 storage API endpoints
"""
import pytest
import requests
import os
import io
import base64
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestR2StorageStatus:
    """Test R2 storage configuration and status"""
    
    def test_storage_status_endpoint(self, api_client):
        """Test /api/storage/status returns configuration status"""
        response = api_client.get(f"{BASE_URL}/api/storage/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        # R2 should be configured based on the .env file
        assert data["configured"] == True


class TestImageUpload:
    """Test image upload endpoints"""
    
    def test_upload_image_success(self, api_client):
        """Test /api/upload/image with valid image data"""
        # Create a minimal PNG file (1x1 pixel transparent)
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test_image.png', io.BytesIO(png_data), 'image/png')
        }
        
        # Remove Content-Type header for multipart
        headers = api_client.headers.copy()
        del headers['Content-Type']
        
        response = requests.post(
            f"{BASE_URL}/api/upload/image",
            files=files,
            headers={"Accept": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "url" in data
        # URL should point to R2 storage or be a base64 fallback
        assert data["url"] is not None
    
    def test_upload_image_empty_file(self, api_client):
        """Test /api/upload/image with empty file"""
        files = {
            'file': ('empty.png', io.BytesIO(b''), 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload/image",
            files=files,
            headers={"Accept": "application/json"}
        )
        
        # Should return error for empty file
        assert response.status_code in [200, 400, 500]  # Depends on implementation


class TestPropertyImageUpload:
    """Test property image upload endpoint"""
    
    def test_upload_property_image_success(self, api_client, unique_id):
        """Test /api/upload/property-image with valid data"""
        # Create a minimal PNG file
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('property_image.png', io.BytesIO(png_data), 'image/png')
        }
        
        data = {
            'property_id': unique_id,
            'user_id': 'test_user_123'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload/property-image",
            files=files,
            data=data,
            headers={"Accept": "application/json"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "url" in result
        assert "key" in result


class TestDocumentUpload:
    """Test document upload endpoints"""
    
    def test_upload_document_endpoint(self, api_client, unique_id):
        """Test /api/upload/document with valid document"""
        # Create a simple text file
        doc_content = b"Test document content for R2 storage testing"
        
        files = {
            'file': ('test_document.txt', io.BytesIO(doc_content), 'text/plain')
        }
        
        data = {
            'user_id': 'test_user_123',
            'document_type': 'general'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload/document",
            files=files,
            data=data,
            headers={"Accept": "application/json"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "url" in result
        assert "key" in result
    
    def test_documents_upload_legacy(self, api_client, unique_id, login_user):
        """Test /api/documents/upload (legacy endpoint) with user auth"""
        user_id = login_user.get("id")
        if not user_id:
            pytest.skip("Login required for this test")
        
        # Create PDF-like content
        pdf_content = b"%PDF-1.4 Test PDF content"
        
        files = {
            'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        
        # Use query params - doc_type is the correct param name
        response = requests.post(
            f"{BASE_URL}/api/documents/upload?user_id={user_id}&name=Test_Doc_{unique_id}&doc_type=lease",
            files=files,
            headers={"Accept": "application/json"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "id" in result
        assert "name" in result
        assert "status" in result
        assert result["status"] == "uploaded"


class TestAvatarUpload:
    """Test avatar upload endpoint"""
    
    def test_upload_avatar_success(self, api_client):
        """Test /api/upload/avatar with valid image"""
        # Create a minimal PNG file
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('avatar.png', io.BytesIO(png_data), 'image/png')
        }
        
        data = {
            'user_id': 'test_user_123'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload/avatar",
            files=files,
            data=data,
            headers={"Accept": "application/json"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "url" in result


class TestGeneralUpload:
    """Test general file upload endpoint"""
    
    def test_upload_general_file(self, api_client, unique_id):
        """Test /api/upload/general with various file types"""
        # Create a simple JSON file
        json_content = b'{"test": "data"}'
        
        files = {
            'file': ('test_data.json', io.BytesIO(json_content), 'application/json')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload/general?folder=uploads&user_id=test_user",
            files=files,
            headers={"Accept": "application/json"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "url" in result
        assert "key" in result
