from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    user_id: int | None = None
    title: str
    message: str
    type: str = "info"


class NotificationResponse(BaseModel):
    id: int
    user_id: int | None = None
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
