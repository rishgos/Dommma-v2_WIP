"""
DocuSign Integration Service
Handles OAuth flow and envelope creation for e-signatures
"""
import os
import base64
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import docusign_esign as docusign
from docusign_esign import ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs, Recipients

logger = logging.getLogger(__name__)

class DocuSignService:
    """Service for DocuSign e-signature integration"""
    
    def __init__(self):
        self.integration_key = os.environ.get("DOCUSIGN_INTEGRATION_KEY")
        self.account_id = os.environ.get("DOCUSIGN_ACCOUNT_ID")
        self.base_url = os.environ.get("DOCUSIGN_BASE_URL", "https://demo.docusign.net/restapi")
        self.oauth_base_url = "https://account-d.docusign.com"  # Demo environment
        self.api_client = None
        self.configured = bool(self.integration_key)
        
    def get_oauth_url(self, redirect_uri: str, state: str = "") -> str:
        """Generate DocuSign OAuth authorization URL"""
        if not self.integration_key:
            raise ValueError("DocuSign integration key not configured")
            
        scopes = "signature"
        auth_url = (
            f"{self.oauth_base_url}/oauth/auth"
            f"?response_type=code"
            f"&scope={scopes}"
            f"&client_id={self.integration_key}"
            f"&redirect_uri={redirect_uri}"
            f"&state={state}"
        )
        return auth_url
    
    def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        # Note: This requires the secret key for code exchange
        # For JWT authentication, use get_jwt_token instead
        raise NotImplementedError("Use JWT authentication for server-to-server")
    
    def create_api_client(self, access_token: str) -> ApiClient:
        """Create DocuSign API client with access token"""
        api_client = ApiClient()
        api_client.host = self.base_url
        api_client.set_default_header("Authorization", f"Bearer {access_token}")
        return api_client
    
    def create_envelope(
        self,
        access_token: str,
        signer_email: str,
        signer_name: str,
        document_content: bytes,
        document_name: str,
        subject: str,
        anchor_string: str = "/sig1/",
        email_body: str = "Please sign this document"
    ) -> Dict[str, Any]:
        """Create and send an envelope for signature"""
        
        api_client = self.create_api_client(access_token)
        envelopes_api = EnvelopesApi(api_client)
        
        # Create document
        doc_b64 = base64.b64encode(document_content).decode("ascii")
        document = Document(
            document_base64=doc_b64,
            name=document_name,
            file_extension="pdf",
            document_id="1"
        )
        
        # Create signer with signature placement
        signer = Signer(
            email=signer_email,
            name=signer_name,
            recipient_id="1",
            routing_order="1"
        )
        
        # Create signature tab (using anchor or fixed position)
        sign_here = SignHere(
            anchor_string=anchor_string,
            anchor_units="pixels",
            anchor_y_offset="10",
            anchor_x_offset="20"
        )
        
        signer.tabs = Tabs(sign_here_tabs=[sign_here])
        
        # Create envelope definition
        envelope_definition = EnvelopeDefinition(
            email_subject=subject,
            email_blurb=email_body,
            documents=[document],
            recipients=Recipients(signers=[signer]),
            status="sent"  # "sent" to send immediately, "created" for draft
        )
        
        try:
            results = envelopes_api.create_envelope(
                account_id=self.account_id,
                envelope_definition=envelope_definition
            )
            
            return {
                "envelope_id": results.envelope_id,
                "status": results.status,
                "status_date_time": results.status_date_time,
                "uri": results.uri
            }
        except Exception as e:
            logger.error(f"DocuSign envelope creation failed: {e}")
            raise
    
    def get_envelope_status(self, access_token: str, envelope_id: str) -> Dict[str, Any]:
        """Get the status of an envelope"""
        api_client = self.create_api_client(access_token)
        envelopes_api = EnvelopesApi(api_client)
        
        try:
            envelope = envelopes_api.get_envelope(
                account_id=self.account_id,
                envelope_id=envelope_id
            )
            
            return {
                "envelope_id": envelope.envelope_id,
                "status": envelope.status,
                "status_date_time": envelope.status_date_time,
                "sent_date_time": envelope.sent_date_time,
                "completed_date_time": envelope.completed_date_time
            }
        except Exception as e:
            logger.error(f"Failed to get envelope status: {e}")
            raise
    
    def get_embedded_signing_url(
        self,
        access_token: str,
        envelope_id: str,
        signer_email: str,
        signer_name: str,
        return_url: str,
        client_user_id: str = "1000"
    ) -> str:
        """Generate embedded signing URL for in-app signing"""
        api_client = self.create_api_client(access_token)
        envelopes_api = EnvelopesApi(api_client)
        
        recipient_view_request = docusign.RecipientViewRequest(
            authentication_method="none",
            client_user_id=client_user_id,
            recipient_id="1",
            return_url=return_url,
            user_name=signer_name,
            email=signer_email
        )
        
        try:
            results = envelopes_api.create_recipient_view(
                account_id=self.account_id,
                envelope_id=envelope_id,
                recipient_view_request=recipient_view_request
            )
            return results.url
        except Exception as e:
            logger.error(f"Failed to create signing URL: {e}")
            raise


