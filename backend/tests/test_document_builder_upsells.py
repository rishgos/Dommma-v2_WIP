"""
Backend tests for Document Builder, Upsells API, and Competitor Analysis features.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDocumentBuilder:
    """Test Document Builder API endpoints"""
    
    def test_save_document_draft(self):
        """Test saving a document draft"""
        doc_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "template_id": "rtb-1",
            "template_name": "Residential Tenancy Agreement (RTB-1)",
            "form_data": {
                "landlord_name": "Test Landlord",
                "tenant_name": "Test Tenant",
                "property_address": "123 Test St",
                "property_city": "Vancouver",
                "monthly_rent": 2500
            },
            "status": "draft"
        }
        
        response = requests.post(f"{BASE_URL}/api/document-builder/save", json=doc_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Document saved"
    
    def test_send_document_for_signature(self):
        """Test sending a document for signature"""
        doc_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "template_id": "rtb-1",
            "template_name": "Residential Tenancy Agreement (RTB-1)",
            "form_data": {
                "landlord_name": "Test Landlord",
                "landlord_email": "landlord@test.com",
                "tenant_name": "Test Tenant",
                "property_address": "123 Main St",
                "monthly_rent": 2200
            },
            "recipient_email": "tenant@test.com",
            "sender_name": "Test Landlord",
            "sender_email": "landlord@test.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/document-builder/send", json=doc_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending_signature"
        assert data["message"] == "Document sent for signature"
    
    def test_generate_pdf(self):
        """Test PDF generation from document data"""
        doc_data = {
            "template_id": "rtb-1",
            "template_name": "Residential Tenancy Agreement (RTB-1)",
            "form_data": {
                "landlord_name": "John Smith",
                "tenant_name": "Jane Doe",
                "property_address": "456 Oak Ave",
                "property_city": "Vancouver",
                "monthly_rent": 2800,
                "start_date": "2026-04-01",
                "security_deposit": 2800
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/document-builder/pdf", json=doc_data)
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        # Check it starts with PDF header
        assert response.content[:4] == b'%PDF'
    
    def test_list_user_documents(self):
        """Test listing user's documents"""
        # First save a document
        user_id = f"test-user-list-{uuid.uuid4().hex[:8]}"
        doc_data = {
            "user_id": user_id,
            "template_id": "rtb-7",
            "template_name": "Notice to End Tenancy (RTB-7)",
            "form_data": {"tenant_name": "Test Tenant"},
            "status": "draft"
        }
        requests.post(f"{BASE_URL}/api/document-builder/save", json=doc_data)
        
        # List documents
        response = requests.get(f"{BASE_URL}/api/document-builder/list/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["user_id"] == user_id
        assert data[0]["template_id"] == "rtb-7"
    
    def test_save_rtb7_template(self):
        """Test saving RTB-7 Notice to End Tenancy"""
        doc_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "template_id": "rtb-7",
            "template_name": "Notice to End Tenancy (RTB-7)",
            "form_data": {
                "tenant_name": "Test Tenant",
                "property_address": "789 End Rd, Vancouver",
                "end_date": "2026-05-31",
                "reason": "Landlord use of property",
                "details": "Landlord moving in"
            },
            "status": "draft"
        }
        
        response = requests.post(f"{BASE_URL}/api/document-builder/save", json=doc_data)
        assert response.status_code == 200
    
    def test_save_rtb26_template(self):
        """Test saving RTB-26 Condition Inspection Report"""
        doc_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "template_id": "rtb-26",
            "template_name": "Condition Inspection Report (RTB-26)",
            "form_data": {
                "property_address": "100 Inspect St, Vancouver",
                "inspection_type": "Move-In",
                "inspection_date": "2026-04-01",
                "living_room": "Good condition, minor scuff on wall",
                "kitchen": "Clean, appliances working",
                "bathroom": "Minor grout wear"
            },
            "status": "draft"
        }
        
        response = requests.post(f"{BASE_URL}/api/document-builder/save", json=doc_data)
        assert response.status_code == 200
    
    def test_save_rtb30_template(self):
        """Test saving RTB-30 Notice of Rent Increase"""
        doc_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "template_id": "rtb-30",
            "template_name": "Notice of Rent Increase (RTB-30)",
            "form_data": {
                "tenant_name": "Rent Increase Tenant",
                "property_address": "200 Increase Ave, Vancouver",
                "current_rent": 2000,
                "new_rent": 2060,
                "effective_date": "2026-06-01"
            },
            "status": "draft"
        }
        
        response = requests.post(f"{BASE_URL}/api/document-builder/save", json=doc_data)
        assert response.status_code == 200


