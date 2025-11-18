"""
Test Endpoints
--------------
API endpoints for testing purposes only.
Provides database reset functionality for automated tests.

Routes:
    - POST /_test/reset: Reset database (requires admin key)

WARNING: These endpoints should ONLY be used in development/testing!
"""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db  # Database session dependency
from app.schemas.models import Pet, Location, User  # Database models

# Create API router with /_test prefix (hidden from main API docs)
router = APIRouter(prefix="/_test", tags=["_test"])


@router.post("/reset")
def reset_db(
        db: Session = Depends(get_db),
        x_admin_key: str = Header(None)
):
    """
    Reset Database
    --------------
    Clear all data from pets and locations tables.
    Used by Cypress tests to ensure clean test state.

    Args:
        x_admin_key: Admin password (must be "letmein")

    Returns:
        dict: Success confirmation

    Raises:
        HTTPException 403: Invalid or missing admin key

    Security:
        - Requires X-Admin-Key header with value "letmein"
        - Should ONLY be enabled in development/testing environments
        - NEVER use in production!
    """
    # Verify admin key
    if x_admin_key != "letmein":
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete all test data
    db.query(Pet).delete()
    db.query(Location).delete()
    db.commit()

    return {"ok": True}
