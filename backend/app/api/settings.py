import secrets
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.core.security import verify_password, hash_password
from app.models.user import User
from app.models.user_preference import UserPreference

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


class ProfileUpdate(BaseModel):
    name: str
    email: str


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class PreferencesUpdate(BaseModel):
    theme: str = "light"
    language: str = "English"
    timezone: str = "UTC"
    email_alerts: bool = True
    weekly_digest: bool = True
    push_notifications: bool = True
    brand_logo_url: str | None = None
    brand_color: str = "#4F46E5"
    workspace_name: str = "Formify Pro Workspace"
    workspace_subdomain: str = "formify-workspace"
    seat_limit: int = 10


def get_or_create_user_preferences(db: Session, user_id: int) -> UserPreference:
    pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not pref:
        default_api_key = f"fmf_live_{secrets.token_hex(12)}"
        pref = UserPreference(
            user_id=user_id,
            theme="light",
            language="English",
            timezone="UTC",
            email_alerts=True,
            weekly_digest=True,
            push_notifications=True,
            brand_logo_url="https://formify.io/logo.png",
            brand_color="#4F46E5",
            workspace_name="Formify Pro Workspace",
            workspace_subdomain="formify-workspace",
            seat_limit=10,
            api_key=default_api_key
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    elif not pref.api_key:
        pref.api_key = f"fmf_live_{secrets.token_hex(12)}"
        db.commit()
        db.refresh(pref)

    return pref


@router.get("/")
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = get_or_create_user_preferences(db, current_user.id)

    return {
        "profile": {
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "preferences": {
            "theme": pref.theme,
            "language": pref.language,
            "timezone": pref.timezone,
            "email_alerts": pref.email_alerts,
            "weekly_digest": pref.weekly_digest,
            "push_notifications": pref.push_notifications,
            "brand_logo_url": pref.brand_logo_url,
            "brand_color": pref.brand_color,
            "workspace_name": pref.workspace_name,
            "workspace_subdomain": pref.workspace_subdomain,
            "seat_limit": pref.seat_limit,
            "api_key": pref.api_key,
        },
    }


@router.put("/profile")
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clean_name = data.name.strip()
    clean_email = data.email.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email address is required")

    existing_user = db.query(User).filter(User.email == clean_email, User.id != current_user.id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email address is already in use by another account")

    current_user.name = clean_name
    current_user.email = clean_email
    db.commit()
    db.refresh(current_user)

    return {"message": "Profile updated successfully", "name": current_user.name, "email": current_user.email}


@router.put("/password")
def update_password(
    data: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}


@router.put("/preferences")
def update_preferences(
    data: PreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = get_or_create_user_preferences(db, current_user.id)

    pref.theme = data.theme
    pref.language = data.language
    pref.timezone = data.timezone
    pref.email_alerts = data.email_alerts
    pref.weekly_digest = data.weekly_digest
    pref.push_notifications = data.push_notifications
    pref.brand_logo_url = data.brand_logo_url
    pref.brand_color = data.brand_color
    pref.workspace_name = data.workspace_name
    pref.workspace_subdomain = data.workspace_subdomain
    pref.seat_limit = data.seat_limit

    db.commit()
    db.refresh(pref)

    return {
        "message": "Preferences updated successfully",
        "preferences": {
            "theme": pref.theme,
            "language": pref.language,
            "timezone": pref.timezone,
            "email_alerts": pref.email_alerts,
            "weekly_digest": pref.weekly_digest,
            "push_notifications": pref.push_notifications,
            "brand_logo_url": pref.brand_logo_url,
            "brand_color": pref.brand_color,
            "workspace_name": pref.workspace_name,
            "workspace_subdomain": pref.workspace_subdomain,
            "seat_limit": pref.seat_limit,
            "api_key": pref.api_key,
        }
    }


@router.post("/api-key/rotate")
def rotate_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = get_or_create_user_preferences(db, current_user.id)
    new_key = f"fmf_live_{secrets.token_hex(16)}"
    pref.api_key = new_key
    db.commit()
    db.refresh(pref)

    return {"message": "API key rotated successfully", "api_key": new_key}
