import json
import os
import urllib.request
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.template_model import TemplateModel
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.schemas.template_schema import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    UseTemplateRequest,
    FavoriteRequest,
    ArchiveRequest,
    AiGenerateRequest,
    ImportRequest,
)

router = APIRouter(
    prefix="/templates",
    tags=["Templates"]
)

# -----------------------------------------------------------------------------
# OFFICIAL SEED DATA
# -----------------------------------------------------------------------------
OFFICIAL_SEED_TEMPLATES = [
    {
        "title": "Customer Feedback & Satisfaction",
        "category": "Feedback",
        "tags": ["feedback", "csat", "nps", "rating", "customer"],
        "description": "Collect valuable customer ratings, product experience feedback, and net promoter scores.",
        "template_schema": [
            {"field_label": "Customer Name", "field_type": "text", "is_required": False, "placeholder": "Jane Doe"},
            {"field_label": "Email Address", "field_type": "email", "is_required": False, "placeholder": "jane@example.com"},
            {"field_label": "Overall Product Rating", "field_type": "rating", "is_required": True},
            {"field_label": "Category of Feedback", "field_type": "select", "is_required": True, "options": ["User Experience", "Customer Support", "Pricing", "Features", "Other"]},
            {"field_label": "Detailed Comments & Suggestions", "field_type": "textarea", "is_required": True, "placeholder": "Share your experience with us..."}
        ],
        "created_by": "Formify Team",
        "usage_count": 3420,
        "is_public": True,
        "is_archived": False,
        "is_ai_generated": False,
        "version": "v1.0"
    },
    {
        "title": "Market Research & User Survey",
        "category": "Survey",
        "tags": ["survey", "market", "demographics", "research"],
        "description": "Gather target audience demographics, usage preferences, and product feature demand.",
        "template_schema": [
            {"field_label": "Age Bracket", "field_type": "select", "is_required": True, "options": ["Under 18", "18-24", "25-34", "35-44", "45+"]},
            {"field_label": "Discovery Channel", "field_type": "checkbox", "is_required": False, "options": ["Social Media", "Search Engine", "Friend Referral", "Online Ad"]},
            {"field_label": "Feature Importance Rating", "field_type": "linear_scale", "is_required": True},
            {"field_label": "Additional Research Notes", "field_type": "textarea", "is_required": False}
        ],
        "created_by": "Formify Team",
        "usage_count": 2180,
        "is_public": True,
        "is_archived": False,
        "is_ai_generated": False,
        "version": "v1.0"
    },
    {
        "title": "Knowledge Assessment Quiz",
        "category": "Quiz",
        "tags": ["quiz", "assessment", "test", "education"],
        "description": "Test user knowledge, assess skills, and evaluate training comprehension with auto-scored questions.",
        "template_schema": [
            {"field_label": "Participant Name", "field_type": "text", "is_required": True, "placeholder": "Alex Johnson"},
            {"field_label": "Select Primary Programming Language", "field_type": "radio", "is_required": True, "options": ["Python", "JavaScript / TypeScript", "Go", "Java"]},
            {"field_label": "What does HTTP stand for?", "field_type": "select", "is_required": True, "options": ["HyperText Transfer Protocol", "High Transfer Tech Protocol", "Hyperlink Text Process"]},
            {"field_label": "Rate Question Difficulty", "field_type": "rating", "is_required": False}
        ],
        "created_by": "Formify Team",
        "usage_count": 1890,
        "is_public": True,
        "is_archived": False,
        "is_ai_generated": False,
        "version": "v1.0"
    },
    {
        "title": "Student & Course Registration",
        "category": "Registration",
        "tags": ["registration", "student", "enrollment", "course"],
        "description": "Enroll students for upcoming academic courses, departments, and workshops.",
        "template_schema": [
            {"field_label": "Student Name", "field_type": "text", "is_required": True, "placeholder": "Michael Chang"},
            {"field_label": "Institutional Email", "field_type": "email", "is_required": True, "placeholder": "michael@edu.com"},
            {"field_label": "Department Selection", "field_type": "select", "is_required": True, "options": ["Computer Science", "Electrical Engineering", "Data Science", "Design"]},
            {"field_label": "Academic Year", "field_type": "number", "is_required": True, "placeholder": "2026"},
            {"field_label": "ID Verification Upload", "field_type": "file_upload", "is_required": False}
        ],
        "created_by": "Formify Team",
        "usage_count": 4120,
        "is_public": True,
        "is_archived": False,
        "is_ai_generated": False,
        "version": "v1.0"
    },
    {
        "title": "Job Application & Candidate Intake",
        "category": "Job Application",
        "tags": ["job", "application", "hr", "hiring", "resume"],
        "description": "Streamline recruiting by collecting candidate resumes, portfolio links, and employment history.",
        "template_schema": [
            {"field_label": "Full Legal Name", "field_type": "text", "is_required": True, "placeholder": "Sarah Parker"},
            {"field_label": "Email Address", "field_type": "email", "is_required": True, "placeholder": "sarah@domain.com"},
            {"field_label": "Phone Number", "field_type": "phone", "is_required": True, "placeholder": "+1 (555) 019-2831"},
            {"field_label": "Desired Position", "field_type": "select", "is_required": True, "options": ["Senior Frontend Engineer", "Backend Developer", "Product Manager", "UI/UX Designer"]},
            {"field_label": "Years of Relevant Experience", "field_type": "number", "is_required": True, "placeholder": "5"},
            {"field_label": "Resume & Cover Letter Upload", "field_type": "file_upload", "is_required": True}
        ],
        "created_by": "Formify Team",
        "usage_count": 5290,
        "is_public": True,
        "is_archived": False,
        "is_ai_generated": False,
        "version": "v1.0"
    },
    {
        "title": "Business Contact & Inquiries",
        "category": "Contact Form",
        "tags": ["contact", "inquiry", "sales", "support"],
        "description": "Capture incoming customer messages, sales inquiries, and support requests.",
        "template_schema": [
            {"field_label": "Sender Name", "field_type": "text", "is_required": True, "placeholder": "David Smith"},
            {"field_label": "Email Address", "field_type": "email", "is_required": True, "placeholder": "david@company.com"},
            {"field_label": "Inquiry Subject", "field_type": "text", "is_required": True, "placeholder": "Enterprise Plan Pricing"},
            {"field_label": "Message Content", "field_type": "textarea", "is_required": True, "placeholder": "How can we help you today?"}
        ],
        "created_by": "Formify Team",
        "usage_count": 6800,
        "is_public": True,
        "is_archived": False,
        "is_ai_generated": False,
        "version": "v1.0"
    },
    {
        "title": "Event & Conference Pass Registration",
        "category": "Event Registration",
        "tags": ["event", "conference", "summit", "tickets"],
        "description": "Register attendees for summit talks, workshops, ticket tiers, and dietary preferences.",
        "template_schema": [
            {"field_label": "Attendee Name", "field_type": "text", "is_required": True, "placeholder": "Emily Taylor"},
            {"field_label": "Work Email", "field_type": "email", "is_required": True, "placeholder": "emily@techsummit.io"},
            {"field_label": "Ticket Tier Selection", "field_type": "select", "is_required": True, "options": ["General Admission Pass", "VIP All-Access Pass", "Virtual Stream Pass"]},
            {"field_label": "Dietary Preference", "field_type": "checkbox", "is_required": False, "options": ["Vegetarian", "Vegan", "Gluten-Free", "Halal"]},
            {"field_label": "Attendance Date", "field_type": "date", "is_required": True}
        ],
        "created_by": "Formify Team",
        "usage_count": 3950,
        "is_public": True,
        "is_archived": False,
        "is_ai_generated": False,
        "version": "v1.0"
    }
]


