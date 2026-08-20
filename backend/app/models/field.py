from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from app.database.database import Base


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    form_version_id = Column(Integer, ForeignKey("form_versions.id"))

    # ── Core ─────────────────────────────────────────────────────────────
    label = Column(String, nullable=False)
    field_type = Column(String, nullable=False)
    placeholder = Column(String)
    is_required = Column(Boolean, default=False)
    field_order = Column(Integer)

    # ── General settings ─────────────────────────────────────────────────
    help_text = Column(String)             # Hint shown below the input
    description = Column(Text)            # Long description above the input
    is_read_only = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)
    default_value = Column(String)        # Pre-filled value

    # ── Display settings ─────────────────────────────────────────────────
    width = Column(String, default="full")         # "full" | "half"
    label_position = Column(String, default="top") # "top" | "left" | "right"
    show_placeholder = Column(Boolean, default=True)

    # ── Validation settings ──────────────────────────────────────────────
    min_length = Column(Integer)          # Min chars / min numeric value
    max_length = Column(Integer)          # Max chars / max numeric value
    regex_pattern = Column(String)        # Custom regex
    validation_message = Column(String)   # Custom error message

    # ── Choice field settings ─────────────────────────────────────────────
    shuffle_options = Column(Boolean, default=False)
    allow_other = Column(Boolean, default=False)
    allow_multiple = Column(Boolean, default=False)
    max_selections = Column(Integer)      # Max number of choices selectable

    # ── File / Image upload settings ─────────────────────────────────────
    allowed_file_types = Column(String)   # CSV: ".pdf,.docx,.png"
    max_file_size_mb = Column(Integer)    # MB limit per file
    max_files = Column(Integer, default=1)