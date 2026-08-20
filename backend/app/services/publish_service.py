from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.form import Form
from app.repositories.form_version_repository import (
    get_version_by_id,
    publish_form_version,
    unpublish_form_version
)


from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule


def publish_version(
    version_id: int,
    db: Session
):
    db_version = get_version_by_id(version_id, db)

    if not db_version:
        raise HTTPException(
            status_code=404,
            detail="Form Version not found"
        )

    if db_version.is_published:
        raise HTTPException(
            status_code=400,
            detail="Form Version is already published"
        )

    # 1. Validate parent Form title
    form = db.query(Form).filter(Form.id == db_version.form_id).first()
    if not form or not form.title or not form.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Form title is required before publishing"
        )

    # 2. Validate form has at least 1 question
    fields = db.query(Field).filter(Field.form_version_id == db_version.id).all()
    if len(fields) == 0:
        raise HTTPException(
            status_code=400,
            detail="Form must contain at least one question before publishing"
        )

    # 3. Validate question titles/labels & configuration
    choice_types = ["select", "dropdown", "radio", "checkbox", "yes_no", "matrix"]
    valid_field_ids = {f.id for f in fields}

    for idx, f in enumerate(fields, start=1):
        if not f.label or not f.label.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Question #{idx} is missing a title/label"
            )
        if f.field_type in choice_types:
            opts_cnt = db.query(FieldOption).filter(FieldOption.field_id == f.id).count()
            if opts_cnt == 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Choice question '{f.label}' must have at least one option before publishing"
                )

    # 4. Validate conditional logic references
    rules = db.query(ConditionalRule).filter(ConditionalRule.form_version_id == db_version.id).all()
    for r in rules:
        if r.trigger_field_id not in valid_field_ids or r.target_field_id not in valid_field_ids:
            raise HTTPException(
                status_code=400,
                detail="Conditional logic rule contains a broken reference to a deleted question"
            )

    form.status = "published"
    return publish_form_version(db_version, db)


def unpublish_version(
    version_id: int,
    db: Session
):
    db_version = get_version_by_id(version_id, db)

    if not db_version:
        raise HTTPException(
            status_code=404,
            detail="Form Version not found"
        )

    if not db_version.is_published:
        raise HTTPException(
            status_code=400,
            detail="Form Version is already unpublished"
        )

    form = db.query(Form).filter(Form.id == db_version.form_id).first()
    if form:
        form.status = "draft"

    return unpublish_form_version(db_version, db)