def seed_templates_if_empty(db: Session):
    """
    Populates database with official templates if table is empty.
    """
    if db.query(TemplateModel).count() == 0:
        for t_data in OFFICIAL_SEED_TEMPLATES:
            tmpl = TemplateModel(**t_data)
            db.add(tmpl)
        db.commit()


# -----------------------------------------------------------------------------
# 1. GET /templates (List templates with filters)
# -----------------------------------------------------------------------------
@router.get("/", response_model=list[TemplateResponse])
def get_templates(
    category: str | None = None,
    q: str | None = None,
    scope: str | None = None,
    owner_only: bool = False,
    archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seed_templates_if_empty(db)
    query = db.query(TemplateModel)

    if scope == "official":
        query = query.filter(TemplateModel.owner_id.is_(None), TemplateModel.is_public == True)
    elif scope == "custom" or owner_only:
        query = query.filter(TemplateModel.owner_id == current_user.id)
    else:
        query = query.filter(
            or_(TemplateModel.owner_id == current_user.id, TemplateModel.is_public == True)
        )

    if archived:
        query = query.filter(TemplateModel.is_archived == True)
    else:
        query = query.filter(TemplateModel.is_archived == False)

    if category and category not in ["All", "Favorites", "My Templates", "Official"]:
        query = query.filter(TemplateModel.category.ilike(f"%{category}%"))

    if q and q.strip():
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                TemplateModel.title.ilike(search_term),
                TemplateModel.description.ilike(search_term),
                TemplateModel.category.ilike(search_term)
            )
        )

    return query.order_by(TemplateModel.created_at.desc()).all()


