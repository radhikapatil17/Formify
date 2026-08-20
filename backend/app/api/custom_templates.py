from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.custom_template import CustomTemplate

router = APIRouter(
    prefix="/custom-templates",
    tags=["Custom Templates"]
)


class TemplateCreate(BaseModel):
    title: str
    description: str | None = None
    category: str = "Feedback"
    is_public: bool = False
    questions: list = []


class TemplateUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    is_public: bool | None = None
    questions: list | None = None


@router.get("/")
def get_custom_templates(
    owner_only: bool = False,
    archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns user's custom templates and ecosystem templates.
    """
    query = db.query(CustomTemplate)

    if owner_only:
        query = query.filter(CustomTemplate.owner_id == current_user.id)
    else:
        query = query.filter(
            (CustomTemplate.owner_id == current_user.id) | (CustomTemplate.is_public == True)
        )

    if not archived:
        query = query.filter(CustomTemplate.is_archived == False)
    else:
        query = query.filter(CustomTemplate.is_archived == True)

    templates = query.order_by(CustomTemplate.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "category": t.category or "Feedback",
            "is_public": t.is_public,
            "is_archived": t.is_archived,
            "is_custom": True,
            "owner_id": t.owner_id,
            "created_by": "You" if t.owner_id == current_user.id else "Shared",
            "version": t.version or "v1.0",
            "usage_count": t.usage_count or 0,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "questions": t.questions_schema or [
                {"field_label": "Full Name", "field_type": "text", "is_required": True},
                {"field_label": "Email Address", "field_type": "email", "is_required": True}
            ],
            "est_time": f"{max(1, len(t.questions_schema or []))} mins",
            "tags": [t.category.lower(), "custom"] if t.category else ["custom"]
        }
        for t in templates
    ]


@router.post("/")
def create_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new custom template schema in database.
    """
    if not data.title.strip():
        raise HTTPException(status_code=400, detail="Template title is required")

    tmpl = CustomTemplate(
        owner_id=current_user.id,
        title=data.title.strip(),
        description=data.description,
        category=data.category,
        is_public=data.is_public,
        questions_schema=data.questions or [
            {"field_label": "Full Name", "field_type": "text", "is_required": True},
            {"field_label": "Email Address", "field_type": "email", "is_required": True}
        ]
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.put("/{template_id}")
def update_template(
    template_id: int,
    data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates template details. Only owner can edit.
    """
    tmpl = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    if tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only template owner can edit this template")

    if data.title is not None:
        tmpl.title = data.title.strip()
    if data.description is not None:
        tmpl.description = data.description
    if data.category is not None:
        tmpl.category = data.category
    if data.is_public is not None:
        tmpl.is_public = data.is_public
    if data.questions is not None:
        tmpl.questions_schema = data.questions

    # Increment version number
    try:
        ver_num = float(tmpl.version.replace("v", "")) + 0.1
        tmpl.version = f"v{ver_num:.1f}"
    except:
        tmpl.version = "v1.1"

    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes template. Only owner can delete.
    """
    tmpl = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    if tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only template owner can delete this template")

    db.delete(tmpl)
    db.commit()
    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/duplicate")
def duplicate_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clones existing template into a new custom template for user.
    """
    tmpl = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")

    cloned = CustomTemplate(
        owner_id=current_user.id,
        title=f"{tmpl.title} (Copy)",
        description=tmpl.description,
        category=tmpl.category,
        is_public=False,
        questions_schema=tmpl.questions_schema
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned


@router.put("/{template_id}/archive")
def archive_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Archives a custom template.
    """
    tmpl = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    if tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only template owner can archive this template")

    tmpl.is_archived = True
    db.commit()
    return {"message": "Template archived successfully"}


@router.put("/{template_id}/restore")
def restore_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Restores an archived custom template.
    """
    tmpl = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    if tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only template owner can restore this template")

    tmpl.is_archived = False
    db.commit()
    return {"message": "Template restored successfully"}


@router.put("/{template_id}/publish")
def toggle_publish_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggles public / private visibility.
    """
    tmpl = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    if tmpl.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only template owner can change template visibility")

    tmpl.is_public = not tmpl.is_public
    db.commit()
    return {"message": f"Template is now {'public' if tmpl.is_public else 'private'}", "is_public": tmpl.is_public}
