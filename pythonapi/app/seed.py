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
    - Adds sample adoption applications
    - Adds sample favorites
    - Only runs if database is empty (won't duplicate data)
    - Useful for development and testing
"""

# Import database session creator
from app.db import SessionLocal

# Import database models
from app.schemas import models as m

# Import password hashing function
from app.api.auth_endpoints import hash_password


def seed_database():
    """
    Add initial data to the database if it's empty
    """
    db = SessionLocal()

    try:
        # Check if database already has data
        existing_users = db.query(m.User).count()
        existing_locations = db.query(m.Location).count()
        existing_pets = db.query(m.Pet).count()

        if existing_users > 0 or existing_locations > 0 or existing_pets > 0:
            print(f"✓Database already has data:")
            print(f"   • {existing_users} users")
            print(f"   • {existing_locations} locations")
            print(f"   • {existing_pets} pets")
            print(f"\nTo reset: delete app/ems.db and run this script again")
            return

        print(" Seeding database with initial data...\n")

        # Step 1: Create default users
        print(" Adding users...")

        admin = m.User(
            email="test@t.ca",
            password_hash=hash_password("123456Pw"),
            display_name="Admin User",
            is_admin=True
        )

        regular_user = m.User(
            email="ebasotest@gmail.com",
            password_hash=hash_password("123456Pw"),
            display_name="Regular User",
            is_admin=False
        )

        test_user2 = m.User(
            email="john@t.ca",
            password_hash=hash_password("123456Pw"),
            display_name="John Smith",
            is_admin=False
        )

        db.add(admin)
        db.add(regular_user)
        db.add(test_user2)
        db.commit()

        print(f" Added 3 users")
        print(f"   Admin: test@t.ca / 123456Pw")
        print(f"   User: ebasotest@gmail.com / 123456Pw")
        print(f"   User: john@t.ca / 123456Pw\n")

        # Step 2: Create locations
        print(" Adding locations...")

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

        for location in locations:
            db.add(location)

        db.commit()

        for location in locations:
            db.refresh(location)

        print(f" Added {len(locations)} locations\n")

        # Step 3: Create pets
        print(" Adding pets...")

        pets = [
            m.Pet(
                name="Max",
                species="Dog",
                age=3,
                location_id=locations[0].location_id,
                description="Friendly Golden Retriever who loves to play fetch and go for long walks. Great with kids and other dogs. Max is house-trained and knows basic commands.",
                status="approved",
                photo_url=None
            ),
            m.Pet(
                name="Luna",
                species="Cat",
                age=2,
                location_id=locations[1].location_id,
                description="Beautiful Siamese cat with striking blue eyes. Luna is gentle and curious, loves sunny naps and interactive toys. Perfect for a quiet home.",
                status="approved",
                photo_url=None
            ),
            m.Pet(
                name="Charlie",
                species="Dog",
                age=5,
                location_id=locations[0].location_id,
                description="Energetic Beagle who loves outdoor activities. Charlie is loyal and great for an active family. Neutered and up-to-date on vaccinations.",
                status="approved",
                photo_url=None
            ),
            m.Pet(
                name="Bella",
                species="Cat",
                age=4,
                location_id=locations[2].location_id,
                description="Sweet Persian cat with a fluffy white coat. Bella is affectionate and loves being brushed. She would thrive in a calm, loving home.",
                status="approved",
                photo_url=None
            ),
            m.Pet(
                name="Rocky",
                species="Dog",
                age=6,
                location_id=locations[2].location_id,
                description="Strong and intelligent German Shepherd. Rocky needs an experienced owner with a large yard. Excellent guard dog and very loyal.",
                status="approved",
                photo_url=None
            ),
            m.Pet(
                name="Milo",
                species="Cat",
                age=1,
                location_id=locations[1].location_id,
                description="Playful tabby kitten full of energy. Milo loves to chase toys and explore. Great for a family with children.",
                status="pending",
                photo_url=None
            ),
            m.Pet(
                name="Daisy",
                species="Dog",
                age=2,
                location_id=locations[0].location_id,
                description="Adorable Corgi mix with short legs and a big personality. Daisy is friendly, smart, and loves treats. Perfect apartment dog.",
                status="pending",
                photo_url=None
            ),
            m.Pet(
                name="Oliver",
                species="Cat",
                age=3,
                location_id=locations[2].location_id,
                description="Handsome orange tabby with a gentle temperament. Oliver enjoys quiet evenings and gentle petting. Would do well with seniors.",
                status="approved",
                photo_url=None
            ),
        ]

        for pet in pets:
            db.add(pet)

        db.commit()

        for pet in pets:
            db.refresh(pet)

        print(f" Added {len(pets)} pets\n")

        # Step 4: Create sample applications
        print(" Adding sample applications...")

        applications = [
            m.Application(
                user_id=regular_user.user_id,
                pet_id=pets[0].pet_id,  # Max
                application_message="I have always wanted a Golden Retriever. I have a large backyard with a secure fence, and I work from home so I can provide constant companionship. I have experience with dogs and understand the time and financial commitment required. Max would be joining a loving home where he would get plenty of exercise, training, and affection.",
                contact_phone="(306) 555-1234",
                living_situation="house",
                has_other_pets=False,
                status="pending"
            ),
            m.Application(
                user_id=test_user2.user_id,
                pet_id=pets[2].pet_id,  # Charlie
                application_message="I am an active person who loves hiking and outdoor activities. Charlie would be the perfect companion for my lifestyle. I have a fenced yard and live near several dog parks. I've owned beagles before and understand their energetic nature and exercise needs.",
                contact_phone="(306) 555-5678",
                living_situation="house",
                has_other_pets=True,
                other_pets_details="I have a 7-year-old Labrador named Buddy who is very friendly with other dogs.",
                status="pending"
            ),
            m.Application(
                user_id=regular_user.user_id,
                pet_id=pets[1].pet_id,  # Luna
                application_message="I live in a quiet apartment that would be perfect for Luna. I work from home and can give her lots of attention. I've owned Siamese cats before and love their personality and intelligence.",
                contact_phone="(306) 555-1234",
                living_situation="apartment",
                has_other_pets=False,
                status="approved",
                admin_notes="Great match! Applicant has experience with Siamese cats. Approved for adoption."
            ),
        ]

        for app in applications:
            db.add(app)

        db.commit()

        print(f"Added {len(applications)} sample applications\n")

        # Step 5: Create sample favorites
        print("  Adding sample favorites...")

        favorites = [
            m.Favorite(
                user_id=regular_user.user_id,
                pet_id=pets[0].pet_id  # Max
            ),
            m.Favorite(
                user_id=regular_user.user_id,
                pet_id=pets[1].pet_id  # Luna
            ),
            m.Favorite(
                user_id=regular_user.user_id,
                pet_id=pets[4].pet_id  # Rocky
            ),
            m.Favorite(
                user_id=test_user2.user_id,
                pet_id=pets[2].pet_id  # Charlie
            ),
        ]

        for fav in favorites:
            db.add(fav)

        db.commit()

        print(f" Added {len(favorites)} sample favorites\n")

        # Print success summary
        print("=" * 60)
        print(" Database seeded successfully!")
        print("=" * 60)
        print("\nData added:")
        print(f"  • 3 users (1 admin, 2 regular)")
        print(f"  • {len(locations)} locations")
        print(f"  • {len([p for p in pets if p.status == 'approved'])} approved pets")
        print(f"  • {len([p for p in pets if p.status == 'pending'])} pending pets")
        print(f"  • {len(applications)} sample applications")
        print(f"  • {len(favorites)} sample favorites")
        print("\nLogin credentials:")
        print("   Admin: test@t.ca / 123456Pw")
        print("   User: ebasotest@gmail.com / 123456Pw")
        print("   User: john@t.ca / 123456Pw")
        print("\nYou can now start your backend:")
        print("  uvicorn app.main:app --reload")

    except Exception as e:
        print(f" Error seeding database: {e}")
        print("\nMake sure:")
        print("  1. You're in the py_fastapi directory")
        print("  2. The database tables exist (start backend first)")
        print("  3. Required packages are installed (bcrypt for password hashing)")
        db.rollback()

    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  DATABASE SEED SCRIPT")
    print("=" * 60)
    print()

    seed_database()