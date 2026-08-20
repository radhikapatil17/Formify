from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class Form(Base):

    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String)

    description = Column(String)

    category = Column(String, default="General")

    status = Column(String, default="draft")

    theme_config = Column(String, nullable=True)

    # Form Scheduling fields
    is_scheduling_enabled = Column(Boolean, default=False, server_default="false", nullable=False)

    schedule_start_time = Column(DateTime(timezone=True), nullable=True)

    schedule_end_time = Column(DateTime(timezone=True), nullable=True)

    # Response Limit fields
    is_response_limit_enabled = Column(Boolean, default=False, server_default="false", nullable=False)

    max_response_limit = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())