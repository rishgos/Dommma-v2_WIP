# DOMMMA - Complete Technical Handover Guide

## Document Information
- **Version:** 1.0
- **Created:** March 12, 2026
- **Purpose:** Complete handover documentation for non-technical users
- **Website:** https://dommma.com

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Account Access & Credentials](#3-account-access--credentials)
4. [GitHub Repository](#4-github-repository)
5. [Domain Management (GoDaddy)](#5-domain-management-godaddy)
6. [AWS Hosting (EC2)](#6-aws-hosting-ec2)
7. [Database (MongoDB Atlas)](#7-database-mongodb-atlas)
8. [File Storage (Cloudflare R2)](#8-file-storage-cloudflare-r2)
9. [Third-Party Services](#9-third-party-services)
10. [How to Update the Website](#10-how-to-update-the-website)
11. [How to Add New Features](#11-how-to-add-new-features)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Security Best Practices](#13-security-best-practices)
14. [Costs & Billing](#14-costs--billing)
15. [Emergency Contacts & Support](#15-emergency-contacts--support)

---

# 1. PROJECT OVERVIEW

## What is DOMMMA?

DOMMMA is a **real estate marketplace platform** for Metro Vancouver. It's like Zillow/Realtor.ca but with an AI assistant (named "Nova") that helps users:

- **Renters:** Find apartments, apply for rentals, find roommates
- **Landlords:** List properties, find tenants, manage maintenance
- **Buyers/Sellers:** Browse homes for sale, make offers
- **Contractors:** Get hired for home services (plumbing, electrical, etc.)

## Key Features

| Feature | Description |
|---------|-------------|
| Nova AI Chatbot | AI assistant that helps users via conversation |
| Property Listings | Browse, search, and filter rentals & homes for sale |
| Contractor Marketplace | Find and hire home service professionals |
| E-Sign Documents | Sign leases and contracts digitally |
| Payment Processing | Pay rent, deposits, and service fees via Stripe |
| Analytics Dashboard | Performance metrics for landlords |

## Technology Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| Website (Frontend) | React.js | What users see and interact with |
| Server (Backend) | Python FastAPI | Handles all business logic |
| Database | MongoDB Atlas | Stores all data (users, listings, etc.) |
| Hosting | AWS EC2 | Runs the website 24/7 |
| Domain | GoDaddy | dommma.com domain name |
| File Storage | Cloudflare R2 | Stores images and documents |
| AI | Anthropic Claude | Powers the Nova chatbot |
| Payments | Stripe | Processes credit card payments |
| Emails | Resend | Sends notification emails |

---

# 2. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                                     │
│                        (https://dommma.com)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AWS EC2 SERVER (Ubuntu)                               │
│                        IP: 35.182.109.198                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         NGINX (Web Server)                          │    │
│  │         - Handles HTTPS/SSL certificates                            │    │
│  │         - Routes traffic to frontend or backend                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                    │                              │                          │
│                    ▼                              ▼                          │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐     │
│  │   FRONTEND (React App)      │   │   BACKEND (FastAPI Server)      │     │
│  │   - Static HTML/CSS/JS      │   │   - API endpoints               │     │
│  │   - User interface          │   │   - Business logic              │     │
│  │   Port: 3000 (internal)     │   │   Port: 8001 (internal)         │     │
│  │   Managed by: Nginx         │   │   Managed by: PM2               │     │
│  └─────────────────────────────┘   └─────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────┐
                    │                               │                           │
                    ▼                               ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
    │   MongoDB Atlas       │   │   Cloudflare R2       │   │   Third-Party APIs    │
    │   (Database)          │   │   (File Storage)      │   │   - Anthropic (AI)    │
    │   - Users             │   │   - Property images   │   │   - Stripe (Payments) │
    │   - Listings          │   │   - Documents         │   │   - Resend (Emails)   │
    │   - Messages          │   │   - User avatars      │   │   - Google Maps       │
    └───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

## Data Flow Example: User Views a Property

1. User opens **https://dommma.com/browse** in their browser
2. **Nginx** receives the request and serves the React frontend
3. Frontend makes API call to **GET /api/listings**
4. **Nginx** routes `/api/*` requests to the **Backend** (port 8001)
5. Backend queries **MongoDB Atlas** for listing data
6. Backend returns JSON data with image URLs from **Cloudflare R2**
7. Frontend displays the listings to the user

---

# 3. ACCOUNT ACCESS & CREDENTIALS

## CRITICAL: Keep These Safe!

Store these credentials securely. If compromised, change them immediately.

### Master Account List

| Service | Login URL | Email/Username | Notes |
|---------|-----------|----------------|-------|
| GitHub | github.com | [Your GitHub email] | Code repository |
| AWS Console | aws.amazon.com | [Your AWS email] | Hosting |
| GoDaddy | godaddy.com | [Your GoDaddy email] | Domain |
| MongoDB Atlas | cloud.mongodb.com | [Your MongoDB email] | Database |
| Cloudflare | dash.cloudflare.com | [Your Cloudflare email] | File storage |
| Stripe | dashboard.stripe.com | [Your Stripe email] | Payments |
| Resend | resend.com | [Your Resend email] | Emails |
| Anthropic | console.anthropic.com | [Your Anthropic email] | AI |

### SSH Key for Server Access

The `.pem` file (`dommma-key.pem`) is required to access the EC2 server.

**NEVER share this file publicly or commit it to GitHub.**

Store it securely and give it only to trusted team members.

---

# 4. GITHUB REPOSITORY

## Repository Information

| Item | Value |
|------|-------|
| URL | https://github.com/Candour-Realty/Dommma_v2_2026 |
| Main Branch | `main` |
| Visibility | Private |

## Repository Structure

```
Dommma_v2_2026/
├── backend/                    # Python server code
│   ├── server.py              # Main application file (~4000 lines)
│   ├── requirements.txt       # Python dependencies
│   ├── services/              # Helper modules
│   │   ├── email.py          # Email sending logic
│   │   ├── r2_storage.py     # File upload logic
│   │   └── ai_tools.py       # AI chatbot tools
│   └── .env.example          # Template for environment variables
│
├── frontend/                   # React website code
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── pages/            # All website pages
│   │   └── components/       # Reusable UI components
│   ├── public/               # Static files (images, favicon)
│   ├── package.json          # JavaScript dependencies
│   └── .env.example          # Template for environment variables
│
├── README.md                   # Project documentation
└── .gitignore                 # Files to exclude from Git
```

## How to View the Code

1. Go to https://github.com/Candour-Realty/Dommma_v2_2026
2. Log in with the GitHub account that has access
3. Browse files by clicking on folders
4. View file history by clicking "History" button

## Important Files to Know

| File | Purpose | When to Edit |
|------|---------|--------------|
| `backend/server.py` | All API logic | Adding new features |
| `frontend/src/pages/*.jsx` | Website pages | Changing UI |
| `backend/.env` | Server secrets | Updating API keys |
| `frontend/.env` | Frontend config | Changing domain |

---

# 5. DOMAIN MANAGEMENT (GODADDY)

## Domain Information

| Item | Value |
|------|-------|
| Domain | dommma.com |
| Registrar | GoDaddy |
| Renewal Date | [Check GoDaddy account] |
| DNS Management | AWS Route 53 |

## Current DNS Setup

The domain's nameservers point to **AWS Route 53**, which manages all DNS records.

### DNS Records (in AWS Route 53)

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | dommma.com | 35.182.109.198 | Points domain to server |
| A | www.dommma.com | 35.182.109.198 | www subdomain |

## How to Renew the Domain

1. Log in to **GoDaddy** (godaddy.com)
2. Go to "My Products" > "Domains"
3. Find **dommma.com**
4. Click "Renew" before the expiration date
5. Pay for renewal (typically $15-20/year for .com)

## How to Transfer Domain to Another Registrar

1. Unlock the domain in GoDaddy
2. Get the authorization/EPP code from GoDaddy
3. Initiate transfer at the new registrar
4. Approve the transfer via email
5. Update nameservers if needed

---

# 6. AWS HOSTING (EC2)

## Server Information

| Item | Value |
|------|-------|
| Cloud Provider | Amazon Web Services (AWS) |
| Region | Canada (Central) - ca-central-1 |
| Instance Type | t3.small |
| Operating System | Ubuntu 24.04 LTS |
| Public IP | 35.182.109.198 (Elastic IP) |
| Instance ID | [Check AWS Console] |

## How to Access the Server (SSH)

### Prerequisites
- SSH key file: `dommma-key.pem`
- SSH client (Terminal on Mac/Linux, PowerShell or PuTTY on Windows)

### Connection Command

**Mac/Linux:**
```bash
# Navigate to folder containing the key file
cd ~/Downloads  # or wherever your key is

# Set correct permissions (first time only)
chmod 400 dommma-key.pem

# Connect to server
ssh -i dommma-key.pem ubuntu@35.182.109.198
```

**Windows (PowerShell):**
```powershell
ssh -i C:\path\to\dommma-key.pem ubuntu@35.182.109.198
```

### Once Connected

You'll see a prompt like:
```
ubuntu@ip-172-31-1-221:~$
```

Now you can run commands on the server.

## Server Directory Structure

```
/home/ubuntu/dommma/          # Main application folder
├── backend/
│   ├── server.py             # Backend code
│   ├── .env                  # Backend secrets (NEVER commit!)
│   ├── venv/                 # Python virtual environment
│   └── requirements.txt
├── frontend/
│   ├── src/                  # React source code
│   ├── build/                # Compiled website (served to users)
│   ├── .env                  # Frontend config
│   └── package.json
└── .git/                     # Git repository data

/etc/nginx/sites-available/dommma    # Nginx configuration
/var/log/nginx/                       # Web server logs
/home/ubuntu/.pm2/logs/               # Backend logs
```

## Key Commands Reference

### Check if Services are Running

```bash
# Check Nginx (web server)
sudo systemctl status nginx

# Check PM2 (backend process manager)
pm2 status

# Check backend logs
pm2 logs dommma-backend --lines 50
```

### Restart Services

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart Backend
pm2 restart dommma-backend
```

### View Logs

```bash
# View Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# View Nginx access logs
sudo tail -50 /var/log/nginx/access.log

# View backend logs
pm2 logs dommma-backend --lines 100
```

---

# 7. DATABASE (MONGODB ATLAS)

## Database Information

| Item | Value |
|------|-------|
| Provider | MongoDB Atlas (Cloud) |
| Cluster Name | [Check MongoDB Atlas] |
| Database Name | dommma |
| Region | AWS Canada |

## How to Access MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Log in with your account
3. Select the cluster
4. Click "Browse Collections" to view data

## Database Collections (Tables)

| Collection | Purpose | Sample Fields |
|------------|---------|---------------|
| users | User accounts | email, password, role, name |
| listings | Property listings | title, address, price, bedrooms |
| applications | Rental applications | user_id, listing_id, status |
| messages | Chat messages | sender_id, receiver_id, content |
| payments | Payment records | amount, status, stripe_id |
| jobs | Contractor job posts | title, category, budget |
| documents | E-sign documents | title, content, signatures |

## Backup & Recovery

MongoDB Atlas automatically creates backups. To restore:

1. Go to MongoDB Atlas dashboard
2. Click on your cluster
3. Go to "Backup" tab
4. Select "Restore" and choose a backup point

---

# 8. FILE STORAGE (CLOUDFLARE R2)

## Storage Information

| Item | Value |
|------|-------|
| Provider | Cloudflare R2 |
| Bucket Name | dommma-files |
| Public URL | [Your R2 public URL] |

## What's Stored Here

- Property listing images
- User profile pictures (avatars)
- Documents (PDFs, contracts)
- Contractor portfolio images

## How to Access Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Log in with your account
3. Click "R2" in the sidebar
4. Select the bucket to view files

---

# 9. THIRD-PARTY SERVICES

## Service Details

### Anthropic (AI Chatbot)

| Item | Value |
|------|-------|
| Website | console.anthropic.com |
| Model Used | Claude Sonnet 4.5 |
| Purpose | Powers Nova AI assistant |
| Cost | Pay per API call (~$0.003 per message) |

### Stripe (Payments)

| Item | Value |
|------|-------|
| Website | dashboard.stripe.com |
| Purpose | Credit card processing |
| Cost | 2.9% + $0.30 per transaction |

### Resend (Emails)

| Item | Value |
|------|-------|
| Website | resend.com |
| Purpose | Transactional emails |
| Cost | Free tier: 3,000 emails/month |

### Google Maps Platform

| Item | Value |
|------|-------|
| Website | console.cloud.google.com |
| APIs Used | Maps JavaScript API, Places API |
| Purpose | Address autocomplete, map display |
| Cost | $200 free credit/month |

---

# 10. HOW TO UPDATE THE WEBSITE

## Step-by-Step Update Process

### Scenario: Someone Made Code Changes on GitHub

**Step 1: Connect to the Server**
```bash
ssh -i dommma-key.pem ubuntu@35.182.109.198
```

**Step 2: Navigate to Project Folder**
```bash
cd /home/ubuntu/dommma
```

**Step 3: Pull the Latest Code from GitHub**
```bash
git pull origin main
```

**Step 4: If Backend Code Changed**
```bash
# Activate Python environment
source backend/venv/bin/activate

# Install any new dependencies
pip install -r backend/requirements.txt

# Restart the backend
pm2 restart dommma-backend
```

**Step 5: If Frontend Code Changed**
```bash
# Navigate to frontend
cd frontend

# Install any new dependencies
yarn install

# Build the new version
yarn build

# Fix permissions for Nginx
sudo chown -R www-data:www-data build/
sudo chmod -R 755 build/

# Restart Nginx
sudo systemctl restart nginx
```

**Step 6: Verify the Update**
- Open https://dommma.com in a browser
- Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Test the changed features

## Quick Reference Commands

```bash
# Full update (backend + frontend)
cd /home/ubuntu/dommma && \
git pull origin main && \
source backend/venv/bin/activate && \
pip install -r backend/requirements.txt && \
pm2 restart dommma-backend && \
cd frontend && \
yarn install && \
yarn build && \
sudo chown -R www-data:www-data build/ && \
sudo chmod -R 755 build/ && \
sudo systemctl restart nginx
```

---

# 11. HOW TO ADD NEW FEATURES

## For Non-Technical Users

If you need new features added:

1. **Document the requirement clearly** - Write exactly what you want
2. **Provide examples** - Screenshots, competitor websites, etc.
3. **Prioritize** - What's most important?
4. **Hire a developer** - Use platforms like:
   - Upwork (upwork.com)
   - Toptal (toptal.com)
   - Fiverr (fiverr.com)
5. **Give them access** to:
   - GitHub repository (invite as collaborator)
   - This handover document
   - NOT the .pem file unless necessary

## For Developers

### Backend Changes (Python/FastAPI)

1. Edit files in `/app/backend/`
2. Main file: `server.py`
3. Test locally first
4. Commit and push to GitHub
5. SSH to server and pull changes
6. Restart PM2: `pm2 restart dommma-backend`

### Frontend Changes (React)

1. Edit files in `/app/frontend/src/`
2. Pages are in `src/pages/`
3. Components are in `src/components/`
4. Test locally: `yarn start`
5. Commit and push to GitHub
6. SSH to server, pull, and rebuild

### Adding New API Endpoints

In `backend/server.py`, add:

```python
@api_router.get("/your-endpoint")
async def your_function():
    # Your logic here
    return {"message": "success"}
```

### Adding New Pages

1. Create `frontend/src/pages/YourPage.jsx`
2. Add route in `frontend/src/App.js`
3. Add navigation link if needed

---

# 12. TROUBLESHOOTING GUIDE

## Common Issues & Solutions

### Website Shows Blank White Page

**Cause:** Usually a JavaScript error or missing environment variable

**Solution:**
1. Check browser console (F12 > Console)
2. SSH to server and check frontend .env:
   ```bash
   cat /home/ubuntu/dommma/frontend/.env
   ```
3. If missing, create it:
   ```bash
   echo "REACT_APP_BACKEND_URL=https://dommma.com" > /home/ubuntu/dommma/frontend/.env
   ```
4. Rebuild frontend:
   ```bash
   cd /home/ubuntu/dommma/frontend
   sudo chown -R ubuntu:ubuntu build/
   yarn build
   sudo chown -R www-data:www-data build/
   sudo systemctl restart nginx
   ```

### "502 Bad Gateway" Error

**Cause:** Backend server is not running

**Solution:**
```bash
# Check if backend is running
pm2 status

# If stopped, start it
pm2 start /home/ubuntu/dommma/backend/server.py --name dommma-backend --interpreter python3

# Check logs for errors
pm2 logs dommma-backend --lines 50
```

### "Permission Denied" Errors

**Cause:** File ownership issues

**Solution:**
```bash
# Fix build folder permissions
sudo chown -R www-data:www-data /home/ubuntu/dommma/frontend/build/
sudo chmod -R 755 /home/ubuntu/dommma/frontend/build/

# Restart Nginx
sudo systemctl restart nginx
```

### Cannot Connect via SSH

**Possible Causes:**
1. Wrong IP address
2. Security group blocking port 22
3. Key file permissions wrong

**Solutions:**
```bash
# Check key permissions
chmod 400 dommma-key.pem

# Verify IP in AWS Console (EC2 > Instances)
# Check Security Groups allow port 22 from your IP
```

### Database Connection Failed

**Cause:** MongoDB Atlas IP whitelist

**Solution:**
1. Go to MongoDB Atlas
2. Network Access > Add IP Address
3. Add the EC2 server's IP: 35.182.109.198

### Emails Not Sending

**Cause:** Resend API key issue or domain verification

**Solution:**
1. Check Resend dashboard for errors
2. Verify domain in Resend
3. Check API key in backend `.env`

---

# 13. SECURITY BEST PRACTICES

## DO:

- Keep `.pem` file secure and never share publicly
- Rotate API keys periodically
- Use strong passwords for all accounts
- Enable 2FA on all service accounts
- Keep software updated (`sudo apt update && sudo apt upgrade`)
- Monitor AWS billing for unexpected charges

## DON'T:

- Commit `.env` files to GitHub
- Share credentials via email or chat
- Use the same password for multiple services
- Leave SSH key files in public locations
- Ignore security alerts from AWS

## Monthly Security Checklist

- [ ] Review AWS billing for anomalies
- [ ] Check MongoDB Atlas access logs
- [ ] Update server packages
- [ ] Review GitHub access permissions
- [ ] Test backup restoration

---

# 14. COSTS & BILLING

## Monthly Estimated Costs

| Service | Estimated Cost | Billing Cycle |
|---------|---------------|---------------|
| AWS EC2 (t3.small) | ~$15-20/month | Monthly |
| AWS Data Transfer | ~$5-10/month | Monthly |
| MongoDB Atlas | Free tier or ~$10/month | Monthly |
| Cloudflare R2 | ~$5-15/month | Monthly |
| Domain (GoDaddy) | ~$15-20/year | Annual |
| Anthropic (AI) | Variable (~$20-50/month) | Monthly |
| Stripe | 2.9% + $0.30 per transaction | Per transaction |
| Resend | Free tier (3,000 emails) | Monthly |
| Google Maps | Free ($200 credit/month) | Monthly |

**Total Estimated:** ~$50-100/month (varies with usage)

## How to Monitor Costs

1. **AWS:** Go to Billing Dashboard in AWS Console
2. **MongoDB:** Check Atlas dashboard for usage
3. **Stripe:** Check Stripe Dashboard > Balance
4. **Anthropic:** Check console.anthropic.com > Usage

## Cost Optimization Tips

- Use AWS Reserved Instances for 30-40% savings
- Stay within MongoDB Atlas free tier if possible
- Monitor Anthropic API usage closely
- Set up billing alerts in AWS

---

# 15. EMERGENCY CONTACTS & SUPPORT

## Service Support

| Service | Support URL | Response Time |
|---------|-------------|---------------|
| AWS | aws.amazon.com/support | 24 hours |
| MongoDB Atlas | mongodb.com/support | 24 hours |
| GoDaddy | godaddy.com/help | 24/7 phone |
| Stripe | support.stripe.com | 24-48 hours |
| Cloudflare | support.cloudflare.com | 24-48 hours |

## What to Do in an Emergency

### Website is Down
1. SSH to server and check services
2. Check AWS Console for instance status
3. Check MongoDB Atlas for database status
4. Contact AWS support if needed

### Security Breach Suspected
1. Change all passwords immediately
2. Rotate all API keys
3. Check AWS CloudTrail logs
4. Contact AWS security support

### Payment Issues
1. Check Stripe Dashboard for errors
2. Verify API keys are correct
3. Contact Stripe support

---

# APPENDIX A: COMPLETE COMMAND REFERENCE

## Server Connection
```bash
ssh -i dommma-key.pem ubuntu@35.182.109.198
```

## Service Management
```bash
# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl stop nginx
sudo systemctl start nginx

# PM2 (Backend)
pm2 status
pm2 restart dommma-backend
pm2 stop dommma-backend
pm2 start dommma-backend
pm2 logs dommma-backend --lines 100
```

## Code Deployment
```bash
# Pull latest code
cd /home/ubuntu/dommma
git pull origin main

# Backend update
source backend/venv/bin/activate
pip install -r backend/requirements.txt
pm2 restart dommma-backend

# Frontend update
cd frontend
yarn install
yarn build
sudo chown -R www-data:www-data build/
sudo chmod -R 755 build/
sudo systemctl restart nginx
```

## Log Viewing
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Backend logs
pm2 logs dommma-backend --lines 100

# System logs
journalctl -u nginx -f
```

## File Editing
```bash
# Edit backend .env
nano /home/ubuntu/dommma/backend/.env

# Edit frontend .env
nano /home/ubuntu/dommma/frontend/.env

# Edit Nginx config
sudo nano /etc/nginx/sites-available/dommma
```

---

# APPENDIX B: ENVIRONMENT VARIABLES REFERENCE

## Backend (.env)

```env
# Database
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=dommma

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Payments
STRIPE_API_KEY=sk_live_xxx

# Email
RESEND_API_KEY=re_xxx
SENDER_EMAIL=noreply@dommma.com

# File Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_BUCKET=dommma-files

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

## Frontend (.env)

```env
REACT_APP_BACKEND_URL=https://dommma.com
REACT_APP_GOOGLE_MAPS_KEY=AIzaSyxxx
```

---

# APPENDIX C: NGINX CONFIGURATION

Location: `/etc/nginx/sites-available/dommma`

```nginx
server {
    listen 80;
    server_name dommma.com www.dommma.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name dommma.com www.dommma.com;

    ssl_certificate /etc/letsencrypt/live/dommma.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dommma.com/privkey.pem;

    # Frontend (React build)
    root /home/ubuntu/dommma/frontend/build;
    index index.html;

    # API requests go to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # All other requests serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

# APPENDIX D: SSL CERTIFICATE RENEWAL

SSL certificates from Let's Encrypt expire every 90 days. Certbot auto-renews, but verify:

```bash
# Check certificate expiry
sudo certbot certificates

# Manual renewal (if needed)
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

---

**END OF DOCUMENT**

*Last Updated: March 12, 2026*
*Document Version: 1.0*
