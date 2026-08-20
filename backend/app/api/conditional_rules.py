from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.conditional_rule_schema import (
    ConditionalRuleCreate,
    ConditionalRuleUpdate,
    ConditionalRuleResponse
)

from app.services.conditional_rule_service import (
    create_new_rule,
    get_rules,
    get_single_rule,
    edit_rule,
    remove_rule
)

router = APIRouter(
    prefix="/conditional-rules",
    tags=["Conditional Rules"]
)


@router.post(
    "/",
    response_model=ConditionalRuleResponse
)
def create_conditional_rule(
    rule: ConditionalRuleCreate,
    db: Session = Depends(get_db)
):
    return create_new_rule(rule, db)


@router.get(
    "/form-version/{form_version_id}",
    response_model=list[ConditionalRuleResponse]
)
def read_conditional_rules(
    form_version_id: int,
    db: Session = Depends(get_db)
):
    return get_rules(form_version_id, db)


@router.get(
    "/{rule_id}",
    response_model=ConditionalRuleResponse
)
def read_conditional_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    return get_single_rule(rule_id, db)


@router.put(
    "/{rule_id}",
    response_model=ConditionalRuleResponse
)
def update_conditional_rule(
    rule_id: int,
    rule: ConditionalRuleUpdate,
    db: Session = Depends(get_db)
):
    return edit_rule(rule_id, rule, db)


@router.delete(
    "/{rule_id}"
)
def delete_conditional_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    return remove_rule(rule_id, db)