"""
Application Schemas
-------------------
Pydantic models for adoption application request/response validation.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class ApplicationCreate(BaseModel):
    """Schema for creating a new adoption application"""
    pet_id: int
    application_message: str = Field(..., min_length=50, max_length=2000)
    contact_phone: str = Field(..., min_length=10, max_length=40)
    living_situation: str = Field(..., min_length=3, max_length=50)
    has_other_pets: bool = False
    other_pets_details: Optional[str] = Field(None, max_length=1000)


class ApplicationUpdate(BaseModel):
    """Schema for admin updating application status"""
    status: Optional[str] = Field(None, pattern="^(pending|approved|rejected)$")
    admin_notes: Optional[str] = Field(None, max_length=2000)


class ApplicationOut(BaseModel):
    """Schema for application output"""
    application_id: int
    user_id: int
    pet_id: int
    application_message: str
    contact_phone: str
    living_situation: str
    has_other_pets: bool
    other_pets_details: Optional[str]
    status: str
    admin_notes: Optional[str]
    application_date: datetime
    reviewed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ApplicationWithDetails(BaseModel):
    """Schema for application with user and pet details"""
    application_id: int
    user_id: int
    pet_id: int
    application_message: str
    contact_phone: str
    living_situation: str
    has_other_pets: bool
    other_pets_details: Optional[str]
    status: str
    admin_notes: Optional[str]
    application_date: datetime
    reviewed_at: Optional[datetime]
    # User details
    user_email: str
    user_name: str
    # Pet details
    pet_name: str
    pet_species: str
    pet_age: int
    pet_photo_url: Optional[str]

    model_config = ConfigDict(from_attributes=True)