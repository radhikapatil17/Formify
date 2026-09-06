from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.form_version_repository import get_published_form
from app.repositories.form_repository import get_form_by_id
from app.repositories.field_repository import get_fields_by_version
from app.repositories.field_option_repository import get_options_by_field
from app.repositories.conditional_rule_repository import get_rules_by_version

from app.models.submission import Submission
from app.models.form_version import FormVersion

from app.core.security import verify_password

from datetime import datetime, timezone
import json

def sanitize_public_lookup_config(raw_config):
    """Sanitize lookup_config for public respondents so credentials and internal headers are never leaked."""
    if not raw_config:
        return None
    try:
        data = json.loads(raw_config) if isinstance(raw_config, str) else raw_config
        if not isinstance(data, dict):
            return None
        # Only expose safe configuration needed by respondent frontend to trigger proxy
        return json.dumps({
            "is_enabled": data.get("is_enabled", True),
            "trigger_field_id": data.get("trigger_field_id"),
            "trigger_behavior": data.get("trigger_behavior", "on_change"),
            "min_chars": data.get("min_chars", 3),
            "response_mappings": data.get("response_mappings", []),
            "button_label": data.get("button_label", "Lookup"),
        })
    except Exception:
        return None

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


def _build_full_public_form_data(form, version, db: Session) -> dict:
    """Build the complete public form data dict (fields, rules, schedule, limit)."""
    fields = get_fields_by_version(db, version.id)

    field_list = []

    for field in fields:
        options = get_options_by_field(db, field.id)

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
            # Formula / Calculation
            "formula_expression": getattr(field, "formula_expression", None),
            "decimal_places": getattr(field, "decimal_places", None),
            "number_prefix": getattr(field, "number_prefix", None),
            "number_suffix": getattr(field, "number_suffix", None),
            # Dynamic API Lookup
            "lookup_config": sanitize_public_lookup_config(getattr(field, "lookup_config", None)),
            "options": options,
        })

    rules = get_rules_by_version(db, version.id)

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
        "response_limit_status": response_limit_status,
        "is_password_protected": getattr(form, "is_password_protected", False) or False,
        "is_email_otp_enabled": getattr(form, "is_email_otp_enabled", False) or False,
        "is_phone_otp_enabled": getattr(form, "is_phone_otp_enabled", False) or False,
        "otp_expiry_minutes": getattr(form, "otp_expiry_minutes", 10) or 10,
        "max_otp_attempts": getattr(form, "max_otp_attempts", 3) or 3,
        "otp_cooldown_seconds": getattr(form, "otp_cooldown_seconds", 60) or 60,
        "require_verification_to_submit": getattr(form, "require_verification_to_submit", False) or False,
    }


def get_public_form(
    public_link: str,
    db: Session
):
    version = get_published_form(public_link, db)

    if not version:
        raise HTTPException(
            status_code=404,
            detail="Published form not found"
        )

    form = get_form_by_id(db, version.form_id)

    # If password protected, return a locked shell — no fields, no rules
    # The frontend must call verify-password to unlock full data
    if getattr(form, "is_password_protected", False):
        return {
            "title": form.title,
            "description": form.description,
            "public_link": version.public_link,
            "theme_config": getattr(form, "theme_config", None),
            "fields": [],
            "conditional_rules": [],
            "schedule_status": None,
            "response_limit_status": None,
            "is_password_protected": True,
        }

    return _build_full_public_form_data(form, version, db)


def verify_form_password(
    public_link: str,
    plain_password: str,
    db: Session
):
    """Verify the visitor-supplied password for a protected form.

    Returns full form data on success, raises 401 on mismatch.
    The password_hash is never included in the returned data.
    """
    version = get_published_form(public_link, db)

    if not version:
        raise HTTPException(status_code=404, detail="Published form not found")

    form = get_form_by_id(db, version.form_id)

    if not getattr(form, "is_password_protected", False):
        # Form is not protected — just return full data
        return _build_full_public_form_data(form, version, db)

    stored_hash = getattr(form, "password_hash", None)
    if not stored_hash:
        # Protection enabled but no hash set — treat as unlocked (misconfiguration fallback)
        return _build_full_public_form_data(form, version, db)

    if not verify_password(plain_password, stored_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please try again."
        )

    return _build_full_public_form_data(form, version, db)