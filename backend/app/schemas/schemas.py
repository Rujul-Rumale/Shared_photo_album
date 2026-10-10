from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ─── Enums ──────────────────────────────────────────────────────────
# Canonical definitions live in app.models.base - imported here so that
# API code can keep importing them from schemas.

from app.models.base import UserRole, MediaStatus, MediaType, CapsuleStatus

# ─── User Schemas ───────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    invite_code: Optional[str] = Field(None, min_length=1, max_length=50)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    personal_email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    personal_email: Optional[EmailStr] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserProfile(UserResponse):
    upload_count: int = 0
    capsule_count: int = 0

# ─── Auth Schemas ───────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    token: str = Field(..., min_length=10)
    invite_code: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class LinkPersonalEmailRequest(BaseModel):
    personal_email: EmailStr

# ─── Album Schemas ──────────────────────────────────────────────────

class AlbumBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    cover_url: Optional[str] = None
    tag: Optional[str] = None
    sort_order: int = 0

class AlbumCreate(AlbumBase):
    slug: str = Field(..., min_length=1, max_length=100, pattern=r'^[a-z0-9-]+$')

class AlbumUpdate(AlbumBase):
    is_active: Optional[bool] = None

class AlbumResponse(AlbumBase):
    id: UUID
    slug: str
    is_active: bool
    created_at: datetime
    photo_count: int = 0
    video_count: int = 0

    class Config:
        from_attributes = True

# ─── Media Schemas ──────────────────────────────────────────────────

class MediaBase(BaseModel):
    note: Optional[str] = Field(None, max_length=1000)
    album_id: UUID

class MediaCreate(MediaBase):
    pass

class MediaUploadInit(BaseModel):
    filename: str
    file_size: int
    mime_type: str
    album_id: UUID
    note: Optional[str] = None

class MediaUploadComplete(BaseModel):
    upload_id: str
    checksum: str

class MediaResponse(BaseModel):
    id: UUID
    album_id: UUID
    contributor_id: UUID
    original_filename: str
    storage_path: str
    thumbnail_path: Optional[str] = None
    mime_type: str
    file_size: int
    media_type: MediaType
    status: MediaStatus
    note: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[int] = None
    created_at: datetime
    contributor_name: str = ""
    contributor_avatar: Optional[str] = None

    class Config:
        from_attributes = True

class MediaModerateRequest(BaseModel):
    status: MediaStatus
    reason: Optional[str] = None

class MediaListParams(BaseModel):
    album_id: Optional[UUID] = None
    status: Optional[MediaStatus] = MediaStatus.APPROVED
    contributor_id: Optional[UUID] = None
    page: int = Field(1, ge=1)
    per_page: int = Field(24, ge=1, le=100)

# ─── Time Capsule Schemas ───────────────────────────────────────────

class TimeCapsuleEntryBase(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=5000)
    ink_color: str = Field(default="#2b2623", pattern=r'^#[0-9A-Fa-f]{6}$')

class TimeCapsuleEntryCreate(TimeCapsuleEntryBase):
    media_id: Optional[UUID] = None

class TimeCapsuleEntryUpdate(BaseModel):
    message: Optional[str] = Field(None, min_length=1, max_length=5000)
    ink_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class TimeCapsuleEntryResponse(TimeCapsuleEntryBase):
    id: UUID
    author_id: UUID
    author_name: str = ""
    status: CapsuleStatus
    media_id: Optional[UUID] = None
    media_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    sealed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CapsuleSealRequest(BaseModel):
    confirm: bool = False

# ─── Invite Code Schemas ────────────────────────────────────────────

class InviteCodeBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)

class InviteCodeCreate(BaseModel):
    count: int = Field(1, ge=1, le=100)

class InviteCodeResponse(InviteCodeBase):
    id: UUID
    is_used: bool
    used_by_id: Optional[UUID] = None
    used_by_name: Optional[str] = None
    created_at: datetime
    used_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─── Allowed Users Schemas ──────────────────────────────────────────

class AllowedUserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)

class AllowedUserCreate(AllowedUserBase):
    pass

class AllowedUserResponse(AllowedUserBase):
    id: UUID
    is_used: bool
    used_by_id: Optional[UUID] = None
    used_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Stats & Dashboard ──────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_users: int
    total_photos: int
    total_videos: int
    pending_moderation: int
    total_albums: int
    storage_used_bytes: int
    capsule_entries: int
    active_invite_codes: int

class StorageHealth(BaseModel):
    total_bytes: int
    used_bytes: int
    free_bytes: int
    health_status: str  # "healthy", "warning", "critical"
    last_check: datetime
