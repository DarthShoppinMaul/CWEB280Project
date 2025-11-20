"""
Authentication Endpoints - CORRECTED VERSION
------------------------
API endpoints for user authentication (login, logout, registration, Google OAuth).
Handles session management using HTTP cookies and password hashing for security.
Added missing endpoints that Cypress tests expect.

Routes:
    - POST /auth/login: User login
    - POST /auth/logout: User logout
    - POST /auth/register: New user registration
    - GET /auth/me: Get current user info
    - GET /auth/status: API health check
    - GET /auth/google/login: Initiate Google OAuth flow
    - GET /auth/google/callback: Handle Google OAuth callback
"""

from fastapi import APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from app.db import get_db
from app.schemas.models import User
from app.schemas.schemas_auth import LoginRequest, RegisterRequest, UserOut
from app import config
import bcrypt

router = APIRouter(prefix="/auth", tags=["auth"])

# Session cookie name
SESSION_COOKIE = "session_email"

# Configure OAuth for Google
oauth = OAuth()
oauth.register(
    name='google',
    client_id=config.GOOGLE_CLIENT_ID,
    client_secret=config.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get the currently authenticated user from session cookie."""
    email = request.cookies.get(SESSION_COOKIE)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_auth(request: Request):
    """Dependency to require authentication."""
    if not request.cookies.get(SESSION_COOKIE):
        raise HTTPException(status_code=401, detail="Login required")


@router.get("/status")
def auth_status():
    """
    API Health Check
    ----------------
    Simple endpoint to check if the authentication API is running.
    Used by Cypress tests to ensure API server is available.

    Returns:
        Status message indicating API is operational
    """
    return {"status": "ok", "message": "Authentication API is running"}


@router.post("/login", response_model=UserOut)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """User Login - Authenticate a user with email and password."""
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Set session cookie
    response.set_cookie(
        SESSION_COOKIE,
        user.email,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7  # 7 days
    )

    return UserOut(
        user_id=user.user_id,
        email=user.email,
        display_name=user.display_name,
        is_admin=user.is_admin,
        created_at=user.created_at
    )


@router.post("/register", response_model=UserOut)
def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """User Registration - Create a new user account."""
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        is_admin=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-login: set session cookie
    response.set_cookie(
        SESSION_COOKIE,
        new_user.email,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7
    )

    return UserOut(
        user_id=new_user.user_id,
        email=new_user.email,
        display_name=new_user.display_name,
        is_admin=new_user.is_admin,
        created_at=new_user.created_at
    )


@router.post("/logout")
def logout(response: Response):
    """User Logout - Clear the session cookie."""
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True, "message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def me(request: Request, db: Session = Depends(get_db)):
    """Get Current User - Retrieve information about the currently logged-in user."""
    return get_current_user(request, db)


@router.get("/google/login")
async def google_login(request: Request):
    """Google OAuth Login - Initiates the Google OAuth flow."""
    if not config.GOOGLE_CLIENT_ID or not config.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )

    redirect_uri = config.GOOGLE_REDIRECT_URI

    oauth.register(
        name='google',
        client_id=config.GOOGLE_CLIENT_ID,
        client_secret=config.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    """Google OAuth Callback - Handles the callback from Google after user authorizes."""
    try:
        oauth.register(
            name='google',
            client_id=config.GOOGLE_CLIENT_ID,
            client_secret=config.GOOGLE_CLIENT_SECRET,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'}
        )

        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")

        email = user_info.get('email')
        display_name = user_info.get('name', email.split('@')[0])

        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            import secrets
            random_password = secrets.token_urlsafe(32)

            user = User(
                email=email,
                password_hash=hash_password(random_password),
                display_name=display_name,
                is_admin=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Set session cookie and redirect to pets page
        response = RedirectResponse(url="http://localhost:5173/pets")
        response.set_cookie(
            SESSION_COOKIE,
            user.email,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7
        )

        return response

    except Exception as e:
        print(f"Google OAuth error: {str(e)}")
        return RedirectResponse(url="http://localhost:5173/login?error=oauth_failed")