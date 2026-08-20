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


def create_field(db: Session, field: Field):
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


def get_fields_by_version(db: Session, version_id: int):
    return (
        db.query(Field)
        .filter(Field.form_version_id == version_id)
        .order_by(Field.field_order)
        .all()
    )


def get_field_by_id(db: Session, field_id: int):
    return db.query(Field).filter(Field.id == field_id).first()


def update_field(db: Session):
    db.commit()


def delete_field(db: Session, field: Field):
    db.query(FieldOption).filter(FieldOption.field_id == field.id).delete(synchronize_session=False)
    db.query(ResponseValue).filter(ResponseValue.field_id == field.id).delete(synchronize_session=False)
    db.delete(field)
    db.commit()