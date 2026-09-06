from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine

# Import Models
from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.submission import Submission
from app.models.response_value import ResponseValue
from app.models.notification import Notification
from app.models.custom_template import CustomTemplate
from app.models.user_preference import UserPreference
from app.models.template_model import TemplateModel
from app.models.form_collaborator import FormCollaborator
from app.models.form_draft import FormDraft
from app.models.form_verification import FormVerification

# Import Routers
from app.api.auth import router as auth_router
from app.api.forms import router as form_router
from app.api.fields import router as field_router
from app.api.form_versions import router as form_version_router
from app.api.field_options import router as field_option_router
from app.api.conditional_rules import router as conditional_rule_router
from app.api.submissions import router as submission_router
from app.api.response_values import router as response_value_router
from app.api.publish import router as publish_router
from app.api.public_forms import router as public_form_router
from app.api.public_submission import router as public_submission_router
from app.api.public_drafts import router as public_drafts_router
from app.api.public_scan_to_fill import router as public_scan_to_fill_router
from app.api.dashboard import router as dashboard_router
from app.api.export import router as export_router
from app.api.analytics import router as analytics_router
from app.api.templates import router as template_router
from app.api.notifications import router as notification_router
from app.api.settings import router as settings_router
from app.api.custom_templates import router as custom_template_router
from app.api.ai_generator import router as ai_router
from app.api.ai_assistant import router as assistant_router
from app.api.ai_insights import router as ai_insights_router
from app.api.ai_doctor import router as ai_doctor_router
from app.api.ai_simulator import router as ai_simulator_router
from app.api.ai_document_import import router as ai_document_import_router
from app.api.upload import router as upload_router, UPLOAD_DIR
from app.api.share import router as share_router
from app.api.collaborators import router as collaborators_router
from app.api.public_verification import router as public_verification_router
from app.api.lookup import router as lookup_router
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text

# Create Database Tables
Base.metadata.create_all(bind=engine)

# Auto-migration for scheduling & response limit & verification columns
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_scheduling_enabled BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_start_time TIMESTAMPTZ;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_end_time TIMESTAMPTZ;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_response_limit_enabled BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_response_limit INTEGER;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_password_protected BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS password_hash TEXT;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_email_otp_enabled BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_phone_otp_enabled BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS otp_expiry_minutes INTEGER DEFAULT 10;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_otp_attempts INTEGER DEFAULT 3;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS otp_cooldown_seconds INTEGER DEFAULT 60;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS require_verification_to_submit BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS client_id TEXT;"))
        conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS formula_expression TEXT;"))
        conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS decimal_places INTEGER DEFAULT 2;"))
        conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS number_prefix TEXT;"))
        conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS number_suffix TEXT;"))
        conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS lookup_config TEXT;"))
        conn.commit()
except Exception as e:
    print(f"Migration notice: {e}")

# Create FastAPI App
app = FastAPI(
    title="Formify API",
    version="1.0.0"
)

# ----------------------------
# CORS Configuration
# ----------------------------
import os

frontend_url_env = os.getenv("FRONTEND_URL", "")
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if frontend_url_env:
    origins.append(frontend_url_env.rstrip("/"))

if allowed_origins_env:
    for item in allowed_origins_env.split(","):
        if item.strip():
            origins.append(item.strip().rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Register Routers
# ----------------------------
app.include_router(auth_router)
app.include_router(form_router)
app.include_router(form_version_router)
app.include_router(field_router)
app.include_router(field_option_router)
app.include_router(conditional_rule_router)
app.include_router(submission_router)
app.include_router(response_value_router)
app.include_router(publish_router)
app.include_router(public_form_router)
app.include_router(public_submission_router)
app.include_router(public_drafts_router)
app.include_router(public_scan_to_fill_router)
app.include_router(dashboard_router)
app.include_router(export_router)
app.include_router(analytics_router)
app.include_router(template_router)
app.include_router(notification_router)
app.include_router(settings_router)
app.include_router(custom_template_router)
app.include_router(ai_router)
app.include_router(assistant_router)
app.include_router(ai_insights_router)
app.include_router(ai_doctor_router)
app.include_router(ai_simulator_router)
app.include_router(ai_document_import_router)
app.include_router(upload_router)
app.include_router(share_router)
app.include_router(collaborators_router)
app.include_router(public_verification_router)
app.include_router(lookup_router)

# Mount uploaded files directory for public access
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ----------------------------
# Root Endpoint
# ----------------------------
@app.get("/")
def root():
    return {
        "message": "Welcome to Formify API"
    }