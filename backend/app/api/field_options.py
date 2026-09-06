from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.field_option_schema import (
    FieldOptionCreate,
    FieldOptionUpdate,
    FieldOptionResponse
)

from app.services.field_option_service import (
    create_new_option,
    get_options,
    get_single_option,
    edit_option,
    remove_option
)

from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/field-options",
    tags=["Field Options"]
)


@router.post(
    "/",
    response_model=FieldOptionResponse
)
def create_field_option(
    option: FieldOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_field_access
    verify_field_access(db, current_user.id, option.field_id, required_role="editor")
    return create_new_option(option, db)


@router.get(
    "/field/{field_id}",
    response_model=list[FieldOptionResponse]
)
def read_field_options(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_field_access
    verify_field_access(db, current_user.id, field_id, required_role="viewer")
    return get_options(field_id, db)


@router.get(
    "/{option_id}",
    response_model=FieldOptionResponse
)
def read_field_option(
    option_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_option_access
    verify_option_access(db, current_user.id, option_id, required_role="viewer")
    return get_single_option(option_id, db)


@router.put(
    "/{option_id}",
    response_model=FieldOptionResponse
)
def update_field_option(
    option_id: int,
    option: FieldOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_option_access
    verify_option_access(db, current_user.id, option_id, required_role="editor")
    return edit_option(option_id, option, db)


@router.delete(
    "/{option_id}"
)
def delete_field_option(
    option_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_option_access
    verify_option_access(db, current_user.id, option_id, required_role="editor")
    return remove_option(option_id, db)