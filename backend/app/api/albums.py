"""
Album endpoints: list, create, update, delete, stats.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin, require_admin, get_optional_user
from app.core.dependencies import AlbumFilter
from app.schemas.schemas import AlbumCreate, AlbumUpdate, AlbumResponse
from app.services.album_service import AlbumService
from app.models.base import User

router = APIRouter()

@router.get("", response_model=List[AlbumResponse])
def list_albums(
    filter_params: AlbumFilter = Depends(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List all active albums with optional filtering (public)."""
    service = AlbumService(db)
    albums = service.get_all_albums(
        tag=filter_params.tag,
        search=filter_params.search,
        only_active=True
    )

    # Enrich with stats
    result = []
    for album in albums:
        stats = service.get_album_stats(album.id)
        album_data = AlbumResponse.model_validate(album)
        album_data.photo_count = stats["photo_count"]
        album_data.video_count = stats["video_count"]
        result.append(album_data)

    return result

@router.get("/{slug}", response_model=AlbumResponse)
def get_album(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get a single album by slug (public)."""
    service = AlbumService(db)
    album = service.get_album_by_slug(slug)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    stats = service.get_album_stats(album.id)
    response = AlbumResponse.model_validate(album)
    response.photo_count = stats["photo_count"]
    response.video_count = stats["video_count"]
    return response

@router.post("", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
def create_album(
    data: AlbumCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new album (admin only)."""
    service = AlbumService(db)
    return service.create_album(data)

@router.patch("/{album_id}", response_model=AlbumResponse)
def update_album(
    album_id: UUID,
    data: AlbumUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update an album (admin only)."""
    service = AlbumService(db)
    return service.update_album(album_id, data)

@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(
    album_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete an album (admin only)."""
    service = AlbumService(db)
    service.delete_album(album_id)
    return None
