"""
Favorites API Endpoints
-----------------------
Handles user's favorite pets (wishlist functionality).

Routes:
    - GET /favorites: Get user's favorited pets
    - POST /favorites/{pet_id}: Add pet to favorites
    - DELETE /favorites/{pet_id}: Remove pet from favorites
    - GET /favorites/check/{pet_id}: Check if pet is favorited
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.models import Favorite, Pet
from app.api.auth_endpoints import get_current_user
from app.schemas.schemas_pet import PetOut
from typing import List

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=List[PetOut])
def list_favorites(
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Get User's Favorite Pets
    ------------------------
    Returns all pets that the current user has favorited.

    Returns:
        List of pet objects
    """
    user = get_current_user(request, db)

    # Query pets that user has favorited
    pets = db.query(Pet).join(
        Favorite, Pet.pet_id == Favorite.pet_id
    ).filter(
        Favorite.user_id == user.user_id
    ).order_by(
        Favorite.created_at.desc()
    ).all()

    return pets


@router.post("/{pet_id}")
def add_favorite(
        pet_id: int,
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Add Pet to Favorites
    --------------------
    Adds a pet to the user's favorites list.

    Args:
        pet_id: ID of the pet to favorite

    Returns:
        Success message

    Raises:
        HTTPException 404: Pet not found
        HTTPException 400: Already favorited
    """
    user = get_current_user(request, db)

    # Check if pet exists
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.user_id == user.user_id,
        Favorite.pet_id == pet_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Pet already in favorites")

    # Create favorite
    favorite = Favorite(
        user_id=user.user_id,
        pet_id=pet_id
    )

    db.add(favorite)
    db.commit()

    return {"ok": True, "message": "Pet added to favorites"}


@router.delete("/{pet_id}")
def remove_favorite(
        pet_id: int,
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Remove Pet from Favorites
    -------------------------
    Removes a pet from the user's favorites list.

    Args:
        pet_id: ID of the pet to unfavorite

    Returns:
        Success message

    Raises:
        HTTPException 404: Favorite not found
    """
    user = get_current_user(request, db)

    # Find favorite
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user.user_id,
        Favorite.pet_id == pet_id
    ).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="Pet not in favorites")

    # Delete favorite
    db.delete(favorite)
    db.commit()

    return {"ok": True, "message": "Pet removed from favorites"}


@router.get("/check/{pet_id}")
def check_favorite(
        pet_id: int,
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Check if Pet is Favorited
    -------------------------
    Returns whether the current user has favorited a specific pet.

    Args:
        pet_id: ID of the pet to check

    Returns:
        {"is_favorited": bool}
    """
    user = get_current_user(request, db)

    # Check if favorited
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user.user_id,
        Favorite.pet_id == pet_id
    ).first()

    return {"is_favorited": favorite is not None}


@router.get("/list-ids")
def list_favorite_ids(
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Get List of Favorited Pet IDs
    ------------------------------
    Returns an array of pet IDs that the user has favorited.
    Useful for checking favorites in bulk.

    Returns:
        {"pet_ids": [1, 2, 3, ...]}
    """
    user = get_current_user(request, db)

    # Query favorite pet IDs
    pet_ids = db.query(Favorite.pet_id).filter(
        Favorite.user_id == user.user_id
    ).all()

    # Extract IDs from tuples
    pet_ids = [pid[0] for pid in pet_ids]

    return {"pet_ids": pet_ids}