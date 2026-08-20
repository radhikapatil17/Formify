from sqlalchemy.orm import Session

from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.submission import Submission
from app.models.response_value import ResponseValue
from app.schemas.submission_schema import SubmissionCreate


def create_submission(
    submission: SubmissionCreate,
    db: Session
):
    db_submission = Submission(
        form_version_id=submission.form_version_id
    )

    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    return db_submission


def get_submissions(
    form_version_id: int,
    db: Session
):
    return (
        db.query(Submission)
        .filter(
            Submission.form_version_id == form_version_id
        )
        .all()
    )


def get_submission_by_id(
    submission_id: int,
    db: Session
):
    return (
        db.query(Submission)
        .filter(
            Submission.id == submission_id
        )
        .first()
    )


def delete_submission(
    db_submission: Submission,
    db: Session
):
    # First delete associated child response_values to satisfy foreign keys
    db.query(ResponseValue).filter(ResponseValue.submission_id == db_submission.id).delete()
    db.delete(db_submission)
    db.commit()