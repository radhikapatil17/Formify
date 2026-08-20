from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.response_value_schema import (
    ResponseValueCreate,
    ResponseValueUpdate
)

from app.repositories.response_value_repository import (
    create_response_value,
    get_response_values,
    get_response_value_by_id,
    update_response_value,
    delete_response_value
)


def create_new_response_value(
    response: ResponseValueCreate,
    db: Session
):
    return create_response_value(response, db)


def get_all_response_values(
    submission_id: int,
    db: Session
):
    return get_response_values(submission_id, db)


def get_single_response_value(
    response_id: int,
    db: Session
):
    db_response = get_response_value_by_id(response_id, db)

    if not db_response:
        raise HTTPException(
            status_code=404,
            detail="Response Value not found"
        )

    return db_response


def edit_response_value(
    response_id: int,
    response: ResponseValueUpdate,
    db: Session
):
    db_response = get_response_value_by_id(response_id, db)

    if not db_response:
        raise HTTPException(
            status_code=404,
            detail="Response Value not found"
        )

    return update_response_value(
        db_response,
        response,
        db
    )


def remove_response_value(
    response_id: int,
    db: Session
):
    db_response = get_response_value_by_id(response_id, db)

    if not db_response:
        raise HTTPException(
            status_code=404,
            detail="Response Value not found"
        )

    delete_response_value(db_response, db)

    return {
        "message": "Response Value deleted successfully"
    }