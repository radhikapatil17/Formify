from sqlalchemy.orm import Session

from app.repositories.dashboard_repository import (
    get_dashboard_summary
)


from app.models.user import User


def dashboard_summary(
    db: Session,
    current_user: User
):
    return get_dashboard_summary(db, current_user)