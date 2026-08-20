from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.conditional_rule_schema import (
    ConditionalRuleCreate,
    ConditionalRuleUpdate
)

from app.repositories.conditional_rule_repository import (
    create_rule,
    get_rules_by_form_version,
    get_rule_by_id,
    update_rule,
    delete_rule
)


def create_new_rule(
    rule: ConditionalRuleCreate,
    db: Session
):
    return create_rule(rule, db)


def get_rules(
    form_version_id: int,
    db: Session
):
    return get_rules_by_form_version(form_version_id, db)


def get_single_rule(
    rule_id: int,
    db: Session
):
    db_rule = get_rule_by_id(rule_id, db)

    if not db_rule:
        raise HTTPException(
            status_code=404,
            detail="Conditional Rule not found"
        )

    return db_rule


def edit_rule(
    rule_id: int,
    rule: ConditionalRuleUpdate,
    db: Session
):
    db_rule = get_rule_by_id(rule_id, db)

    if not db_rule:
        raise HTTPException(
            status_code=404,
            detail="Conditional Rule not found"
        )

    return update_rule(
        db_rule,
        rule,
        db
    )


def remove_rule(
    rule_id: int,
    db: Session
):
    db_rule = get_rule_by_id(rule_id, db)

    if not db_rule:
        raise HTTPException(
            status_code=404,
            detail="Conditional Rule not found"
        )

    delete_rule(db_rule, db)

    return {
        "message": "Conditional Rule deleted successfully"
    }