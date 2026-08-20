from pydantic import BaseModel, ConfigDict
from typing import Optional


class FieldOptionCreate(BaseModel):
    field_id: int
    option_text: str
    option_order: int = 0


class FieldOptionUpdate(BaseModel):
    option_text: str
    option_order: Optional[int] = None


class FieldOptionResponse(BaseModel):
    id: int
    field_id: int
    option_text: str
    option_order: int

    model_config = ConfigDict(from_attributes=True)