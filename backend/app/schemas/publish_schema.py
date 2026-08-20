from pydantic import BaseModel


class PublishResponse(BaseModel):
    message: str
    public_link: str | None = None