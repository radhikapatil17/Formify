from pydantic import BaseModel, ConfigDict


class ResponseValueCreate(BaseModel):
    submission_id: int
    field_id: int
    value: str


class ResponseValueUpdate(BaseModel):
    value: str


class ResponseValueResponse(BaseModel):
    id: int
    submission_id: int
    field_id: int
    value: str

    model_config = ConfigDict(from_attributes=True)