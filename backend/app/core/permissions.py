from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.submission import Submission
from app.models.form_collaborator import FormCollaborator

def verify_form_access(db: Session, user_id: int, form_id: int, required_role: str = "viewer") -> Form:
    """
    Check if user_id has required access level on form_id.
    required_role can be: 'viewer', 'editor', or 'owner'.
    Returns the Form object if access is verified, otherwise raises 403 or 404.
    """
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    # Form owner always has full access
    if form.owner_id == user_id:
        return form

    # If owner access is requested, and user is not owner -> reject
    if required_role == "owner":
        raise HTTPException(status_code=403, detail="Access denied. Owner permissions required.")

    # Look up accepted collaborator record
    collab = db.query(FormCollaborator).filter(
        FormCollaborator.form_id == form_id,
        FormCollaborator.user_id == user_id,
        FormCollaborator.status == "accepted"
    ).first()

    if not collab:
        raise HTTPException(status_code=403, detail="Access denied. You are not a collaborator on this form.")

    # Check role permissions:
    # If role required is 'editor', collaborator role must be 'editor'
    if required_role == "editor" and collab.role != "editor":
        raise HTTPException(status_code=403, detail="Access denied. Editor permissions required.")

    return form


def verify_version_access(db: Session, user_id: int, version_id: int, required_role: str = "viewer") -> FormVersion:
    version = db.query(FormVersion).filter(FormVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Form version not found")
    verify_form_access(db, user_id, version.form_id, required_role)
    return version


def verify_field_access(db: Session, user_id: int, field_id: int, required_role: str = "viewer") -> Field:
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    verify_version_access(db, user_id, field.form_version_id, required_role)
    return field


def verify_rule_access(db: Session, user_id: int, rule_id: int, required_role: str = "viewer") -> ConditionalRule:
    rule = db.query(ConditionalRule).filter(ConditionalRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Conditional rule not found")
    verify_version_access(db, user_id, rule.form_version_id, required_role)
    return rule


def verify_option_access(db: Session, user_id: int, option_id: int, required_role: str = "viewer") -> FieldOption:
    option = db.query(FieldOption).filter(FieldOption.id == option_id).first()
    if not option:
        raise HTTPException(status_code=404, detail="Field option not found")
    verify_field_access(db, user_id, option.field_id, required_role)
    return option


def verify_submission_access(db: Session, user_id: int, submission_id: int, required_role: str = "viewer") -> Submission:
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    verify_version_access(db, user_id, submission.form_version_id, required_role)
    return submission
