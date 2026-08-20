from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.api.auth import get_current_user
from app.models.user import User

from app.schemas.dashboard_schema import (
    DashboardSummary
)

from app.services.dashboard_service import (
    dashboard_summary
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/summary",
    response_model=DashboardSummary
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return dashboard_summary(db, current_user)