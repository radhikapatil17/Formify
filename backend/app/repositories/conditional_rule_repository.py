from sqlalchemy.orm import Session

from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.submission import Submission
from app.models.response_value import ResponseValue
from app.models.notification import Notification
from app.schemas.conditional_rule_schema import (
    ConditionalRuleCreate,
    ConditionalRuleUpdate
)


def create_rule(rule: ConditionalRuleCreate, db: Session):
    db_rule = ConditionalRule(
        form_version_id=rule.form_version_id,
        trigger_field_id=rule.trigger_field_id,
        operator=rule.operator,
        comparison_value=rule.comparison_value,
        target_field_id=rule.target_field_id,
        action=rule.action,
        logic_operator=rule.logic_operator or "AND",
        conditions_json=rule.conditions_json,
        rule_order=rule.rule_order or 0,
    )

    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)

    return db_rule


def get_rules_by_form_version(form_version_id: int, db: Session):
    return (
        db.query(ConditionalRule)
        .filter(
            ConditionalRule.form_version_id == form_version_id
        )
        .order_by(ConditionalRule.rule_order.asc(), ConditionalRule.id.asc())
        .all()
    )


def get_rule_by_id(rule_id: int, db: Session):
    return (
        db.query(ConditionalRule)
        .filter(ConditionalRule.id == rule_id)
        .first()
    )


def update_rule(
    db_rule: ConditionalRule,
    rule: ConditionalRuleUpdate,
    db: Session
):
    if rule.trigger_field_id is not None:
        db_rule.trigger_field_id = rule.trigger_field_id
    if rule.operator is not None:
        db_rule.operator = rule.operator
    if rule.comparison_value is not None:
        db_rule.comparison_value = rule.comparison_value
    if rule.target_field_id is not None:
        db_rule.target_field_id = rule.target_field_id
    if rule.action is not None:
        db_rule.action = rule.action
    if rule.logic_operator is not None:
        db_rule.logic_operator = rule.logic_operator
    if rule.conditions_json is not None:
        db_rule.conditions_json = rule.conditions_json
    if rule.rule_order is not None:
        db_rule.rule_order = rule.rule_order

    db.commit()
    db.refresh(db_rule)

    return db_rule


def delete_rule(
    db_rule: ConditionalRule,
    db: Session
):
    db.delete(db_rule)
    db.commit()
    
def get_rules_by_version(
    db,
    version_id: int
):
    return (
        db.query(ConditionalRule)
        .filter(
            ConditionalRule.form_version_id == version_id
        )
        .order_by(ConditionalRule.rule_order.asc(), ConditionalRule.id.asc())
        .all()
    )