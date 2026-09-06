import os
import json
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/ai",
    tags=["AI Generator"]
)


class GeneratePrompt(BaseModel):
    prompt: str
    category: str | None = "General"


def call_gemini_api(prompt_text: str):
    """
    Calls Google Gemini API via HTTP request if GEMINI_API_KEY is configured.
    Implements a strict audit and repair self-correction loop with intelligent fallback.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return fallback_synthesize(prompt_text)

    # Step 1: Initial Generation Prompt
    sys_prompt = (
        "You are an expert AI Form Builder. Generate a valid JSON object ONLY representing a form schema. "
        "The JSON must have keys: 'title', 'description', 'category', 'thank_you_message', "
        "and 'questions' (list of objects with: 'field_label', 'field_type' (text, email, select, radio, checkbox, date, rating, file_upload, textarea, phone, number, heading, description, section_divider, page_break), "
        "'is_required' (boolean), 'options' (list of strings if select/radio/checkbox/dropdown), 'placeholder', 'help_text', "
        "'min_length' (integer/null), 'max_length' (integer/null), 'regex_pattern' (string/null), 'validation_message' (string/null)), "
        "and 'conditional_logic' (list of objects with: 'trigger_field' (field_label of trigger question), 'operator' (equals, not_equals, contains, not_contains, greater_than, less_than), "
        "'value' (string value), 'action' (show, hide), 'target_field' (field_label of target question)). "
        "Do NOT wrap in markdown codeblocks or output any extra text. Return ONLY raw JSON."
    )

    first_schema = None
    models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]
    for model_name in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{sys_prompt}\nUser Request:\n{prompt_text}"}]}
                ]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                clean_text = text.replace("```json", "").replace("```", "").strip()
                first_schema = json.loads(clean_text)
                break
        except urllib.error.HTTPError as he:
            print(f"Gemini API ({model_name}) HTTP Error {he.code}: {he.reason}")
            # If 400, 401, 403, 404, or 429, key/endpoint is invalid or rate limited - abort Gemini loop
            if he.code in (400, 401, 403, 404, 429):
                print(f"Aborting Gemini model iteration due to HTTP {he.code}.")
                break
        except Exception as e:
            print(f"Gemini API ({model_name}) call notice:", e)
            err_msg = str(e).lower()
            if "timeout" in err_msg or "timed out" in err_msg or "temporary failure" in err_msg or "connection" in err_msg:
                print("Aborting Gemini model list iteration due to network connection/timeout issue.")
                break

    if not first_schema:
        return fallback_synthesize(prompt_text)

    # Step 2: Audit & Repair Call
    audit_prompt = (
        f"You are a strict Audit and Repair Agent for an AI Form Builder.\n"
        f"Compare the user's original request against the generated JSON schema below:\n\n"
        f"User Original Request:\n{prompt_text}\n\n"
        f"Generated JSON Schema:\n{json.dumps(first_schema, indent=2)}\n\n"
        f"Instructions:\n"
        f"1. Audit the schema. Check if ALL requested questions, sections (headings/section_dividers), "
        f"question types, options, validations, and conditional logic rules from the User Request are fully included.\n"
        f"2. If anything requested in the prompt is missing or simplified, REPAIR and update the JSON schema to include them.\n"
        f"3. Return ONLY the finalized valid JSON object. Do NOT wrap in markdown block or write extra text."
    )

    for model_name in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": audit_prompt}]}
                ]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                clean_text = text.replace("```json", "").replace("```", "").strip()
                repaired_schema = json.loads(clean_text)
                return repaired_schema
        except Exception as e:
            print(f"Audit/Repair model ({model_name}) call notice:", e)
            break

    return first_schema


def fallback_synthesize(prompt_text: str, category: str = "General") -> dict:
    """Intelligent domain-aware schema synthesizer for offline / instant fallback mode."""
    p = prompt_text.strip()
    p_lower = p.lower()
    
    # 1. Job Application / Resume
    if any(k in p_lower for k in ["job", "application", "hiring", "candidate", "resume", "employment", "career"]):
        title = "Job Application Form"
        category = "Job Application"
        description = "Submit your resume, contact details, and qualifications for open positions."
        questions = [
            {"field_label": "Full Name", "field_type": "text", "is_required": True, "placeholder": "e.g. Sarah Jenkins"},
            {"field_label": "Email Address", "field_type": "email", "is_required": True, "placeholder": "sarah@example.com"},
            {"field_label": "Phone Number", "field_type": "phone", "is_required": True, "placeholder": "+1 (555) 000-0000"},
            {"field_label": "Target Position", "field_type": "select", "is_required": True, "options": ["Software Engineer", "Product Designer", "Marketing Manager", "Data Analyst", "Other"]},
            {"field_label": "Years of Experience", "field_type": "select", "is_required": True, "options": ["Entry-level (0-1 yrs)", "Mid-level (2-4 yrs)", "Senior (5+ yrs)", "Executive / Lead"]},
            {"field_label": "Portfolio / LinkedIn URL", "field_type": "text", "is_required": False, "placeholder": "https://linkedin.com/in/username"},
            {"field_label": "Upload Resume / CV", "field_type": "file_upload", "is_required": True, "help_text": "PDF, DOCX, or max 10MB file"},
            {"field_label": "Personal Statement / Cover Note", "field_type": "textarea", "is_required": False, "placeholder": "Tell us why you are interested in this position..."}
        ]
    
    # 2. College / School / Course Admission
    elif any(k in p_lower for k in ["admission", "college", "school", "university", "student", "course", "enroll"]):
        title = "College & Course Admission Form"
        category = "Registration"
        description = "Complete your academic details and upload transcripts for enrollment."
        questions = [
            {"field_label": "Applicant Full Name", "field_type": "text", "is_required": True, "placeholder": "Alex Morgan"},
            {"field_label": "Date of Birth", "field_type": "date", "is_required": True},
            {"field_label": "Applicant Email", "field_type": "email", "is_required": True, "placeholder": "alex@university.edu"},
            {"field_label": "Contact Phone", "field_type": "phone", "is_required": True, "placeholder": "+1 (555) 123-4567"},
            {"field_label": "Intended Major / Program", "field_type": "select", "is_required": True, "options": ["Computer Science", "Business Administration", "Biomedical Engineering", "Graphic Design", "Finance"]},
            {"field_label": "Highest Qualification", "field_type": "radio", "is_required": True, "options": ["High School Diploma", "Associate Degree", "Bachelor Degree", "Master / Doctorate"]},
            {"field_label": "Upload Academic Transcript", "field_type": "file_upload", "is_required": True, "help_text": "Official transcript (PDF or JPG)"},
            {"field_label": "Personal Essay / Statement of Purpose", "field_type": "textarea", "is_required": True, "placeholder": "Detail your academic background and goals..."}
        ]

    # 3. Feedback / Customer Satisfaction / Survey
    elif any(k in p_lower for k in ["feedback", "satisfaction", "survey", "rating", "review", "nps", "evaluation"]):
        title = "Customer Experience & Feedback Survey"
        category = "Feedback"
        description = "Share your rating and feedback to help us improve our services."
        questions = [
            {"field_label": "Respondent Name", "field_type": "text", "is_required": False, "placeholder": "Optional name"},
            {"field_label": "Email Address", "field_type": "email", "is_required": False, "placeholder": "user@example.com"},
            {"field_label": "Overall Experience Rating", "field_type": "rating", "is_required": True},
            {"field_label": "Service Category", "field_type": "select", "is_required": True, "options": ["Customer Support", "Product Quality", "Pricing", "Delivery / Speed", "Website Experience"]},
            {"field_label": "Would you recommend us to a friend?", "field_type": "radio", "is_required": True, "options": ["Definitely", "Probably", "Not sure", "Unlikely"]},
            {"field_label": "Detailed Comments & Suggestions", "field_type": "textarea", "is_required": False, "placeholder": "Share what we did well or how we can improve..."}
        ]

    # 4. Event RSVP / Registration
    elif any(k in p_lower for k in ["event", "rsvp", "conference", "webinar", "workshop", "meetup"]):
        title = "Event RSVP & Registration Form"
        category = "Event Registration"
        description = "Confirm your attendance and dietary preferences for the event."
        questions = [
            {"field_label": "Attendee Name", "field_type": "text", "is_required": True, "placeholder": "Jane Smith"},
            {"field_label": "Email Address", "field_type": "email", "is_required": True, "placeholder": "jane@company.com"},
            {"field_label": "Phone Number", "field_type": "phone", "is_required": False},
            {"field_label": "Will you be attending?", "field_type": "radio", "is_required": True, "options": ["Yes, attending in person", "Yes, attending virtually", "No, cannot attend"]},
            {"field_label": "Number of Additional Guests", "field_type": "number", "is_required": False, "placeholder": "0"},
            {"field_label": "Dietary Restrictions / Requirements", "field_type": "checkbox", "is_required": False, "options": ["Vegetarian", "Vegan", "Gluten-Free", "Nut Allergy", "None"]},
            {"field_label": "Special Accommodation Requests", "field_type": "textarea", "is_required": False}
        ]

    # 5. Generic / Custom Prompt Default
    else:
        clean_title = p.split(".")[0].strip()
        if len(clean_title) > 40:
            clean_title = clean_title[:40].strip() + "..."
        title = f"{clean_title.title()}" if clean_title else "Smart Generated Form"
        category = "General"
        description = f"AI-generated form schema for: {p[:100]}..."
        questions = [
            {"field_label": "Full Name", "field_type": "text", "is_required": True, "placeholder": "John Doe"},
            {"field_label": "Email Address", "field_type": "email", "is_required": True, "placeholder": "john@example.com"},
            {"field_label": "Contact Phone Number", "field_type": "phone", "is_required": False, "placeholder": "+1 (555) 000-0000"},
            {"field_label": "Primary Topic / Choice", "field_type": "select", "is_required": True, "options": ["Option 1", "Option 2", "Option 3"]},
            {"field_label": "Date of Request", "field_type": "date", "is_required": False},
            {"field_label": "Detailed Information / Notes", "field_type": "textarea", "is_required": True, "placeholder": "Enter details..."}
        ]

    for idx, q in enumerate(questions):
        q["field_order"] = idx + 1

    return {
        "title": title,
        "description": description,
        "category": category,
        "questions": questions,
        "conditional_logic": []
    }


@router.post("/generate-template")
def generate_ai_template(
    data: GeneratePrompt,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates structured JSON form schema using Gemini AI.
    """
    if not data.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt string is required")

    try:
        schema = call_gemini_api(data.prompt.strip())
        if not schema or not isinstance(schema, dict) or "questions" not in schema:
            schema = fallback_synthesize(data.prompt.strip(), data.category or "General")
    except Exception as e:
        print(f"AI Generation exception: {e}, using offline domain synthesis fallback.")
        schema = fallback_synthesize(data.prompt.strip(), data.category or "General")

    return schema
