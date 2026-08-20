from sqlalchemy.orm import Session

from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.submission import Submission
from app.models.response_value import ResponseValue
from app.models.notification import Notification
from app.schemas.response_value_schema import (
    ResponseValueCreate,
    ResponseValueUpdate
)


def create_response_value(response: ResponseValueCreate, db: Session):
    db_response = ResponseValue(
        submission_id=response.submission_id,
        field_id=response.field_id,
        value=response.value
    )

    db.add(db_response)
    db.commit()
    db.refresh(db_response)

    return db_response


def get_response_values(submission_id: int, db: Session):
    return (
        db.query(ResponseValue)
        .filter(ResponseValue.submission_id == submission_id)
        .all()
    )


def get_response_value_by_id(response_id: int, db: Session):
    return (
        db.query(ResponseValue)
        .filter(ResponseValue.id == response_id)
        .first()
    )


def update_response_value(
    db_response: ResponseValue,
    response: ResponseValueUpdate,
    db: Session
):
    db_response.value = response.value

    db.commit()
    db.refresh(db_response)

    return db_response


def delete_response_value(
    db_response: ResponseValue,
    db: Session
):
    db.delete(db_response)
    db.commit()