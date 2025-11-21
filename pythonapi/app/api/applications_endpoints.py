"""
Applications API Endpoints
--------------------------
Handles adoption application submission, review, and management.

Routes:
    - POST /applications: Submit new application
    - GET /applications: Get all applications (admin) or user's applications
    - GET /applications/{id}: Get specific application
    - PATCH /applications/{id}: Update application status (admin)
    - GET /applications/stats: Get application statistics (admin)
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.db import get_db
from app.schemas.models import Application, User, Pet
from app.schemas.schemas_application import ApplicationCreate, ApplicationUpdate, ApplicationOut, ApplicationWithDetails
from app.api.auth_endpoints import get_current_user
from typing import List

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationOut)
def create_application(
        data: ApplicationCreate,
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Submit Adoption Application
    ---------------------------
    Allows authenticated users to submit an application to adopt a pet.

    Returns:
        ApplicationOut: Created application

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 404: Pet not found
        HTTPException 400: User already has pending application for this pet
    """
    # Get current user
    user = get_current_user(request, db)

    # Check if pet exists
    pet = db.query(Pet).filter(Pet.pet_id == data.pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Check if user already has a pending application for this pet
    existing = db.query(Application).filter(
        Application.user_id == user.user_id,
        Application.pet_id == data.pet_id,
        Application.status == "pending"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending application for this pet"
        )

    # Create application
    application = Application(
        user_id=user.user_id,
        **data.model_dump()
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@router.get("", response_model=List[ApplicationWithDetails])
def list_applications(
        request: Request,
        db: Session = Depends(get_db),
        status: str = None
):
    """
    List Applications
    -----------------
    - Admin: Returns all applications (optionally filtered by status)
    - User: Returns only their own applications

    Query Parameters:
        status: Filter by status (pending, approved, rejected)

    Returns:
        List of applications with user and pet details
    """
    user = get_current_user(request, db)

    # Build query
    query = db.query(
        Application,
        User.email.label('user_email'),
        User.display_name.label('user_name'),
        Pet.name.label('pet_name'),
        Pet.species.label('pet_species'),
        Pet.age.label('pet_age'),
        Pet.photo_url.label('pet_photo_url')
    ).join(
        User, Application.user_id == User.user_id
    ).join(
        Pet, Application.pet_id == Pet.pet_id
    )

    # Filter by user if not admin
    if not user.is_admin:
        query = query.filter(Application.user_id == user.user_id)

    # Filter by status if provided
    if status:
        query = query.filter(Application.status == status)

    # Order by date (newest first)
    query = query.order_by(Application.application_date.desc())

    # Execute query
    results = query.all()

    # Transform results
    applications = []
    for app, user_email, user_name, pet_name, pet_species, pet_age, pet_photo_url in results:
        applications.append(ApplicationWithDetails(
            application_id=app.application_id,
            user_id=app.user_id,
            pet_id=app.pet_id,
            application_message=app.application_message,
            contact_phone=app.contact_phone,
            living_situation=app.living_situation,
            has_other_pets=app.has_other_pets,
            other_pets_details=app.other_pets_details,
            status=app.status,
            admin_notes=app.admin_notes,
            application_date=app.application_date,
            reviewed_at=app.reviewed_at,
            user_email=user_email,
            user_name=user_name,
            pet_name=pet_name,
            pet_species=pet_species,
            pet_age=pet_age,
            pet_photo_url=pet_photo_url
        ))

    return applications


@router.get("/stats")
def get_application_stats(
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Get Application Statistics (Admin Only)
    ----------------------------------------
    Returns statistics about applications.

    Returns:
        Dict with pending, approved, rejected, and total counts
    """
    user = get_current_user(request, db)

    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get counts by status
    stats = db.query(
        Application.status,
        func.count(Application.application_id).label('count')
    ).group_by(Application.status).all()

    # Transform to dict
    result = {
        'pending': 0,
        'approved': 0,
        'rejected': 0,
        'total': 0
    }

    for status, count in stats:
        result[status] = count
        result['total'] += count

    return result


@router.get("/{application_id}", response_model=ApplicationWithDetails)
def get_application(
        application_id: int,
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Get Application Details
    -----------------------
    Returns detailed information about a specific application.
    Users can only view their own applications, admins can view all.

    Args:
        application_id: ID of the application

    Returns:
        Application with user and pet details

    Raises:
        HTTPException 404: Application not found
        HTTPException 403: Not authorized to view this application
    """
    user = get_current_user(request, db)

    # Query with joins
    result = db.query(
        Application,
        User.email.label('user_email'),
        User.display_name.label('user_name'),
        Pet.name.label('pet_name'),
        Pet.species.label('pet_species'),
        Pet.age.label('pet_age'),
        Pet.photo_url.label('pet_photo_url')
    ).join(
        User, Application.user_id == User.user_id
    ).join(
        Pet, Application.pet_id == Pet.pet_id
    ).filter(
        Application.application_id == application_id
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Application not found")

    app, user_email, user_name, pet_name, pet_species, pet_age, pet_photo_url = result

    # Check authorization
    if not user.is_admin and app.user_id != user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this application"
        )

    return ApplicationWithDetails(
        application_id=app.application_id,
        user_id=app.user_id,
        pet_id=app.pet_id,
        application_message=app.application_message,
        contact_phone=app.contact_phone,
        living_situation=app.living_situation,
        has_other_pets=app.has_other_pets,
        other_pets_details=app.other_pets_details,
        status=app.status,
        admin_notes=app.admin_notes,
        application_date=app.application_date,
        reviewed_at=app.reviewed_at,
        user_email=user_email,
        user_name=user_name,
        pet_name=pet_name,
        pet_species=pet_species,
        pet_age=pet_age,
        pet_photo_url=pet_photo_url
    )


@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
        application_id: int,
        data: ApplicationUpdate,
        request: Request,
        db: Session = Depends(get_db)
):
    """
    Update Application Status (Admin Only)
    --------------------------------------
    Allows admins to approve/reject applications and add notes.

    Args:
        application_id: ID of the application
        data: Update data (status, admin_notes)

    Returns:
        Updated application

    Raises:
        HTTPException 403: Not admin
        HTTPException 404: Application not found
    """
    user = get_current_user(request, db)

    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Find application
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Update fields
    if data.status:
        application.status = data.status
        application.reviewed_at = datetime.utcnow()

    if data.admin_notes is not None:
        application.admin_notes = data.admin_notes

    db.commit()
    db.refresh(application)

    return application


@router.delete("/{application_id}")
def delete_application(
        application_id: int,
        request: Request,
        db: Session = Depends(get_db)
):
    # Get current user from JWT token
    user = get_current_user(request, db)

    # Find application in database
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Authorization check - users can only delete their own
    if not user.is_admin and application.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Perform deletion
    db.delete(application)
    db.commit()

    return {"ok": True, "message": "Application deleted successfully"}