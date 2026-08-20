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
from app.api.dashboard import router as dashboard_router
from app.api.export import router as export_router
from app.api.analytics import router as analytics_router
from app.api.templates import router as template_router
from app.api.notifications import router as notification_router
from app.api.settings import router as settings_router
from app.api.custom_templates import router as custom_template_router
from app.api.ai_generator import router as ai_router
from app.api.upload import router as upload_router, UPLOAD_DIR
from app.api.share import router as share_router
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text

# Create Database Tables
Base.metadata.create_all(bind=engine)

# Auto-migration for scheduling & response limit columns
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_scheduling_enabled BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_start_time TIMESTAMPTZ;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS schedule_end_time TIMESTAMPTZ;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_response_limit_enabled BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_response_limit INTEGER;"))
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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
app.include_router(dashboard_router)
app.include_router(export_router)
app.include_router(analytics_router)
app.include_router(template_router)
app.include_router(notification_router)
app.include_router(settings_router)
app.include_router(custom_template_router)
app.include_router(ai_router)
app.include_router(upload_router)
app.include_router(share_router)

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