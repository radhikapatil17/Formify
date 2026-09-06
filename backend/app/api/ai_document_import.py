import os
import io
import json
import base64
import re
import zipfile
import xml.etree.ElementTree as ET
import urllib.request
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/ai/import",
    tags=["AI Document Import"]
)


@router.post("/parse-document")
async def parse_document_form(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parses PDF, Word (DOC/DOCX), Images (JPG/PNG/WEBP), CSV/Excel, and JSON files.
    Automatically extracts form title, description, questions, types, options, required flags,
    and flags uncertain fields for user review before form creation.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    filename = file.filename.lower()
    content_bytes = await file.read()

    if len(content_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

    # 1. Handle JSON files directly
    if filename.endswith(".json"):
        try:
            parsed_json = json.loads(content_bytes.decode("utf-8"))
            return normalize_json_schema(parsed_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON file format: {str(e)}")

    # 2. Extract raw text based on file type
    extracted_text = ""
    file_mime_type = "application/pdf"

    if filename.endswith(".docx"):
        extracted_text = extract_text_from_docx(content_bytes)
        file_mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls"):
        extracted_text = extract_text_from_csv(content_bytes)
        file_mime_type = "text/csv"
    elif filename.endswith(".png"):
        file_mime_type = "image/png"
    elif filename.endswith(".jpg") or filename.endswith(".jpeg"):
        file_mime_type = "image/jpeg"
    elif filename.endswith(".webp"):
        file_mime_type = "image/webp"

    # 3. Attempt Gemini Vision / Multimodal Document Parser
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        ai_result = call_gemini_document_parser(content_bytes, file_mime_type, filename, extracted_text, gemini_key)
        if ai_result:
            return ai_result

    # 4. Fallback Heuristic Text Parser
    if extracted_text:
        return parse_text_heuristically(extracted_text, filename)

    # Fallback default if image without API key
    return {
        "title": clean_title_from_filename(filename),
        "description": "Form imported from document. Please review detected questions.",
        "category": "General",
        "questions": [
            {
                "field_label": "Full Name",
                "field_type": "text",
                "is_required": True,
                "options": [],
                "placeholder": "Enter full name",
                "help_text": "",
                "needs_review": True,
                "uncertainty_reason": "Default field generated from image OCR fallback. Please verify."
            }
        ]
    }


def extract_text_from_docx(content_bytes: bytes) -> str:
    """Extracts text from a DOCX file using Python standard zipfile + ElementTree."""
    try:
        with zipfile.ZipFile(io.BytesIO(content_bytes)) as z:
            xml_content = z.read("word/document.xml")
            root = ET.fromstring(xml_content)
            # Namespace for Word processing ML
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            texts = []
            for elem in root.iter():
                if elem.tag.endswith("}t") and elem.text:
                    texts.append(elem.text)
            return "\n".join(texts)
    except Exception as e:
        print(f"Error reading docx: {e}")
        return ""


def extract_text_from_csv(content_bytes: bytes) -> str:
    """Extracts text lines from CSV or tabular text files."""
    try:
        text = content_bytes.decode("utf-8", errors="ignore")
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        return "\n".join(lines[:50])
    except Exception:
        return ""


def normalize_json_schema(parsed: Dict[str, Any]) -> Dict[str, Any]:
    title = parsed.get("title") or parsed.get("name") or parsed.get("form_title") or "Imported Form"
    desc = parsed.get("description") or "Imported custom form schema"
    category = parsed.get("category") or "General"
    raw_q = parsed.get("questions") or parsed.get("fields") or parsed.get("elements") or []

    questions = []
    for idx, q in enumerate(raw_q):
        label = q.get("field_label") or q.get("label") or q.get("title") or f"Question {idx + 1}"
        ftype = (q.get("field_type") or q.get("type") or "text").lower()
        opts = q.get("options") or q.get("choices") or []
        if isinstance(opts, list):
            clean_opts = [o.get("option_text") if isinstance(o, dict) else str(o) for o in opts]
        else:
            clean_opts = []

        questions.append({
            "field_label": label,
            "field_type": ftype if ftype in ["text", "textarea", "email", "phone", "number", "select", "radio", "checkbox", "date", "rating", "file_upload"] else "text",
            "is_required": bool(q.get("is_required") or q.get("required")),
            "options": clean_opts,
            "placeholder": q.get("placeholder") or "",
            "help_text": q.get("help_text") or q.get("help") or "",
            "needs_review": False,
            "uncertainty_reason": None
        })

    return {
        "title": title,
        "description": desc,
        "category": category,
        "questions": questions
    }


def call_gemini_document_parser(
    content_bytes: bytes,
    mime_type: str,
    filename: str,
    extracted_text: str,
    gemini_key: str
) -> Optional[Dict[str, Any]]:
    sys_prompt = (
        "You are the AI Form Document Extractor for Formify. Analyze the provided form document/image/text.\n"
        "Extract all form details and structure:\n"
        "- 'title': concise form title\n"
        "- 'description': form introduction or purpose\n"
        "- 'category': (e.g. Feedback, Registration, Survey, Application, Contact, General)\n"
        "- 'questions': list of objects:\n"
        "  - 'field_label': clear question text\n"
        "  - 'field_type': one of ('text', 'textarea', 'email', 'phone', 'number', 'select', 'radio', 'checkbox', 'date', 'rating', 'file_upload')\n"
        "  - 'is_required': boolean (true if marked with *, 'required', or mandatory)\n"
        "  - 'options': list of option string choices if choice question, else empty list []\n"
        "  - 'placeholder': string sample placeholder input or empty string ''\n"
        "  - 'help_text': string instructions or empty string ''\n"
        "  - 'needs_review': boolean (true if question label/type is uncertain or blurry)\n"
        "  - 'uncertainty_reason': string explanation if needs_review is true, else null\n\n"
        "Do NOT include markdown formatting. Return raw JSON ONLY."
    )

    parts: List[Dict[str, Any]] = [{"text": sys_prompt}]

    # Pass text or base64 image inline
    if extracted_text:
        parts.append({"text": f"Document Text Extracted:\n{extracted_text}"})
    else:
        base64_data = base64.b64encode(content_bytes).decode("utf-8")
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": base64_data
            }
        })
        parts.append({"text": f"Filename: {filename}. Extract all form fields from this image/document."})

    payload_data = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.1,
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
        with urllib.request.urlopen(req, timeout=25) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                text_out = candidates[0]["content"]["parts"][0]["text"].strip()
                if text_out.startswith("```"):
                    lines = text_out.split("\n")
                    text_out = "\n".join(lines[1:-1]).strip()
                parsed = json.loads(text_out)
                if parsed and "questions" in parsed:
                    return parsed
    except Exception as e:
        print(f"Gemini Document Parser error: {e}")

    return None


