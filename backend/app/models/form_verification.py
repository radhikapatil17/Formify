from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class FormVerification(Base):
    __tablename__ = "form_verifications"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    verification_type = Column(String, nullable=False)  # "email" or "phone"
    destination = Column(String, nullable=False, index=True)  # email address or phone number
    otp_hash = Column(String, nullable=True)  # SHA-256 hashed 6-digit OTP
    session_token = Column(String, nullable=True, unique=True, index=True)
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    cooldown_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
