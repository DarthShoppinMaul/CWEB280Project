"""
File Upload Service
-------------------
Utility functions for handling file uploads, specifically pet photos.
Provides validation, size checking, and safe storage of uploaded images.

Features:
    - File type validation (only JPG/PNG allowed)
    - File size limits (configurable)
    - Automatic filename sanitization
    - Duplicate filename handling
    - Streaming upload to prevent memory issues
"""

import os
import shutil
from fastapi import UploadFile, HTTPException

# Allowed image file extensions
ALLOWED_EXT = {".jpg", ".jpeg", ".png"}


def save_image_or_error(f: UploadFile, upload_dir: str, max_bytes: int) -> str:
    """
    Save Uploaded Image File
    ------------------------
    Validates and saves an uploaded image file to the specified directory.

    Args:
        f: Uploaded file from FastAPI
        upload_dir: Directory path where file should be saved
        max_bytes: Maximum allowed file size in bytes

    Returns:
        str: Relative web path to saved file (e.g., "uploads/image.jpg")

    Raises:
        HTTPException 400: Invalid file type (not JPG/PNG)
        HTTPException 400: File exceeds size limit

    Process:
        1. Validate file extension
        2. Stream file to temporary location
        3. Check size during streaming to avoid memory issues
        4. Handle filename conflicts (add number suffix if needed)
        5. Move to final location
        6. Return web-accessible path

    Example:
        photo_url = save_image_or_error(
            uploaded_file,
            "/app/uploads",
            2 * 1024 * 1024  # 2MB limit
        )
        # Returns: "uploads/dog_photo.jpg"
    """
    # Ensure upload directory exists
    os.makedirs(upload_dir, exist_ok=True)

    # Extract and validate file extension
    name, ext = os.path.splitext(f.filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXT:
        # Consume the file stream before raising error
        _ = f.file.read()
        raise HTTPException(status_code=400, detail="Only JPG/PNG allowed")

    # Write to temporary file while checking size
    tmp = os.path.join(upload_dir, f"tmp_{f.filename}")
    with open(tmp, "wb") as out:
        size = 0
        # Read file in 1MB chunks to prevent memory issues
        chunk = f.file.read(1024 * 1024)
        while chunk:
            size += len(chunk)
            # Check if file exceeds maximum allowed size
            if size > max_bytes:
                out.close()
                # Clean up temporary file
                try:
                    os.remove(tmp)
                except:
                    pass
                # Consume remaining file stream
                while chunk:
                    chunk = f.file.read(1024 * 1024)
                raise HTTPException(status_code=400, detail="File too large")
            out.write(chunk)
            chunk = f.file.read(1024 * 1024)

    # Generate final filename (sanitize spaces)
    final = os.path.join(upload_dir, name.replace(" ", "_") + ext)

    # Handle duplicate filenames by adding numeric suffix
    i = 1
    while os.path.exists(final):
        final = os.path.join(upload_dir, f"{name}_{i}{ext}")
        i += 1

    # Move from temporary to final location
    shutil.move(tmp, final)

    # Return web-accessible path (relative URL)
    # Format: "uploads/filename.jpg" (works on both Windows and Unix)
    return ("uploads/" + os.path.basename(final)).replace("\\", "/")
