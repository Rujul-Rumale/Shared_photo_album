"""
Core configuration for Shared Album - a generalized shared photo album template.
Uses Pydantic Settings for environment-based configuration.

Copy `.env.example` to `.env` and customize for your own group/event.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    # ─── Application ─────────────────────────────────────────────────
    APP_NAME: str = "Shared Album"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"  # development, staging, production

    # ─── Database ────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./shared_album.db"
    SQLITE_PATH: str = "./shared_album.db"

    # ─── Storage ─────────────────────────────────────────────────────
    # "local" stores uploads on disk under STORAGE_BASE_PATH.
    # "gdrive" also mirrors originals to Google Drive (needs Drive settings below).
    STORAGE_BACKEND: str = "local"
    STORAGE_BASE_PATH: str = "./uploads"
    UPLOAD_DIR: str = "./uploads"

    # ─── Security ────────────────────────────────────────────────────
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ─── Google OAuth & Drive Storage ────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_DRIVE_ROOT_FOLDER_ID: str = ""
    GDRIVE_SERVICE_ACCOUNT_JSON: str = ""

    # Optional: restrict sign-in to specific email domains (comma-separated).
    # Leave empty to allow any Google account.
    # Example: ALLOWED_EMAIL_DOMAINS="example.com,club.org"
    ALLOWED_EMAIL_DOMAINS: str = ""

    # ─── CORS ────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ─── Upload Limits ───────────────────────────────────────────────
    MAX_IMAGE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB
    MAX_VIDEO_SIZE_BYTES: int = 2 * 1024 * 1024 * 1024  # 2GB
    MAX_UPLOAD_SIZE_MB: int = 2048  # single-file cap used by the upload session API
    CHUNK_SIZE_BYTES: int = 8 * 1024 * 1024  # 8MB resumable-upload chunks
    MAX_BATCH_FILES: int = 500
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp,image/heic"
    ALLOWED_VIDEO_TYPES: str = "video/mp4,video/quicktime,video/x-msvideo"

    # ─── Time Capsule ────────────────────────────────────────────────
    # Entries are accepted until this date (YYYY-MM-DD), then the capsule
    # can be sealed and ceremonially revealed. Set it to your event date.
    TIME_CAPSULE_REVEAL_DATE: str = "2027-05-15"

    # ─── Admin & Contact ─────────────────────────────────────────────
    ADMIN_EMAILS: str = ""
    ADMIN_EMAIL: str = ""
    ADMIN_WHATSAPP_URL: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_mime_types(self) -> list[str]:
        images = [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",") if t.strip()]
        videos = [t.strip() for t in self.ALLOWED_VIDEO_TYPES.split(",") if t.strip()]
        return images + videos

    @property
    def admin_emails_list(self) -> list[str]:
        combined = ",".join(filter(None, [self.ADMIN_EMAILS, self.ADMIN_EMAIL]))
        if not combined:
            return []
        return [email.strip().lower() for email in combined.split(",") if email.strip()]

    @property
    def allowed_email_domains_list(self) -> list[str]:
        """Allowed email domains for Google OAuth sign-in. Empty = any domain."""
        if not self.ALLOWED_EMAIL_DOMAINS:
            return []
        return [d.strip().lower() for d in self.ALLOWED_EMAIL_DOMAINS.split(",") if d.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
