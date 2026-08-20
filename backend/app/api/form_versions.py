from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.form_version_schema import (
    FormVersionCreate,
    FormVersionUpdate,
    FormVersionResponse
)

from app.services.form_version_service import (
    create_new_version,
    get_versions,
    get_single_version,
    edit_version,
    remove_version
)

from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/form-versions",
    tags=["Form Versions"]
)


@router.post(
    "/",
    response_model=FormVersionResponse
)
def create_version(
    version: FormVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_new_version(version, db)


@router.get(
    "/form/{form_id}",
    response_model=list[FormVersionResponse]
)
def read_versions(
    form_id: int,
    db: Session = Depends(get_db)
):
    return get_versions(
        form_id,
        db
    )


@router.get(
    "/{version_id}",
    response_model=FormVersionResponse
)
def read_version(
    version_id: int,
    db: Session = Depends(get_db)
):
    return get_single_version(
        version_id,
        db
    )


@router.put(
    "/{version_id}",
    response_model=FormVersionResponse
)
def update_version_api(
    version_id: int,
    version: FormVersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return edit_version(
        version_id,
        version,
        db
    )


@router.delete(
    "/{version_id}"
)
def delete_version_api(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return remove_version(
        version_id,
        db
    )