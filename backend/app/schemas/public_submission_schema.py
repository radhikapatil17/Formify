from pydantic import BaseModel
from typing import Optional


class ResponseItem(BaseModel):
    field_id: int
    value: Optional[str] = ""


class PublicSubmissionCreate(BaseModel):
    responses: list[ResponseItem]


class PublicSubmissionResponse(BaseModel):
    message: str
    submission_id: int