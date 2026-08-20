from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SubmissionCreate(BaseModel):
    form_version_id: int


class SubmissionResponse(BaseModel):
    id: int
    form_version_id: int
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)