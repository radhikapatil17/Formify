from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FormCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str | None = "General"


class FormUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    status: str | None = None
    theme_config: str | None = None
    is_scheduling_enabled: bool | None = None
    schedule_start_time: datetime | None = None
    schedule_end_time: datetime | None = None
    is_response_limit_enabled: bool | None = None
    max_response_limit: int | None = None


class FormResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str | None = "General"
    status: str | None = "draft"
    theme_config: str | None = None
    is_scheduling_enabled: bool = False
    schedule_start_time: datetime | None = None
    schedule_end_time: datetime | None = None
    is_response_limit_enabled: bool = False
    max_response_limit: int | None = None
    owner_id: int
    owner_email: str | None = None
    owner_name: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    submissions_count: int | None = 0
    fields_count: int | None = 0
    public_link: str | None = None
    latest_version_id: int | None = None

    model_config = ConfigDict(from_attributes=True)