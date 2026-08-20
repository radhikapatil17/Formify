from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.form_schema import (
    FormCreate,
    FormUpdate,
    FormResponse
)

from app.services.form_service import (
    create_new_form,
    duplicate_existing_form,
    get_forms,
    get_single_form,
    edit_form,
    remove_form
)

from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/forms",
    tags=["Forms"]
)


@router.post(
    "/",
    response_model=FormResponse
)
def create_form(
    form: FormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_new_form(
        form,
        current_user,
        db
    )


@router.post(
    "/{form_id}/duplicate",
    response_model=FormResponse
)
def duplicate_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return duplicate_existing_form(
        form_id,
        current_user,
        db
    )


@router.get(
    "/",
    response_model=list[FormResponse]
)
def read_forms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_forms(db, current_user)


@router.get(
    "/{form_id}",
    response_model=FormResponse
)
def read_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_single_form(
        form_id,
        db
    )


@router.put(
    "/{form_id}",
    response_model=FormResponse
)
def update_form(
    form_id: int,
    form: FormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return edit_form(
        form_id,
        form,
        current_user,
        db
    )


@router.delete(
    "/{form_id}"
)
def delete_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return remove_form(
        form_id,
        current_user,
        db
    )