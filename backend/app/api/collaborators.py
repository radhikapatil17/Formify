from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import logging

logger = logging.getLogger(__name__)

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.form import Form
from app.models.form_collaborator import FormCollaborator
from app.core.permissions import verify_form_access

from app.schemas.form_collaborator_schema import (
    FormCollaboratorInvite,
    FormCollaboratorUpdate,
    FormCollaboratorResponse,
    InvitationResponse
)

router = APIRouter(
    tags=["Form Collaborators"]
)

# 1. Invite collaborator (Owner only)
@router.post(
    "/forms/{form_id}/collaborators",
    response_model=FormCollaboratorResponse
)
def invite_collaborator(
    form_id: int,
    invite: FormCollaboratorInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify owner access
    form = verify_form_access(db, current_user.id, form_id, required_role="owner")

    # Invite target user lookup
    invite_email = invite.email.strip().lower()
    target_user = db.query(User).filter(User.email == invite_email).first()
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User with this email is not registered on Formify."
        )

    # Owner cannot invite themselves
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot invite yourself as a collaborator."
        )

    # Check if already a collaborator
    existing = db.query(FormCollaborator).filter(
        FormCollaborator.form_id == form_id,
        FormCollaborator.user_id == target_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This user is already a collaborator or has a pending invitation."
        )

    new_collaborator = FormCollaborator(
        form_id=form_id,
        user_id=target_user.id,
        role=invite.role,
        status="pending"
    )
    db.add(new_collaborator)
    db.commit()
    db.refresh(new_collaborator)

    # Dispatch Collaboration Invitation Email
    frontend_base = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
    dashboard_url = f"{frontend_base}/dashboard"

    try:
        from app.services.email_service import send_collaboration_email_invitation
        send_collaboration_email_invitation(
            recipient_email=target_user.email,
            form_title=form.title,
            role=new_collaborator.role,
            sender_name=current_user.name or current_user.email,
            dashboard_url=dashboard_url
        )
    except Exception as e:
        logger.error(f"Failed to send email invitation to {target_user.email}: {str(e)}")

    return FormCollaboratorResponse(
        id=new_collaborator.id,
        form_id=new_collaborator.form_id,
        user_id=new_collaborator.user_id,
        email=target_user.email,
        name=target_user.name,
        role=new_collaborator.role,
        status=new_collaborator.status,
        created_at=new_collaborator.created_at
    )

# 2. Get list of collaborators (Owner / accepted collaborator)
@router.get(
    "/forms/{form_id}/collaborators",
    response_model=list[FormCollaboratorResponse]
)
def get_collaborators(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_form_access(db, current_user.id, form_id, required_role="viewer")

    collabs = db.query(FormCollaborator).filter(FormCollaborator.form_id == form_id).all()
    
    response_list = []
    for c in collabs:
        usr = db.query(User).filter(User.id == c.user_id).first()
        response_list.append(
            FormCollaboratorResponse(
                id=c.id,
                form_id=c.form_id,
                user_id=c.user_id,
                email=usr.email if usr else "Unknown User",
                name=usr.name if usr else "Unknown",
                role=c.role,
                status=c.status,
                created_at=c.created_at
            )
        )
    return response_list

# 3. Update collaborator role (Owner only)
@router.put(
    "/forms/{form_id}/collaborators/{collaborator_id}",
    response_model=FormCollaboratorResponse
)
def update_collaborator_role(
    form_id: int,
    collaborator_id: int,
    update: FormCollaboratorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_form_access(db, current_user.id, form_id, required_role="owner")

    collab = db.query(FormCollaborator).filter(
        FormCollaborator.id == collaborator_id,
        FormCollaborator.form_id == form_id
    ).first()

    if not collab:
        raise HTTPException(
            status_code=404,
            detail="Collaborator record not found."
        )

    collab.role = update.role
    db.commit()
    db.refresh(collab)

    usr = db.query(User).filter(User.id == collab.user_id).first()
    return FormCollaboratorResponse(
        id=collab.id,
        form_id=collab.form_id,
        user_id=collab.user_id,
        email=usr.email if usr else "",
        name=usr.name if usr else "",
        role=collab.role,
        status=collab.status,
        created_at=collab.created_at
    )

# 4. Remove collaborator (Owner only)
@router.delete(
    "/forms/{form_id}/collaborators/{collaborator_id}"
)
def remove_collaborator(
    form_id: int,
    collaborator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_form_access(db, current_user.id, form_id, required_role="owner")

    collab = db.query(FormCollaborator).filter(
        FormCollaborator.id == collaborator_id,
        FormCollaborator.form_id == form_id
    ).first()

    if not collab:
        raise HTTPException(
            status_code=404,
            detail="Collaborator record not found."
        )

    db.delete(collab)
    db.commit()
    return {"message": "Collaborator removed successfully."}

# 5. Get user's pending invitations
@router.get(
    "/collaborators/invitations",
    response_model=list[InvitationResponse]
)
def get_pending_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invites = db.query(FormCollaborator).filter(
        FormCollaborator.user_id == current_user.id,
        FormCollaborator.status == "pending"
    ).all()

    response_list = []
    for invite in invites:
        form = db.query(Form).filter(Form.id == invite.form_id).first()
        if form:
            owner = db.query(User).filter(User.id == form.owner_id).first()
            response_list.append(
                InvitationResponse(
                    id=invite.id,
                    form_id=invite.form_id,
                    form_title=form.title,
                    form_description=form.description,
                    owner_email=owner.email if owner else "",
                    role=invite.role,
                    status=invite.status,
                    created_at=invite.created_at
                )
            )
    return response_list

# 6. Accept invitation
@router.post(
    "/collaborators/invitations/{collaborator_id}/accept",
    response_model=InvitationResponse
)
def accept_invitation(
    collaborator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(FormCollaborator).filter(
        FormCollaborator.id == collaborator_id,
        FormCollaborator.user_id == current_user.id
    ).first()

    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found."
        )

    invite.status = "accepted"
    db.commit()
    db.refresh(invite)

    form = db.query(Form).filter(Form.id == invite.form_id).first()
    owner = db.query(User).filter(User.id == form.owner_id).first() if form else None

    return InvitationResponse(
        id=invite.id,
        form_id=invite.form_id,
        form_title=form.title if form else "Form",
        form_description=form.description if form else "",
        owner_email=owner.email if owner else "",
        role=invite.role,
        status=invite.status,
        created_at=invite.created_at
    )

# 7. Decline invitation
@router.post(
    "/collaborators/invitations/{collaborator_id}/decline"
)
def decline_invitation(
    collaborator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(FormCollaborator).filter(
        FormCollaborator.id == collaborator_id,
        FormCollaborator.user_id == current_user.id
    ).first()

    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found."
        )

    db.delete(invite)
    db.commit()
    return {"message": "Invitation declined successfully."}
