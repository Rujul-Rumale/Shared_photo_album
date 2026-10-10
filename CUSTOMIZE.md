# CUSTOMIZE.md — Make This Template Yours

Everything group-specific lives in a short list of places. Work through it
top to bottom when you adopt this template.

## 1. Identity & Access (`.env`)

| Setting | What it does |
|---|---|
| `APP_NAME` | Shown in the API docs and page metadata. |
| `ADMIN_EMAILS` | Comma-separated emails that become admins on first sign-in. |
| `ALLOWED_EMAIL_DOMAINS` | Restrict sign-in to your group's domains (e.g. `example.com,club.org`). Empty = anyone with Google can join. |
| Invite codes | Admins generate one-time codes at `/admin` → Invites tab. New members enter them at sign-in. Optional. |

## 2. Albums

- Edit `backend/scripts/seed_data.py` (`ALBUMS`) **and**
  `frontend/src/utils.ts` (`DEFAULT_ARCHIVE_ALBUMS`) together — the frontend
  list is the offline fallback shown before the API responds.
- Or skip seeding and create albums from the admin panel after deploy.

## 3. Branding & Theme

- Header / footer copy: `frontend/src/components/Layout.tsx`
- Home hero + stats: `frontend/src/pages/HomePage.tsx`
- About page: `frontend/src/pages/AboutPage.tsx`
- Colors: `frontend/tailwind.config.js` (`sa-*` tokens) and
  `frontend/src/index.css`. The default palette is warm paper + terracotta.
- Logo: the `SA` monogram in `Layout.tsx` — swap for your own mark.
- Contact email in the footer (`Layout.tsx`) and in `.env` (`ADMIN_EMAIL`).

## 4. Time Capsule

- Reveal date: `TIME_CAPSULE_REVEAL_DATE` in `.env` (default `2027-05-15`).
- Letter prompts: `PROMPTS` in `frontend/src/pages/CapsulePage.tsx`.
- Don't want a capsule at all? Remove the `/timecapsule` route in
  `frontend/src/App.tsx`, the nav item in `Layout.tsx`, and the
  `time-capsule` seed album.

## 5. Storage

- Default is local disk (`STORAGE_BACKEND=local`, `STORAGE_BASE_PATH`).
- To mirror originals to Google Drive, set `STORAGE_BACKEND=gdrive` and add
  `GOOGLE_DRIVE_ROOT_FOLDER_ID` + `GDRIVE_SERVICE_ACCOUNT_JSON`.
- Upload caps: `MAX_IMAGE_SIZE_BYTES`, `MAX_VIDEO_SIZE_BYTES`,
  `MAX_UPLOAD_SIZE_MB` in `.env`.

## 6. Auth (Production)

The bundled sign-in is a simplified dev flow (see the `NOTE` in
`frontend/src/components/AuthModal.tsx`). For production, integrate
[Google Identity Services](https://developers.google.com/identity) to get a
real ID token and POST it to `/api/v1/auth/google`.

## 7. Deploy

`docker compose up -d` (API + Caddy with automatic HTTPS) and point
`VITE_API_URL` at `/api/v1`. Full steps in [DEPLOYMENT.md](DEPLOYMENT.md).
