# Cloudflare CDN & DDoS Protection Setup Guide for DOMMMA

## Overview
This guide walks you through setting up Cloudflare CDN and DDoS protection for your DOMMMA deployment.

## Prerequisites
- Cloudflare account (already set up for R2)
- Domain name pointing to your DOMMMA deployment
- Access to DNS settings

---

## Step 1: Add Your Domain to Cloudflare

1. Log into your Cloudflare dashboard: https://dash.cloudflare.com
2. Click **"Add a Site"**
3. Enter your domain (e.g., `dommma.com`)
4. Select a plan (Free plan includes basic DDoS protection)
5. Cloudflare will scan your existing DNS records

---

## Step 2: Update Nameservers

1. Cloudflare will provide you with nameservers like:
   - `ada.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`
2. Go to your domain registrar and update nameservers
3. Wait for propagation (usually 24-48 hours)

---

## Step 3: Configure DNS Records

Add these DNS records in Cloudflare:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | Your server IP | Proxied (orange cloud) |
| A | www | Your server IP | Proxied (orange cloud) |
| A | api | Your server IP | Proxied (orange cloud) |
| CNAME | storage | Your R2 bucket URL | DNS Only |

**Important:** Keep the orange cloud (Proxied) enabled for CDN and DDoS protection.

---

## Step 4: Enable SSL/TLS

1. Go to **SSL/TLS** in your Cloudflare dashboard
2. Set SSL mode to **Full (Strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

---

## Step 5: Configure CDN Caching

### Page Rules (Free Plan)
1. Go to **Rules** > **Page Rules**
2. Create these rules:

**Rule 1: Cache Static Assets**
- URL: `*dommma.com/static/*`
- Setting: Cache Level = Cache Everything
- Edge Cache TTL: 1 month

**Rule 2: Bypass Cache for API**
- URL: `*dommma.com/api/*`
- Setting: Cache Level = Bypass

**Rule 3: Cache Images**
- URL: `*dommma.com/*.jpg` (repeat for .png, .webp)
- Setting: Cache Level = Cache Everything
- Edge Cache TTL: 1 week

### Cache Rules (Better Method)
1. Go to **Caching** > **Cache Rules**
2. Create rule for static files:
   - When: URI Path contains `/static/` OR ends with `.js` OR ends with `.css`
   - Then: Cache everything, Edge TTL: 1 month

---

## Step 6: Enable DDoS Protection

DDoS protection is **automatic** on Cloudflare, but you can enhance it:

### Security Settings
1. Go to **Security** > **Settings**
2. Set Security Level to **Medium** or **High**
3. Enable **Bot Fight Mode**
4. Enable **Browser Integrity Check**

### WAF (Web Application Firewall)
1. Go to **Security** > **WAF**
2. Enable **Managed Rules** (OWASP rules)
3. Create custom rules if needed:
   - Block countries you don't serve
   - Rate limit login attempts

### Rate Limiting
1. Go to **Security** > **WAF** > **Rate limiting rules**
2. Create rule for login endpoint:
   - URI Path equals `/api/auth/login`
   - Rate limit: 10 requests per minute
   - Action: Block for 10 minutes

---

## Step 7: Configure R2 with CDN

Your R2 bucket is already set up. To serve files through CDN:

### Option A: Custom Domain for R2
1. Go to **R2** > Your bucket > **Settings**
2. Click **Connect Domain**
3. Add subdomain like `files.dommma.com`
4. Cloudflare will handle SSL and caching

### Option B: Workers (Advanced)
Create a Cloudflare Worker to serve R2 files with custom headers:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    
    const object = await env.MY_BUCKET.get(key);
    
    if (object === null) {
      return new Response('Not Found', { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    return new Response(object.body, { headers });
  },
};
```

---

## Step 8: Monitor & Analytics

1. Go to **Analytics & Logs** > **Traffic**
2. Monitor:
   - Total requests
   - Cached vs uncached requests
   - Threats blocked
   - Top countries

### Set Up Notifications
1. Go to **Notifications**
2. Create alerts for:
   - DDoS attack detected
   - SSL certificate expiring
   - Origin server errors

---

## Recommended Settings Summary

| Setting | Recommended Value |
|---------|------------------|
| SSL Mode | Full (Strict) |
| Security Level | Medium |
| Browser Integrity Check | On |
| Bot Fight Mode | On |
| Always Use HTTPS | On |
| Minimum TLS Version | 1.2 |
| Opportunistic Encryption | On |

---

## Testing Your Setup

1. **CDN Test:**
   ```bash
   curl -I https://yourdomain.com/static/js/main.js
   # Look for: cf-cache-status: HIT
   ```

2. **SSL Test:**
   Visit https://www.ssllabs.com/ssltest/

3. **Speed Test:**
   Visit https://www.webpagetest.org/

4. **Security Test:**
   Visit https://securityheaders.com/

---

## Troubleshooting

### Issue: "Error 521 - Web server is down"
- Your origin server is not responding
- Check that your backend is running
- Verify firewall allows Cloudflare IPs

### Issue: "Error 524 - A timeout occurred"
- Request took too long (>100s)
- Optimize slow API endpoints
- Increase timeout in Cloudflare settings

### Issue: Assets not caching
- Check Page Rules order (first match wins)
- Verify Cache-Control headers from origin
- Check for query strings in URLs

---

## Support

For Cloudflare support:
- Documentation: https://developers.cloudflare.com
- Community: https://community.cloudflare.com
- Support: https://support.cloudflare.com

---

*Last Updated: March 2026*