# -----------------------------------------------------------------------------
# 2. GET /templates/categories (List categories)
# -----------------------------------------------------------------------------
@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seed_templates_if_empty(db)
    cats = db.query(TemplateModel.category).distinct().all()
    categories_list = sorted([c[0] for c in cats if c[0]])
    return {"categories": ["All", "My Templates", *categories_list]}


# -----------------------------------------------------------------------------
# 3. GET /templates/search (Search endpoint)
# -----------------------------------------------------------------------------
@router.get("/search", response_model=list[TemplateResponse])
def search_templates(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seed_templates_if_empty(db)
    search_term = f"%{q.strip().lower()}%"
    templates = db.query(TemplateModel).filter(
        TemplateModel.is_archived == False,
        or_(
            TemplateModel.title.ilike(search_term),
            TemplateModel.description.ilike(search_term),
            TemplateModel.category.ilike(search_term)
        )
    ).order_by(TemplateModel.usage_count.desc()).all()
    return templates


# -----------------------------------------------------------------------------
# 4. GET /templates/:id (Get single template)
# -----------------------------------------------------------------------------
@router.get("/{template_id}", response_model=TemplateResponse)
def get_single_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seed_templates_if_empty(db)
    tmpl = db.query(TemplateModel).filter(TemplateModel.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tmpl


# -----------------------------------------------------------------------------
# 5. POST /templates (Create template)
# -----------------------------------------------------------------------------
@router.post("/", response_model=TemplateResponse, status_code=201)
def create_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tmpl = TemplateModel(
        title=data.title.strip(),
        description=data.description,
        category=data.category,
        tags=data.tags,
        template_schema=data.template_schema,
        created_by=current_user.name,
        owner_id=current_user.id,
        is_public=data.is_public,
        is_ai_generated=data.is_ai_generated,
        version="v1.0"
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl


# -----------------------------------------------------------------------------
# 6. PUT /templates/:id (Update template)
# -----------------------------------------------------------------------------
@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tmpl = db.query(TemplateModel).filter(TemplateModel.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    if tmpl.owner_id and tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this template")

    if data.title is not None:
        tmpl.title = data.title.strip()
    if data.description is not None:
        tmpl.description = data.description
    if data.category is not None:
        tmpl.category = data.category
    if data.tags is not None:
        tmpl.tags = data.tags
    if data.template_schema is not None:
        tmpl.template_schema = data.template_schema
    if data.is_public is not None:
        tmpl.is_public = data.is_public

    try:
        ver_num = float(tmpl.version.replace("v", "")) + 0.1
        tmpl.version = f"v{ver_num:.1f}"
    except:
        tmpl.version = "v1.1"

    db.commit()
    db.refresh(tmpl)
    return tmpl


# -----------------------------------------------------------------------------
# 7. DELETE /templates/:id (Delete template)
# -----------------------------------------------------------------------------
@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tmpl = db.query(TemplateModel).filter(TemplateModel.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    if tmpl.owner_id and tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this template")

    db.delete(tmpl)
    db.commit()
    return {"message": "Template deleted successfully"}


# -----------------------------------------------------------------------------
# 8. POST /templates/use (Instantiate template into Form + Version + Fields)
# -----------------------------------------------------------------------------
@router.post("/use")
def use_template(
    req: UseTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tmpl = db.query(TemplateModel).filter(TemplateModel.id == req.template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    # Increment template usage count
    tmpl.usage_count += 1

    # Create new Form
    new_form = Form(
        title=tmpl.title,
        description=tmpl.description,
        owner_id=current_user.id,
        status="draft"
    )
    db.add(new_form)
    db.commit()
    db.refresh(new_form)

    # Create Form Version
    new_version = FormVersion(
        form_id=new_form.id,
        version_number=1,
        is_published=False
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    # Populate Fields & Field Options
    schema_questions = tmpl.template_schema if isinstance(tmpl.template_schema, list) else tmpl.template_schema.get("questions", [])
    
    label_to_id = {}
    for idx, q in enumerate(schema_questions):
        label = q.get("field_label") or q.get("label") or f"Question {idx+1}"
        f = Field(
            form_version_id=new_version.id,
            label=label,
            field_type=q.get("field_type", "text"),
            placeholder=q.get("placeholder", ""),
            is_required=q.get("is_required", False),
            field_order=idx + 1,
            # Populate advanced field configurations if present
            help_text=q.get("help_text"),
            description=q.get("description"),
            is_read_only=q.get("is_read_only", False),
            is_hidden=q.get("is_hidden", False),
            default_value=q.get("default_value"),
            width=q.get("width", "full"),
            label_position=q.get("label_position", "top"),
            show_placeholder=q.get("show_placeholder", True),
            min_length=q.get("min_length"),
            max_length=q.get("max_length"),
            regex_pattern=q.get("regex_pattern"),
            validation_message=q.get("validation_message"),
            shuffle_options=q.get("shuffle_options", False),
            allow_other=q.get("allow_other", False),
            allow_multiple=q.get("allow_multiple", False),
            max_selections=q.get("max_selections"),
            allowed_file_types=q.get("allowed_file_types"),
            max_file_size_mb=q.get("max_file_size_mb"),
            max_files=q.get("max_files", 1)
        )
        db.add(f)
        db.commit()
        db.refresh(f)
        
        # Build mapping for trigger/target fields
        label_to_id[label.lower().strip()] = f.id

        if "options" in q and isinstance(q["options"], list):
            for o_idx, opt_text in enumerate(q["options"]):
                opt = FieldOption(
                    field_id=f.id,
                    option_text=str(opt_text),
                    option_order=o_idx
                )
                db.add(opt)

    db.commit()

    # Populate Conditional Logic Rules
    conditional_rules = []
    if isinstance(tmpl.template_schema, dict):
        conditional_rules = tmpl.template_schema.get("conditional_logic", []) or tmpl.template_schema.get("conditional_rules", [])

    if conditional_rules:
        from app.models.conditional_rule import ConditionalRule
        for r in conditional_rules:
            trigger_label = r.get("trigger_field") or r.get("trigger_field_label")
            target_label = r.get("target_field") or r.get("target_field_label")
            
            trigger_id = label_to_id.get(trigger_label.lower().strip()) if trigger_label else None
            target_id = label_to_id.get(target_label.lower().strip()) if target_label else None
            
            if target_id:
                rule_obj = ConditionalRule(
                    form_version_id=new_version.id,
                    trigger_field_id=trigger_id,
                    operator=r.get("operator", "equals"),
                    comparison_value=r.get("comparison_value") or r.get("value") or "",
                    target_field_id=target_id,
                    action=r.get("action", "show"),
                    logic_operator=r.get("logic_operator", "AND"),
                    rule_order=r.get("rule_order", 0)
                )
                db.add(rule_obj)
        db.commit()

    return {
        "message": f"Form created from template '{tmpl.title}'",
        "form_id": new_form.id,
        "version_id": new_version.id
    }


# -----------------------------------------------------------------------------
# 9. POST /templates/favorite (Toggle favorite)
# -----------------------------------------------------------------------------
@router.post("/favorite")
def favorite_template(
    req: FavoriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tmpl = db.query(TemplateModel).filter(TemplateModel.id == req.template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    tmpl.favorites_count += 1
    db.commit()
    return {"message": "Favorite recorded", "favorites_count": tmpl.favorites_count}


# -----------------------------------------------------------------------------
# 10. POST /templates/archive (Toggle archive)
# -----------------------------------------------------------------------------
@router.post("/archive")
def archive_template(
    req: ArchiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tmpl = db.query(TemplateModel).filter(TemplateModel.id == req.template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    if tmpl.owner_id and tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to archive this template")

    tmpl.is_archived = not tmpl.is_archived
    db.commit()
    return {"message": f"Template {'archived' if tmpl.is_archived else 'restored'}", "is_archived": tmpl.is_archived}


# -----------------------------------------------------------------------------
# 11. POST /templates/duplicate (Duplicate template)
# -----------------------------------------------------------------------------
@router.post("/duplicate", response_model=TemplateResponse)
def duplicate_template(
    req: UseTemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tmpl = db.query(TemplateModel).filter(TemplateModel.id == req.template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    cloned = TemplateModel(
        title=f"{tmpl.title} (Copy)",
        description=tmpl.description,
        category=tmpl.category,
        tags=tmpl.tags,
        template_schema=tmpl.template_schema,
        created_by=current_user.name,
        owner_id=current_user.id,
        is_public=False,
        version="v1.0"
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned


# -----------------------------------------------------------------------------
# 12. POST /templates/import (Import template JSON)
# -----------------------------------------------------------------------------
@router.post("/import", response_model=TemplateResponse)
def import_template(
    req: ImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        parsed = json.loads(req.raw_json)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON syntax: {str(e)}")

    title = parsed.get("title") or parsed.get("name") or "Imported Template"
    questions = parsed.get("questions") or parsed.get("fields") or []

    if not isinstance(questions, list) or len(questions) == 0:
        raise HTTPException(status_code=400, detail="Invalid template format: 'questions' must be a non-empty array.")

    tmpl = TemplateModel(
        title=title,
        description=parsed.get("description", "Imported template schema"),
        category=parsed.get("category", "Custom"),
        tags=parsed.get("tags", ["imported"]),
        template_schema=questions,
        created_by=current_user.name,
        owner_id=current_user.id,
        is_public=False,
        version="v1.0"
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl


# -----------------------------------------------------------------------------
# 13. POST /templates/ai-generate (AI Generate Template)
# -----------------------------------------------------------------------------
@router.post("/ai-generate", response_model=TemplateResponse)
def ai_generate_template(
    req: AiGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    from app.api.ai_generator import call_gemini_api
    generated_schema = call_gemini_api(req.prompt.strip())

    tmpl = TemplateModel(
        title=generated_schema.get("title", f"AI {req.prompt.title()}"),
        description=generated_schema.get("description", "AI synthesized form schema"),
        category=generated_schema.get("category", "Feedback"),
        tags=["ai-generated", "smart-schema"],
        template_schema=generated_schema,
        created_by="Formify AI",
        owner_id=current_user.id,
        is_public=False,
        is_ai_generated=True,
        version="v1.0"
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl
