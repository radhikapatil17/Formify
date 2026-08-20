from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database.database import Base


class CustomTemplate(Base):
    __tablename__ = "custom_templates"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, default="Feedback")
    is_public = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    version = Column(String, default="v1.0")
    usage_count = Column(Integer, default=0)
    questions_schema = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
