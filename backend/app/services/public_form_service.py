from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.form_version_repository import get_published_form
from app.repositories.form_repository import get_form_by_id
from app.repositories.field_repository import get_fields_by_version
from app.repositories.field_option_repository import get_options_by_field
from app.repositories.conditional_rule_repository import get_rules_by_version

from app.models.submission import Submission
from app.models.form_version import FormVersion


from datetime import datetime, timezone

def evaluate_form_schedule(form):
    if not form or not getattr(form, "is_scheduling_enabled", False):
        return {
            "is_scheduling_enabled": False,
            "is_active": True,
            "status": "active",
            "message": None,
            "start_time": None,
            "end_time": None
        }

    now = datetime.now(timezone.utc)
    start_time = form.schedule_start_time
    end_time = form.schedule_end_time

    if start_time and start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    if end_time and end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    start_iso = start_time.isoformat() if start_time else None
    end_iso = end_time.isoformat() if end_time else None

    if start_time and now < start_time:
        return {
            "is_scheduling_enabled": True,
            "is_active": False,
            "status": "not_started",
            "message": "This form is not yet available.",
            "start_time": start_iso,
            "end_time": end_iso
        }

    if end_time and now > end_time:
        return {
            "is_scheduling_enabled": True,
            "is_active": False,
            "status": "closed",
            "message": "This form is closed.",
            "start_time": start_iso,
            "end_time": end_iso
        }

    return {
        "is_scheduling_enabled": True,
        "is_active": True,
        "status": "active",
        "message": None,
        "start_time": start_iso,
        "end_time": end_iso
    }


def evaluate_response_limit(form, db: Session):
    """Evaluate whether the form has reached its maximum response limit."""
    if not form or not getattr(form, "is_response_limit_enabled", False):
        return {
            "is_response_limit_enabled": False,
            "is_limit_reached": False,
            "current_count": 0,
            "max_limit": None,
            "message": None
        }

    max_limit = getattr(form, "max_response_limit", None)
    if max_limit is None or max_limit <= 0:
        return {
            "is_response_limit_enabled": True,
            "is_limit_reached": False,
            "current_count": 0,
            "max_limit": None,
            "message": None
        }

    # Count all submissions across all published versions of this form
    version_ids = [
        v.id for v in db.query(FormVersion.id).filter(FormVersion.form_id == form.id).all()
    ]
    current_count = 0
    if version_ids:
        current_count = db.query(Submission).filter(
            Submission.form_version_id.in_(version_ids)
        ).count()

    is_limit_reached = current_count >= max_limit

    return {
        "is_response_limit_enabled": True,
        "is_limit_reached": is_limit_reached,
        "current_count": current_count,
        "max_limit": max_limit,
        "message": "This form has reached its maximum response limit and is no longer accepting responses." if is_limit_reached else None
    }


def get_public_form(
    public_link: str,
    db: Session
):
    version = get_published_form(
        public_link,
        db
    )

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Published form not found"
        )

    form = get_form_by_id(
        db,
        version.form_id
    )

    fields = get_fields_by_version(
        db,
        version.id
    )

    field_list = []

    for field in fields:
        options = get_options_by_field(
            db,
            field.id
        )

        field_list.append({
            "id": field.id,
            "label": field.label,
            "field_type": field.field_type,
            "placeholder": field.placeholder,
            "is_required": field.is_required,
            "field_order": field.field_order or 0,
            # General
            "help_text": field.help_text,
            "description": field.description,
            "is_read_only": field.is_read_only or False,
            "is_hidden": field.is_hidden or False,
            "default_value": field.default_value,
            "show_placeholder": field.show_placeholder if hasattr(field, 'show_placeholder') else True,
            # Display
            "width": field.width or "full",
            "label_position": field.label_position or "top",
            # Validation
            "min_length": field.min_length,
            "max_length": field.max_length,
            "regex_pattern": field.regex_pattern,
            "validation_message": field.validation_message,
            # Choice
            "shuffle_options": field.shuffle_options or False,
            "allow_other": field.allow_other or False,
            "allow_multiple": field.allow_multiple or False,
            "max_selections": field.max_selections,
            # File upload
            "allowed_file_types": field.allowed_file_types,
            "max_file_size_mb": field.max_file_size_mb,
            "max_files": field.max_files or 1,
            "options": options,
        })

    rules = get_rules_by_version(
        db,
        version.id
    )

    schedule_status = evaluate_form_schedule(form)
    response_limit_status = evaluate_response_limit(form, db)

    return {
        "title": form.title,
        "description": form.description,
        "public_link": version.public_link,
        "theme_config": getattr(form, "theme_config", None),
        "fields": field_list,
        "conditional_rules": rules,
        "schedule_status": schedule_status,
        "response_limit_status": response_limit_status
    }