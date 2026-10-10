"""
Database configuration and session management.
Supports PostgreSQL (production) and SQLite (development).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from .config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Determine database backend
if settings.DATABASE_URL.startswith("postgresql"):
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        echo=settings.DEBUG,
    )
    logger.info("Using PostgreSQL database")
else:
    # SQLite for development
    engine = create_engine(
        f"sqlite:///{settings.SQLITE_PATH}",
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
        echo=settings.DEBUG,
    )

    # Enable foreign keys & WAL mode for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

    logger.info(f"Using SQLite database at {settings.SQLITE_PATH} with WAL mode")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables."""
    from app.models.base import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized")
