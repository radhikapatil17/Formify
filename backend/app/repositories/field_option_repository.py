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
from app.schemas.field_option_schema import (
    FieldOptionCreate,
    FieldOptionUpdate
)


def create_option(option: FieldOptionCreate, db: Session):
    db_option = FieldOption(
        field_id=option.field_id,
        option_text=option.option_text,
        option_order=option.option_order,
    )
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    return db_option


def get_options_by_field(db: Session, field_id: int):
    return (
        db.query(FieldOption)
        .filter(FieldOption.field_id == field_id)
        .order_by(FieldOption.option_order, FieldOption.id)
        .all()
    )


def get_option_by_id(option_id: int, db: Session):
    return db.query(FieldOption).filter(FieldOption.id == option_id).first()


def update_option(db_option: FieldOption, option: FieldOptionUpdate, db: Session):
    db_option.option_text = option.option_text
    if option.option_order is not None:
        db_option.option_order = option.option_order
    db.commit()
    db.refresh(db_option)
    return db_option


def delete_option(db_option: FieldOption, db: Session):
    db.delete(db_option)
    db.commit()