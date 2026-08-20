from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate

from app.repositories.user_repository import (
    get_user_by_email,
    create_user
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


def validate_password_strength(password: str):
    """
    Helper to check password strength requirements.
    Raises HTTPException 400 with a user-friendly error message on failure.
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )
    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter"
        )
    if not any(char.islower() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter"
        )
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number"
        )

    special_chars = set('!@#$%^&*()_+-=[]{};:\'",.<>?/\\|~')
    if not any(char in special_chars for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character"
        )


def register_user(user: UserCreate, db: Session):
    """
    Register a new user
    """

    existing_user = get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Perform password strength check
    validate_password_strength(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    return create_user(db, new_user)


def login_user(email: str, password: str, db: Session):
    """
    Authenticate user and return JWT token
    """

    existing_user = get_user_by_email(db, email)

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email,
            "name": existing_user.name,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }