import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.field import Field
from app.models.form_version import FormVersion
from app.repositories.form_version_repository import get_published_form
from app.services.lookup_service import (
    execute_lookup,
    check_rate_limit,
    validate_and_check_ssrf,
)

router = APIRouter(
    tags=["Dynamic API Lookup"]
)


class LookupTestRequest(BaseModel):
    endpoint: str
    method: str = "GET"
    input_value: Optional[str] = None
    query_params: Optional[List[Dict[str, str]]] = None
    headers: Optional[List[Dict[str, str]]] = None
    body: Optional[Any] = None
    response_mappings: Optional[List[Dict[str, Any]]] = None


class PublicLookupRequest(BaseModel):
    input_value: str


def get_client_ip(request: Request) -> str:
    """Extracts client IP from request forwarding headers or client host."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.post("/lookup/test")
async def test_external_lookup(
    payload: LookupTestRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Authenticated endpoint for form creators to test their lookup configuration
    with a sample input value and preview the mapped outputs before publishing.
    """
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a minute before making further lookup requests.",
        )

    try:
        result = await execute_lookup(
            endpoint=payload.endpoint,
            method=payload.method,
            input_value=payload.input_value,
            query_params=payload.query_params,
            headers=payload.headers,
            body=payload.body,
            response_mappings=payload.response_mappings,
            timeout_seconds=6.0,
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lookup failed: {str(exc)}",
        )


@router.post("/public/forms/{public_link}/lookup/{field_id}")
async def execute_public_form_lookup(
    public_link: str,
    field_id: int,
    payload: PublicLookupRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public proxy endpoint for respondents filling out a form.
    Executes the configured external API call securely on the server without
    exposing secret headers or internal credentials to the browser,
    and returns mapped field values.
    """
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        return {
            "success": False,
            "error": "Too many lookup requests. Please try again in a moment.",
            "mapped_values": {},
        }

    # Verify form version exists and is published
    version = get_published_form(public_link, db)
    if not version:
        raise HTTPException(status_code=404, detail="Form not found or not published.")

    # Find field in this version
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.form_version_id == version.id
    ).first()

    if not field:
        raise HTTPException(status_code=404, detail="Field not found in this form.")

    if not field.lookup_config:
        return {
            "success": False,
            "error": "No lookup configuration is defined for this field.",
            "mapped_values": {},
        }

    try:
        config = json.loads(field.lookup_config) if isinstance(field.lookup_config, str) else field.lookup_config
    except Exception:
        return {
            "success": False,
            "error": "Malformed lookup configuration.",
            "mapped_values": {},
        }

    if not config.get("is_enabled", True):
        return {
            "success": False,
            "error": "API lookup is currently disabled for this field.",
            "mapped_values": {},
        }

    endpoint = config.get("endpoint")
    if not endpoint:
        return {
            "success": False,
            "error": "No API endpoint configured.",
            "mapped_values": {},
        }

    method = config.get("method", "GET")
    query_params = config.get("query_params")
    headers = config.get("headers")
    body = config.get("body")
    response_mappings = config.get("response_mappings", [])

    try:
        result = await execute_lookup(
            endpoint=endpoint,
            method=method,
            input_value=payload.input_value,
            query_params=query_params,
            headers=headers,
            body=body,
            response_mappings=response_mappings,
            timeout_seconds=6.0,
        )
        return {
            "success": result.get("success", False),
            "status_code": result.get("status_code"),
            "latency_ms": result.get("latency_ms"),
            "mapped_values": result.get("mapped_values", {}),
            "raw_response": result.get("raw_response") if result.get("success") else None,
            "error": None if result.get("success") else f"API returned status {result.get('status_code')}",
        }
    except Exception as exc:
        # Graceful return so form submission is not blocked if external API is temporarily down
        return {
            "success": False,
            "error": str(exc),
            "mapped_values": {},
        }
