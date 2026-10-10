"""
Invite code management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import require_admin
from app.schemas.schemas import InviteCodeCreate, InviteCodeResponse
from app.services.invite_service import InviteService
from app.models.base import User

router = APIRouter(tags=["Invite Codes"])

@router.post("/generate", response_model=List[InviteCodeResponse])
def generate_invite_codes(
    request: InviteCodeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Generate new one-time invite codes (admin only)."""
    service = InviteService(db)
    codes = service.generate_codes(request.count, admin)
    return codes

@router.get("", response_model=List[InviteCodeResponse])
def list_invite_codes(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all invite codes with usage status (admin only)."""
    service = InviteService(db)
    codes = service.get_all_codes()

    results = []
    for code in codes:
        data = InviteCodeResponse.model_validate(code)
        data.used_by_name = code.used_by.name if code.used_by else None
        results.append(data)

    return results
