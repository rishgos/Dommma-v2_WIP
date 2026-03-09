# DOMMMA Cloudflare Integration Plan

## Overview

This document outlines the plan to integrate Cloudflare services into DOMMMA for improved performance, security, and file storage.

---

## Services to Implement

### 1. Cloudflare CDN (Content Delivery Network)

**Purpose:** Accelerate website loading by caching static assets globally

**Benefits:**
- Faster page loads (50-200ms improvement)
- Reduced server load
- Global edge network (200+ data centers)
- Automatic image optimization

**Implementation:**
1. Set up Cloudflare account with dommma.com domain
2. Update DNS nameservers to Cloudflare
3. Configure caching rules for static assets
4. Enable Brotli/Gzip compression
5. Set up Page Rules for optimization

### 2. Cloudflare R2 Storage

**Purpose:** Store user-uploaded files (documents, images, property photos)

**Benefits:**
- S3-compatible API (easy migration)
- No egress fees (unlike S3)
- Automatic global distribution
- Integrated with Cloudflare CDN

**Current File Types to Store:**
- Property photos/images
- Lease documents (PDFs)
- Contractor portfolios
- User avatars
- E-signed documents

**Implementation:**
1. Create R2 bucket in Cloudflare dashboard
2. Generate R2 API tokens
3. Update backend to use R2 for file uploads
4. Migrate existing files from current storage
5. Set up lifecycle rules for old files

### 3. DDoS Protection

**Purpose:** Protect against malicious traffic and attacks

**Benefits:**
- Free DDoS mitigation (included with Cloudflare)
- Bot protection
- Rate limiting
- Web Application Firewall (WAF)

**Implementation:**
1. Enable DDoS protection (automatic with Cloudflare proxy)
2. Configure rate limiting rules
3. Set up WAF rules for common attacks
4. Enable bot management
5. Configure security headers

---

## Implementation Steps

### Phase 1: CDN Setup (Day 1-2)
1. Create Cloudflare account
2. Add dommma.com domain
3. Update DNS nameservers
4. Verify SSL/TLS (Full Strict mode)
5. Enable caching and optimization

### Phase 2: R2 Storage (Day 3-5)
1. Create R2 bucket
2. Generate API credentials
3. Install `boto3` or use Cloudflare SDK
4. Update file upload endpoints
5. Test uploads/downloads
6. Migrate existing files

### Phase 3: Security Hardening (Day 6-7)
1. Configure WAF rules
2. Set up rate limiting
3. Enable security headers
4. Test attack protection
5. Set up monitoring/alerts

---

## Required Credentials

To implement Cloudflare integration, you'll need:

1. **Cloudflare Account**
   - Sign up at https://dash.cloudflare.com
   - Free tier is sufficient for basic features

2. **R2 API Credentials**
   - Go to R2 → Manage R2 API Tokens
   - Create token with read/write access
   - Note: Access Key ID and Secret Access Key

3. **DNS Access**
   - Access to your domain registrar
   - Ability to update nameservers

---

## Code Changes Required

### Backend Updates

```python
# Example R2 upload function
import boto3
from botocore.config import Config

R2_ENDPOINT = "https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_ACCESS_KEY = os.environ.get('R2_ACCESS_KEY')
R2_SECRET_KEY = os.environ.get('R2_SECRET_KEY')
R2_BUCKET = "dommma-files"

s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version='s3v4')
)

async def upload_to_r2(file_data, filename, content_type):
    """Upload file to Cloudflare R2"""
    key = f"uploads/{datetime.now().strftime('%Y/%m')}/{filename}"
    s3_client.put_object(
        Bucket=R2_BUCKET,
        Key=key,
        Body=file_data,
        ContentType=content_type
    )
    return f"https://files.dommma.com/{key}"
```

### Frontend Updates

- Update image URLs to use CDN domain
- Implement lazy loading for images
- Use srcset for responsive images

---

## Estimated Costs

| Service | Cost |
|---------|------|
| Cloudflare CDN | Free (Pro: $20/mo for advanced features) |
| R2 Storage | $0.015/GB/month stored |
| R2 Egress | Free (no egress fees!) |
| DDoS Protection | Free (included) |
| WAF | Free basic / $20/mo Pro |

**Estimated Monthly Cost:** $5-25 depending on storage usage

---

## Questions for User

Before proceeding, please confirm:

1. Do you have a Cloudflare account or should I guide you through setup?
2. What is your domain registrar (for DNS updates)?
3. Do you want to use the free tier or Pro plan?
4. Current approximate storage needs (GB of files)?

---

## Next Steps

Once you confirm you want to proceed:

1. I'll create the R2 integration code
2. Update file upload endpoints
3. Add CDN-optimized image serving
4. Configure security headers
5. Test the full integration
