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
from starlette.middleware.sessions import SessionMiddleware
from app.db import Base, engine
from app.schemas import models
from app.api.auth_endpoints import router as auth_router
from app.api.users_endpoints import router as users_router
from app.api.locations_endpoints import router as loc_router
from app.api.pets_endpoints import router as pets_router
from app.api.applications_endpoints import router as applications_router
from app.api.favorites_endpoints import router as favorites_router
from app.api.test_endpoints import router as test_router
from app import config
import uvicorn
from pathlib import Path

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(title="Pet Gallery API")

# Add SessionMiddleware for OAuth support (must be added before other middleware)
app.add_middleware(
    SessionMiddleware,
    secret_key=config.MY_SECRET_KEY,
    session_cookie="session",
    max_age=3600,
    same_site="lax",
    https_only=False
)

# Configure CORS (Cross-Origin Resource Sharing)
origins = [os.getenv("CORS_ORIGINS", "http://localhost:5173")]
if isinstance(origins, str) and "," in origins:
    origins = [o.strip() for o in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if isinstance(origins, list) else [origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(loc_router)
app.include_router(pets_router)
app.include_router(applications_router)
app.include_router(favorites_router)
app.include_router(test_router)

# Configure static file serving for uploaded images
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve files at http://localhost:8000/uploads/<file>
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Run the application
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)