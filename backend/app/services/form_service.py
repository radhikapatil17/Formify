from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.security import hash_password

from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.submission import Submission
from app.models.user import User
from app.models.form_collaborator import FormCollaborator

from app.schemas.form_schema import (
    FormCreate,
    FormUpdate,
    FormResponse
)

from app.repositories.form_repository import (
    create_form,
    get_all_forms,
    get_form_by_id,
    update_form,
    delete_form
)


def _build_form_response(f: Form, db: Session, current_user_id: int | None = None) -> FormResponse:
    versions = db.query(FormVersion).filter(FormVersion.form_id == f.id).all()
    published_ver = next((v for v in versions if v.is_published), None)
    latest_ver = max(versions, key=lambda v: v.version_number) if versions else None

    subs_cnt = 0
    fields_cnt = 0
    latest_ver_id = None
    pub_link = published_ver.public_link if published_ver else None

    if latest_ver:
        latest_ver_id = latest_ver.id
        subs_cnt = db.query(Submission).filter(Submission.form_version_id == latest_ver.id).count()
        fields_cnt = db.query(Field).filter(Field.form_version_id == latest_ver.id).count()

    owner = db.query(User).filter(User.id == f.owner_id).first()
    owner_email = owner.email if owner else None
    owner_name = owner.name if owner else (owner.email if owner else f"User #{f.owner_id}")

    # Determine user role
    role = None
    if current_user_id is not None:
        if f.owner_id == current_user_id:
            role = "owner"
        else:
            collab = db.query(FormCollaborator).filter(
                FormCollaborator.form_id == f.id,
                FormCollaborator.user_id == current_user_id,
                FormCollaborator.status == "accepted"
            ).first()
            if collab:
                role = collab.role

    return FormResponse(
        id=f.id,
        title=f.title,
        description=f.description,
        category=getattr(f, "category", "General") or "General",
        status=f.status or ("published" if published_ver else "draft"),
        theme_config=getattr(f, "theme_config", None),
        is_scheduling_enabled=getattr(f, "is_scheduling_enabled", False) or False,
        schedule_start_time=getattr(f, "schedule_start_time", None),
        schedule_end_time=getattr(f, "schedule_end_time", None),
        is_response_limit_enabled=getattr(f, "is_response_limit_enabled", False) or False,
        max_response_limit=getattr(f, "max_response_limit", None),
        is_password_protected=getattr(f, "is_password_protected", False) or False,
        is_email_otp_enabled=getattr(f, "is_email_otp_enabled", False) or False,
        is_phone_otp_enabled=getattr(f, "is_phone_otp_enabled", False) or False,
        otp_expiry_minutes=getattr(f, "otp_expiry_minutes", 10) or 10,
        max_otp_attempts=getattr(f, "max_otp_attempts", 3) or 3,
        otp_cooldown_seconds=getattr(f, "otp_cooldown_seconds", 60) or 60,
        require_verification_to_submit=getattr(f, "require_verification_to_submit", False) or False,
        owner_id=f.owner_id,
        owner_email=owner_email,
        owner_name=owner_name,
        created_at=f.created_at,
        updated_at=f.updated_at,
        submissions_count=subs_cnt,
        fields_count=fields_cnt,
        public_link=pub_link,
        latest_version_id=latest_ver_id,
        user_role=role,
    )


def create_new_form(
    form: FormCreate,
    current_user: User,
    db: Session
):
    new_form = Form(
        title=form.title,
        description=form.description,
        category=form.category or "General",
        status="draft",
        owner_id=current_user.id
    )

    saved = create_form(db, new_form)

    # Automatically initialize Version 1 for new form
    initial_version = FormVersion(
        form_id=saved.id,
        version_number=1,
        is_published=False
    )
    db.add(initial_version)
    db.commit()
    db.refresh(saved)

    return _build_form_response(saved, db, current_user.id)


