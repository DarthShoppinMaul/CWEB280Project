"""
Authentication Endpoints
------------------------
API endpoints for user authentication (login, logout, registration, Google OAuth).
Handles session management using HTTP cookies and password hashing for security.

Routes:
    - POST /auth/login: User login
    - POST /auth/logout: User logout
    - POST /auth/register: New user registration
    - GET /auth/me: Get current user info
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
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password as a string

    Note:
        bcrypt automatically handles salt generation and is designed to be slow
        to prevent brute-force attacks.
    """
    # Convert password to bytes and hash it
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Password entered by user
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Get the currently authenticated user from session cookie.

    Args:
        request: FastAPI request object
        db: Database session

    Returns:
        User object if authenticated

    Raises:
        HTTPException 401: If not authenticated or user not found
    """
    email = request.cookies.get(SESSION_COOKIE)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_auth(request: Request):
    """
    Dependency to require authentication.
    Use this to protect routes that require a logged-in user.

    Raises:
        HTTPException 401: If user is not logged in
    """
    if not request.cookies.get(SESSION_COOKIE):
        raise HTTPException(status_code=401, detail="Login required")


@router.post("/login", response_model=UserOut)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    User Login
    ----------
    Authenticate a user with email and password.

    Process:
        1. Look up user by email
        2. Verify password hash
        3. Set session cookie
        4. Return user info

    Args:
        data: Login credentials (email and password)
        response: FastAPI response object (to set cookie)
        db: Database session

    Returns:
        User object with email, display_name, is_admin

    Raises:
        HTTPException 401: Invalid credentials

    Security:
        - Passwords are never stored in plain text
        - Uses bcrypt for password hashing
        - Session maintained via HTTP-only cookie
    """
    # Find user by email
    user = db.query(User).filter(User.email == data.email).first()

    # Check if user exists and password is correct
    if not user or not verify_password(data.password, user.password_hash):
        # Generic error message to prevent email enumeration
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Set session cookie (httponly prevents JavaScript access for security)
    response.set_cookie(
        SESSION_COOKIE,
        user.email,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7  # 7 days
    )

    # Return user info (password is never sent to client)
    return UserOut(
        user_id=user.user_id,
        email=user.email,
        display_name=user.display_name,
        is_admin=user.is_admin,
        created_at=user.created_at
    )


@router.post("/register", response_model=UserOut)
def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """
    User Registration
    -----------------
    Create a new user account.

    Process:
        1. Check if email is already registered
        2. Hash the password
        3. Create user in database
        4. Set session cookie (auto-login)
        5. Return user info

    Args:
        data: Registration information (email, password, display_name)
        response: FastAPI response object (to set cookie)
        db: Database session

    Returns:
        Created user object

    Raises:
        HTTPException 400: Email already registered

    Note:
        New users are created as regular users (not admins).
        Only existing admins can create admin accounts.
    """
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with hashed password
    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        is_admin=False  # New registrations are never admin
    )

    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-login: set session cookie
    response.set_cookie(
        SESSION_COOKIE,
        new_user.email,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7  # 7 days
    )

    # Return user info
    return UserOut(
        user_id=new_user.user_id,
        email=new_user.email,
        display_name=new_user.display_name,
        is_admin=new_user.is_admin,
        created_at=new_user.created_at
    )


@router.post("/logout")
def logout(response: Response):
    """
    User Logout
    -----------
    Clear the session cookie to log out the user.

    Args:
        response: FastAPI response object

    Returns:
        Success message

    Note:
        This only clears the cookie. The user's account remains in the database.
    """
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True, "message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def me(request: Request, db: Session = Depends(get_db)):
    """
    Get Current User
    ----------------
    Retrieve information about the currently logged-in user.

    Args:
        request: FastAPI request object (to read cookie)
        db: Database session

    Returns:
        Current user object

    Raises:
        HTTPException 401: Not authenticated

    Use Case:
        Frontend calls this on page load to check if user is logged in
        and to get user information (name, admin status, etc.)
    """
    return get_current_user(request, db)


@router.get("/google/login")
async def google_login(request: Request):
    """
    Google OAuth Login
    ------------------
    Initiates the Google OAuth flow by redirecting to Google's login page.

    Returns:
        Redirect response to Google OAuth consent screen
    """
    # Check if Google OAuth is configured
    if not config.GOOGLE_CLIENT_ID or not config.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )

    # Generate the redirect URI for Google OAuth callback
    redirect_uri = config.GOOGLE_REDIRECT_URI

    # Re-register Google OAuth with current config values (fix for empty values at startup)
    oauth.register(
        name='google',
        client_id=config.GOOGLE_CLIENT_ID,
        client_secret=config.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

    # Redirect user to Google's OAuth consent screen
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Google OAuth Callback
    ---------------------
    Handles the callback from Google after user authorizes the application.

    Process:
        1. Exchange authorization code for access token
        2. Get user info from Google
        3. Check if user exists in database
        4. Create new user if doesn't exist
        5. Set session cookie
        6. Redirect to application

    Returns:
        Redirect to frontend application with user logged in
    """
    try:
        # Re-register Google OAuth with current config values (fix for empty values at startup)
        oauth.register(
            name='google',
            client_id=config.GOOGLE_CLIENT_ID,
            client_secret=config.GOOGLE_CLIENT_SECRET,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'}
        )

        # Exchange authorization code for access token and get user info
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")

        email = user_info.get('email')
        display_name = user_info.get('name', email.split('@')[0])

        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        # Create new user if doesn't exist
        if not user:
            # Generate a random password hash (user won't use it for Google login)
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

        # Set session cookie
        response = RedirectResponse(url="http://localhost:5173/pets")
        response.set_cookie(
            SESSION_COOKIE,
            user.email,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7  # 7 days
        )

        return response

    except Exception as e:
        print(f"Google OAuth error: {str(e)}")
        # Redirect to login page with error
        return RedirectResponse(url="http://localhost:5173/login?error=oauth_failed")


