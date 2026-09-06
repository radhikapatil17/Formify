from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class FormCollaboratorInvite(BaseModel):
    email: str = Field(..., min_length=1)
    role: str = "viewer"  # 'viewer' or 'editor'

class FormCollaboratorUpdate(BaseModel):
    role: str  # 'viewer' or 'editor'

class FormCollaboratorResponse(BaseModel):
    id: int
    form_id: int
    user_id: int
    email: str | None = None
    name: str | None = None
    role: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InvitationResponse(BaseModel):
    id: int
    form_id: int
    form_title: str
    form_description: str | None = None
    owner_email: str | None = None
    role: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
