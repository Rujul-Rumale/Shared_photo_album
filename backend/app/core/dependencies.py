"""
Common dependencies and utilities for the API.
"""

from fastapi import Query
from typing import Optional
from uuid import UUID

class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(24, ge=1, le=100, description="Items per page")
    ):
        self.page = page
        self.per_page = per_page
        self.offset = (page - 1) * per_page

class AlbumFilter:
    def __init__(
        self,
        tag: Optional[str] = Query(None, description="Filter by tag"),
        search: Optional[str] = Query(None, description="Search query"),
    ):
        self.tag = tag
        self.search = search
