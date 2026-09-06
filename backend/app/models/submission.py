from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database.database import Base


class Submission(Base):

    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)

    form_version_id = Column(
        Integer,
        ForeignKey("form_versions.id")
    )

    respondent_identifier = Column(String)

    client_id = Column(String, nullable=True, index=True)

    status = Column(String, default="submitted")

    started_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    submitted_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )