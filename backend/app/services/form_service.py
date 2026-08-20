from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.submission import Submission
from app.models.user import User

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


def _build_form_response(f: Form, db: Session) -> FormResponse:
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
        owner_id=f.owner_id,
        owner_email=owner_email,
        owner_name=owner_name,
        created_at=f.created_at,
        updated_at=f.updated_at,
        submissions_count=subs_cnt,
        fields_count=fields_cnt,
        public_link=pub_link,
        latest_version_id=latest_ver_id,
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

    return _build_form_response(saved, db)


def duplicate_existing_form(
    form_id: int,
    current_user: User,
    db: Session
):
    source_form = get_form_by_id(db, form_id)
    if not source_form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

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
                is_required=sf.is_required or False,
                field_order=sf.field_order,
                help_text=getattr(sf, "help_text", None),
                description=getattr(sf, "description", None),
                is_read_only=getattr(sf, "is_read_only", False),
                is_hidden=getattr(sf, "is_hidden", False),
                default_value=getattr(sf, "default_value", None),
                width=getattr(sf, "width", "full"),
                label_position=getattr(sf, "label_position", "top"),
                show_placeholder=getattr(sf, "show_placeholder", True),
                min_length=getattr(sf, "min_length", None),
                max_length=getattr(sf, "max_length", None),
                regex_pattern=getattr(sf, "regex_pattern", None),
                validation_message=getattr(sf, "validation_message", None),
                shuffle_options=getattr(sf, "shuffle_options", False),
                allow_other=getattr(sf, "allow_other", False),
                allow_multiple=getattr(sf, "allow_multiple", False),
                max_selections=getattr(sf, "max_selections", None),
                allowed_file_types=getattr(sf, "allowed_file_types", None),
                max_file_size_mb=getattr(sf, "max_file_size_mb", None),
                max_files=getattr(sf, "max_files", 1)
            )
            db.add(new_field)
            db.commit()
            db.refresh(new_field)
            field_id_map[sf.id] = new_field.id

            opts = db.query(FieldOption).filter(FieldOption.field_id == sf.id).order_by(FieldOption.option_order).all()
            for opt in opts:
                new_opt = FieldOption(
                    field_id=new_field.id,
                    option_text=opt.option_text,
                    option_order=opt.option_order
                )
                db.add(new_opt)
            db.commit()

        source_rules = db.query(ConditionalRule).filter(ConditionalRule.form_version_id == source_version.id).all()
        for sr in source_rules:
            new_trigger = field_id_map.get(sr.trigger_field_id) if sr.trigger_field_id else None
            new_target = field_id_map.get(sr.target_field_id) if sr.target_field_id else None
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

    return _build_form_response(saved_form, db)


def get_forms(db: Session, current_user: User):
    forms = get_all_forms(db, owner_id=current_user.id)
    return [_build_form_response(f, db) for f in forms]


def get_single_form(
    form_id: int,
    db: Session
):
    form = get_form_by_id(db, form_id)

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    return _build_form_response(form, db)


def edit_form(
    form_id: int,
    form_data: FormUpdate,
    current_user: User,
    db: Session
):
    form = get_form_by_id(db, form_id)

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    if form.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

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

    update_form(db)

    return _build_form_response(form, db)


def remove_form(
    form_id: int,
    current_user: User,
    db: Session
):
    form = get_form_by_id(db, form_id)

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    if form.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    delete_form(db, form)

    return {
        "message": "Form deleted successfully"
    }