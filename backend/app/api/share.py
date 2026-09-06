from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.form import Form
from app.schemas.share_schema import EmailShareRequest, EmailShareResponse
from app.services.email_service import send_form_email_invitation

router = APIRouter(
    prefix="/share",
    tags=["Share"]
)

@router.post("/email", response_model=EmailShareResponse)
def share_form_via_email(
    payload: EmailShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify form exists
    form = db.query(Form).filter(Form.id == payload.form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form #{payload.form_id} not found."
        )

    # 2. Determine public URL
    frontend_base = os.getenv("FRONTEND_URL", "https://formify-studio.netlify.app").rstrip("/")
    public_url = payload.public_url or f"{frontend_base}/public/form/{form.id}"

    # 3. Dispatch Email
    try:
        result = send_form_email_invitation(
            recipient_email=payload.recipient_email,
            subject=payload.subject,
            form_title=form.title,
            public_url=public_url,
            custom_message=payload.custom_message,
            sender_name=current_user.name or current_user.email
        )
        return EmailShareResponse(**result)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(re)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email invitation: {str(err)}"
        )
