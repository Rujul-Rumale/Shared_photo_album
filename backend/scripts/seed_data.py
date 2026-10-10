"""
Database seeding script for initial data.
Run once after database initialization.

Customize ALBUMS and DEFAULT_USERS for your own group or event,
or leave the placeholders and manage everything from the admin panel.
"""

import logging
import hashlib
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.base import Base, Album, AllowedUser

logger = logging.getLogger(__name__)

ALBUMS = [
    {
        "slug": "getting-started",
        "name": "Getting Started",
        "description": "First photos, first faces, and the beginning of the collection.",
        "sort_order": 1,
    },
    {
        "slug": "everyday-moments",
        "name": "Everyday Moments",
        "description": "Candid shots, shared meals, and ordinary days worth remembering.",
        "sort_order": 2,
    },
    {
        "slug": "events",
        "name": "Events & Gatherings",
        "description": "Celebrations, meetups, workshops, and group activities.",
        "sort_order": 3,
    },
    {
        "slug": "trips",
        "name": "Trips & Outings",
        "description": "Weekend getaways, road trips, hikes, and adventures together.",
        "sort_order": 4,
    },
    {
        "slug": "behind-the-scenes",
        "name": "Behind the Scenes",
        "description": "Bloopers, setup chaos, and the moments between the moments.",
        "sort_order": 5,
    },
    {
        "slug": "favorites",
        "name": "Favorites",
        "description": "The all-time best shots, as picked by the curators.",
        "sort_order": 6,
    },
    {
        "slug": "miscellaneous",
        "name": "Miscellaneous",
        "description": "Everything that doesn't fit anywhere else.",
        "sort_order": 7,
    },
    {
        "slug": "time-capsule",
        "name": "Time Capsule",
        "description": "Sealed letters and memories, locked until the reveal date.",
        "sort_order": 8,
    },
]

# Optional: pre-approved members for invite-only albums.
# Leave empty to allow open registration (or domain-restricted registration).
DEFAULT_USERS = [
    # {"email": "organizer@example.com", "full_name": "Album Organizer", "code": "WELCOME2027"},
]


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode('utf-8')).hexdigest()


def seed_albums(db: Session):
    """Seed default albums if none exist."""
    existing = db.query(Album).first()
    if existing:
        logger.info("Albums already seeded, skipping")
        return

    for album_data in ALBUMS:
        album = Album(**album_data)
        db.add(album)

    db.commit()
    logger.info(f"Seeded {len(ALBUMS)} albums")


def seed_allowed_users(db: Session):
    """Seed initial allowed members for testing."""
    existing = db.query(AllowedUser).first()
    if existing:
        logger.info("Allowed users already seeded, skipping")
        return

    for member in DEFAULT_USERS:
        allowed = AllowedUser(
            email=member["email"],
            full_name=member["full_name"],
            registration_code_hash=hash_code(member["code"]),
            used=False
        )
        db.add(allowed)

    db.commit()
    logger.info(f"Seeded {len(DEFAULT_USERS)} allowed users")


def run_seed():
    """Run all seed operations."""
    db = SessionLocal()
    try:
        seed_albums(db)
        seed_allowed_users(db)
        logger.info("Database seeding completed successfully")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    run_seed()
