# Architecture Specification

Technical architecture for **Shared Album**, a reusable shared photo collection template.

---

## 1. System Design Goals

1. **Simplicity over overengineering**: a handful of SQLite tables, two services (API + static frontend), optional Drive mirror.
2. **Curated, non-algorithmic**: no feeds, no likes, no comments. Members contribute; curators publish.
3. **Stable identity**: Google OAuth (`google_sub`) as the immutable identity key, so accounts survive email changes. Optional backup email per member.
4. **Flexible storage**: local disk by default; optional Google Drive mirror for originals.

---

## 2. SQLite Database Schemas (WAL Mode)

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

### Table 1: `allowed_users` (optional invite-only access)
```sql
CREATE TABLE allowed_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    registration_code_hash TEXT,
    used BOOLEAN DEFAULT FALSE,
    linked_user_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_allowed_users_email ON allowed_users(email);
```

### Table 2: `users`
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    personal_email TEXT,
    google_sub TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
CREATE UNIQUE INDEX idx_users_google_sub ON users(google_sub);
```

### Table 3: `invite_codes`
```sql
CREATE TABLE invite_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by_id TEXT REFERENCES users(id),
    created_by_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
);
```

### Table 4: `albums`
```sql
CREATE TABLE albums (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    tag TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_albums_slug ON albums(slug);
```

### Table 5: `media`
```sql
CREATE TABLE media (
    id TEXT PRIMARY KEY,
    album_id TEXT REFERENCES albums(id) NOT NULL,
    contributor_id TEXT REFERENCES users(id) NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    checksum TEXT,
    media_type TEXT DEFAULT 'photo',
    status TEXT DEFAULT 'pending',
    note TEXT,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    approved_at DATETIME,
    approved_by_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_media_album_id ON media(album_id);
CREATE INDEX idx_media_contributor_id ON media(contributor_id);
```

### Table 6: `time_capsule_messages`
```sql
CREATE TABLE time_capsule_messages (
    id TEXT PRIMARY KEY,
    author_id TEXT REFERENCES users(id) NOT NULL,
    prompt TEXT NOT NULL,
    message TEXT NOT NULL,
    ink_color TEXT DEFAULT '#2b2623',
    status TEXT DEFAULT 'open',
    media_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    sealed_at DATETIME
);
```

> The SQLAlchemy models in `backend/app/models/base.py` are authoritative;
> the SQL above is a readable summary of the same shape.

---

## 3. Storage Backends

- `STORAGE_BACKEND=local` (default): uploads are stored under
  `STORAGE_BASE_PATH` (`./uploads` in dev, a mounted volume in Docker).
- `STORAGE_BACKEND=gdrive`: in addition to local storage, originals are
  mirrored to Google Drive via a service account
  (`GDRIVE_SERVICE_ACCOUNT_JSON`, folders per album under
  `GOOGLE_DRIVE_ROOT_FOLDER_ID`).

---

## 4. Environment Configuration (`backend/app/core/config.py`)

See `.env.example` for the full list. The most template-relevant knobs:

```bash
APP_NAME=Shared Album
ALLOWED_EMAIL_DOMAINS=          # empty = any Google account
ADMIN_EMAILS=you@example.com
STORAGE_BACKEND=local
TIME_CAPSULE_REVEAL_DATE=2027-05-15
MAX_IMAGE_SIZE_BYTES=52428800
MAX_VIDEO_SIZE_BYTES=2147483648
```
