from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.submission import Submission
from app.models.response_value import ResponseValue
from app.models.notification import Notification

from app.repositories.form_version_repository import (
    get_version_by_public_link
)

from app.schemas.public_submission_schema import (
    PublicSubmissionCreate
)


def submit_public_form(
    public_link: str,
    submission_data: PublicSubmissionCreate,
    db: Session
):
    version = get_version_by_public_link(
        db,
        public_link
    )

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Published form not found"
        )

    # Validate Form Schedule Status
    form = db.query(Form).filter(Form.id == version.form_id).first()
    if form:
        from app.services.public_form_service import evaluate_form_schedule, evaluate_response_limit
        schedule_eval = evaluate_form_schedule(form)
        if not schedule_eval["is_active"]:
            raise HTTPException(
                status_code=400,
                detail=schedule_eval["message"] or "This form is not currently accepting responses."
            )

        # Validate Response Limit
        limit_eval = evaluate_response_limit(form, db)
        if limit_eval["is_limit_reached"]:
            raise HTTPException(
                status_code=400,
                detail=limit_eval["message"] or "This form has reached its maximum response limit and is no longer accepting responses."
            )

        # Validate Micro-Verification Gate if required
        if form.require_verification_to_submit:
            tokens = submission_data.verification_tokens or []
            from app.models.form_verification import FormVerification
            valid_count = (
                db.query(FormVerification)
                .filter(
                    FormVerification.form_id == form.id,
                    FormVerification.session_token.in_(tokens),
                    FormVerification.is_verified == True
                )
                .count()
            ) if tokens else 0

            if valid_count == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Form submission blocked. Email or Phone verification is required before submitting."
                )

    # Extract respondent identifier if email or name field is present
    respondent_ident = None
    if submission_data.responses:
        field_ids = [r.field_id for r in submission_data.responses]
        fields = db.query(Field).filter(Field.id.in_(field_ids)).all()
        field_map = {f.id: f for f in fields}

        for resp in submission_data.responses:
            f_obj = field_map.get(resp.field_id)
            if f_obj and resp.value:
                if f_obj.field_type in ["email", "text"] and ("email" in f_obj.label.lower() or "name" in f_obj.label.lower()):
                    respondent_ident = resp.value
                    break

    if submission_data.client_id:
        existing = db.query(Submission).filter(
            Submission.form_version_id == version.id,
            Submission.client_id == submission_data.client_id
        ).first()
        if existing:
            if submission_data.resume_token:
                from app.models.form_draft import FormDraft
                draft = db.query(FormDraft).filter(
                    FormDraft.public_link == public_link,
                    FormDraft.resume_token == submission_data.resume_token
                ).first()
                if draft:
                    draft.is_submitted = True
                    db.commit()
            return {
                "message": "Form submitted successfully (already synced)",
                "submission_id": existing.id
            }

    submission = Submission(
        form_version_id=version.id,
        respondent_identifier=respondent_ident or "Anonymous Respondent",
        client_id=submission_data.client_id,
        status="submitted"
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    valid_version_field_ids = {
        f.id for f in db.query(Field.id).filter(Field.form_version_id == version.id).all()
    }

    for response in submission_data.responses:
        if response.field_id in valid_version_field_ids:
            response_value = ResponseValue(
                submission_id=submission.id,
                field_id=response.field_id,
                value_text=response.value or ""
            )
            db.add(response_value)

    db.commit()

    # Find form owner to assign notification
    target_user_id = None
    target_form = db.query(Form).filter(Form.id == version.form_id).first()
    if target_form:
        target_user_id = target_form.owner_id

    # Archive draft if resume_token was provided
    if submission_data.resume_token:
        from app.models.form_draft import FormDraft
        draft = db.query(FormDraft).filter(
            FormDraft.public_link == public_link,
            FormDraft.resume_token == submission_data.resume_token
        ).first()
        if draft:
            draft.is_submitted = True
            db.commit()

    return {
        "message": "Form submitted successfully",
        "submission_id": submission.id
    }