from pydantic import BaseModel
from typing import Optional, Dict, Any


class SaveDraftRequest(BaseModel):
    resume_token: Optional[str] = None
    answers: Dict[str, Any]
    current_page: Optional[int] = 0
    respondent_email: Optional[str] = None


class SaveDraftResponse(BaseModel):
    resume_token: str
    resume_url: str
    saved_at: str
    message: str


class ResumeDraftResponse(BaseModel):
    resume_token: str
    public_link: str
    answers: Dict[str, Any]
    current_page: int
    respondent_email: Optional[str] = None
    updated_at: str


class SendResumeEmailRequest(BaseModel):
    email: str
    resume_url: str
