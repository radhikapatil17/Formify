from sqlalchemy import Column, Integer, String, ForeignKey, Text
from app.database.database import Base

class ConditionalRule(Base):
    __tablename__ = "conditional_rules"

    id = Column(Integer, primary_key=True, index=True)

    form_version_id = Column(Integer, ForeignKey("form_versions.id"))

    trigger_field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)

    operator = Column(String, nullable=True)

    comparison_value = Column(String, nullable=True)

    target_field_id = Column(Integer, ForeignKey("fields.id"))

    action = Column(String)

    logic_operator = Column(String, default="AND")

    conditions_json = Column(Text, nullable=True)

    rule_order = Column(Integer, default=0)