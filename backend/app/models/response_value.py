from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.database import Base


class ResponseValue(Base):

    __tablename__ = "response_values"

    id = Column(Integer, primary_key=True, index=True)

    submission_id = Column(
        Integer,
        ForeignKey("submissions.id")
    )

    field_id = Column(
        Integer,
        ForeignKey("fields.id")
    )

    value_text = Column(String)

    file_url = Column(String)