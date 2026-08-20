from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False, index=True)
    theme = Column(String, default="light")
    language = Column(String, default="English")
    timezone = Column(String, default="UTC")
    email_alerts = Column(Boolean, default=True)
    weekly_digest = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    brand_logo_url = Column(String, default="https://formify.io/logo.png")
    brand_color = Column(String, default="#4F46E5")
    workspace_name = Column(String, default="Formify Pro Workspace")
    workspace_subdomain = Column(String, default="formify-workspace")
    seat_limit = Column(Integer, default=10)
    api_key = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
