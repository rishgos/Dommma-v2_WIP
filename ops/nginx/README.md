# Nginx Configuration

`dommma.conf` is the canonical Nginx config for the production server at `dommma.com`.

## Install / Update

On the EC2 host:

```bash
sudo cp /etc/nginx/sites-enabled/dommma /root/nginx-backups/dommma.bak-$(date +%Y%m%d%H%M%S)
sudo cp ops/nginx/dommma.conf /etc/nginx/sites-enabled/dommma
sudo nginx -t
sudo systemctl reload nginx
```

## What's in here

- **Security headers** (`X-Frame-Options`, `HSTS`, `Permissions-Policy`, etc.)
- **Cache rules** — critical for SPA deploys:
  - `/static/*` → immutable 1-year cache (filenames are content-hashed by CRA)
  - `/` (index.html + SPA shell) → `no-cache, no-store, must-revalidate`
  - service workers → `no-cache`
- **Reverse proxy** for `/api` and `/ws` to the FastAPI backend on `127.0.0.1:8001`
- **SSL** via Let's Encrypt (`certbot`)
- **HTTP → HTTPS redirect**

## Why the cache split matters

Without `no-cache` on `index.html`, browsers keep serving the old HTML file, which references old hashed JS bundles. New deploys don't reach users until they hard-refresh. This config fixes that: HTML revalidates every request, hashed assets cache forever.
