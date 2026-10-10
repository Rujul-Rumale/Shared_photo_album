"""
Authentication endpoints: Google OAuth, token refresh, personal email linking.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.schemas import (
    GoogleAuthRequest, TokenResponse, UserResponse,
    LinkPersonalEmailRequest, UserUpdate
)
from app.services.auth_service import AuthService
from app.models.base import User

router = APIRouter()

@router.post("/google", response_model=TokenResponse)
def auth_with_google(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate with Google OAuth token.
    For new users, invite_code is required.
    For returning users, invite_code is ignored.
    """
    auth_service = AuthService(db)
    user, is_new = auth_service.authenticate_or_register(
        request.token,
        request.invite_code
    )

    return auth_service.create_token_response(user)

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user information."""
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_profile(
    update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile (name, avatar)."""
    if update.name:
        current_user.name = update.name
    if update.avatar_url:
        current_user.avatar_url = update.avatar_url

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/link-personal-email", response_model=UserResponse)
def link_personal_email(
    request: LinkPersonalEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link a personal email as a backup contact for the account.
    """
    auth_service = AuthService(db)
    user = auth_service.link_personal_email(current_user, request.personal_email)
    return user

@router.post("/refresh")
def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Refresh access token."""
    auth_service = AuthService(db)
    return auth_service.create_token_response(current_user)
