import json
import secrets
import smtplib
from email.message import EmailMessage
import os

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.form_draft import FormDraft
from app.models.form import Form
from app.repositories.form_version_repository import (
    get_version_by_public_link
)
from app.schemas.form_draft_schema import (
    SaveDraftRequest,
    SaveDraftResponse,
    ResumeDraftResponse,
    SendResumeEmailRequest
)


def save_or_update_draft(
    public_link: str,
    draft_data: SaveDraftRequest,
    db: Session
) -> SaveDraftResponse:
    version = get_version_by_public_link(db, public_link)
    if not version:
        raise HTTPException(status_code=404, detail="Published form not found")

    draft = None
    if draft_data.resume_token:
        draft = db.query(FormDraft).filter(
            FormDraft.public_link == public_link,
            FormDraft.resume_token == draft_data.resume_token,
            FormDraft.is_submitted == False
        ).first()

    answers_str = json.dumps(draft_data.answers)

    if draft:
        draft.answers_json = answers_str
        draft.current_page = draft_data.current_page or 0
        if draft_data.respondent_email:
            draft.respondent_email = draft_data.respondent_email
        db.commit()
        db.refresh(draft)
    else:
        new_token = secrets.token_urlsafe(24)
        draft = FormDraft(
            public_link=public_link,
            form_version_id=version.id,
            resume_token=new_token,
            respondent_email=draft_data.respondent_email,
            answers_json=answers_str,
            current_page=draft_data.current_page or 0
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)

    saved_time_str = draft.updated_at.strftime("%I:%M %p, %b %d") if draft.updated_at else "Just now"

    frontend_base = os.getenv("FRONTEND_URL", "https://formify-studio.netlify.app").rstrip("/")
    resume_url = f"{frontend_base}/public/forms/{public_link}?resume={draft.resume_token}"

    return SaveDraftResponse(
        resume_token=draft.resume_token,
        resume_url=resume_url,
        saved_at=saved_time_str,
        message="Draft progress saved successfully"
    )


def get_draft_by_token(
    public_link: str,
    resume_token: str,
    db: Session
) -> ResumeDraftResponse:
    draft = db.query(FormDraft).filter(
        FormDraft.public_link == public_link,
        FormDraft.resume_token == resume_token,
        FormDraft.is_submitted == False
    ).first()

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Saved draft not found, expired, or already submitted."
        )

    try:
        answers = json.loads(draft.answers_json)
    except Exception:
        answers = {}

    saved_time_str = draft.updated_at.strftime("%I:%M %p, %b %d") if draft.updated_at else "Just now"

    return ResumeDraftResponse(
        resume_token=draft.resume_token,
        public_link=draft.public_link,
        answers=answers,
        current_page=draft.current_page or 0,
        respondent_email=draft.respondent_email,
        updated_at=saved_time_str
    )


def send_resume_link_email(
    public_link: str,
    req_data: SendResumeEmailRequest,
    db: Session
):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)
    from_name = os.getenv("SMTP_FROM_NAME", "Formify")

    if not (smtp_server and smtp_user and smtp_pass):
        # Return graceful confirmation
        return {
            "message": f"Resume link copied for {req_data.email}. (Email dispatch simulated locally)"
        }

    version = get_version_by_public_link(db, public_link)
    form_title = "Formify Form"
    if version:
        target_form = db.query(Form).filter(Form.id == version.form_id).first()
        if target_form:
            form_title = target_form.title

    msg = EmailMessage()
    msg['Subject'] = f"Resume your progress on '{form_title}'"
    msg['From'] = f"{from_name} <{from_email}>"
    msg['To'] = req_data.email

    msg.set_content(
        f"Hi,\n\n"
        f"You saved your progress on '{form_title}'.\n\n"
        f"Click the link below from any browser or device to resume exactly where you left off:\n\n"
        f"{req_data.resume_url}\n\n"
        f"Your saved progress is securely stored and will remain available until submitted.\n\n"
        f"Best regards,\nFormify Team"
    )

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return {"message": f"Resume link sent successfully to {req_data.email}!"}
    except Exception as e:
        print(f"Error sending email: {e}")
        return {"message": f"Resume link ready for {req_data.email}: {req_data.resume_url}"}
