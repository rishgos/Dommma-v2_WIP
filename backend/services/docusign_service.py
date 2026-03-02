"""
DocuSign Integration Service
Handles OAuth 2.0 Authorization Code Grant flow and envelope creation for e-signatures
"""
import os
import base64
import secrets
import logging
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from urllib.parse import urlencode

logger = logging.getLogger(__name__)


class DocuSignError(Exception):
    """Custom exception for DocuSign errors"""
    pass


class DocuSignService:
    """Service for DocuSign e-signature integration with OAuth 2.0"""
    
    def __init__(self):
        self.integration_key = os.environ.get("DOCUSIGN_INTEGRATION_KEY")
        self.client_secret = os.environ.get("DOCUSIGN_CLIENT_SECRET", "")
        self.account_id = os.environ.get("DOCUSIGN_ACCOUNT_ID")
        self.base_url = os.environ.get("DOCUSIGN_BASE_URL", "https://demo.docusign.net/restapi")
        self.oauth_base_url = os.environ.get("DOCUSIGN_AUTH_SERVER", "account-d.docusign.com")
        self.configured = bool(self.integration_key)
        
    def generate_authorization_url(self, redirect_uri: str) -> tuple:
        """Generate OAuth authorization URL and state parameter for CSRF protection"""
        if not self.integration_key:
            raise DocuSignError("DocuSign integration key not configured")
        
        state = secrets.token_urlsafe(32)
        
        auth_params = {
            "response_type": "code",
            "scope": "signature impersonation",
            "client_id": self.integration_key,
            "redirect_uri": redirect_uri,
            "state": state,
        }
        
        auth_url = f"https://{self.oauth_base_url}/oauth/auth?{urlencode(auth_params)}"
        return auth_url, state
    
    def get_oauth_url(self, redirect_uri: str, state: str = "") -> str:
        """Legacy method - Generate DocuSign OAuth authorization URL"""
        if not state:
            state = secrets.token_urlsafe(32)
        
        auth_params = {
            "response_type": "code",
            "scope": "signature impersonation",
            "client_id": self.integration_key,
            "redirect_uri": redirect_uri,
            "state": state,
        }
        
        return f"https://{self.oauth_base_url}/oauth/auth?{urlencode(auth_params)}"
    
    async def exchange_code_for_tokens(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens (OAuth 2.0 flow)"""
        if not self.client_secret:
            raise DocuSignError("DocuSign client secret not configured. Required for OAuth code exchange.")
        
        token_params = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        
        # Create Basic auth header
        credentials = f"{self.integration_key}:{self.client_secret}"
        auth_header = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://{self.oauth_base_url}/oauth/token",
                    data=token_params,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"DocuSign token exchange failed: {response.text}")
                    raise DocuSignError(f"Token exchange failed: {response.text}")
                
                token_data = response.json()
                logger.info("Successfully obtained DocuSign tokens")
                return token_data
                
        except httpx.HTTPError as e:
            logger.error(f"DocuSign HTTP error: {str(e)}")
            raise DocuSignError(f"Token exchange failed: {str(e)}")
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Use refresh token to get new access token"""
        if not self.client_secret:
            raise DocuSignError("DocuSign client secret not configured")
        
        token_params = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
        
        credentials = f"{self.integration_key}:{self.client_secret}"
        auth_header = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://{self.oauth_base_url}/oauth/token",
                    data=token_params,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise DocuSignError(f"Token refresh failed: {response.text}")
                
                return response.json()
                
        except httpx.HTTPError as e:
            raise DocuSignError(f"Token refresh failed: {str(e)}")
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user info including account ID from DocuSign"""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://{self.oauth_base_url}/oauth/userinfo",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise DocuSignError(f"Failed to get user info: {response.text}")
                
                data = response.json()
                
                # Extract primary account
                account = data.get("accounts", [{}])[0]
                
                return {
                    "account_id": account.get("account_id"),
                    "account_name": account.get("account_name"),
                    "base_uri": account.get("base_uri"),
                    "is_default": account.get("is_default"),
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "sub": data.get("sub"),
                }
                
        except httpx.HTTPError as e:
            raise DocuSignError(f"Failed to get user info: {str(e)}")
    
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