def duplicate_existing_form(
    form_id: int,
    current_user: User,
    db: Session
):
    from app.core.permissions import verify_form_access
    source_form = verify_form_access(db, current_user.id, form_id, required_role="viewer")

    new_form = Form(
        title=f"{source_form.title} (Copy)",
        description=source_form.description or "",
        category=getattr(source_form, "category", "General") or "General",
        status="draft",
        owner_id=current_user.id
    )
    saved_form = create_form(db, new_form)

    new_version = FormVersion(
        form_id=saved_form.id,
        version_number=1,
        is_published=False
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    source_versions = db.query(FormVersion).filter(FormVersion.form_id == source_form.id).all()
    source_version = max(source_versions, key=lambda v: v.version_number) if source_versions else None

    if source_version:
        source_fields = db.query(Field).filter(Field.form_version_id == source_version.id).order_by(Field.field_order).all()
        field_id_map = {}

        for sf in source_fields:
            new_field = Field(
                form_version_id=new_version.id,
                label=sf.label,
                field_type=sf.field_type,
                placeholder=sf.placeholder or "",
                is_required=sf.is_required,
                field_order=sf.field_order,
                help_text=sf.help_text,
                description=sf.description,
                is_read_only=sf.is_read_only,
                is_hidden=sf.is_hidden,
                default_value=sf.default_value,
                width=sf.width,
                label_position=sf.label_position,
                show_placeholder=sf.show_placeholder if hasattr(sf, 'show_placeholder') else True,
                min_length=sf.min_length,
                max_length=sf.max_length,
                regex_pattern=sf.regex_pattern,
                validation_message=sf.validation_message,
                shuffle_options=sf.shuffle_options,
                allow_other=sf.allow_other,
                allow_multiple=sf.allow_multiple,
                max_selections=sf.max_selections,
                allowed_file_types=sf.allowed_file_types,
                max_file_size_mb=sf.max_file_size_mb,
                max_files=sf.max_files,
            )
            db.add(new_field)
            db.commit()
            db.refresh(new_field)
            field_id_map[sf.id] = new_field.id

            sf_opts = db.query(FieldOption).filter(FieldOption.field_id == sf.id).all()
            for opt in sf_opts:
                new_opt = FieldOption(
                    field_id=new_field.id,
                    option_text=opt.option_text,
                    option_order=opt.option_order
                )
                db.add(new_opt)

        source_rules = db.query(ConditionalRule).filter(ConditionalRule.form_version_id == source_version.id).all()
        for sr in source_rules:
            new_trigger = field_id_map.get(sr.trigger_field_id)
            new_target = field_id_map.get(sr.target_field_id)
            new_rule = ConditionalRule(
                form_version_id=new_version.id,
                trigger_field_id=new_trigger,
                operator=sr.operator,
                comparison_value=sr.comparison_value,
                target_field_id=new_target or 0,
                action=sr.action,
                logic_operator=sr.logic_operator or "AND",
                conditions_json=sr.conditions_json,
                rule_order=sr.rule_order or 0
            )
            db.add(new_rule)
        db.commit()

    return _build_form_response(saved_form, db, current_user.id)


def get_forms(db: Session, current_user: User):
    collabs = db.query(FormCollaborator.form_id).filter(
        FormCollaborator.user_id == current_user.id,
        FormCollaborator.status == "accepted"
    ).all()
    collaborator_form_ids = [c[0] for c in collabs]
    forms = db.query(Form).filter(
        (Form.owner_id == current_user.id) | (Form.id.in_(collaborator_form_ids))
    ).all()
    return [_build_form_response(f, db, current_user.id) for f in forms]


def get_single_form(
    form_id: int,
    db: Session,
    current_user_id: int | None = None
):
    if current_user_id is not None:
        from app.core.permissions import verify_form_access
        form = verify_form_access(db, current_user_id, form_id, required_role="viewer")
    else:
        form = get_form_by_id(db, form_id)

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    return _build_form_response(form, db, current_user_id)


def edit_form(
    form_id: int,
    form_data: FormUpdate,
    current_user: User,
    db: Session
):
    from app.core.permissions import verify_form_access
    form = verify_form_access(db, current_user.id, form_id, required_role="editor")

    if form_data.title is not None:
        if not form_data.title.strip():
            raise HTTPException(
                status_code=400,
                detail="Form title cannot be empty"
            )
        form.title = form_data.title

    if form_data.description is not None:
        form.description = form_data.description

    if form_data.category is not None:
        form.category = form_data.category

    if form_data.status is not None:
        if form_data.status not in ["draft", "published", "archived"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid form status"
            )
        form.status = form_data.status

    if form_data.theme_config is not None:
        form.theme_config = form_data.theme_config

    if form_data.is_scheduling_enabled is not None:
        form.is_scheduling_enabled = form_data.is_scheduling_enabled

    if form_data.schedule_start_time is not None or "schedule_start_time" in form_data.model_fields_set:
        form.schedule_start_time = form_data.schedule_start_time

    if form_data.schedule_end_time is not None or "schedule_end_time" in form_data.model_fields_set:
        form.schedule_end_time = form_data.schedule_end_time

    if form_data.is_response_limit_enabled is not None:
        form.is_response_limit_enabled = form_data.is_response_limit_enabled

    if form_data.max_response_limit is not None or "max_response_limit" in form_data.model_fields_set:
        form.max_response_limit = form_data.max_response_limit

    # Password protection
    if form_data.is_password_protected is not None:
        form.is_password_protected = form_data.is_password_protected
        if not form_data.is_password_protected:
            # Disabling protection — clear the stored hash
            form.password_hash = None

    if form_data.password is not None and form_data.password.strip():
        if len(form_data.password) < 4:
            raise HTTPException(
                status_code=400,
                detail="Form password must be at least 4 characters long"
            )
        form.password_hash = hash_password(form_data.password)
        form.is_password_protected = True

    # Micro-Verification Settings
    if form_data.is_email_otp_enabled is not None:
        form.is_email_otp_enabled = form_data.is_email_otp_enabled

    if form_data.is_phone_otp_enabled is not None:
        form.is_phone_otp_enabled = form_data.is_phone_otp_enabled

    if form_data.otp_expiry_minutes is not None:
        form.otp_expiry_minutes = form_data.otp_expiry_minutes

    if form_data.max_otp_attempts is not None:
        form.max_otp_attempts = form_data.max_otp_attempts

    if form_data.otp_cooldown_seconds is not None:
        form.otp_cooldown_seconds = form_data.otp_cooldown_seconds

    if form_data.require_verification_to_submit is not None:
        form.require_verification_to_submit = form_data.require_verification_to_submit

    update_form(db)

    return _build_form_response(form, db, current_user.id)


def remove_form(
    form_id: int,
    current_user: User,
    db: Session
):
    from app.core.permissions import verify_form_access
    form = verify_form_access(db, current_user.id, form_id, required_role="owner")

    delete_form(db, form)

    return {
        "message": "Form deleted successfully"
    }