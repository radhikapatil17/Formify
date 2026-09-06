from pydantic import BaseModel
from typing import Optional


class ResponseItem(BaseModel):
    field_id: int
    value: Optional[str] = ""


class PublicSubmissionCreate(BaseModel):
    client_id: Optional[str] = None
    resume_token: Optional[str] = None
    verification_tokens: Optional[list[str]] = []
    responses: list[ResponseItem]


class PublicSubmissionResponse(BaseModel):
    message: str
    submission_id: int