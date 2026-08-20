from datetime import datetime, UTC
import uuid
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
from app.schemas.form_version_schema import (
    FormVersionCreate,
    FormVersionUpdate
)


def create_form_version(
    form_version: FormVersionCreate,
    db: Session
):
    db_version = FormVersion(
        form_id=form_version.form_id,
        version_number=form_version.version_number
    )

    db.add(db_version)
    db.commit()
    db.refresh(db_version)

    return db_version


def get_all_versions(
    form_id: int,
    db: Session
):
    return (
        db.query(FormVersion)
        .filter(FormVersion.form_id == form_id)
        .all()
    )


def get_version_by_id(
    version_id: int,
    db: Session
):
    return (
        db.query(FormVersion)
        .filter(FormVersion.id == version_id)
        .first()
    )


def update_version(
    db_version: FormVersion,
    version: FormVersionUpdate,
    db: Session
):
    db_version.is_published = version.is_published
    db_version.public_link = version.public_link

    if version.is_published:
        db_version.published_at = datetime.now(UTC)

    db.commit()
    db.refresh(db_version)

    return db_version


def delete_version(
    db_version: FormVersion,
    db: Session
):
    db.delete(db_version)
    db.commit()


def publish_form_version(db_version, db):
    db_version.is_published = True
    db_version.published_at = datetime.now(UTC)
    db_version.public_link = str(uuid.uuid4())

    db.commit()
    db.refresh(db_version)

    return db_version


def unpublish_form_version(db_version, db):
    db_version.is_published = False
    db_version.published_at = None
    db_version.public_link = None

    db.commit()
    db.refresh(db_version)

    return db_version


def get_published_form(public_link: str, db):
    return (
        db.query(FormVersion)
        .filter(
            FormVersion.public_link == public_link,
            FormVersion.is_published == True
        )
        .first()
    )


def get_version_by_public_link(
    db,
    public_link: str
):
    return (
        db.query(FormVersion)
        .filter(
            FormVersion.public_link == public_link,
            FormVersion.is_published == True
        )
        .first()
    )