"""
Location Management Endpoints
-----------------------------
API endpoints for managing pet adoption locations.
Handles location CRUD operations for shelters and facilities.

Routes:
    - GET /locations: List all locations
    - POST /locations: Create new location
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db  # Database session dependency
from app.schemas.schemas_location import LocationCreate, LocationOut  # Pydantic schemas for locations
from app.schemas.models import Location  # Location database model
from sqlalchemy import func

# Create API router with /locations prefix
router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db)):
    """
    List All Locations
    ------------------
    Returns all adoption locations, sorted alphabetically by name.

    Returns:
        List[LocationOut]: List of all locations

    Note:
        Uses case-insensitive sorting for consistent alphabetical order.
    """
    return db.query(Location).order_by(func.lower(Location.name).asc()).all()


@router.post("", response_model=LocationOut, status_code=200)
def create_location(payload: LocationCreate, db: Session = Depends(get_db)):
    """
    Create New Location
    -------------------
    Create a new adoption location/shelter.

    Args:
        payload: Location data (name, address, phone)

    Returns:
        LocationOut: Created location object

    Note:
        Phone number defaults to empty string if not provided.
        All locations are immediately available for associating with pets.
    """
    data = payload.model_dump()
    data["phone"] = data.get("phone") or ""  # Ensure phone is never None

    # Create and save new location
    obj = Location(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj