import os
import json
import urllib.request
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/ai/doctor",
    tags=["AI Form Doctor"]
)


class FieldSchemaPayload(BaseModel):
    id: Optional[Any] = None
    label: Optional[str] = ""
    field_type: Optional[str] = "text"
    placeholder: Optional[str] = ""
    help_text: Optional[str] = ""
    is_required: Optional[bool] = False
    is_hidden: Optional[bool] = False
    min_length: Optional[Any] = None
    max_length: Optional[Any] = None
    regex_pattern: Optional[str] = None
    validation_message: Optional[str] = None
    options: Optional[List[Any]] = []


class DoctorAnalyzeRequest(BaseModel):
    form_title: Optional[str] = "Untitled Form"
    description: Optional[str] = ""
    category: Optional[str] = "General"
    fields: Optional[List[FieldSchemaPayload]] = []
    conditional_rules: Optional[List[Dict[str, Any]]] = []


@router.post("/analyze")
def analyze_form_health(
    payload: DoctorAnalyzeRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyzes form schema for structural, clarity, validation, logic, and accessibility issues.
    Returns audit score, issue list with Critical/Warning/Suggestion severities, and AI fix actions.
    """
    form_data = {
        "title": payload.form_title or "Untitled Form",
        "description": payload.description or "",
        "category": payload.category or "General",
        "fields_count": len(payload.fields or []),
        "fields": [f.dict() for f in (payload.fields or [])],
        "conditional_rules": payload.conditional_rules or []
    }

    # Attempt Gemini AI analysis
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        ai_res = call_gemini_doctor(form_data, gemini_key)
        if ai_res:
            return ai_res

    # Local fallback rule audit engine
    return local_doctor_audit(form_data)


def call_gemini_doctor(form_data: Dict[str, Any], gemini_key: str) -> Optional[Dict[str, Any]]:
    sys_prompt = (
        "You are the AI Form Doctor for Formify. Analyze the provided form schema and audit it for:\n"
        "1. Question clarity & vague labels\n"
        "2. Duplicate/redundant questions\n"
        "3. Missing or weak validation (email/phone regex, numeric bounds, rating scale limits)\n"
        "4. Required-field configuration problems\n"
        "5. Conditional logic issues & broken targets\n"
        "6. Question flow & ordering\n"
        "7. Excessive form length & missing page breaks\n"
        "8. Accessibility issues & missing placeholders\n"
        "9. Confusing wording\n"
        "10. Unnecessary questions\n\n"
        "Return a raw JSON object ONLY with keys:\n"
        "- 'health_score': (integer 0-100)\n"
        "- 'summary': (string concise overall diagnosis)\n"
        "- 'issues': list of objects with keys:\n"
        "  - 'id': (string unique ID like 'iss_1')\n"
        "  - 'field_id': (field ID if question-specific, or null)\n"
        "  - 'field_label': (field label or 'Form Structure')\n"
        "  - 'category': (one of 'Validation', 'Clarity', 'Logic', 'Accessibility', 'Flow', 'Length', 'Redundancy')\n"
        "  - 'severity': (one of 'critical', 'warning', 'suggestion')\n"
        "  - 'problem': (string why it is a problem)\n"
        "  - 'recommendation': (string recommended improvement)\n"
        "  - 'can_auto_fix': (boolean)\n"
        "  - 'fix_action': (object with 'type': 'update_field', 'field_id': ID, 'updates': { key: value } or null)\n\n"
        "Do NOT include markdown formatting. Return ONLY raw JSON."
    )

    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    user_prompt = f"Form Schema Data:\n{json.dumps(form_data, indent=2)}"

    for model in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{sys_prompt}\n\n{user_prompt}"}]}
                ]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=14) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

                if text.startswith("```"):
                    lines = text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    text = "\n".join(lines).strip()

                parsed = json.loads(text)
                if "health_score" in parsed and "issues" in parsed:
                    return parsed
        except Exception as e:
            print(f"[AI Form Doctor] Error with model {model}: {e}")

    return None


def local_doctor_audit(form_data: Dict[str, Any]) -> Dict[str, Any]:
    fields = form_data.get("fields", [])
    rules = form_data.get("conditional_rules", [])
    title = form_data.get("title", "Form")

    issues = []
    issue_counter = 1

    field_labels_map = {}
    required_count = 0

    for idx, f in enumerate(fields):
        f_id = f.get("id") or idx + 1
        label = (f.get("label") or "").strip()
        f_type = f.get("field_type") or f.get("type") or "text"

        if f.get("is_required"):
            required_count += 1

        # Skip layout blocks
        if f_type in ("heading", "description", "section_divider", "page_break", "image", "video"):
            continue

        # 1. Question Clarity / Generic Label Audit
        if not label or label.lower() in ("untitled", "field", "question", "text", "input", "new question"):
            issues.append({
                "id": f"iss_{issue_counter}",
                "field_id": f_id,
                "field_label": label or f"Question #{idx + 1}",
                "category": "Clarity",
                "severity": "critical",
                "problem": "Generic or missing question label makes it confusing for respondents.",
                "recommendation": "Provide a descriptive label clearly explaining what information is requested.",
                "can_auto_fix": True,
                "fix_action": {
                    "type": "update_field",
                    "field_id": f_id,
                    "updates": {"label": f"Please enter your {f_type.replace('_', ' ')}"}
                }
            })
            issue_counter += 1

        # 2. Duplicate Questions Audit
        lower_lbl = label.lower()
        if lower_lbl in field_labels_map:
            issues.append({
                "id": f"iss_{issue_counter}",
                "field_id": f_id,
                "field_label": label,
                "category": "Redundancy",
                "severity": "warning",
                "problem": f"Duplicate question label detected! Same label as Question #{field_labels_map[lower_lbl] + 1}.",
                "recommendation": "Differentiate duplicate labels to avoid user confusion and data overlap.",
                "can_auto_fix": True,
                "fix_action": {
                    "type": "update_field",
                    "field_id": f_id,
                    "updates": {"label": f"{label} (Additional)"}
                }
            })
            issue_counter += 1
        else:
            field_labels_map[lower_lbl] = idx

        # 3. Missing / Weak Validation Audit
        if f_type == "email" and not f.get("validation_message"):
            issues.append({
                "id": f"iss_{issue_counter}",
                "field_id": f_id,
                "field_label": label,
                "category": "Validation",
                "severity": "warning",
                "problem": "Email field lacks a custom error validation message.",
                "recommendation": "Add a clear error message to guide users when an invalid email format is entered.",
                "can_auto_fix": True,
                "fix_action": {
                    "type": "update_field",
                    "field_id": f_id,
                    "updates": {"validation_message": "Please enter a valid email address (e.g. user@example.com)."}
                }
            })
            issue_counter += 1

        if f_type == "phone" and not f.get("placeholder"):
            issues.append({
                "id": f"iss_{issue_counter}",
                "field_id": f_id,
                "field_label": label,
                "category": "Accessibility",
                "severity": "suggestion",
                "problem": "Phone field missing format placeholder hint.",
                "recommendation": "Provide placeholder text like '+1 (555) 000-0000' showing expected phone structure.",
                "can_auto_fix": True,
                "fix_action": {
                    "type": "update_field",
                    "field_id": f_id,
                    "updates": {"placeholder": "+1 (555) 000-0000"}
                }
            })
            issue_counter += 1

        # 4. Placeholder & Accessibility Audit
        if f_type in ("text", "textarea") and not f.get("placeholder"):
            issues.append({
                "id": f"iss_{issue_counter}",
                "field_id": f_id,
                "field_label": label,
                "category": "Accessibility",
                "severity": "suggestion",
                "problem": "Field is missing helper placeholder text.",
                "recommendation": "Add a helpful placeholder prompt to guide respondents.",
                "can_auto_fix": True,
                "fix_action": {
                    "type": "update_field",
                    "field_id": f_id,
                    "updates": {"placeholder": f"Type your {label.lower()}..."}
                }
            })
            issue_counter += 1

    # 5. Required Field Ratio Audit
    total_q = len([f for f in fields if (f.get("field_type") or f.get("type")) not in ("heading", "description", "section_divider", "page_break")])
    if total_q > 5 and required_count == total_q:
        issues.append({
            "id": f"iss_{issue_counter}",
            "field_id": None,
            "field_label": "Form Structure",
            "category": "Flow",
            "severity": "warning",
            "problem": "100% of questions are marked as Required, which increases form drop-off rates.",
            "recommendation": "Mark optional questions as non-required to improve overall completion conversion.",
            "can_auto_fix": False,
            "fix_action": None
        })
        issue_counter += 1

    # 6. Form Length & Pagination Audit
    if total_q > 12:
        has_page_break = any((f.get("field_type") or f.get("type")) == "page_break" for f in fields)
        if not has_page_break:
            issues.append({
                "id": f"iss_{issue_counter}",
                "field_id": None,
                "field_label": "Form Length",
                "category": "Length",
                "severity": "warning",
                "problem": f"Form has {total_q} questions on a single page without multi-page breaks.",
                "recommendation": "Add Page Breaks to break long forms into multi-step wizard sections.",
                "can_auto_fix": False,
                "fix_action": None
            })
            issue_counter += 1

    # Health score calculation
    critical_cnt = sum(1 for i in issues if i["severity"] == "critical")
    warning_cnt = sum(1 for i in issues if i["severity"] == "warning")
    suggestion_cnt = sum(1 for i in issues if i["severity"] == "suggestion")

    deduction = (critical_cnt * 15) + (warning_cnt * 7) + (suggestion_cnt * 3)
    health_score = max(35, 100 - deduction)

    if not issues:
        summary = f"Excellent! '{title}' has zero detected schema issues and achieves a 100% Form Health Score."
    else:
        summary = f"Detected {len(issues)} potential issue(s) across '{title}'. Health Score is {health_score}/100."

    return {
        "health_score": health_score,
        "summary": summary,
        "issues": issues
    }
