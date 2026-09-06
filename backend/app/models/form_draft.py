from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.database.database import Base


class FormDraft(Base):

    __tablename__ = "form_drafts"

    id = Column(Integer, primary_key=True, index=True)

    public_link = Column(String, index=True, nullable=False)

    form_version_id = Column(
        Integer,
        ForeignKey("form_versions.id"),
        nullable=False
    )

    resume_token = Column(String, unique=True, index=True, nullable=False)

    respondent_email = Column(String, nullable=True)

    answers_json = Column(Text, nullable=False, default="{}")

    current_page = Column(Integer, default=0)

    is_submitted = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
