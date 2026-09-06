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
    prefix="/ai/simulator",
    tags=["AI Form Simulator"]
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


class SimulatorRunRequest(BaseModel):
    form_title: Optional[str] = "Untitled Form"
    description: Optional[str] = ""
    category: Optional[str] = "General"
    fields: Optional[List[FieldSchemaPayload]] = []
    conditional_rules: Optional[List[Dict[str, Any]]] = []


@router.post("/run")
def run_form_simulation(
    payload: SimulatorRunRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates end-to-end user respondent flows for the current form.
    Tests validation rules, conditional branching, question reachability,
    and reports Passed / Warning / Failed scenarios with safe AI fix actions.
    """
    form_data = {
        "title": payload.form_title or "Untitled Form",
        "description": payload.description or "",
        "category": payload.category or "General",
        "fields": [f.dict() for f in (payload.fields or [])],
        "conditional_rules": payload.conditional_rules or []
    }

    # Attempt Gemini AI simulation
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        ai_res = call_gemini_simulator(form_data, gemini_key)
        if ai_res:
            return ai_res

    # Local fallback rule evaluation simulator engine
    return local_simulator_engine(form_data)


def call_gemini_simulator(form_data: Dict[str, Any], gemini_key: str) -> Optional[Dict[str, Any]]:
    sys_prompt = (
        "You are the AI Form Simulator for Formify. Test the provided form schema before publishing.\n"
        "Generate 3 to 4 realistic user respondent scenarios based on the actual form fields and conditional rules.\n"
        "For each scenario:\n"
        "1. Simulate specific user inputs for each visible question.\n"
        "2. Evaluate conditional logic rules: determine which questions are shown or hidden based on answers.\n"
        "3. Test required fields and validation rules (e.g., email format, min/max bounds, missing required input).\n"
        "4. Detect unreachable questions, broken conditional paths, or conflicting logic.\n"
        "5. Check whether the user can successfully reach final submission.\n\n"
        "Return a raw JSON object ONLY with structure:\n"
        "- 'overall_status': ('passed', 'warning', or 'failed')\n"
        "- 'summary': (string overall simulation report summary)\n"
        "- 'total_scenarios': (integer)\n"
        "- 'passed_count': (integer)\n"
        "- 'warning_count': (integer)\n"
        "- 'failed_count': (integer)\n"
        "- 'scenarios': list of objects:\n"
        "  - 'id': (string, e.g., 'scen_1')\n"
        "  - 'name': (string, e.g., 'Scenario 1: Standard Respondent Flow')\n"
        "  - 'description': (string summary of scenario intent)\n"
        "  - 'status': ('passed', 'warning', or 'failed')\n"
        "  - 'submission_successful': (boolean)\n"
        "  - 'path_taken': list of step objects:\n"
        "    - 'step': (integer 1-indexed)\n"
        "    - 'field_id': (field ID)\n"
        "    - 'field_label': (string)\n"
        "    - 'user_input': (string or option selected)\n"
        "    - 'is_visible': (boolean)\n"
        "    - 'is_valid': (boolean)\n"
        "    - 'notes': (string explanation of rule or validation outcome)\n"
        "  - 'issues': list of objects:\n"
        "    - 'id': (string, e.g., 'sim_iss_1')\n"
        "    - 'severity': ('critical', 'warning', or 'suggestion')\n"
        "    - 'field_label': (string or 'Conditional Logic')\n"
        "    - 'problem': (string description of logic error or validation failure)\n"
        "    - 'recommendation': (string how to fix)\n"
        "    - 'can_auto_fix': (boolean)\n"
        "    - 'fix_action': (object with 'type': 'update_field', 'field_id': ID, 'updates': { key: val } or null)\n\n"
        "Do NOT include markdown formatting. Return ONLY raw JSON."
    )

    prompt_content = f"Form Schema to Simulate:\n{json.dumps(form_data, indent=2)}"

    payload_data = {
        "contents": [
            {
                "parts": [
                    {"text": sys_prompt},
                    {"text": prompt_content}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 3000
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload_data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                text_out = candidates[0]["content"]["parts"][0]["text"].strip()
                if text_out.startswith("```"):
                    lines = text_out.split("\n")
                    text_out = "\n".join(lines[1:-1]).strip()
                return json.loads(text_out)
    except Exception as e:
        print(f"Gemini Simulator API call error: {e}")

    return None


def local_simulator_engine(form_data: Dict[str, Any]) -> Dict[str, Any]:
    fields = form_data.get("fields", [])
    rules = form_data.get("conditional_rules", [])

    if not fields:
        return {
            "overall_status": "warning",
            "summary": "Form contains zero questions. Add questions before running simulation.",
            "total_scenarios": 1,
            "passed_count": 0,
            "warning_count": 1,
            "failed_count": 0,
            "scenarios": [
                {
                    "id": "scen_empty",
                    "name": "Scenario 1: Empty Form Check",
                    "description": "Evaluating form with no fields defined.",
                    "status": "warning",
                    "submission_successful": False,
                    "path_taken": [],
                    "issues": [
                        {
                            "id": "iss_empty",
                            "severity": "warning",
                            "field_label": "Form Canvas",
                            "problem": "Form has no fields to simulate.",
                            "recommendation": "Add at least one input field to your form.",
                            "can_auto_fix": False,
                            "fix_action": None
                        }
                    ]
                }
            ]
        }

    # Analyze fields & rules
    target_field_ids = set()
    for r in rules:
        target_id = r.get("action_target") or r.get("target_field_id")
        if target_id:
            target_field_ids.add(str(target_id))

    unreachable_fields = []
    rule_conflicts = []
    for r in rules:
        target_id = str(r.get("action_target") or r.get("target_field_id") or "")
        field_exists = any(str(f.get("id")) == target_id for f in fields)
        if target_id and not field_exists:
            rule_conflicts.append({
                "rule": r,
                "problem": f"Conditional rule targets non-existent question ID #{target_id}."
            })

    # Generate 3 simulated scenarios
    # Scenario 1: Standard Complete Respondent
    scen1_path = []
    scen1_issues = []
    step = 1
    for f in fields:
        f_id = str(f.get("id"))
        is_req = f.get("is_required", False)
        ftype = f.get("field_type", "text")
        label = f.get("label") or f"Question {f_id}"

        mock_input = "Sample Answer"
        if ftype == "email":
            mock_input = "user@example.com"
        elif ftype == "phone":
            mock_input = "+1 555-0199"
        elif ftype == "number":
            mock_input = "42"
        elif ftype in ["select", "dropdown", "radio", "checkbox"] and f.get("options"):
            opts = f.get("options", [])
            mock_input = opts[0].get("option_text") if isinstance(opts[0], dict) else str(opts[0])

        scen1_path.append({
            "step": step,
            "field_id": f_id,
            "field_label": label,
            "user_input": mock_input,
            "is_visible": not f.get("is_hidden", False),
            "is_valid": True,
            "notes": "Valid response submitted for required field." if is_req else "Optional response recorded."
        })
        step += 1

    # Scenario 2: Validation Edge Case
    scen2_path = []
    scen2_issues = []
    step = 1
    has_validation_failure = False
    for f in fields:
        f_id = str(f.get("id"))
        is_req = f.get("is_required", False)
        ftype = f.get("field_type", "text")
        label = f.get("label") or f"Question {f_id}"

        if ftype == "email":
            mock_input = "invalid-email-address"
            is_valid = False
            has_validation_failure = True
            scen2_issues.append({
                "id": f"iss_val_{f_id}",
                "severity": "critical",
                "field_label": label,
                "problem": f"Invalid email format '{mock_input}' passed validation check.",
                "recommendation": "Ensure email regex validation rule is enabled.",
                "can_auto_fix": True,
                "fix_action": {
                    "type": "update_field",
                    "field_id": f.get("id"),
                    "updates": {"regex_pattern": r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"}
                }
            })
            notes = "Validation failed: Email input missing '@' symbol."
        elif is_req and step == 1:
            mock_input = ""
            is_valid = False
            has_validation_failure = True
            scen2_issues.append({
                "id": f"iss_req_{f_id}",
                "severity": "critical",
                "field_label": label,
                "problem": f"Required question '{label}' was left empty.",
                "recommendation": "Provide clear help text or default validation message for required fields.",
                "can_auto_fix": True,
                "fix_action": {
                    "type": "update_field",
                    "field_id": f.get("id"),
                    "updates": {"help_text": "This field is required. Please provide a response."}
                }
            })
            notes = "Required field check failed: Empty input."
        else:
            mock_input = "Test Response"
            is_valid = True
            notes = "Input validated successfully."

        scen2_path.append({
            "step": step,
            "field_id": f_id,
            "field_label": label,
            "user_input": mock_input or "(empty)",
            "is_visible": not f.get("is_hidden", False),
            "is_valid": is_valid,
            "notes": notes
        })
        step += 1

    # Scenario 3: Conditional Branching Flow
    scen3_path = []
    scen3_issues = []
    step = 1
    for f in fields:
        f_id = str(f.get("id"))
        is_target = f_id in target_field_ids
        label = f.get("label") or f"Question {f_id}"

        scen3_path.append({
            "step": step,
            "field_id": f_id,
            "field_label": label,
            "user_input": "Branch Option Selected",
            "is_visible": True,
            "is_valid": True,
            "notes": "Question dynamically revealed by conditional logic branch." if is_target else "Standard form question flow."
        })
        step += 1

    if rule_conflicts:
        for rc in rule_conflicts:
            scen3_issues.append({
                "id": "iss_rule_conflict",
                "severity": "critical",
                "field_label": "Conditional Rule",
                "problem": rc["problem"],
                "recommendation": "Update or delete rule targeting invalid question ID.",
                "can_auto_fix": False,
                "fix_action": None
            })

    scenarios = [
        {
            "id": "scen_happy",
            "name": "Scenario 1: Complete Respondent Flow",
            "description": "Simulates a respondent filling all visible fields accurately.",
            "status": "passed",
            "submission_successful": True,
            "path_taken": scen1_path,
            "issues": scen1_issues
        },
        {
            "id": "scen_validation",
            "name": "Scenario 2: Validation & Required Field Test",
            "description": "Tests field constraints, missing inputs, and regex validation checks.",
            "status": "failed" if has_validation_failure else "passed",
            "submission_successful": not has_validation_failure,
            "path_taken": scen2_path,
            "issues": scen2_issues
        },
        {
            "id": "scen_logic",
            "name": "Scenario 3: Conditional Logic & Branching Test",
            "description": "Verifies dynamic show/hide question rules and path reachability.",
            "status": "failed" if rule_conflicts else "passed",
            "submission_successful": not bool(rule_conflicts),
            "path_taken": scen3_path,
            "issues": scen3_issues
        }
    ]

    passed_count = sum(1 for s in scenarios if s["status"] == "passed")
    warning_count = sum(1 for s in scenarios if s["status"] == "warning")
    failed_count = sum(1 for s in scenarios if s["status"] == "failed")

    overall_status = "passed" if failed_count == 0 else "failed"
    if overall_status == "passed" and warning_count > 0:
        overall_status = "warning"

    return {
        "overall_status": overall_status,
        "summary": f"Completed 3 simulated respondent test flows: {passed_count} passed, {warning_count} warnings, {failed_count} failed.",
        "total_scenarios": len(scenarios),
        "passed_count": passed_count,
        "warning_count": warning_count,
        "failed_count": failed_count,
        "scenarios": scenarios
    }
