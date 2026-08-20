from sqlalchemy.orm import Session

from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.submission import Submission
from app.models.response_value import ResponseValue
from app.models.notification import Notification


def create_form(db: Session, form: Form):
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


def get_all_forms(db: Session, owner_id: int):
    return db.query(Form).filter(Form.owner_id == owner_id).all()


def get_form_by_id(db: Session, form_id: int):
    return db.query(Form).filter(Form.id == form_id).first()


def update_form(db: Session):
    db.commit()


def delete_form(db: Session, form: Form):
    # Unlink latest_version_id to break circular foreign key dependency
    form.latest_version_id = None
    db.flush()

    versions = db.query(FormVersion).filter(FormVersion.form_id == form.id).all()
    version_ids = [v.id for v in versions]

    if version_ids:
        submissions = db.query(Submission).filter(Submission.form_version_id.in_(version_ids)).all()
        submission_ids = [s.id for s in submissions]

        fields = db.query(Field).filter(Field.form_version_id.in_(version_ids)).all()
        field_ids = [f.id for f in fields]

        if submission_ids:
            db.query(ResponseValue).filter(ResponseValue.submission_id.in_(submission_ids)).delete(synchronize_session=False)
        if field_ids:
            db.query(ResponseValue).filter(ResponseValue.field_id.in_(field_ids)).delete(synchronize_session=False)

        if submission_ids:
            db.query(Submission).filter(Submission.id.in_(submission_ids)).delete(synchronize_session=False)

        if field_ids:
            db.query(FieldOption).filter(FieldOption.field_id.in_(field_ids)).delete(synchronize_session=False)

        db.query(ConditionalRule).filter(ConditionalRule.form_version_id.in_(version_ids)).delete(synchronize_session=False)

        if field_ids:
            db.query(Field).filter(Field.id.in_(field_ids)).delete(synchronize_session=False)

        db.query(FormVersion).filter(FormVersion.form_id == form.id).delete(synchronize_session=False)

    db.delete(form)
    db.commit()