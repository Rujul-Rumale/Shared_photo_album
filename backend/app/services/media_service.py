"""
Media service handling uploads, storage, and moderation.
Supports resumable chunked uploads for large video files.
"""

import os
import hashlib
import shutil
import logging
from datetime import datetime, timezone
from typing import Optional, List
from uuid import uuid4, UUID
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status

from app.core.config import get_settings
from app.models.base import Media, MediaStatus, MediaType, Album, User
from app.schemas.schemas import MediaResponse, MediaModerateRequest

logger = logging.getLogger(__name__)
settings = get_settings()

class MediaService:
    def __init__(self, db: Session):
        self.db = db
        self.storage_base = Path(settings.STORAGE_BASE_PATH)
        self.storage_base.mkdir(parents=True, exist_ok=True)

    def _get_storage_path(self, user_id: UUID, filename: str) -> Path:
        """Generate organized storage path: base/user_id/year/filename"""
        now = datetime.now(timezone.utc)
        relative_path = f"{str(user_id)[:8]}/{now.year}/{now.month:02d}"
        full_path = self.storage_base / relative_path
        full_path.mkdir(parents=True, exist_ok=True)
        return full_path / f"{uuid4()}_{filename}"

    def _get_mime_type(self, filename: str) -> str:
        """Infer MIME type from filename extension."""
        ext = Path(filename).suffix.lower()
        mime_map = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.heic': 'image/heic',
            '.webp': 'image/webp', '.mp4': 'video/mp4',
            '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
        }
        return mime_map.get(ext, 'application/octet-stream')

    def _is_valid_media_type(self, mime_type: str) -> bool:
        """Check if MIME type is in allowed list."""
        return mime_type in settings.allowed_mime_types

    def _determine_media_type(self, mime_type: str) -> MediaType:
        if mime_type.startswith('image/'):
            return MediaType.PHOTO
        elif mime_type.startswith('video/'):
            return MediaType.VIDEO
        raise ValueError(f"Unsupported media type: {mime_type}")

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA-256 checksum of file."""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()

    def init_upload(
        self,
        filename: str,
        file_size: int,
        mime_type: str,
        album_id: UUID,
        note: Optional[str],
        user: User
    ) -> dict:
        """Initialize a resumable upload session."""
        # Validate file size
        max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        # Validate MIME type
        if not self._is_valid_media_type(mime_type):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"File type not supported. Allowed: {settings.allowed_mime_types}"
            )

        # Validate album exists
        album = self.db.query(Album).filter(Album.id == album_id).first()
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )

        # Create upload session record
        upload_id = str(uuid4())

        return {
            "upload_id": upload_id,
            "chunk_size": settings.CHUNK_SIZE_BYTES,
            "total_chunks": (file_size + settings.CHUNK_SIZE_BYTES - 1) // settings.CHUNK_SIZE_BYTES,
            "album_id": str(album_id),
            "filename": filename,
        }

    def save_upload(
        self,
        upload_file: UploadFile,
        album_id: UUID,
        note: Optional[str],
        user: User
    ) -> Media:
        """Save a complete uploaded file (for smaller files or non-resumable)."""
        mime_type = upload_file.content_type or self._get_mime_type(upload_file.filename)

        if not self._is_valid_media_type(mime_type):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="File type not supported"
            )

        # Validate album
        album = self.db.query(Album).filter(Album.id == album_id).first()
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )

        # Save file
        storage_path = self._get_storage_path(user.id, upload_file.filename)

        try:
            with open(storage_path, 'wb') as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
        except Exception as e:
            logger.error(f"Failed to save upload: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file"
            )

        # Calculate checksum
        checksum = self._calculate_checksum(storage_path)
        file_size = storage_path.stat().st_size

        # Create media record
        media = Media(
            id=str(uuid4()),
            album_id=album_id,
            contributor_id=user.id,
            original_filename=upload_file.filename,
            storage_path=str(storage_path.relative_to(self.storage_base)),
            mime_type=mime_type,
            file_size=file_size,
            checksum=checksum,
            media_type=self._determine_media_type(mime_type),
            status=MediaStatus.PENDING,
            note=note,
        )

        self.db.add(media)
        self.db.commit()
        self.db.refresh(media)

        logger.info(f"Media uploaded: {media.id} by {user.email}")
        return media

    def get_media_list(
        self,
        album_id: Optional[UUID] = None,
        status: MediaStatus = MediaStatus.APPROVED,
        contributor_id: Optional[UUID] = None,
        page: int = 1,
        per_page: int = 24
    ) -> tuple[List[Media], int]:
        """Get paginated media list."""
        query = self.db.query(Media)

        if album_id:
            query = query.filter(Media.album_id == album_id)
        if status:
            query = query.filter(Media.status == status)
        if contributor_id:
            query = query.filter(Media.contributor_id == contributor_id)

        total = query.count()
        items = query.order_by(Media.created_at.desc()).offset(
            (page - 1) * per_page
        ).limit(per_page).all()

        return items, total

    def moderate_media(
        self,
        media_id: UUID,
        request: MediaModerateRequest,
        moderator: User
    ) -> Media:
        """Approve or reject a media item."""
        media = self.db.query(Media).filter(Media.id == media_id).first()
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media not found"
            )

        media.status = request.status
        if request.status == MediaStatus.APPROVED:
            media.approved_at = datetime.now(timezone.utc)
            media.approved_by_id = moderator.id

        self.db.commit()
        self.db.refresh(media)

        action = "approved" if request.status == MediaStatus.APPROVED else "rejected"
        logger.info(f"Media {media_id} {action} by {moderator.email}")
        return media

    def delete_media(self, media_id: UUID, user: User) -> None:
        """Delete media and its file."""
        media = self.db.query(Media).filter(Media.id == media_id).first()
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media not found"
            )

        # Only admin, curator, or original contributor can delete
        if (user.role not in [UserRole.ADMIN, UserRole.CURATOR] and 
            media.contributor_id != user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this media"
            )

        # Delete file
        file_path = self.storage_base / media.storage_path
        if file_path.exists():
            file_path.unlink()

        self.db.delete(media)
        self.db.commit()

        logger.info(f"Media deleted: {media_id} by {user.email}")
