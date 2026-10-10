"""
Authentication service handling Google OAuth flow,
invite code validation, and user registration.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
from uuid import uuid4
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token
from app.models.base import User, UserRole, InviteCode, AllowedUser
from app.schemas.schemas import TokenResponse, UserResponse, UserCreate

logger = logging.getLogger(__name__)
settings = get_settings()

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def verify_google_token(self, token: str) -> dict:
        """Verify Google ID token and return user info."""
        try:
            # Verify token with Google
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10
            )

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')

            return {
                'email': idinfo['email'],
                'name': idinfo.get('name', idinfo['email'].split('@')[0]),
                'picture': idinfo.get('picture'),
                'sub': idinfo['sub'],  # Google unique ID
            }
        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google authentication token"
            )

    def validate_email_domain(self, email: str) -> bool:
        """Check if email domain is allowed (if domains are configured)."""
        allowed_domains = settings.allowed_email_domains_list
        if not allowed_domains:
            return True  # No restriction if not configured
        email_domain = email.lower().split('@')[-1]
        return email_domain in allowed_domains

    def validate_invite_code(self, code: str) -> Optional[InviteCode]:
        """Check if invite code is valid and unused."""
        invite = self.db.query(InviteCode).filter(
            InviteCode.code == code.upper().strip(),
            InviteCode.is_used == False
        ).first()
        return invite

    def validate_allowed_user(self, email: str) -> Optional[AllowedUser]:
        """Check if user is in allowed users list (if configured)."""
        allowed = self.db.query(AllowedUser).filter(
            AllowedUser.email == email.lower(),
            AllowedUser.used == False
        ).first()
        return allowed

    def authenticate_or_register(
        self,
        google_token: str,
        invite_code: Optional[str] = None
    ) -> Tuple[User, bool]:
        """
        Authenticate existing user or register new one.
        Returns (user, is_new_user).
        """
        google_info = self.verify_google_token(google_token)
        email = google_info['email'].lower()

        # Check if user already exists
        existing_user = self.db.query(User).filter(
            User.email == email
        ).first()

        if existing_user:
            # Update last login
            existing_user.last_login = datetime.now(timezone.utc)
            if google_info.get('picture'):
                existing_user.avatar_url = google_info['picture']
            self.db.commit()
            return existing_user, False

        # New user registration
        if not self.validate_email_domain(email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Registration restricted to allowed email domains: {', '.join(settings.allowed_email_domains_list)}"
            )

        # Validate invite code if required (when allowed users list is used)
        allowed_user = self.validate_allowed_user(email)
        if allowed_user:
            if not invite_code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invite code required for registration"
                )
            invite = self.validate_invite_code(invite_code)
            if not invite:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or already used invite code"
                )

        # Determine role (check if admin email)
        role = UserRole.ADMIN if email in settings.admin_emails_list else UserRole.USER

        # Create new user with immutable UUID
        new_user = User(
            id=str(uuid4()),
            email=email,
            name=google_info['name'],
            avatar_url=google_info.get('picture'),
            google_sub=google_info['sub'],
            role=role,
            is_active=True,
            last_login=datetime.now(timezone.utc)
        )

        self.db.add(new_user)

        # Mark invite code as used if provided
        if invite_code:
            invite = self.validate_invite_code(invite_code)
            if invite:
                invite.is_used = True
                invite.used_by_id = new_user.id
                invite.used_at = datetime.now(timezone.utc)

        # Mark allowed user as used if applicable
        if allowed_user:
            allowed_user.used = True
            allowed_user.linked_user_id = new_user.id

        self.db.commit()
        self.db.refresh(new_user)

        logger.info(f"New user registered: {email} (role: {role})")
        return new_user, True

    def create_token_response(self, user: User) -> TokenResponse:
        """Generate JWT tokens for authenticated user."""
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": str(user.role),
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user)
        )

    def link_personal_email(self, user: User, personal_email: str) -> User:
        """Link a personal email for alternative access."""
        # Check if email already linked to another user
        existing = self.db.query(User).filter(
            User.personal_email == personal_email.lower(),
            User.id != user.id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This personal email is already linked to another account"
            )

        user.personal_email = personal_email.lower()
        self.db.commit()
        self.db.refresh(user)

        logger.info(f"Personal email linked for user {user.id}: {personal_email}")
        return user
