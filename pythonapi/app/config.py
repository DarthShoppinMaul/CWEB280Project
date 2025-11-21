# app/config.py
# Configuration settings for the application
# Loads environment variables from googleauth.env

from dotenv import load_dotenv
import os
from pathlib import Path

# Get the directory where this config file is located
config_dir = Path(__file__).resolve().parent

# Load environment variables from googleauth.env file
env_file = config_dir / 'googleauth.env'
if not env_file.exists():
    env_file = config_dir.parent / 'googleauth.env'

# Load environment variables
load_dotenv(env_file)

# -----------------------------
# GLOBAL CONFIG VARIABLES
# -----------------------------

# Secret key for JWT signing (MUST be changed in production!)
MY_SECRET_KEY = os.getenv(
    "MY_SECRET_KEY",
    "default-secret-key-change-in-production"
)

# Validate secret key in production
if MY_SECRET_KEY == "default-secret-key-change-in-production" or MY_SECRET_KEY == "your-secret-key-here":
    print("WARNING: Using default secret key. Please change MY_SECRET_KEY in googleauth.env")

# Database connection string
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ems.db")

# -----------------------------
# GOOGLE OAUTH CONFIGURATION
# -----------------------------

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# Backend callback URL (where Google redirects after authorization)
# This should ALWAYS point to the backend, not the frontend
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/auth/google/callback"
)

# Validate Google OAuth configuration
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    print(f" Google OAuth configured")
    print(f" Client ID: {GOOGLE_CLIENT_ID[:20]}...")
    print(f" Redirect URI: {GOOGLE_REDIRECT_URI}")
else:
    print(" Google OAuth not configured (set credentials in googleauth.env)")

# Frontend URL (where backend redirects after successful OAuth)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# -----------------------------
# SECURITY SETTINGS
# -----------------------------

# CORS origins (comma-separated if multiple)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")

# JWT Settings
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 1  # Default token expiration
JWT_REMEMBER_ME_DAYS = 7  # Remember me token expiration