from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database.database import Base


class TemplateModel(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, default="Feedback", index=True)
    tags = Column(JSON, default=list)
    template_schema = Column(JSON, nullable=False)
    created_by = Column(String, default="Formify Team")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    usage_count = Column(Integer, default=0)
    favorites_count = Column(Integer, default=0)
    is_public = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    is_ai_generated = Column(Boolean, default=False)
    version = Column(String, default="v1.0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