# BC Rental Form Templates
BC_FORM_TEMPLATES = {
    "rtb-1": {
        "name": "RTB-1: Residential Tenancy Agreement",
        "description": "Standard BC rental agreement between landlord and tenant",
        "fields": [
            "landlord_name", "landlord_address", "tenant_name", "tenant_email",
            "property_address", "rent_amount", "start_date", "end_date",
            "security_deposit", "pet_deposit"
        ]
    },
    "rtb-7": {
        "name": "RTB-7: Notice to End Tenancy",
        "description": "Notice from landlord to end tenancy",
        "fields": [
            "landlord_name", "tenant_name", "property_address",
            "end_date", "reason", "additional_notes"
        ]
    },
    "rtb-26": {
        "name": "RTB-26: Condition Inspection Report",
        "description": "Move-in/Move-out property condition documentation",
        "fields": [
            "property_address", "inspection_date", "inspection_type",
            "landlord_name", "tenant_name", "condition_notes"
        ]
    },
    "rtb-30": {
        "name": "RTB-30: Notice of Rent Increase",
        "description": "Official notice of rent increase (requires 3 months notice)",
        "fields": [
            "landlord_name", "tenant_name", "property_address",
            "current_rent", "new_rent", "effective_date"
        ]
    }
}


def generate_rtb1_pdf(data: Dict[str, Any]) -> bytes:
    """Generate RTB-1 Residential Tenancy Agreement PDF"""
    # In production, use a PDF library like reportlab or fill a template
    # For now, return a simple text representation
    content = f"""
    RESIDENTIAL TENANCY AGREEMENT (RTB-1)
    Province of British Columbia
    
    This agreement is made on {data.get('start_date', '_____________')}
    
    LANDLORD:
    Name: {data.get('landlord_name', '_____________')}
    Address: {data.get('landlord_address', '_____________')}
    
    TENANT:
    Name: {data.get('tenant_name', '_____________')}
    Email: {data.get('tenant_email', '_____________')}
    
    RENTAL UNIT:
    Address: {data.get('property_address', '_____________')}
    
    RENT:
    Monthly Rent: ${data.get('rent_amount', '_____________')}
    Due Date: 1st of each month
    
    TERM:
    Start Date: {data.get('start_date', '_____________')}
    End Date: {data.get('end_date', 'Month-to-month')}
    
    DEPOSITS:
    Security Deposit: ${data.get('security_deposit', '_____________')}
    Pet Deposit: ${data.get('pet_deposit', 'N/A')}
    
    SIGNATURES:
    
    Landlord Signature: /sig1/
    Date: _____________
    
    Tenant Signature: /sig2/
    Date: _____________
    
    This agreement is governed by the Residential Tenancy Act of British Columbia.
    """
    return content.encode('utf-8')
