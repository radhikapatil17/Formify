from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.services.export_service import export_csv

router = APIRouter(
    prefix="/export",
    tags=["Export"]
)


@router.get(
    "/form-version/{version_id}/csv"
)
def export_form_csv(
    version_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return export_csv(
        version_id,
        db,
        background_tasks
    )