from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.public_submission_schema import (
    PublicSubmissionCreate,
    PublicSubmissionResponse
)

from app.services.public_submission_service import (
    submit_public_form
)

router = APIRouter(
    prefix="/public/forms",
    tags=["Public Forms"]
)


@router.post(
    "/{public_link}/submit",
    response_model=PublicSubmissionResponse
)
def submit_form(
    public_link: str,
    submission: PublicSubmissionCreate,
    db: Session = Depends(get_db)
):
    return submit_public_form(
        public_link,
        submission,
        db
    )