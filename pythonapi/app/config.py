# app/config.py
from dotenv import load_dotenv
import os

# Load environment variables from a .env file into os.environ
# IMPORTANT: Never commit .env files to version control (they can contain secrets).
load_dotenv()

# -----------------------------
# GLOBAL CONFIG VARIABLES
# -----------------------------

# Example secret key (used for signing tokens, sessions, etc.)
# In production, always override this with a secure key via .env
MY_SECRET_KEY = os.getenv(
    "MY_SECRET_KEY",
    "default goes here - not secure but fine while developing"
)

# Base directory of the project (absolute path to the 'app' folder)
#BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Database connection string
# Default â†’ SQLite file "ems.db" inside app/ folder
# Can be overridden in .env (e.g., PostgreSQL, MySQL)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ems.db")


# Google OAuth Configuration
# These should be set in your .env file
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/google/callback")
