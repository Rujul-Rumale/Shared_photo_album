"""
Admin dashboard endpoints: stats, user management, storage health.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import require_admin
from app.schemas.schemas import DashboardStats, StorageHealth, UserResponse, InviteCodeResponse
from app.services.invite_service import InviteService
from app.models.base import User, Media, MediaStatus, MediaType, Album, TimeCapsuleMessage, InviteCode

router = APIRouter(tags=["Admin"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get admin dashboard statistics."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_photos = db.query(func.count(Media.id)).filter(
        Media.media_type == MediaType.PHOTO
    ).scalar() or 0
    total_videos = db.query(func.count(Media.id)).filter(
        Media.media_type == MediaType.VIDEO
    ).scalar() or 0
    pending = db.query(func.count(Media.id)).filter(
        Media.status == MediaStatus.PENDING
    ).scalar() or 0
    total_albums = db.query(func.count(Album.id)).scalar() or 0
    capsule_entries = db.query(func.count(TimeCapsuleMessage.id)).scalar() or 0
    active_invites = db.query(func.count(InviteCode.id)).filter(
        InviteCode.is_used == False
    ).scalar() or 0

    # Calculate storage used (sum of file sizes)
    storage_used = db.query(func.sum(Media.file_size)).scalar() or 0

    return DashboardStats(
        total_users=total_users,
        total_photos=total_photos,
        total_videos=total_videos,
        pending_moderation=pending,
        total_albums=total_albums,
        storage_used_bytes=storage_used,
        capsule_entries=capsule_entries,
        active_invite_codes=active_invites
    )

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all registered users."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.get("/storage/health", response_model=StorageHealth)
def get_storage_health(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Check storage health on the upload volume."""
    import shutil
    from app.core.config import get_settings

    settings = get_settings()
    path = settings.STORAGE_BASE_PATH

    try:
        total, used, free = shutil.disk_usage(path)
        usage_percent = (used / total) * 100

        if usage_percent > 90:
            health = "critical"
        elif usage_percent > 75:
            health = "warning"
        else:
            health = "healthy"

        return StorageHealth(
            total_bytes=total,
            used_bytes=used,
            free_bytes=free,
            health_status=health,
            last_check=datetime.now(timezone.utc)
        )
    except Exception as e:
        return StorageHealth(
            total_bytes=0,
            used_bytes=0,
            free_bytes=0,
            health_status="unknown",
            last_check=datetime.now(timezone.utc)
        )

@router.post("/users/{user_id}/promote")
def promote_user(
    user_id: str,
    role: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Promote/demote a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()
    return {"success": True, "user_id": user_id, "new_role": role}
