from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.submission import Submission
from app.models.response_value import ResponseValue
from app.schemas.submission_schema import SubmissionCreate
from app.repositories.submission_repository import (
    create_submission,
    get_submissions,
    get_submission_by_id,
    delete_submission
)


def create_new_submission(
    submission: SubmissionCreate,
    db: Session
):
    return create_submission(submission, db)


def get_all_submissions(
    form_version_id: int,
    db: Session
):
    return get_submissions(form_version_id, db)


def get_single_submission(
    submission_id: int,
    db: Session
):
    db_submission = get_submission_by_id(submission_id, db)

    if not db_submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found"
        )

    return db_submission


def remove_submission(
    submission_id: int,
    db: Session
):
    db_submission = get_submission_by_id(submission_id, db)

    if not db_submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found"
        )

    delete_submission(db_submission, db)

    return {
        "message": "Submission deleted successfully"
    }