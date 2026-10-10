"""
Media endpoints: upload, list, moderate, delete.
Supports both direct upload and resumable chunked upload.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, get_current_curator, get_optional_user
from app.schemas.schemas import (
    MediaResponse, MediaCreate, MediaUploadInit,
    MediaModerateRequest, MediaListParams
)
from app.services.media_service import MediaService
from app.models.base import User, MediaStatus

router = APIRouter()

@router.post("/upload")
def upload_media(
    file: UploadFile = File(...),
    album_id: str = Form(...),
    note: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a media file directly.
    """
    service = MediaService(db)
    album_uuid = UUID(album_id)
    media = service.save_upload(file, album_uuid, note, current_user)
    return {"success": True, "media_id": str(media.id), "status": str(media.status)}

@router.post("/upload/init")
def init_resumable_upload(
    request: MediaUploadInit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initialize a resumable upload session for large files.
    """
    service = MediaService(db)
    session = service.init_upload(
        request.filename,
        request.file_size,
        request.mime_type,
        request.album_id,
        request.note,
        current_user
    )
    return session

@router.get("")
def list_media(
    album_id: Optional[str] = None,
    status: str = "approved",
    page: int = 1,
    per_page: int = 24,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List approved media with filtering and pagination (public)."""
    service = MediaService(db)

    album_uuid = UUID(album_id) if album_id else None
    status_enum = MediaStatus(status) if status in ["pending", "approved", "rejected"] else MediaStatus.APPROVED

    # Non-admins can only see approved media
    effective_status = status_enum
    if current_user and str(current_user.role) not in ["admin", "curator"]:
        effective_status = MediaStatus.APPROVED

    items, total = service.get_media_list(
        album_id=album_uuid,
        status=effective_status,
        page=page,
        per_page=per_page
    )

    # Build response with contributor info
    results = []
    for item in items:
        data = MediaResponse.model_validate(item)
        data.contributor_name = item.contributor.name if item.contributor else "Unknown"
        data.contributor_avatar = item.contributor.avatar_url if item.contributor else None
        results.append(data)

    return {
        "items": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page
    }

@router.get("/pending")
def list_pending_media(
    page: int = 1,
    per_page: int = 24,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_curator)
):
    """List pending media for moderation (curators and admins)."""
    service = MediaService(db)
    items, total = service.get_media_list(
        status=MediaStatus.PENDING,
        page=page,
        per_page=per_page
    )

    results = []
    for item in items:
        data = MediaResponse.model_validate(item)
        data.contributor_name = item.contributor.name if item.contributor else "Unknown"
        data.contributor_avatar = item.contributor.avatar_url if item.contributor else None
        results.append(data)

    return {
        "items": results,
        "total": total,
        "page": page,
        "per_page": per_page
    }

@router.post("/{media_id}/moderate")
def moderate_media(
    media_id: str,
    request: MediaModerateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_curator)
):
    """Approve or reject a media item (curators and admins)."""
    service = MediaService(db)
    media_uuid = UUID(media_id)
    media = service.moderate_media(media_uuid, request, admin)
    return {"success": True, "media_id": str(media.id), "status": str(media.status)}

@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a media item."""
    service = MediaService(db)
    media_uuid = UUID(media_id)
    service.delete_media(media_uuid, current_user)
    return None
