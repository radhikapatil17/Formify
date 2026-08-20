from pydantic import BaseModel, EmailStr
from typing import Optional

class EmailShareRequest(BaseModel):
    form_id: int
    recipient_email: EmailStr
    subject: Optional[str] = None
    custom_message: Optional[str] = None
    public_url: Optional[str] = None

class EmailShareResponse(BaseModel):
    success: bool
    message: str
    recipient: str
    simulated: Optional[bool] = False
