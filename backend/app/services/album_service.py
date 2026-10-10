"""
Album management service.
"""

import logging
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.base import Album, Media, MediaStatus, MediaType
from app.schemas.schemas import AlbumCreate, AlbumUpdate, AlbumResponse

logger = logging.getLogger(__name__)

class AlbumService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_albums(
        self,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        only_active: bool = True
    ) -> List[Album]:
        query = self.db.query(Album)

        if only_active:
            query = query.filter(Album.is_active == True)
        if tag:
            query = query.filter(Album.tag == tag)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                Album.name.ilike(search_filter) | 
                Album.description.ilike(search_filter)
            )

        return query.order_by(Album.sort_order).all()

    def get_album_by_slug(self, slug: str) -> Optional[Album]:
        return self.db.query(Album).filter(Album.slug == slug).first()

    def get_album_by_id(self, album_id: UUID) -> Optional[Album]:
        return self.db.query(Album).filter(Album.id == album_id).first()

    def create_album(self, data: AlbumCreate) -> Album:
        # Check slug uniqueness
        existing = self.get_album_by_slug(data.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Album slug already exists"
            )

        album = Album(**data.model_dump())
        self.db.add(album)
        self.db.commit()
        self.db.refresh(album)

        logger.info(f"Album created: {album.slug}")
        return album

    def update_album(self, album_id: UUID, data: AlbumUpdate) -> Album:
        album = self.get_album_by_id(album_id)
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(album, field, value)

        self.db.commit()
        self.db.refresh(album)
        return album

    def delete_album(self, album_id: UUID) -> None:
        album = self.get_album_by_id(album_id)
        if not album:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Album not found"
            )

        # Check if album has media
        media_count = self.db.query(Media).filter(Media.album_id == album_id).count()
        if media_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete album with existing media. Move or delete media first."
            )

        self.db.delete(album)
        self.db.commit()
        logger.info(f"Album deleted: {album_id}")

    def get_album_stats(self, album_id: UUID) -> dict:
        photos = self.db.query(func.count(Media.id)).filter(
            Media.album_id == album_id,
            Media.media_type == MediaType.PHOTO,
            Media.status == MediaStatus.APPROVED
        ).scalar() or 0

        videos = self.db.query(func.count(Media.id)).filter(
            Media.album_id == album_id,
            Media.media_type == MediaType.VIDEO,
            Media.status == MediaStatus.APPROVED
        ).scalar() or 0

        return {"photo_count": photos, "video_count": videos}
