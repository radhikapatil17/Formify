from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Union, Any


class FieldBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=500)
    field_type: str
    placeholder: Optional[str] = None
    is_required: bool = False
    field_order: int

    # General
    help_text: Optional[str] = None
    description: Optional[str] = None
    is_read_only: bool = False
    is_hidden: bool = False
    default_value: Optional[str] = None

    # Display
    width: str = "full"
    label_position: str = "top"
    show_placeholder: bool = True

    # Validation
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    regex_pattern: Optional[str] = None
    validation_message: Optional[str] = None

    # Choice
    shuffle_options: bool = False
    allow_other: bool = False
    allow_multiple: bool = False
    max_selections: Optional[int] = None

    # File upload
    allowed_file_types: Optional[str] = None
    max_file_size_mb: Optional[int] = None
    max_files: int = 1

    # Formula / Math
    formula_expression: Optional[str] = None
    decimal_places: Optional[int] = 2
    number_prefix: Optional[str] = None
    number_suffix: Optional[str] = None

    # Dynamic API Lookup
    lookup_config: Optional[Union[str, dict, Any]] = None


class FieldCreate(FieldBase):
    form_version_id: int


class FieldUpdate(FieldBase):
    pass


class FieldResponse(FieldBase):
    id: int
    form_version_id: int

    model_config = ConfigDict(from_attributes=True)