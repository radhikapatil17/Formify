from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TemplateCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str = "Feedback"
    tags: list[str] = []
    template_schema: list[dict] | dict
    is_public: bool = True
    is_ai_generated: bool = False


class TemplateUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    template_schema: list[dict] | dict | None = None
    is_public: bool | None = None


class TemplateResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str
    tags: list[str] = []
    template_schema: list[dict] | dict
    created_by: str
    owner_id: int | None = None
    usage_count: int
    favorites_count: int
    is_public: bool
    is_archived: bool
    is_ai_generated: bool
    version: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UseTemplateRequest(BaseModel):
    template_id: int


class FavoriteRequest(BaseModel):
    template_id: int


class ArchiveRequest(BaseModel):
    template_id: int


class AiGenerateRequest(BaseModel):
    prompt: str
    category: str | None = "General"


class ImportRequest(BaseModel):
    raw_json: str
