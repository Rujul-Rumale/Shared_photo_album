"""
Time Capsule service: sealed messages with a scheduled ceremonial reveal.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models.base import TimeCapsuleMessage, CapsuleStatus, User, UserRole
from app.schemas.schemas import (
    TimeCapsuleEntryCreate, TimeCapsuleEntryUpdate,
    TimeCapsuleEntryResponse, CapsuleSealRequest
)

logger = logging.getLogger(__name__)
settings = get_settings()

class CapsuleService:
    def __init__(self, db: Session):
        self.db = db

    def is_capsule_open(self) -> bool:
        """Check if capsule is still accepting entries."""
        # Parse reveal date
        try:
            reveal_date = datetime.strptime(settings.TIME_CAPSULE_REVEAL_DATE, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            return datetime.now(timezone.utc) < reveal_date
        except ValueError:
            return True  # Default to open if config is invalid

    def can_edit(self, entry: TimeCapsuleMessage) -> bool:
        """Check if entry can still be edited."""
        return entry.status == CapsuleStatus.OPEN

    def create_entry(self, data: TimeCapsuleEntryCreate, user: User) -> TimeCapsuleMessage:
        if not self.is_capsule_open():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Time capsule is sealed. No new entries accepted."
            )

        entry = TimeCapsuleMessage(
            id=str(uuid4()),
            author_id=user.id,
            prompt=data.prompt,
            message=data.message,
            ink_color=data.ink_color,
            media_id=data.media_id,
            status=CapsuleStatus.OPEN,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)

        logger.info(f"Capsule entry created by {user.email}")
        return entry

    def update_entry(
        self,
        entry_id: UUID,
        data: TimeCapsuleEntryUpdate,
        user: User
    ) -> TimeCapsuleMessage:
        entry = self.db.query(TimeCapsuleMessage).filter(TimeCapsuleMessage.id == entry_id).first()
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entry not found"
            )

        if entry.author_id != user.id and user.role not in [UserRole.ADMIN, UserRole.CURATOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to edit this entry"
            )

        if not self.can_edit(entry):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This entry has been sealed and cannot be edited"
            )

        if data.message is not None:
            entry.message = data.message
        if data.ink_color is not None:
            entry.ink_color = data.ink_color
        entry.updated_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(entry)
        return entry

    def get_entries(
        self,
        include_sealed: bool = False,
        user: Optional[User] = None
    ) -> List[TimeCapsuleMessage]:
        """
        Get capsule entries.
        Before the reveal date: only show the member's own entries.
        After the reveal date: show all entries (ceremonial reveal).
        """
        query = self.db.query(TimeCapsuleMessage)

        if not self.is_capsule_open() or include_sealed:
            # After reveal date - reveal all
            return query.order_by(TimeCapsuleMessage.created_at.desc()).all()
        else:
            # Before reveal date - only show own entries
            if user:
                return query.filter(
                    TimeCapsuleMessage.author_id == user.id
                ).order_by(TimeCapsuleMessage.created_at.desc()).all()
            return []

    def get_entry_by_id(self, entry_id: UUID) -> Optional[TimeCapsuleMessage]:
        return self.db.query(TimeCapsuleMessage).filter(TimeCapsuleMessage.id == entry_id).first()

    def seal_capsule(self, user: User) -> None:
        """Seal the time capsule (admin only)."""
        if user.role not in [UserRole.ADMIN, UserRole.CURATOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can seal the capsule"
            )

        entries = self.db.query(TimeCapsuleMessage).filter(
            TimeCapsuleMessage.status == CapsuleStatus.OPEN
        ).all()

        for entry in entries:
            entry.status = CapsuleStatus.SEALED
            entry.sealed_at = datetime.now(timezone.utc)

        self.db.commit()
        logger.info(f"Time capsule sealed by {user.email}. {len(entries)} entries sealed.")

    def reveal_capsule(self, user: User) -> None:
        """Reveal the time capsule on the configured reveal date."""
        if not self.is_capsule_open():
            entries = self.db.query(TimeCapsuleMessage).filter(
                TimeCapsuleMessage.status == CapsuleStatus.SEALED
            ).all()

            for entry in entries:
                entry.status = CapsuleStatus.REVEALED

            self.db.commit()
            logger.info(f"Time capsule revealed by {user.email}")
