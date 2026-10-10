# Shared Album

> One shared home for everyone's photos.

A self-hostable, non-algorithmic photo collection website for any group —
friends, clubs, teams, weddings, trips, or communities. Members sign in with
Google, upload photos into albums, curators review submissions before they go
public, and an optional sealed **Time Capsule** collects signed letters until
a reveal date you choose.

This repository is a **reusable template**: clone it, set your album name and
options in `.env`, seed your own albums, and deploy.

![Python](https://img.shields.io/badge/Python-3.11%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

| Area | What you get |
|---|---|
| Albums | Curated photo/video albums with cover art, tags, search, and counts |
| Moderation | Uploads land in a review queue — nothing is public until approved |
| Time Capsule | Signed letters sealed until a configurable reveal date, with countdown |
| Members | Google sign-in, per-photo attribution, personal galleries, backup email |
| Access control | Optional email-domain restriction + optional one-time invite codes |
| Curation | Admin dashboard: stats, moderation queue, albums, invites, storage health |
| Storage | Local disk out of the box, optional Google Drive mirror for originals |

What it deliberately has **none** of: likes, comments, feeds, followers,
algorithms.

---

## Quick Start

### Backend (FastAPI + SQLite)

```bash
cd backend
python -m venv venv          # Python 3.11 or 3.12 recommended
venv\Scripts\activate        # Windows — or: source venv/bin/activate
pip install -r requirements.txt
$env:PYTHONPATH = "."        # Windows — or: export PYTHONPATH=.
python scripts/seed_data.py  # creates shared_album.db + starter albums
uvicorn app.main:app --reload --port 8000
```

API health check: http://127.0.0.1:8000/health

### Frontend (React + Vite + Tailwind)

```bash
cd frontend
npm install
npm run dev                  # http://127.0.0.1:3000
```

The dev server proxies `/api` to the backend, so no extra config is needed
locally. For other setups, set `VITE_API_URL` (see `.env.example`).

Sign in with the dev flow (name → optional invite code → Continue with
Google). For production Google auth, see [CUSTOMIZE.md](CUSTOMIZE.md).

---

## Project Structure

```text
shared-album-template/
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/       # Layout, AuthModal, PolaroidCard, MediaPolaroid, LightboxModal
│   │   ├── pages/            # Home, Albums, AlbumDetail, Capsule, Contribute, Profile, About, Admin
│   │   ├── api.ts            # Axios client (uses VITE_API_URL or /api/v1)
│   │   ├── store.ts          # Auth state (zustand)
│   │   └── utils.ts          # Offline fallback albums (mirror of seed_data.py)
│   ├── public/               # Static assets (paper texture, …)
│   └── Dockerfile / nginx.conf
├── backend/                  # FastAPI + SQLAlchemy + SQLite (WAL mode)
│   ├── app/
│   │   ├── api/              # auth, albums, media, capsule, admin, invites
│   │   ├── core/             # config, database, security (JWT, roles)
│   │   ├── models/           # users, albums, media, capsule, invite codes
│   │   ├── schemas/          # Pydantic v2 request/response models
│   │   └── services/         # business logic (+ optional Google Drive mirror)
│   └── scripts/              # seed_data.py, verify_db.py
├── scripts/
│   └── setup-oracle.sh       # Optional VM bootstrap (Docker, firewall, dirs)
├── docker-compose.yml        # API + Caddy (automatic HTTPS)
├── Caddyfile
├── .env.example              # Every knob, documented
├── ARCHITECTURE.md           # Database schema + system design
├── DEPLOYMENT.md             # Docker / VM / Vercel guide
└── CUSTOMIZE.md              # Checklist to make it yours
```

---

## Configuration

The most template-relevant settings (full list in `.env.example`):

| Setting | Default | Purpose |
|---|---|---|
| `APP_NAME` | `Shared Album` | API title, docs, page metadata |
| `ADMIN_EMAILS` | _(empty)_ | Become admin on first sign-in |
| `ALLOWED_EMAIL_DOMAINS` | _(empty = anyone)_ | Restrict sign-in to your domains |
| `STORAGE_BACKEND` | `local` | `local` disk, or `gdrive` mirror |
| `TIME_CAPSULE_REVEAL_DATE` | `2027-05-15` | Capsule stops accepting entries |
| `MAX_IMAGE_SIZE_BYTES` / `MAX_VIDEO_SIZE_BYTES` | `50MB` / `2GB` | Upload caps |

---

## API Overview

Base path `/api/v1`. Public gallery reads need no token; writes and
moderation do (`Authorization: Bearer <JWT>`).

| Method & path | Access | Purpose |
|---|---|---|
| `POST /auth/google` | public | Sign in / register with a Google ID token (+ optional invite code) |
| `GET /auth/me` · `PATCH /auth/me` | member | Profile |
| `GET /albums` · `GET /albums/{slug}` | public | Browse albums |
| `POST /albums` · `PATCH /albums/{id}` · `DELETE …` | admin | Manage albums |
| `GET /media` | public (approved only) | Gallery listing |
| `POST /media/upload` | member | Upload (goes to moderation queue) |
| `GET /media/pending` · `POST /media/{id}/moderate` | curator | Review queue |
| `GET /capsule/status` | public | Reveal-date countdown state |
| `POST /capsule` · `PATCH /capsule/{id}` | member | Write / edit letters (while open) |
| `POST /capsule/seal` · `POST /capsule/reveal` | admin | Seal & reveal ceremony |
| `POST /invites/generate` · `GET /invites` | admin | One-time invite codes |
| `GET /admin/stats` · `/admin/users` · `/admin/storage/health` | admin | Dashboard |

Interactive docs at `/api/docs` when `DEBUG=true`.

---

## Roles

- **member** (`user`) — browse, upload, write capsule letters
- **curator** — everything above + approve/reject/move uploads
- **admin** — everything above + albums, invites, users, seal/reveal

First sign-in with an email listed in `ADMIN_EMAILS` grants admin.
Promote others from the dashboard or `POST /admin/users/{id}/promote`.

---

## Customization & Deployment

- **[CUSTOMIZE.md](CUSTOMIZE.md)** — branding, albums, theme, capsule prompts, storage, production auth
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Docker Compose + Caddy with automatic HTTPS, Vercel frontend option
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — schema and design notes

---

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router,
TanStack Query, Zustand, Framer Motion, Lucide icons.
**Backend:** FastAPI, SQLAlchemy 2, Pydantic v2, SQLite (WAL) or PostgreSQL,
JWT auth, Google OAuth + optional Drive mirror.
**Ops:** Docker Compose, Caddy (auto-HTTPS), Vercel-ready static frontend.

---

## Contributing

Issues and pull requests are welcome. For larger changes, please open an
issue first to discuss direction. Run `tsc --noEmit` (frontend) and the
backend smoke path (`seed_data.py` + `/health`) before submitting.

---

## License

MIT — use it for your group, your event, your community. See [LICENSE](LICENSE).
