"""
Shared Album - FastAPI Backend
Production-ready API for the shared photo album platform.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import time

from app.core.config import get_settings
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.albums import router as albums_router
from app.api.media import router as media_router
from app.api.capsule import router as capsule_router
from app.api.admin import router as admin_router
from app.api.invites import router as invites_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_db()
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")

app = FastAPI(
    title=settings.APP_NAME,
    description="A curated shared photo album with moderation, member galleries, and an optional sealed time capsule",
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ─── Middleware ──────────────────────────────────────────────────────

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Per-Page"],
)

# Trusted Hosts (production)
if settings.ENVIRONMENT == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# ─── Exception Handlers ──────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# ─── API Routes ──────────────────────────────────────────────────────

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(albums_router, prefix="/api/v1/albums", tags=["Albums"])
app.include_router(media_router, prefix="/api/v1/media", tags=["Media"])
app.include_router(capsule_router, prefix="/api/v1/capsule", tags=["Time Capsule"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(invites_router, prefix="/api/v1/invites", tags=["Invite Codes"])

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "environment": settings.ENVIRONMENT}

# Root
@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Shared photo album API",
        "docs": "/api/docs" if settings.DEBUG else None
    }

# Static files for local storage (development)
if settings.STORAGE_BACKEND == "local":
    app.mount("/storage", StaticFiles(directory=settings.STORAGE_BASE_PATH, check_dir=False), name="storage")
