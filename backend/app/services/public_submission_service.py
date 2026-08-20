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

    submission = Submission(
        form_version_id=version.id,
        respondent_identifier=respondent_ident or "Anonymous Respondent",
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

    # Dispatch notification for new response
    notif = Notification(
        user_id=target_user_id,
        title="New Response Collected",
        message=f"A new submission (SUB-{submission.id}) was recorded for form '{target_form.title if target_form else 'Published Form'}'.",
        type="response"
    )
    db.add(notif)
    db.commit()

    return {
        "message": "Form submitted successfully",
        "submission_id": submission.id
    }