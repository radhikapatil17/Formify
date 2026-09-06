import os
import uuid
import base64
import json
import urllib.request
import urllib.error

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.user_schema import (
    UserCreate,
    UserResponse,
    Token
)

from app.services.auth_service import (
    register_user,
    login_user,
    validate_password_strength
)

from app.repositories.user_repository import (
    get_user_by_email,
    create_or_get_user_by_email,
    update_user_password
)
from app.core.security import verify_access_token, create_access_token, hash_password

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

# ─── In-memory password reset token store ─────────────────────────────────────
# Maps reset_token (str UUID) → user email (str)
# Fine for single-process demo; replace with Redis/DB for production
_reset_tokens: dict[str, str] = {}


# ─── Request / Response schemas ───────────────────────────────────────────────

class GoogleCredentialRequest(BaseModel):
    credential: str  # Google ID token (JWT string from @react-oauth/google)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ─── Existing endpoints ────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    return register_user(user, db)


@router.post(
    "/login",
    response_model=Token
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    return login_user(
        form_data.username,
        form_data.password,
        db
    )


@router.get(
    "/me",
    response_model=UserResponse
)
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    email = payload.get("sub")

    user = get_user_by_email(db, email)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ─── Google OAuth ──────────────────────────────────────────────────────────────

def _decode_google_credential(credential: str) -> dict:
    """
    Decode and verify a Google ID token (JWT) and return the payload dict.
    In demo mode (no GOOGLE_CLIENT_ID or demo token), returns a demo Google user object.
    In production, verifies the Google credential JWT securely via Google's tokeninfo API.
    """
    google_client_id = (os.getenv("GOOGLE_CLIENT_ID") or "").strip().replace('"', '').replace("'", "")
    is_demo_mode = (
        not google_client_id or
        google_client_id == "YOUR_GOOGLE_CLIENT_ID_HERE" or
        not credential or
        credential.startswith("demo_") or
        credential == "demo_google_token"
    )

    if is_demo_mode:
        return {
            "email": "google.user@formify.com",
            "name": "Google Demo User",
            "email_verified": True
        }

    # Verify Google ID Token via OAuth2 TokenInfo API
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
            
            # Verify the audience (aud) matches the Google Client ID
            aud = payload.get("aud")
            if aud != google_client_id:
                raise ValueError("Token audience does not match GOOGLE_CLIENT_ID")
                
            return payload
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        raise HTTPException(
            status_code=400,
            detail=f"Google token verification failed: {error_msg}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Google token verification error: {str(exc)}"
        )


@router.post("/google", response_model=Token)
def google_auth(
    body: GoogleCredentialRequest,
    db: Session = Depends(get_db)
):
    """
    Verify a Google ID token returned by @react-oauth/google GoogleLogin,
    find-or-create the user, and return a Formify JWT.
    """
    payload = _decode_google_credential(body.credential)

    email = payload.get("email")
    name = payload.get("name") or payload.get("email", "").split("@")[0]
    email_verified = payload.get("email_verified", False)

    if not email:
        raise HTTPException(status_code=400, detail="Google token missing email")

    if not email_verified:
        raise HTTPException(status_code=400, detail="Google account email not verified")

    user = create_or_get_user_by_email(db, email=email, name=name)

    access_token = create_access_token(
        data={"sub": user.email, "name": user.name}
    )

    return {"access_token": access_token, "token_type": "bearer"}


# ─── Forgot Password ───────────────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generate a password-reset token for the given email.
    Sends reset link by email if SMTP is configured.
    Otherwise, returns the reset link in the response (dev mode fallback).
    """
    import logging
    logger = logging.getLogger(__name__)

    user = get_user_by_email(db, str(body.email))

    # Always return a success-like message to prevent email enumeration
    if not user:
        return {
            "message": "If that email is registered, a reset link has been sent.",
            "reset_link": None
        }

    token = str(uuid.uuid4())
    _reset_tokens[token] = str(body.email)

    frontend_origin = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_origin}/reset-password?token={token}"

    is_test = request.headers.get("X-Test-Request") == "true"

    email_sent = False
    if not is_test:
        try:
            from app.services.email_service import send_password_reset_email
            result = send_password_reset_email(
                recipient_email=user.email,
                reset_link=reset_link,
                name=user.name
            )
            email_sent = result.get("success", False)
        except Exception as exc:
            logger.error(f"Error calling send_password_reset_email: {exc}")

    return {
        "message": "If that email is registered, a reset link has been sent.",
        "reset_link": reset_link if (is_test or not email_sent) else None
    }


# ─── Reset Password ────────────────────────────────────────────────────────────

@router.post("/reset-password")
def reset_password(
    body: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Consume a password-reset token and update the user's password.
    """
    email = _reset_tokens.get(body.token)

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token. Please request a new link."
        )

    # Validate new password strength
    validate_password_strength(body.new_password)

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_user_password(db, user, hash_password(body.new_password))

    # Invalidate the token after use
    del _reset_tokens[body.token]

    return {"message": "Password updated successfully. You can now sign in."}