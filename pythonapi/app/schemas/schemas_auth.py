"""
Authentication Schemas
----------------------
Pydantic models for request/response validation related to user authentication and management.
These define the structure of data sent to and from the API.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """
    Login Request Schema
    -------------------
    Data required for user login.

    Fields:
        - email: User's email address
        - password: User's password (plain text, will be hashed server-side)
    """
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """
    Registration Request Schema
    ---------------------------
    Data required for new user registration.

    Fields:
        - email: User's email address (must be unique)
        - password: User's chosen password (min 6 characters)
        - display_name: User's display name
    """
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    display_name: str = Field(..., min_length=1, max_length=120)


class UserOut(BaseModel):
    """
    User Output Schema
    ------------------
    User data returned to clients (password is never included).

    Fields:
        - user_id: Unique identifier for the user
        - email: User's email address
        - display_name: User's display name
        - is_admin: Whether user has admin privileges
        - created_at: When the account was created
    """
    user_id: int
    email: str
    display_name: str
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True  # Allows creation from SQLAlchemy models


class UserUpdate(BaseModel):
    """
    User Update Schema
    ------------------
    Data that can be updated for a user profile.
    All fields are optional - only include what you want to change.

    Fields:
        - display_name: New display name (optional)
        - email: New email address (optional)
        - password: New password (optional, min 6 characters if provided)
    """
    display_name: Optional[str] = Field(None, min_length=1, max_length=120)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)


class UserCreate(BaseModel):
    """
    User Creation Schema (Admin)
    -----------------------------
    Schema for admins to create new users.
    Similar to RegisterRequest but allows setting is_admin flag.

    Fields:
        - email: User's email address
        - password: User's password
        - display_name: User's display name
        - is_admin: Whether to grant admin privileges (default: False)
    """
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: str = Field(..., min_length=1, max_length=120)
    is_admin: bool = False