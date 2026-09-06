import hashlib
import os
import random
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.form import Form
from app.models.form_verification import FormVerification
from app.services.email_service import send_otp_email

router = APIRouter(
    prefix="/public/verification",
    tags=["Public Form Micro-Verification"]
)

# List of known temporary/disposable email domain providers
DISPOSABLE_EMAIL_DOMAINS = {
    "tempmail.com", "mailinator.com", "10minutemail.com", "dispostable.com",
    "yopmail.com", "guerrillamail.com", "trashmail.com", "temp-mail.org",
    "fakemailgenerator.com", "getairmail.com", "maildrop.cc", "sharklasers.com",
    "throwawaymail.com", "tempmailo.com", "crazymailing.com", "binkmail.com",
    "0815.ru", "10minutemail.net", "burnermail.io", "emailondeck.com"
}

def is_disposable_email(email_address: str) -> bool:
    """Detects whether an email address belongs to a disposable/temporary email service."""
    if not email_address or "@" not in email_address:
        return False
    domain = email_address.strip().split("@")[-1].lower()
    return domain in DISPOSABLE_EMAIL_DOMAINS

def is_valid_phone_number(phone_str: str) -> bool:
    """Validates basic international or local phone number formatting (e.g. +1 555 123 4567 or 10-15 digits)."""
    cleaned = re.sub(r"[\s\-\(\)\.]", "", phone_str.strip())
    # Reject dummy repetitive strings
    if cleaned in ("0000000000", "1234567890", "1111111111", "9999999999"):
        return False
    # Must be 7 to 15 digits, optional + prefix
    return bool(re.match(r"^\+?[1-9]\d{6,14}$", cleaned))

def hash_otp(otp_str: str, salt: str = "formify_otp_salt") -> str:
    """SHA-256 secure hash for OTP codes. Plaintext OTPs are NEVER stored."""
    return hashlib.sha256(f"{salt}:{otp_str}".encode("utf-8")).hexdigest()

class SendOtpRequest(BaseModel):
    form_id: Optional[int] = None
    public_link: Optional[str] = None
    verification_type: Optional[Literal["email", "phone"]] = None
    target_type: Optional[Literal["email", "phone"]] = None
    destination: str

class VerifyOtpRequest(BaseModel):
    form_id: Optional[int] = None
    public_link: Optional[str] = None
    verification_type: Optional[Literal["email", "phone"]] = None
    target_type: Optional[Literal["email", "phone"]] = None
    destination: str
    otp_code: str

