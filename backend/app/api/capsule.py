"""
Time Capsule endpoints: create, update, list, seal, reveal.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin, require_admin
from app.schemas.schemas import (
    TimeCapsuleEntryCreate, TimeCapsuleEntryUpdate,
    TimeCapsuleEntryResponse, CapsuleSealRequest
)
from app.services.capsule_service import CapsuleService
from app.models.base import User, CapsuleStatus

router = APIRouter(tags=["Time Capsule"])

@router.get("/status")
def get_capsule_status(
    db: Session = Depends(get_db)
):
    """Get current capsule status and reveal-date countdown."""
    service = CapsuleService(db)
    from app.core.config import get_settings
    settings = get_settings()

    return {
        "is_open": service.is_capsule_open(),
        "reveal_date": settings.TIME_CAPSULE_REVEAL_DATE,
        "can_contribute": service.is_capsule_open(),
    }

@router.post("", response_model=TimeCapsuleEntryResponse, status_code=status.HTTP_201_CREATED)
def create_capsule_entry(
    data: TimeCapsuleEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new time capsule entry."""
    service = CapsuleService(db)
    entry = service.create_entry(data, current_user)

    response = TimeCapsuleEntryResponse.model_validate(entry)
    response.author_name = entry.author.name
    return response

@router.patch("/{entry_id}", response_model=TimeCapsuleEntryResponse)
def update_capsule_entry(
    entry_id: UUID,
    data: TimeCapsuleEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing capsule entry (only while open)."""
    service = CapsuleService(db)
    entry = service.update_entry(entry_id, data, current_user)

    response = TimeCapsuleEntryResponse.model_validate(entry)
    response.author_name = entry.author.name
    return response

@router.get("", response_model=List[TimeCapsuleEntryResponse])
def list_capsule_entries(
    include_sealed: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    List capsule entries.
    Before the reveal date: shows only your own entries.
    After the reveal date (or with include_sealed=true): reveals all.
    """
    service = CapsuleService(db)

    # Check if user is admin for include_sealed
    if include_sealed and current_user and str(current_user.role) not in ["admin", "curator"]:
        include_sealed = False

    entries = service.get_entries(include_sealed=include_sealed, user=current_user)

    results = []
    for entry in entries:
        data = TimeCapsuleEntryResponse.model_validate(entry)
        data.author_name = entry.author.name
        results.append(data)

    return results

@router.post("/seal", status_code=status.HTTP_200_OK)
def seal_capsule(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Seal the time capsule (admin only). No more edits allowed."""
    service = CapsuleService(db)
    service.seal_capsule(admin)
    return {"success": True, "message": "Time capsule sealed. All entries are now immutable."}

@router.post("/reveal", status_code=status.HTTP_200_OK)
def reveal_capsule(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Reveal the time capsule (admin only, typically on the reveal date)."""
    service = CapsuleService(db)
    service.reveal_capsule(admin)
    return {"success": True, "message": "Time capsule revealed! All entries are now visible."}