def parse_text_heuristically(text: str, filename: str) -> Dict[str, Any]:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    title = clean_title_from_filename(filename)
    description = "Form extracted from uploaded document."
    questions = []

    if lines and len(lines[0]) < 80 and not lines[0].startswith("1."):
        title = lines[0]
        lines = lines[1:]

    current_q = None
    for line in lines:
        # Check if line looks like a question
        is_q = bool(re.match(r"^(\d+[\.\)]|\*|[A-Z][a-z]+:|\?|Question\s+\d+)", line)) or "?" in line
        if is_q or current_q is None:
            if current_q:
                questions.append(current_q)
            
            clean_label = re.sub(r"^(\d+[\.\)]|\*|Question\s+\d+[:\.]?)\s*", "", line).strip()
            is_req = "*" in line or "required" in line.lower()
            
            ftype = "text"
            lower_label = clean_label.lower()
            if "email" in lower_label:
                ftype = "email"
            elif "phone" in lower_label or "mobile" in lower_label:
                ftype = "phone"
            elif "age" in lower_label or "count" in lower_label or "number" in lower_label:
                ftype = "number"
            elif "date" in lower_label or "dob" in lower_label:
                ftype = "date"
            elif "description" in lower_label or "feedback" in lower_label or "comment" in lower_label:
                ftype = "textarea"
            elif "rating" in lower_label or "score" in lower_label:
                ftype = "rating"
            
            current_q = {
                "field_label": clean_label or "Question",
                "field_type": ftype,
                "is_required": is_req,
                "options": [],
                "placeholder": "",
                "help_text": "",
                "needs_review": False,
                "uncertainty_reason": None
            }
        else:
            # Check if line is an option
            if line.startswith("-") or line.startswith("•") or re.match(r"^[a-d][\.\)]", line):
                clean_opt = re.sub(r"^[-•a-d[\.\)]\s*", "", line).strip()
                if current_q:
                    current_q["options"].append(clean_opt)
                    if current_q["field_type"] == "text":
                        current_q["field_type"] = "select"

    if current_q:
        questions.append(current_q)

    if not questions:
        questions = [
            {
                "field_label": "Document Query",
                "field_type": "textarea",
                "is_required": True,
                "options": [],
                "placeholder": "Enter details",
                "help_text": "",
                "needs_review": True,
                "uncertainty_reason": "Could not split questions automatically. Please review."
            }
        ]

    return {
        "title": title,
        "description": description,
        "category": "General",
        "questions": questions
    }


def clean_title_from_filename(filename: str) -> str:
    name = os.path.splitext(filename)[0]
    name = re.sub(r"[_\-]+", " ", name)
    return name.title()