class TestUpsellsAPI:
    """Test Post-Reservation Upsells API endpoints"""
    
    def test_get_vancouver_services(self):
        """Test getting services for Vancouver"""
        response = requests.get(f"{BASE_URL}/api/upsells/services/Vancouver")
        assert response.status_code == 200
        data = response.json()
        
        assert data["city"] == "Vancouver"
        assert "services" in data
        assert "generated_at" in data
    
    def test_upsells_has_all_categories(self):
        """Test that upsells API returns all service categories"""
        response = requests.get(f"{BASE_URL}/api/upsells/services/Vancouver")
        data = response.json()
        
        services = data["services"]
        expected_categories = ["movers", "internet", "insurance", "utilities", "cleaning", "storage"]
        
        for category in expected_categories:
            assert category in services, f"Missing category: {category}"
            assert len(services[category]) > 0, f"Empty category: {category}"
    
    def test_movers_service_details(self):
        """Test movers services have required fields"""
        response = requests.get(f"{BASE_URL}/api/upsells/services/Vancouver")
        data = response.json()
        movers = data["services"]["movers"]
        
        assert len(movers) >= 3
        for mover in movers:
            assert "id" in mover
            assert "name" in mover
            assert "rating" in mover
            assert "price" in mover
    
    def test_internet_providers(self):
        """Test internet providers are returned"""
        response = requests.get(f"{BASE_URL}/api/upsells/services/Vancouver")
        data = response.json()
        internet = data["services"]["internet"]
        
        # Check for known providers
        provider_names = [p["name"] for p in internet]
        assert any("Telus" in name for name in provider_names)
        assert any("Shaw" in name for name in provider_names)
    
    def test_insurance_providers(self):
        """Test insurance providers are returned"""
        response = requests.get(f"{BASE_URL}/api/upsells/services/Vancouver")
        data = response.json()
        insurance = data["services"]["insurance"]
        
        assert len(insurance) >= 2
        # Check for BCAA
        provider_names = [p["name"] for p in insurance]
        assert any("BCAA" in name for name in provider_names)
    
    def test_request_quote(self):
        """Test quote request submission"""
        quote_data = {
            "user_id": f"test-user-quote-{uuid.uuid4().hex[:8]}",
            "service_type": "movers",
            "provider_id": "m1",
            "provider_name": "BC Moving Co.",
            "property_address": "123 Move St, Vancouver",
            "move_date": "2026-04-15",
            "notes": "3 bedroom apartment, no stairs"
        }
        
        response = requests.post(f"{BASE_URL}/api/upsells/request-quote", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending"
        assert data["message"] == "Quote request submitted"
    
    def test_different_city_services(self):
        """Test services for different cities"""
        response = requests.get(f"{BASE_URL}/api/upsells/services/Burnaby")
        assert response.status_code == 200
        data = response.json()
        assert data["city"] == "Burnaby"
        # Services should still be returned (Vancouver metro area)
        assert "services" in data


class TestCompetitorAnalysis:
    """Test AI Competitor Analysis endpoint"""
    
    def test_competitor_analysis_basic(self):
        """Test basic competitor analysis"""
        analysis_data = {
            "address": "123 Main St",
            "city": "Vancouver",
            "bedrooms": 2,
            "property_type": "apartment"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/competitor-analysis", json=analysis_data)
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "recommended_price" in data
        assert "price_range" in data
        assert "comparable_listings" in data
    
    def test_competitor_analysis_returns_listing_content(self):
        """Test that competitor analysis returns title and description"""
        analysis_data = {
            "address": "456 Oak Ave",
            "city": "Vancouver",
            "bedrooms": 3,
            "property_type": "house"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/competitor-analysis", json=analysis_data)
        assert response.status_code == 200
        data = response.json()
        
        # Check for AI analysis with title and description
        if "ai_analysis" in data and data["ai_analysis"]:
            ai = data["ai_analysis"]
            assert "title" in ai or "recommended_price" in ai
            assert "description" in ai or "price_explanation" in ai
    
    def test_competitor_analysis_price_range(self):
        """Test price range is returned"""
        analysis_data = {
            "address": "789 Test Blvd",
            "city": "Vancouver",
            "bedrooms": 1,
            "property_type": "condo"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/competitor-analysis", json=analysis_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "price_range" in data
        price_range = data["price_range"]
        assert "min" in price_range
        assert "max" in price_range
    
    def test_competitor_analysis_without_address_fails(self):
        """Test that analysis fails without address"""
        analysis_data = {
            "city": "Vancouver",
            "bedrooms": 2
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/competitor-analysis", json=analysis_data)
        assert response.status_code == 400
    
    def test_competitor_analysis_comparable_listings(self):
        """Test comparable listings are returned"""
        analysis_data = {
            "address": "100 Compare St",
            "city": "Vancouver",
            "bedrooms": 2,
            "property_type": "apartment"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/competitor-analysis", json=analysis_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "comparable_listings" in data
        assert isinstance(data["comparable_listings"], list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
