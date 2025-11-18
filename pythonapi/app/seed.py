"""
Database Seed Script
--------------------
Run this file to populate the database with initial test data.

Usage:
    python seed.py

Purpose:
    - Adds default admin and regular user accounts
    - Adds sample locations (adoption centers)
    - Adds sample pets (some approved, some pending)
    - Only runs if database is empty (won't duplicate data)
    - Useful for development and testing
"""

# Import database session creator
from app.db import SessionLocal

# Import database models (Location, Pet, User, etc.)
from app.schemas import models as m

# Import password hashing function
from app.api.auth_endpoints import hash_password


def seed_database():
    """
    Add initial data to the database if it's empty

    What this does:
    1. Checks if data already exists
    2. If exists, prints message and exits
    3. If empty, creates:
       - 2 users (1 admin, 1 regular)
       - 3 locations
       - 6 pets
    4. Saves everything to database
    """

    # Create a database session
    # This is like opening a connection to the database
    db = SessionLocal()

    try:
        # Check if database already has data
        # Count how many users, locations, and pets exist
        existing_users = db.query(m.User).count()
        existing_locations = db.query(m.Location).count()
        existing_pets = db.query(m.Pet).count()

        # If any data exists, don't add more (prevents duplicates)
        if existing_users > 0 or existing_locations > 0 or existing_pets > 0:
            print(f" Database already has data:")
            print(f"   • {existing_users} users")
            print(f"   • {existing_locations} locations")
            print(f"   • {existing_pets} pets")
            print(f"\nTo reset: delete app/ems.db and run this script again")
            return  # Exit function early

        # Database is empty, so let's add data
        print(" Seeding database with initial data...\n")

        # Step 1: Create default users
        print(" Adding users...")

        # Create default admin user
        admin = m.User(
            email="admin@t.ca",
            password_hash=hash_password("123456Pw"),
            display_name="Admin User",
            is_admin=True
        )

        # Create default regular user
        regular_user = m.User(
            email="test@t.ca",
            password_hash=hash_password("123456Pw"),
            display_name="Regular User",
            is_admin=False
        )

        # Add users to database
        db.add(admin)
        db.add(regular_user)
        db.commit()

        print(f" Added 2 users")
        print(f"   • Admin: admin@t.ca / 123456Pw")
        print(f"   • User: test@t.ca / 123456Pw\n")

        # Step 2: Create locations (adoption centers)
        print(" Adding locations...")

        # Create a list of Location objects
        # Each location has: name, address, phone
        locations = [
            m.Location(
                name="Downtown Adoption Center",
                address="123 Main St, Saskatoon, SK",
                phone="(306) 555-0123"
            ),
            m.Location(
                name="Riverside Shelter",
                address="55 River Rd, Saskatoon, SK",
                phone="(306) 555-0456"
            ),
            m.Location(
                name="Northside Rescue",
                address="118 North St, Saskatoon, SK",
                phone="(306) 555-0890"
            ),
        ]

        # Add each location to the database session
        # (Not saved yet, just staged)
        for location in locations:
            db.add(location)

        # Commit = Actually save to database
        # All 3 locations are now permanently saved
        db.commit()

        # Refresh = Reload objects from database
        # This is needed to get the auto-generated location_id values
        for location in locations:
            db.refresh(location)

        print(f" Added {len(locations)} locations\n")

        # Step 3: Create pets
        print(" Adding pets...")

        # Create a list of Pet objects
        # Each pet has: name, species, age, location_id, description, status
        # location_id references one of the locations we just created
        # status can be "approved" (visible on home page) or "pending" (needs approval)
        pets = [
            m.Pet(
                name="Bella",
                species="Husky",
                age=2,
                location_id=locations[0].location_id,  # Downtown
                description="Friendly and energetic. Loves running, good with kids.",
                status="approved",  # Already approved, will show on home page
                photo_url=None  # No photo (could add later)
            ),
            m.Pet(
                name="Milo",
                species="Tabby Cat",
                age=1,
                location_id=locations[1].location_id,  # Riverside
                description="Gentle and curious. Enjoys sunny naps.",
                status="approved",
                photo_url=None
            ),
            m.Pet(
                name="Luna",
                species="Mixed Breed",
                age=3,
                location_id=locations[2].location_id,  # Northside
                description="Loves kids and walks. Spayed, vaccinated.",
                status="pending",  # Needs approval in dashboard
                photo_url=None
            ),
            m.Pet(
                name="Charlie",
                species="Golden Retriever",
                age=4,
                location_id=locations[0].location_id,  # Downtown
                description="Very friendly and playful. Great with children and other dogs.",
                status="approved",
                photo_url=None
            ),
            m.Pet(
                name="Shadow",
                species="Black Cat",
                age=2,
                location_id=locations[1].location_id,  # Riverside
                description="Quiet and affectionate. Perfect lap cat.",
                status="pending",  # Needs approval
                photo_url=None
            ),
            m.Pet(
                name="Max",
                species="Beagle",
                age=5,
                location_id=locations[2].location_id,  # Northside
                description="Energetic and loyal. Loves outdoor activities.",
                status="approved",
                photo_url=None
            ),
        ]

        # Add each pet to the database session
        for pet in pets:
            db.add(pet)

        # Commit = Save all pets to database
        db.commit()

        print(f" Added {len(pets)} pets\n")

        # Print success summary
        print("=" * 60)
        print(" Database seeded successfully!")
        print("=" * 60)
        print("\nData added:")
        print(f"  • 2 users (1 admin, 1 regular)")
        print(f"  • {len(locations)} locations")
        # Count approved pets (filter where status == 'approved')
        print(f"  • {len([p for p in pets if p.status == 'approved'])} approved pets")
        # Count pending pets (filter where status == 'pending')
        print(f"  • {len([p for p in pets if p.status == 'pending'])} pending pets")
        print("\nLogin credentials:")
        print("   Admin: admin@t.ca / 123456Pw")
        print("   User: test@t.ca / 123456Pw")
        print("\nYou can now start your backend:")
        print("  uvicorn app.main:app --reload")

    except Exception as e:
        # If anything goes wrong, show error message
        print(f" Error seeding database: {e}")
        print("\nMake sure:")
        print("  1. You're in the py_fastapi directory")
        print("  2. The database tables exist (start backend first)")
        print("  3. Required packages are installed (bcrypt for password hashing)")

        # Rollback = Undo any changes that were staged but not committed
        db.rollback()

    finally:
        # Always close the database session when done
        # This is important to free up resources
        db.close()


# This block only runs if script is executed directly
# (Not if imported as a module)
if __name__ == "__main__":
    # Print header
    print("=" * 60)
    print("  DATABASE SEED SCRIPT")
    print("=" * 60)
    print()

    # Run the seed function
    seed_database()