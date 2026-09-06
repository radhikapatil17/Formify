from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.form_draft_schema import (
    SaveDraftRequest,
    SaveDraftResponse,
    ResumeDraftResponse,
    SendResumeEmailRequest
)
from app.services.form_draft_service import (
    save_or_update_draft,
    get_draft_by_token,
    send_resume_link_email
)

router = APIRouter(
    prefix="/public/forms",
    tags=["Public Form Drafts"]
)


@router.post(
    "/{public_link}/draft",
    response_model=SaveDraftResponse
)
def save_draft_endpoint(
    public_link: str,
    draft_data: SaveDraftRequest,
    db: Session = Depends(get_db)
):
    return save_or_update_draft(public_link, draft_data, db)


@router.get(
    "/{public_link}/draft/{resume_token}",
    response_model=ResumeDraftResponse
)
def get_draft_endpoint(
    public_link: str,
    resume_token: str,
    db: Session = Depends(get_db)
):
    return get_draft_by_token(public_link, resume_token, db)


@router.post(
    "/{public_link}/draft-send-email"
)
def send_email_endpoint(
    public_link: str,
    req_data: SendResumeEmailRequest,
    db: Session = Depends(get_db)
):
    return send_resume_link_email(public_link, req_data, db)
