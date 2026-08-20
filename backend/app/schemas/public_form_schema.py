from pydantic import BaseModel, ConfigDict


class PublicOption(BaseModel):
    id: int
    option_text: str

    model_config = ConfigDict(from_attributes=True)


class PublicField(BaseModel):
    id: int
    label: str
    field_type: str
    placeholder: str | None = None
    is_required: bool
    field_order: int = 0

    # General
    help_text: str | None = None
    description: str | None = None
    is_read_only: bool = False
    is_hidden: bool = False
    default_value: str | None = None
    show_placeholder: bool = True

    # Display
    width: str = "full"
    label_position: str = "top"

    # Validation
    min_length: int | None = None
    max_length: int | None = None
    regex_pattern: str | None = None
    validation_message: str | None = None

    # Choice
    shuffle_options: bool = False
    allow_other: bool = False
    allow_multiple: bool = False
    max_selections: int | None = None

    # File upload
    allowed_file_types: str | None = None
    max_file_size_mb: int | None = None
    max_files: int = 1

    options: list[PublicOption] = []

    model_config = ConfigDict(from_attributes=True)


class PublicConditionalRule(BaseModel):
    trigger_field_id: int
    operator: str
    comparison_value: str
    target_field_id: int
    action: str

    model_config = ConfigDict(from_attributes=True)


class PublicFormResponse(BaseModel):
    title: str
    description: str | None = None
    public_link: str
    theme_config: str | None = None
    fields: list[PublicField]
    conditional_rules: list[PublicConditionalRule]
    schedule_status: dict | None = None
    response_limit_status: dict | None = None