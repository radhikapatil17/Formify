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

from app.api.auth import get_current_user
from app.models.user import User

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_version_access
    verify_version_access(db, current_user.id, rule.form_version_id, required_role="editor")
    return create_new_rule(rule, db)


@router.get(
    "/form-version/{form_version_id}",
    response_model=list[ConditionalRuleResponse]
)
def read_conditional_rules(
    form_version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_version_access
    verify_version_access(db, current_user.id, form_version_id, required_role="viewer")
    return get_rules(form_version_id, db)


@router.get(
    "/{rule_id}",
    response_model=ConditionalRuleResponse
)
def read_conditional_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_rule_access
    verify_rule_access(db, current_user.id, rule_id, required_role="viewer")
    return get_single_rule(rule_id, db)


@router.put(
    "/{rule_id}",
    response_model=ConditionalRuleResponse
)
def update_conditional_rule(
    rule_id: int,
    rule: ConditionalRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_rule_access
    verify_rule_access(db, current_user.id, rule_id, required_role="editor")
    return edit_rule(rule_id, rule, db)


@router.delete(
    "/{rule_id}"
)
def delete_conditional_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.permissions import verify_rule_access
    verify_rule_access(db, current_user.id, rule_id, required_role="editor")
    return remove_rule(rule_id, db)