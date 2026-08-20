from sqlalchemy.orm import Session

from app.models.submission import Submission
from app.models.response_value import ResponseValue


def get_submissions_by_form_version(
    db: Session,
    form_version_id: int
):
    return (
        db.query(Submission)
        .filter(
            Submission.form_version_id == form_version_id
        )
        .all()
    )


def get_response_values(
    db: Session,
    submission_id: int
):
    return (
        db.query(ResponseValue)
        .filter(
            ResponseValue.submission_id == submission_id
        )
        .all()
    )