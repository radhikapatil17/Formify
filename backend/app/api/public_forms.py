from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.public_form_schema import (
    PublicFormResponse,
    PasswordVerifyRequest
)

from app.services.public_form_service import (
    get_public_form,
    verify_form_password
)

router = APIRouter(
    prefix="/public/forms",
    tags=["Public Forms"]
)


@router.get(
    "/{public_link}",
    response_model=PublicFormResponse
)
def read_public_form(
    public_link: str,
    db: Session = Depends(get_db)
):
    """Fetch public form schema.

    If the form is password-protected, returns a locked shell with empty fields.
    The caller must POST to /verify-password to unlock the full form data.
    """
    return get_public_form(public_link, db)


@router.post(
    "/{public_link}/verify-password",
    response_model=PublicFormResponse
)
def verify_public_form_password(
    public_link: str,
    body: PasswordVerifyRequest,
    db: Session = Depends(get_db)
):
    """Verify the password for a password-protected public form.

    Returns full form data (fields, rules, schedule) on success.
    Returns HTTP 401 if the password is incorrect.
    The stored password hash is never exposed in the response.
    """
    return verify_form_password(public_link, body.password, db)