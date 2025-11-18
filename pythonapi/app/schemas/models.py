"""
Database Models
---------------
Defines the database structure using SQLAlchemy ORM.
This file contains all table definitions for the pet adoption system.
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class User(Base):
    """
    User Model
    ----------
    Represents registered users in the system.
    Stores authentication credentials and user profile information.

    Columns:
        - user_id: Primary key
        - email: Unique email address for login
        - password_hash: Hashed password (never store plain text!)
        - display_name: User's display name
        - is_admin: Boolean flag for admin privileges
        - created_at: Timestamp when account was created
    """
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(120), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Location(Base):
    """
    Location Model
    --------------
    Represents physical locations where pets are housed.
    Each pet must be associated with a location.

    Columns:
        - location_id: Primary key
        - name: Name of the location/shelter
        - address: Physical address
        - phone: Contact phone number

    Relationships:
        - pets: One-to-many relationship with Pet model
    """
    __tablename__ = "locations"

    location_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    address = Column(String(200), nullable=False)
    phone = Column(String(40), nullable=False)

    # Relationship: One location can have many pets
    pets = relationship("Pet", back_populates="location")


class Pet(Base):
    """
    Pet Model
    ---------
    Represents pets available for adoption.
    Each pet must be linked to a location.

    Columns:
        - pet_id: Primary key
        - name: Pet's name
        - species: Type of animal (dog, cat, etc.)
        - age: Pet's age in years
        - description: Detailed information about the pet
        - photo_url: URL/path to pet's photo
        - location_id: Foreign key to Location
        - status: Approval status ("pending" or "approved")

    Relationships:
        - location: Many-to-one relationship with Location model
    """
    __tablename__ = "pets"

    pet_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    species = Column(String(80), nullable=False)
    age = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    photo_url = Column(String(255), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.location_id"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # "pending" | "approved"

    # Relationship: Each pet belongs to one location
    location = relationship("Location", back_populates="pets")
