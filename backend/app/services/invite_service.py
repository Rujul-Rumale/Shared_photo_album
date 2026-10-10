"""
Invite code management service.
"""

import logging
import secrets
import string
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.base import InviteCode, User, UserRole
from app.schemas.schemas import InviteCodeResponse

logger = logging.getLogger(__name__)

class InviteService:
    def __init__(self, db: Session):
        self.db = db

    def generate_codes(self, count: int, created_by: User) -> List[InviteCode]:
        """Generate new one-time invite codes."""
        if created_by.role not in [UserRole.ADMIN, UserRole.CURATOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can generate invite codes"
            )

        codes = []
        for _ in range(count):
            # Generate memorable codes: SA-XXXXX (Shared Album)
            code = f"SA-{''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(5))}"

            invite = InviteCode(
                code=code,
                created_by_id=created_by.id,
            )
            self.db.add(invite)
            codes.append(invite)

        self.db.commit()
        for code in codes:
            self.db.refresh(code)

        logger.info(f"Generated {count} invite codes by {created_by.email}")
        return codes

    def get_all_codes(self) -> List[InviteCode]:
        return self.db.query(InviteCode).order_by(InviteCode.created_at.desc()).all()

    def get_active_codes_count(self) -> int:
        return self.db.query(InviteCode).filter(InviteCode.is_used == False).count()
