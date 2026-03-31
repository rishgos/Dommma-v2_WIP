"""AI Document Intelligence router - Tenant document review and lease comparison"""
import os
import json
import logging
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/ai", tags=["ai-intelligence"])
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "dommma")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


@router.post("/tenant-document-review")
async def ai_tenant_document_review(document_id: str = None, content: str = None, tenant_id: str = None):
    """AI reviews a lease/rental document for tenant, highlighting payment terms, late fees, critical clauses"""
    
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        return {
            "summary": "Document review is currently unavailable. AI service is not configured.",
            "monthly_obligations": {"rent": "N/A", "late_fee": "N/A", "other_fees": []},
            "highlights": [],
            "concerns": [],
            "tenant_checklist": ["Verify rent amount", "Check late fee terms", "Review move-in/move-out dates"],
            "risk_score": "N/A"
        }
    
    doc_content = content or ""
    if document_id and not content:
        doc = await db.esign_documents.find_one({"id": document_id}, {"_id": 0})
        if not doc:
            doc = await db.builder_documents.find_one({"id": document_id}, {"_id": 0})
        if doc:
            form_data = doc.get("form_data", {})
            doc_content = "\n".join([f"{k}: {v}" for k, v in form_data.items() if v])
            if not doc_content:
                doc_content = doc.get("content", str(doc))
    
    if not doc_content:
        raise HTTPException(status_code=400, detail="No document content provided")
    
    from anthropic import AsyncAnthropic
    client_ai = AsyncAnthropic(api_key=anthropic_key)
    
    prompt = f"""You are a tenant advocacy AI assistant reviewing a rental agreement in British Columbia, Canada.
Your job is to protect the tenant's interests and flag anything unusual.

Review this document and provide:
1. A clear summary of key terms
2. All financial obligations (rent, deposits, fees)
3. Any clauses that are unusual, unfair, or potentially illegal under BC Residential Tenancy Act
4. A risk assessment score (low/medium/high)
5. A checklist of things the tenant should verify or negotiate

Document content:
{doc_content}

Respond ONLY in valid JSON format:
{{
    "summary": "2-3 sentence plain language summary",
    "monthly_obligations": {{
        "rent": "$amount/month",
        "late_fee": "description of late fee structure",
        "other_fees": ["list of other fees"]
    }},
    "highlights": [
        {{"type": "info|warning|alert", "title": "short title", "clause": "relevant text from doc", "explanation": "why this matters for tenant"}}
    ],
    "concerns": [
        {{"severity": "low|medium|high", "issue": "description", "legal_reference": "relevant BC RTA section", "recommendation": "what tenant should do"}}
    ],
    "tenant_checklist": ["action items for tenant before signing"],
    "risk_score": "low|medium|high",
    "risk_explanation": "why this risk score"
}}"""

    try:
        response = await client_ai.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        result_text = response.content[0].text
        try:
            json_start = result_text.find('{')
            json_end = result_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                result = json.loads(result_text[json_start:json_end])
                return result
        except json.JSONDecodeError:
            pass
        
        return {
            "summary": result_text[:500],
            "highlights": [],
            "concerns": [],
            "tenant_checklist": [],
            "risk_score": "unknown"
        }
    except Exception as e:
        logger.error(f"AI document review error: {e}")
        raise HTTPException(status_code=500, detail="AI review failed")


@router.get("/lease-comparison")
async def ai_lease_comparison(tenant_id: str, document_id: str):
    """Compare a lease against BC standard terms and market averages"""
    
    doc = await db.esign_documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        doc = await db.builder_documents.find_one({"id": document_id}, {"_id": 0})
    
    form_data = doc.get("form_data", {}) if doc else {}
    
    rent = float(form_data.get("monthly_rent", 0) or 0)
    deposit = float(form_data.get("security_deposit", 0) or 0)
    
    max_deposit = rent / 2 if rent > 0 else 0
    deposit_compliant = deposit <= max_deposit if rent > 0 else True
    
    comparison = {
        "document_id": document_id,
        "rent_analysis": {
            "amount": rent,
            "market_comparison": "Within typical Vancouver range" if 1500 <= rent <= 3500 else "Outside typical range",
        },
        "deposit_analysis": {
            "amount": deposit,
            "max_allowed": max_deposit,
            "compliant": deposit_compliant,
            "note": f"BC RTA limits deposit to half month's rent (${max_deposit:.2f})" if not deposit_compliant else "Deposit is within legal limits"
        },
        "key_terms": {
            "pet_policy": form_data.get("pets_allowed", "Not specified"),
            "parking": form_data.get("parking_included", "Not specified"),
            "utilities_included": [k.replace("_included", "") for k, v in form_data.items() if k.endswith("_included") and v],
            "lease_type": form_data.get("tenancy_type", "Not specified"),
        },
        "bc_rta_compliance": {
            "deposit_within_limit": deposit_compliant,
            "has_start_date": bool(form_data.get("start_date")),
            "has_rent_amount": rent > 0,
            "has_parties_info": bool(form_data.get("landlord_name") and form_data.get("tenant_name")),
        }
    }
    
    return comparison
