from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.field_schema import (
    FieldCreate,
    FieldUpdate,
    FieldResponse
)

from app.services.field_service import (
    create_new_field,
    get_fields,
    get_single_field,
    edit_field,
    remove_field
)

from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/fields",
    tags=["Fields"]
)


@router.post(
    "/",
    response_model=FieldResponse
)
def create_field(
    field: FieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_version_access
    verify_version_access(db, current_user.id, field.form_version_id, required_role="editor")
    return create_new_field(field, db)


@router.get(
    "/form-version/{form_version_id}",
    response_model=list[FieldResponse]
)
def read_fields(
    form_version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_version_access
    verify_version_access(db, current_user.id, form_version_id, required_role="viewer")
    return get_fields(
        form_version_id,
        db
    )


@router.get(
    "/{field_id}",
    response_model=FieldResponse
)
def read_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_field_access
    verify_field_access(db, current_user.id, field_id, required_role="viewer")
    return get_single_field(
        field_id,
        db
    )


@router.put(
    "/{field_id}",
    response_model=FieldResponse
)
def update_field(
    field_id: int,
    field: FieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_field_access
    verify_field_access(db, current_user.id, field_id, required_role="editor")
    return edit_field(
        field_id,
        field,
        db
    )


@router.delete(
    "/{field_id}"
)
def delete_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_field_access
    verify_field_access(db, current_user.id, field_id, required_role="editor")
    return remove_field(
        field_id,
        db
    )