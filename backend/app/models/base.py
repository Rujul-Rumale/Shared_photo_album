"""
Database models for Shared Album.

Single source of truth for enums (UserRole, MediaStatus, MediaType,
CapsuleStatus) - schemas and services import them from here.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


# ─── Enums (stored as plain strings in the DB) ───────────────────────

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    CURATOR = "curator"


class MediaStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MediaType(str, enum.Enum):
    PHOTO = "photo"
    VIDEO = "video"


class CapsuleStatus(str, enum.Enum):
    OPEN = "open"
    SEALED = "sealed"
    REVEALED = "revealed"


def _uuid() -> str:
    return str(uuid.uuid4())


# ─── Users ───────────────────────────────────────────────────────────

class AllowedUser(Base):
    """Pre-approved members for invite-only albums. Optional feature."""
    __tablename__ = "allowed_users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    registration_code_hash = Column(String(255), nullable=True)
    used = Column(Boolean, default=False)
    linked_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    personal_email = Column(String(255), nullable=True)
    google_sub = Column(String(255), unique=True, nullable=False, index=True)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(50), default=UserRole.USER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    uploads = relationship("Media", back_populates="contributor", foreign_keys="Media.contributor_id")
    capsule_messages = relationship("TimeCapsuleMessage", back_populates="author")


class InviteCode(Base):
    """One-time invite codes for first-time registration."""
    __tablename__ = "invite_codes"

    id = Column(String(36), primary_key=True, default=_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False)
    used_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)

    used_by = relationship("User", foreign_keys=[used_by_id])


# ─── Albums & Media ──────────────────────────────────────────────────

class Album(Base):
    __tablename__ = "albums"

    id = Column(String(36), primary_key=True, default=_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cover_url = Column(String(500), nullable=True)
    tag = Column(String(100), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    media = relationship("Media", back_populates="album")


class Media(Base):
    __tablename__ = "media"

    id = Column(String(36), primary_key=True, default=_uuid)
    album_id = Column(String(36), ForeignKey("albums.id"), nullable=False, index=True)
    contributor_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500), nullable=True)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    checksum = Column(String(64), nullable=True)
    media_type = Column(String(20), default=MediaType.PHOTO.value, nullable=False)
    status = Column(String(20), default=MediaStatus.PENDING.value, nullable=False)
    note = Column(Text, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    album = relationship("Album", back_populates="media")
    contributor = relationship("User", back_populates="uploads", foreign_keys=[contributor_id])


# ─── Time Capsule ────────────────────────────────────────────────────

class TimeCapsuleMessage(Base):
    __tablename__ = "time_capsule_messages"

    id = Column(String(36), primary_key=True, default=_uuid)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    prompt = Column(String(255), nullable=False, default="Letter to my future self")
    message = Column(Text, nullable=False)
    ink_color = Column(String(7), nullable=False, default="#2b2623")
    status = Column(String(20), default=CapsuleStatus.OPEN.value, nullable=False)
    media_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    sealed_at = Column(DateTime(timezone=True), nullable=True)

    author = relationship("User", back_populates="capsule_messages")
