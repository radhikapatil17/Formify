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

    # Formula / Calculation
    formula_expression: str | None = None
    decimal_places: int | None = 2
    number_prefix: str | None = None
    number_suffix: str | None = None

    # Dynamic API Lookup
    lookup_config: str | None = None

    options: list[PublicOption] = []

    model_config = ConfigDict(from_attributes=True)


class PublicConditionalRule(BaseModel):
    trigger_field_id: int | None = None
    operator: str | None = None
    comparison_value: str | None = None
    target_field_id: int | None = None
    action: str | None = None
    logic_operator: str | None = "AND"
    conditions_json: str | None = None

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
    is_password_protected: bool = False  # True means form is locked; fields will be empty until unlocked
    is_email_otp_enabled: bool = False
    is_phone_otp_enabled: bool = False
    otp_expiry_minutes: int = 10
    max_otp_attempts: int = 3
    otp_cooldown_seconds: int = 60
    require_verification_to_submit: bool = False


class PasswordVerifyRequest(BaseModel):
    password: str