from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.form_version_schema import (
    FormVersionCreate,
    FormVersionUpdate
)

from app.repositories.form_version_repository import (
    create_form_version,
    get_all_versions,
    get_version_by_id,
    update_version,
    delete_version
)


def create_new_version(
    version: FormVersionCreate,
    db: Session
):
    return create_form_version(version, db)


def get_versions(
    form_id: int,
    db: Session
):
    return get_all_versions(form_id, db)


def get_single_version(
    version_id: int,
    db: Session
):
    db_version = get_version_by_id(version_id, db)

    if not db_version:
        raise HTTPException(
            status_code=404,
            detail="Form Version not found"
        )

    return db_version


def edit_version(
    version_id: int,
    version: FormVersionUpdate,
    db: Session
):
    db_version = get_version_by_id(version_id, db)

    if not db_version:
        raise HTTPException(
            status_code=404,
            detail="Form Version not found"
        )

    return update_version(
        db_version,
        version,
        db
    )


def remove_version(
    version_id: int,
    db: Session
):
    db_version = get_version_by_id(version_id, db)

    if not db_version:
        raise HTTPException(
            status_code=404,
            detail="Form Version not found"
        )

    delete_version(
        db_version,
        db
    )

    return {
        "message": "Form Version deleted successfully"
    }