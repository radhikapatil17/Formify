from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.public_form_schema import (
    PublicFormResponse
)

from app.services.public_form_service import (
    get_public_form
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
    return get_public_form(
        public_link,
        db
    )