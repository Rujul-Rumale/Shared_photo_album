# Production Deployment Guide

Deploy **Shared Album** with Docker Compose + Caddy (automatic HTTPS) for the
API, and Vercel (or any static host) for the frontend. Local-disk storage
means Google Drive is optional.

---

## 1. Domain & SSL Setup (`nip.io` Wildcard Hostname)

You do **not** need to purchase a custom domain.
`nip.io` maps any IP address to a valid hostname so Caddy can obtain free
SSL certificates from Let's Encrypt.

- If your VM public IP is `123.45.67.89`:
  - Your app URL will be: `https://123-45-67-89.nip.io`
- If you later buy a custom domain (e.g., `ouralbum.com`), point it at your
  VM IP and set `SERVER_HOSTNAME=ouralbum.com`.

---

## 2. Quick VM Setup (Docker)

1. SSH into your Linux VM:
```bash
git clone https://github.com/YOUR_USERNAME/shared-album-template.git
cd shared-album-template

# Automated environment setup (Docker, firewall, data directories)
chmod +x scripts/setup-oracle.sh
./scripts/setup-oracle.sh
```

2. Configure environment file:
```bash
cp .env.example .env
nano .env
```
Fill in `SERVER_HOSTNAME`, `SECRET_KEY`, `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`,
and `GOOGLE_CLIENT_SECRET`. See [CUSTOMIZE.md](CUSTOMIZE.md) for all options.

3. Launch backend stack:
```bash
docker compose up -d
```

The API serves at `https://<SERVER_HOSTNAME>/api/...` and the frontend can
be served as static files or from Vercel below.

---

## 3. Vercel Frontend Deployment

1. Connect your repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<SERVER_HOSTNAME>/api/v1`
4. Click **Deploy**. Vercel handles static hosting with global CDN & SSL.

---

## 4. Google OAuth Settings

In [Google Cloud Console](https://console.cloud.google.com), under your
OAuth client:

- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `https://<your-vercel-app>.vercel.app`
- Authorized redirect URIs (if you add a server-side callback later):
  - `http://localhost:8000/api/v1/auth/google/callback`
  - `https://<SERVER_HOSTNAME>/api/v1/auth/google/callback`

> The bundled sign-in flow posts a Google ID token to
> `POST /api/v1/auth/google`. For production, wire up Google Identity
> Services in `frontend/src/components/AuthModal.tsx` (see the code comment).
