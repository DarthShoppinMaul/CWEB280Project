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

    Relationships:
        - applications: One-to-many relationship with Application model
        - favorites: One-to-many relationship with Favorite model
    """
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(120), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


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
        - applications: One-to-many relationship with Application model
        - favorites: One-to-many relationship with Favorite model
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

    # Relationships
    location = relationship("Location", back_populates="pets")
    applications = relationship("Application", back_populates="pet", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="pet", cascade="all, delete-orphan")


class Application(Base):
    """
    Application Model
    -----------------
    Represents adoption applications submitted by users.

    Columns:
        - application_id: Primary key
        - user_id: Foreign key to User
        - pet_id: Foreign key to Pet
        - application_message: Why they want to adopt
        - contact_phone: Applicant's phone number
        - living_situation: Type of home (house, apartment, etc.)
        - has_other_pets: Boolean - do they have other pets
        - other_pets_details: Details about other pets
        - status: Application status (pending, approved, rejected)
        - admin_notes: Admin's review notes
        - application_date: When application was submitted
        - reviewed_at: When application was reviewed

    Relationships:
        - user: Many-to-one relationship with User model
        - pet: Many-to-one relationship with Pet model
    """
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.pet_id"), nullable=False)
    application_message = Column(Text, nullable=False)
    contact_phone = Column(String(40), nullable=False)
    living_situation = Column(String(50), nullable=False)
    has_other_pets = Column(Boolean, default=False, nullable=False)
    other_pets_details = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    application_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="applications")
    pet = relationship("Pet", back_populates="applications")


class Favorite(Base):
    """
    Favorite Model
    --------------
    Represents pets favorited by users (wishlist).

    Columns:
        - favorite_id: Primary key
        - user_id: Foreign key to User
        - pet_id: Foreign key to Pet
        - created_at: When pet was favorited

    Relationships:
        - user: Many-to-one relationship with User model
        - pet: Many-to-one relationship with Pet model
    """
    __tablename__ = "favorites"

    favorite_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.pet_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="favorites")
    pet = relationship("Pet", back_populates="favorites")