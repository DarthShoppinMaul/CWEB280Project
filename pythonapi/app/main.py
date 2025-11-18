"""
FastAPI Main Application
------------------------
Entry point for the Pet Gallery backend API.
Configures CORS, database, routers, and serves static files.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db import Base, engine
from app.schemas import models  # registers tables
from app.api.auth_endpoints import router as auth_router
from app.api.users_endpoints import router as users_router
from app.api.locations_endpoints import router as loc_router
from app.api.pets_endpoints import router as pets_router
from app.api.test_endpoints import router as test_router
import uvicorn
from pathlib import Path

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(title="Pet Gallery API")

# Configure CORS (Cross-Origin Resource Sharing)
# Allows the frontend (React) to communicate with the backend
origins = [os.getenv("CORS_ORIGINS", "http://localhost:5173")]
if isinstance(origins, str) and "," in origins:
    origins = [o.strip() for o in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if isinstance(origins, list) else [origins],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],     # Allow all headers
)

# Register API routers
app.include_router(auth_router)   # Authentication: /auth/login, /auth/register, etc.
app.include_router(users_router)  # User management: /users
app.include_router(loc_router)    # Locations: /locations
app.include_router(pets_router)   # Pets: /pets

# Test router for database reset (development only)
app.include_router(test_router)

# Configure static file serving for uploaded images
BASE_DIR = Path(__file__).resolve().parent          # .../app
UPLOAD_DIR = BASE_DIR / "uploads"                   # .../app/uploads
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve files at http://localhost:8000/uploads/<file>
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Run the application
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)