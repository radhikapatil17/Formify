from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FormVersionCreate(BaseModel):
    form_id: int
    version_number: int


class FormVersionUpdate(BaseModel):
    is_published: bool
    public_link: str | None = None


class FormVersionResponse(BaseModel):
    id: int
    form_id: int
    version_number: int
    is_published: bool
    published_at: datetime | None = None
    public_link: str | None = None

    model_config = ConfigDict(from_attributes=True)