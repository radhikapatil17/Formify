from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.submission_schema import (
    SubmissionCreate,
    SubmissionResponse
)

from app.services.submission_service import (
    create_new_submission,
    get_all_submissions,
    get_single_submission,
    remove_submission
)

from app.api.auth import get_current_user
from app.models.user import User

from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.submission import Submission
from app.models.response_value import ResponseValue

router = APIRouter(
    prefix="/submissions",
    tags=["Submissions"]
)


@router.get("/")
def get_user_submissions_api(
    form_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns user-scoped submissions list with form details and question answers.
    """
    forms_query = db.query(Form).filter(Form.owner_id == current_user.id)
    if form_id:
        forms_query = forms_query.filter(Form.id == form_id)

    user_forms = forms_query.all()
    form_map = {f.id: f.title for f in user_forms}

    if not form_map:
        return []

    version_rows = db.query(FormVersion.id, FormVersion.form_id).filter(FormVersion.form_id.in_(form_map.keys())).all()
    version_to_form = {v[0]: v[1] for v in version_rows}

    if not version_to_form:
        return []

    subs = (
        db.query(Submission)
        .filter(Submission.form_version_id.in_(version_to_form.keys()))
        .order_by(Submission.submitted_at.desc())
        .all()
    )

    result = []
    for sub in subs:
        f_id = version_to_form.get(sub.form_version_id)
        f_title = form_map.get(f_id, "Untitled Form")

        fields = (
            db.query(Field)
            .filter(Field.form_version_id == sub.form_version_id)
            .order_by(Field.field_order, Field.id)
            .all()
        )

        resp_vals = (
            db.query(ResponseValue)
            .filter(ResponseValue.submission_id == sub.id)
            .all()
        )
        val_map = {rv.field_id: rv.value_text for rv in resp_vals}

        answers = []
        for f in fields:
            if f.field_type in ["heading", "description", "section_divider"]:
                continue
            val = val_map.get(f.id, "")
            answers.append({
                "field_id": f.id,
                "label": f.label,
                "field_type": f.field_type,
                "value": val if val is not None else ""
            })

        status_str = "Complete" if sub.status in ["submitted", "Complete"] else "Partial"

        result.append({
            "id": sub.id,
            "subCode": f"SUB-{sub.id}",
            "form_id": f_id,
            "form_title": f_title,
            "form_version_id": sub.form_version_id,
            "respondent": sub.respondent_identifier or "Anonymous Respondent",
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "status": status_str,
            "answers": answers,
        })

    return result


@router.post(
    "/",
    response_model=SubmissionResponse
)
def create_submission_api(
    submission: SubmissionCreate,
    db: Session = Depends(get_db)
):
    return create_new_submission(submission, db)


@router.get(
    "/form-version/{form_version_id}",
    response_model=list[SubmissionResponse]
)
def read_submissions(
    form_version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_all_submissions(form_version_id, db)


@router.get(
    "/{submission_id}",
    response_model=SubmissionResponse
)
def read_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_single_submission(submission_id, db)


@router.delete(
    "/{submission_id}"
)
def delete_submission_api(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return remove_submission(submission_id, db)