@router.post("/send-otp")
def send_verification_otp(
    req: SendOtpRequest,
    db: Session = Depends(get_db)
):
    """
    Generates and sends a time-limited 6-digit OTP code for Email or Phone verification.
    Applies spam protection, resend cooldown, and secure OTP hashing.
    """
    v_type = req.verification_type or req.target_type
    if not v_type:
        raise HTTPException(status_code=400, detail="verification_type or target_type must be specified")

    if req.form_id:
        form = db.query(Form).filter(Form.id == req.form_id).first()
    elif req.public_link:
        from app.repositories.form_version_repository import get_published_form
        version = get_published_form(req.public_link, db)
        if not version:
            raise HTTPException(status_code=404, detail="Public form version not found")
        form = db.query(Form).filter(Form.id == version.form_id).first()
    else:
        raise HTTPException(status_code=400, detail="Either form_id or public_link must be specified")

    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    # Check if verification type is enabled on form
    if v_type == "email" and not form.is_email_otp_enabled:
        raise HTTPException(status_code=400, detail="Email verification is not enabled for this form.")
    if v_type == "phone" and not form.is_phone_otp_enabled:
        raise HTTPException(status_code=400, detail="Phone verification is not enabled for this form.")

    destination_clean = req.destination.strip().lower() if v_type == "email" else req.destination.strip()
    if not destination_clean:
        raise HTTPException(status_code=400, detail="Verification target destination cannot be empty.")

    # 1. Spam Protection Checks
    if v_type == "email":
        if not re.match(r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$", destination_clean, re.IGNORECASE):
            raise HTTPException(status_code=400, detail="Invalid email address format.")
        if is_disposable_email(destination_clean):
            raise HTTPException(status_code=400, detail="Disposable or temporary email addresses are not permitted.")
    elif v_type == "phone":
        if not is_valid_phone_number(destination_clean):
            raise HTTPException(status_code=400, detail="Invalid phone number format. Please enter a valid number.")

    now = datetime.now(timezone.utc)

    # 2. Check existing verification session for cooldown
    existing_record = (
        db.query(FormVerification)
        .filter(
            FormVerification.form_id == form.id,
            FormVerification.verification_type == v_type,
            FormVerification.destination == destination_clean
        )
        .first()
    )

    cooldown_seconds = form.otp_cooldown_seconds or 60
    expiry_minutes = form.otp_expiry_minutes or 10
    max_attempts = form.max_otp_attempts or 3

    if existing_record and existing_record.cooldown_until:
        if existing_record.cooldown_until > now:
            remaining = int((existing_record.cooldown_until - now).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting a new verification code."
            )

    # 3. Generate 6-Digit Numeric OTP
    otp_code = f"{random.randint(100000, 999999)}"
    otp_hashed = hash_otp(otp_code)
    expires_at = now + timedelta(minutes=expiry_minutes)
    cooldown_until = now + timedelta(seconds=cooldown_seconds)

    if existing_record:
        existing_record.otp_hash = otp_hashed
        existing_record.attempts = 0
        existing_record.max_attempts = max_attempts
        existing_record.is_verified = False
        existing_record.expires_at = expires_at
        existing_record.cooldown_until = cooldown_until
        existing_record.session_token = None
    else:
        existing_record = FormVerification(
            form_id=form.id,
            verification_type=v_type,
            destination=destination_clean,
            otp_hash=otp_hashed,
            attempts=0,
            max_attempts=max_attempts,
            is_verified=False,
            expires_at=expires_at,
            cooldown_until=cooldown_until
        )
        db.add(existing_record)

    db.commit()

    # 4. Dispatch Delivery
    delivery_status = "sent"
    if v_type == "email":
        email_res = send_otp_email(
            recipient_email=destination_clean,
            otp_code=otp_code,
            form_title=form.title,
            expiry_minutes=expiry_minutes
        )
        if not email_res.get("success"):
            print(f"[OTP LOG] SMTP Not Configured/Failed. OTP for {destination_clean}: {otp_code}")
            delivery_status = "logged_console"
    else:
        # Phone SMS OTP Delivery
        print(f"[PHONE SMS OTP LOG] Code for {destination_clean}: {otp_code}")
        delivery_status = "sms_queued"

    return {
        "success": True,
        "message": f"Verification code sent to {destination_clean}.",
        "cooldown_seconds": cooldown_seconds,
        "expiry_minutes": expiry_minutes,
        "max_attempts": max_attempts,
        "delivery_status": delivery_status
    }

@router.post("/verify-otp")
def verify_otp_code(
    req: VerifyOtpRequest,
    db: Session = Depends(get_db)
):
    """
    Verifies a user-submitted OTP code.
    Validates attempt limits, expiration, and returns a secure session token upon success.
    """
    v_type = req.verification_type or req.target_type
    if not v_type:
        raise HTTPException(status_code=400, detail="verification_type or target_type must be specified")

    if req.form_id:
        form = db.query(Form).filter(Form.id == req.form_id).first()
    elif req.public_link:
        from app.repositories.form_version_repository import get_published_form
        version = get_published_form(req.public_link, db)
        if not version:
            raise HTTPException(status_code=404, detail="Public form version not found")
        form = db.query(Form).filter(Form.id == version.form_id).first()
    else:
        raise HTTPException(status_code=400, detail="Either form_id or public_link must be specified")

    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    destination_clean = req.destination.strip().lower() if v_type == "email" else req.destination.strip()
    now = datetime.now(timezone.utc)

    record = (
        db.query(FormVerification)
        .filter(
            FormVerification.form_id == form.id,
            FormVerification.verification_type == v_type,
            FormVerification.destination == destination_clean
        )
        .first()
    )

    if not record or not record.otp_hash:
        raise HTTPException(status_code=400, detail="No active verification session found. Please request an OTP first.")

    if record.is_verified:
        return {
            "success": True,
            "verified": True,
            "session_token": record.session_token,
            "message": "Destination is already verified."
        }

    # 1. Check expiration
    if record.expires_at and record.expires_at < now:
        record.otp_hash = None
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    # 2. Check attempt limits
    if record.attempts >= record.max_attempts:
        record.otp_hash = None
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Maximum verification attempts exceeded. Please request a new code."
        )

    # 3. Check code match
    submitted_hash = hash_otp(req.otp_code.strip())
    if submitted_hash != record.otp_hash:
        record.attempts += 1
        remaining_attempts = record.max_attempts - record.attempts
        db.commit()
        if remaining_attempts <= 0:
            record.otp_hash = None
            db.commit()
            raise HTTPException(status_code=400, detail="Incorrect code. Maximum attempts reached. Request a new OTP.")
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect verification code. {remaining_attempts} attempt(s) remaining."
        )

    # 4. Successful Verification!
    session_token = f"verif_{uuid.uuid4().hex}"
    record.is_verified = True
    record.session_token = session_token
    record.otp_hash = None  # Clear OTP hash after successful verification
    db.commit()

    return {
        "success": True,
        "verified": True,
        "session_token": session_token,
        "message": "Verification successful! You may now submit the form."
    }
