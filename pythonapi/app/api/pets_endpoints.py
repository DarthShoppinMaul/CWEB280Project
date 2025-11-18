"""
Pet Management Endpoints
------------------------
API endpoints for managing pets in the adoption system.
Handles pet CRUD operations with photo upload support.

Routes:
    - GET /pets: List all pets
    - GET /pets/{pet_id}: Get specific pet details
    - POST /pets: Create new pet (with optional photo upload)
    - PATCH /pets/{pet_id}/approve: Approve a pet
    - DELETE /pets/{pet_id}: Delete a pet
"""

import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db import get_db  # Database session dependency
from app.schemas.schemas_pet import PetCreate, PetOut  # Pydantic schemas for pets
from app.schemas.models import Pet  # Pet database model
from app.api.auth_endpoints import require_auth  # Authentication dependency
from app.services.files_service import save_image_or_error  # File upload utility
from pathlib import Path

# Create API router with /pets prefix
router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("", response_model=list[PetOut])
def list_pets(db: Session = Depends(get_db)):
    """
    List All Pets
    -------------
    Returns all pets in the database, ordered by newest first.

    Returns:
        List[PetOut]: List of all pets
    """
    return db.query(Pet).order_by(Pet.pet_id.desc()).all()


@router.get("/{pet_id}", response_model=PetOut)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    """
    Get Pet by ID
    -------------
    Retrieve a single pet's details.

    Args:
        pet_id: ID of the pet to retrieve

    Returns:
        PetOut: Pet details

    Raises:
        HTTPException 404: Pet not found
    """
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Not found")
    return pet


@router.post("", response_model=PetOut, dependencies=[Depends(require_auth)])
def create_pet(
        name: str = Form(...),
        species: str = Form(...),
        age: int = Form(...),
        description: str | None = Form(None),
        location_id: int = Form(...),
        photo: UploadFile | None = File(None),
        db: Session = Depends(get_db),
):
    """
    Create New Pet
    --------------
    Create a new pet entry with optional photo upload.
    Requires authentication.

    Args:
        name: Pet's name
        species: Type of animal (dog, cat, etc.)
        age: Pet's age in years
        description: Detailed description (optional)
        location_id: ID of the location where pet is housed
        photo: Pet's photo file (optional, max 2MB)

    Returns:
        PetOut: Created pet object

    Note:
        Uses multipart/form-data because of file upload.
        Photo is saved to uploads/ directory and URL is stored in database.
    """
    # Validate input with Pydantic for consistent error messages
    payload = PetCreate(
        name=name, species=species, age=age, description=description, location_id=location_id
    )

    # Get absolute path to uploads directory
    base_dir = Path(__file__).resolve().parent  # Project root directory
    upload_dir = os.getenv("UPLOAD_DIR") or str(base_dir / "uploads")
    max_mb = int(os.getenv("MAX_UPLOAD_MB", "2"))

    # Handle photo upload if provided
    photo_url = None
    if photo:
        photo_url = save_image_or_error(photo, upload_dir, max_mb * 1024 * 1024)
        # Returns relative path like "uploads/<filename>"

    # Create and save new pet
    obj = Pet(**payload.model_dump(), photo_url=photo_url)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.patch("/{pet_id}/approve", response_model=PetOut, dependencies=[Depends(require_auth)])
def approve_pet(pet_id: int, db: Session = Depends(get_db)):
    """
    Approve Pet
    -----------
    Change a pet's status from "pending" to "approved".
    Requires authentication.

    Args:
        pet_id: ID of the pet to approve

    Returns:
        PetOut: Updated pet object

    Raises:
        HTTPException 404: Pet not found

    Note:
        Approved pets are visible to public users.
        Used for admin approval workflow.
    """
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Not found")

    # Only update if not already approved
    if pet.status != "approved":
        pet.status = "approved"
        db.add(pet)
        db.commit()
        db.refresh(pet)
    return pet


@router.delete("/{pet_id}", dependencies=[Depends(require_auth)])
def delete_pet(pet_id: int, db: Session = Depends(get_db)):
    """
    Delete Pet
    ----------
    Permanently delete a pet from the database.
    Requires authentication.

    Args:
        pet_id: ID of the pet to delete

    Returns:
        dict: Success confirmation

    Raises:
        HTTPException 404: Pet not found

    Note:
        This is a permanent action and cannot be undone!
    """
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(pet)
    db.commit()
    return {"ok": True}