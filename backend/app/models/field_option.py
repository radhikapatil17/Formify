from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.database import Base


class FieldOption(Base):
    __tablename__ = "field_options"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"))
    option_text = Column(String, nullable=False)
    option_order = Column(Integer, default=0)