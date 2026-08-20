from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: User):
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_password(db: Session, user: User, hashed_password: str):
    user.password_hash = hashed_password
    db.commit()
    db.refresh(user)
    return user


def create_or_get_user_by_email(db: Session, email: str, name: str) -> User:
    """Find existing user or create a new one (used for OAuth logins)."""
    user = get_user_by_email(db, email)
    if user:
        return user
    # Create a new OAuth user with no password hash (cannot log in with password)
    new_user = User(name=name, email=email, password_hash="")
    return create_user(db, new_user)