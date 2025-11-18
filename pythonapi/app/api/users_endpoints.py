"""
User Management Endpoints
-------------------------
API endpoints for managing users in the system.
Handles user CRUD operations with proper authentication and authorization.

Routes:
    - GET /users: List all users (admin only)
    - GET /users/{user_id}: Get specific user details
    - PUT /users/{user_id}: Update user information
    - DELETE /users/{user_id}: Delete user account
    - POST /users: Create new user (admin only)
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.models import User
from app.schemas.schemas_auth import UserOut, UserUpdate, UserCreate
from app.api.auth_endpoints import require_auth, get_current_user, hash_password
from typing import List

router = APIRouter(prefix="/users", tags=["users"])


def require_admin(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Dependency to require admin authentication.

    Raises:
        HTTPException: If user is not authenticated or not an admin

    Returns:
        User: The authenticated admin user
    """
    user = get_current_user(request, db)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


@router.get("", response_model=List[UserOut])
def list_users(
        db: Session = Depends(get_db),
        _: User = Depends(require_admin)
):
    """
    List All Users (Admin Only)
    ---------------------------
    Returns a list of all registered users in the system.

    Authorization:
        - Requires admin privileges

    Returns:
        List of user objects (without passwords)

    Example Response:
        [
            {
                "user_id": 1,
                "email": "user@example.com",
                "display_name": "John Doe",
                "is_admin": false,
                "created_at": "2024-01-01T00:00:00"
            },
            ...
        ]
    """
    users = db.query(User).all()
    return users


@router.get("/{user_id}", response_model=UserOut)
def get_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get User Details
    ----------------
    Retrieve details for a specific user.

    Authorization:
        - Users can view their own profile
        - Admins can view any user's profile

    Args:
        user_id: ID of the user to retrieve

    Returns:
        User object (without password)

    Raises:
        HTTPException 404: User not found
        HTTPException 403: User trying to access another user's profile (non-admin)
    """
    # Users can only view their own profile unless they're admin
    if current_user.user_id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot view other users' profiles")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
        user_id: int,
        user_data: UserUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Update User Information
    -----------------------
    Update a user's profile information.

    Authorization:
        - Users can update their own profile
        - Admins can update any user's profile

    Args:
        user_id: ID of the user to update
        user_data: Fields to update (only provided fields will be changed)

    Fields that can be updated:
        - display_name: User's display name
        - email: User's email address (must be unique)
        - password: User's password (will be hashed)

    Returns:
        Updated user object

    Raises:
        HTTPException 404: User not found
        HTTPException 403: User trying to update another user's profile (non-admin)
        HTTPException 400: Email already taken by another user
    """
    # Users can only update their own profile unless they're admin
    if current_user.user_id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot update other users' profiles")

    # Find the user to update
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only the fields that were provided
    if user_data.display_name is not None:
        user.display_name = user_data.display_name

    if user_data.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(
            User.email == user_data.email,
            User.user_id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_data.email

    if user_data.password is not None:
        # Hash the new password before storing
        user.password_hash = hash_password(user_data.password)

    # Save changes to database
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Delete User Account
    -------------------
    Permanently delete a user account from the system.

    Authorization:
        - Users can delete their own account
        - Admins can delete any user account

    Args:
        user_id: ID of the user to delete

    Returns:
        Success message

    Raises:
        HTTPException 404: User not found
        HTTPException 403: User trying to delete another user's account (non-admin)

    Note:
        This is a permanent action and cannot be undone!
    """
    # Users can only delete their own account unless they're admin
    if current_user.user_id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot delete other users' accounts")

    # Find the user to delete
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete the user from the database
    db.delete(user)
    db.commit()

    return {"message": "User account deleted successfully", "user_id": user_id}


@router.post("", response_model=UserOut)
def create_user(
        user_data: UserCreate,
        db: Session = Depends(get_db),
        _: User = Depends(require_admin)
):
    """
    Create New User (Admin Only)
    ----------------------------
    Create a new user account. Admin-only endpoint.

    Authorization:
        - Requires admin privileges

    Args:
        user_data: New user information

    Returns:
        Created user object

    Raises:
        HTTPException 400: Email already registered

    Note:
        For regular user registration, use the /auth/register endpoint instead.
    """
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with hashed password
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        display_name=user_data.display_name,
        is_admin=user_data.is_admin
    )

    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user