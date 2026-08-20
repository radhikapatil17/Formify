from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

RuleAction = Literal[
    "show",
    "hide",
    "make_required",
    "make_optional",
    "require",
    "optional",
    "skip_to_question",
    "skip_to_section",
    "skip_to_page",
    "end_form",
    "continue",
]


class ConditionalRuleCreate(BaseModel):
    form_version_id: int
    trigger_field_id: Optional[int] = None
    operator: Optional[str] = "=="
    comparison_value: Optional[str] = ""
    target_field_id: int
    action: RuleAction
    logic_operator: Optional[str] = "AND"
    conditions_json: Optional[str] = None
    rule_order: Optional[int] = 0


class ConditionalRuleUpdate(BaseModel):
    trigger_field_id: Optional[int] = None
    operator: Optional[str] = None
    comparison_value: Optional[str] = None
    target_field_id: Optional[int] = None
    action: Optional[RuleAction] = None
    logic_operator: Optional[str] = None
    conditions_json: Optional[str] = None
    rule_order: Optional[int] = None


class ConditionalRuleResponse(BaseModel):
    id: int
    form_version_id: int
    trigger_field_id: Optional[int] = None
    operator: Optional[str] = None
    comparison_value: Optional[str] = None
    target_field_id: int
    action: str
    logic_operator: Optional[str] = "AND"
    conditions_json: Optional[str] = None
    rule_order: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)