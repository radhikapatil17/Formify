from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.field import Field

from app.schemas.field_schema import (
    FieldCreate,
    FieldUpdate
)

from app.repositories.field_repository import (
    create_field,
    get_fields_by_version,
    get_field_by_id,
    update_field,
    delete_field
)


def _apply_field_data(field: Field, data):
    """Apply all schema fields onto a Field ORM object."""
    field.label = data.label
    field.field_type = data.field_type
    field.placeholder = data.placeholder
    field.is_required = data.is_required
    field.field_order = data.field_order

    # General
    field.help_text = data.help_text
    field.description = data.description
    field.is_read_only = data.is_read_only
    field.is_hidden = data.is_hidden
    field.default_value = data.default_value

    # Display
    field.width = data.width
    field.label_position = data.label_position
    field.show_placeholder = data.show_placeholder

    # Validation
    field.min_length = data.min_length
    field.max_length = data.max_length
    field.regex_pattern = data.regex_pattern
    field.validation_message = data.validation_message

    # Choice
    field.shuffle_options = data.shuffle_options
    field.allow_other = data.allow_other
    field.allow_multiple = data.allow_multiple
    field.max_selections = data.max_selections

    # File upload
    field.allowed_file_types = data.allowed_file_types
    field.max_file_size_mb = data.max_file_size_mb
    field.max_files = data.max_files

    # Formula / Calculation
    if hasattr(data, "formula_expression"):
        field.formula_expression = data.formula_expression
    if hasattr(data, "decimal_places"):
        field.decimal_places = data.decimal_places
    if hasattr(data, "number_prefix"):
        field.number_prefix = data.number_prefix
    if hasattr(data, "number_suffix"):
        field.number_suffix = data.number_suffix

    # Dynamic API Lookup
    if hasattr(data, "lookup_config"):
        cfg = data.lookup_config
        if isinstance(cfg, (dict, list)):
            import json
            cfg = json.dumps(cfg)
        field.lookup_config = cfg


def create_new_field(field: FieldCreate, db: Session):
    new_field = Field(form_version_id=field.form_version_id)
    _apply_field_data(new_field, field)
    return create_field(db, new_field)


def get_fields(form_version_id, db):
    return get_fields_by_version(db, form_version_id)


def get_single_field(field_id: int, db: Session):
    field = get_field_by_id(db, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


def edit_field(field_id: int, field_data: FieldUpdate, db: Session):
    field = get_field_by_id(db, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    _apply_field_data(field, field_data)
    update_field(db)
    return field


def remove_field(field_id: int, db: Session):
    field = get_field_by_id(db, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    delete_field(db, field)
    return {"message": "Field deleted successfully"}