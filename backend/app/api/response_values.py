from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.response_value_schema import (
    ResponseValueCreate,
    ResponseValueUpdate,
    ResponseValueResponse
)

from app.services.response_value_service import (
    create_new_response_value,
    get_all_response_values,
    get_single_response_value,
    edit_response_value,
    remove_response_value
)

router = APIRouter(
    prefix="/response-values",
    tags=["Response Values"]
)


@router.post(
    "/",
    response_model=ResponseValueResponse
)
def create_response(
    response: ResponseValueCreate,
    db: Session = Depends(get_db)
):
    return create_new_response_value(response, db)


@router.get(
    "/submission/{submission_id}",
    response_model=list[ResponseValueResponse]
)
def read_responses(
    submission_id: int,
    db: Session = Depends(get_db)
):
    return get_all_response_values(
        submission_id,
        db
    )


@router.get(
    "/{response_id}",
    response_model=ResponseValueResponse
)
def read_response(
    response_id: int,
    db: Session = Depends(get_db)
):
    return get_single_response_value(
        response_id,
        db
    )


@router.put(
    "/{response_id}",
    response_model=ResponseValueResponse
)
def update_response(
    response_id: int,
    response: ResponseValueUpdate,
    db: Session = Depends(get_db)
):
    return edit_response_value(
        response_id,
        response,
        db
    )


@router.delete(
    "/{response_id}"
)
def delete_response(
    response_id: int,
    db: Session = Depends(get_db)
):
    return remove_response_value(
        response_id,
        db
    )