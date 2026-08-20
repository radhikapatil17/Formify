from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.field_option_schema import (
    FieldOptionCreate,
    FieldOptionUpdate
)

from app.repositories.field_option_repository import (
    create_option,
    get_options_by_field,
    get_option_by_id,
    update_option,
    delete_option
)


def create_new_option(
    option: FieldOptionCreate,
    db: Session
):
    return create_option(option, db)


def get_options(field_id: int, db: Session):
    return get_options_by_field(db, field_id)


def get_single_option(
    option_id: int,
    db: Session
):
    db_option = get_option_by_id(option_id, db)

    if not db_option:
        raise HTTPException(
            status_code=404,
            detail="Field Option not found"
        )

    return db_option


def edit_option(
    option_id: int,
    option: FieldOptionUpdate,
    db: Session
):
    db_option = get_option_by_id(option_id, db)

    if not db_option:
        raise HTTPException(
            status_code=404,
            detail="Field Option not found"
        )

    return update_option(
        db_option,
        option,
        db
    )


def remove_option(
    option_id: int,
    db: Session
):
    db_option = get_option_by_id(option_id, db)

    if not db_option:
        raise HTTPException(
            status_code=404,
            detail="Field Option not found"
        )

    delete_option(
        db_option,
        db
    )

    return {
        "message": "Field Option deleted successfully"
    }