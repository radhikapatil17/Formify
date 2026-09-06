import os
import io
import json
import base64
import re
import urllib.request
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.repositories.form_version_repository import get_published_form
from app.repositories.field_repository import get_fields_by_version
from app.repositories.field_option_repository import get_options_by_field
from app.repositories.form_repository import get_form_by_id

router = APIRouter(
    prefix="/public/forms",
    tags=["Public Forms Scan-to-Fill"]
)


@router.post("/{public_link}/scan-to-fill")
async def scan_to_fill_form(
    public_link: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Parses an uploaded document/image (PDF, JPG/PNG, receipt, invoice, business card, ID)
    and extracts field values mapped to the specified public form's fields.
    Returns extracted field values with confidence scores for respondent review.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No document or image file uploaded.")

    filename = file.filename.lower()
    allowed_exts = (".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".csv", ".txt")
    if not any(filename.endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Please upload a PDF, PNG, JPG, WEBP, DOCX, or CSV file."
        )

    content_bytes = await file.read()
    if len(content_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

    # Fetch public form version
    version = get_published_form(public_link, db)
    if not version:
        raise HTTPException(status_code=404, detail="Published form not found")

    form = get_form_by_id(db, version.form_id)
    if getattr(form, "is_password_protected", False):
        raise HTTPException(
            status_code=403,
            detail="Password-protected forms must be unlocked before scanning documents."
        )

    # Get target form fields (exclude headings, dividers, breaks, images)
    all_fields = get_fields_by_version(db, version.id)
    target_fields = []
    for f in all_fields:
        if f.is_hidden or f.is_read_only:
            continue
        ftype = f.field_type
        if ftype in ["heading", "description", "section_divider", "page_break", "image", "video", "formula"]:
            continue
        
        opts = get_options_by_field(db, f.id)
        clean_opts = [o.option_text for o in opts if getattr(o, 'option_text', None)]
        
        target_fields.append({
            "id": f.id,
            "label": f.label,
            "field_type": f.field_type,
            "options": clean_opts,
            "placeholder": f.placeholder or "",
            "description": f.description or ""
        })

    if not target_fields:
        raise HTTPException(status_code=400, detail="Form contains no editable questions to auto-fill.")

    # Determine file mime type
    mime_type = "application/pdf"
    if filename.endswith(".png"):
        mime_type = "image/png"
    elif filename.endswith((".jpg", ".jpeg")):
        mime_type = "image/jpeg"
    elif filename.endswith(".webp"):
        mime_type = "image/webp"

    # Extract text content if text-based file
    extracted_text = ""
    if filename.endswith(".txt") or filename.endswith(".csv"):
        try:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = ""

    # Attempt AI Extraction via Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    extracted_results = None

    if gemini_key:
        extracted_results = call_gemini_scan_to_fill(
            content_bytes=content_bytes,
            mime_type=mime_type,
            filename=file.filename,
            extracted_text=extracted_text,
            target_fields=target_fields,
            gemini_key=gemini_key
        )

    # Fallback to Heuristic Pattern Extractor if Gemini unavailable or failed
    if not extracted_results:
        extracted_results = run_heuristic_scan_to_fill(
            content_bytes=content_bytes,
            filename=file.filename,
            extracted_text=extracted_text,
            target_fields=target_fields
        )

    return {
        "success": True,
        "filename": file.filename,
        "extracted_count": len([item for item in extracted_results if item.get("extracted_value")]),
        "total_target_fields": len(target_fields),
        "extracted_fields": extracted_results
    }


def call_gemini_scan_to_fill(
    content_bytes: bytes,
    mime_type: str,
    filename: str,
    extracted_text: str,
    target_fields: List[Dict[str, Any]],
    gemini_key: str
) -> Optional[List[Dict[str, Any]]]:
    """Invokes Gemini Vision API to extract values mapped to target form fields."""
    sys_prompt = (
        "You are the AI Scan-to-Fill Document Extraction Engine for Formify.\n"
        "The user uploaded a document or image (e.g., receipt, invoice, business card, ID, form, application).\n"
        "Your task is to analyze the document/image and extract field values corresponding to the target form fields list.\n\n"
        "Target Form Fields:\n"
        + json.dumps(target_fields, indent=2) + "\n\n"
        "Instructions:\n"
        "1. For each target field, attempt to locate its corresponding value in the document.\n"
        "2. Match names, emails, phones, dates, addresses, invoice amounts, line items, numbers, ratings, or choices accurately.\n"
        "3. Format dates as YYYY-MM-DD when possible.\n"
        "4. Provide a numerical confidence score between 0.0 and 1.0 (e.g. 0.95 for clear text, 0.60 for estimated, 0.0 if not found).\n"
        "5. If confidence is below 0.80, provide a short 'confidence_reason' explaining why (e.g., 'Uncertain OCR match', 'Partially blurry text').\n\n"
        "Return a JSON array of objects ONLY, formatted as:\n"
        "[\n"
        "  {\n"
        "    \"field_id\": <field id from target_fields>,\n"
        "    \"field_label\": \"<field label>\",\n"
        "    \"field_type\": \"<field type>\",\n"
        "    \"extracted_value\": \"<extracted string value or null if not found>\",\n"
        "    \"confidence\": <float 0.0 to 1.0>,\n"
        "    \"confidence_reason\": <string explanation or null>\n"
        "  }\n"
        "]\n"
        "Return raw JSON ONLY. No markdown wrappers."
    )

    parts: List[Dict[str, Any]] = [{"text": sys_prompt}]

    if extracted_text:
        parts.append({"text": f"Extracted Document Text:\n{extracted_text}"})
    else:
        base64_data = base64.b64encode(content_bytes).decode("utf-8")
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": base64_data
            }
        })
        parts.append({"text": f"Filename: {filename}. Extract values for target form fields."})

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
                if isinstance(parsed, list):
                    return parsed
    except Exception as e:
        print(f"Gemini Scan-to-Fill error: {e}")

    return None


def run_heuristic_scan_to_fill(
    content_bytes: bytes,
    filename: str,
    extracted_text: str,
    target_fields: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Fallback pattern & regex extractor for standard document fields."""
    text = extracted_text
    if not text and content_bytes:
        text = content_bytes.decode("utf-8", errors="ignore")

    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # Common Regex Patterns
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    date_match = re.search(r'\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}/\d{1,2}/\d{2,4}\b', text)
    amount_match = re.search(r'\$?\s?\b\d+(?:\.\d{2})\b', text)

    results = []
    for f in target_fields:
        f_id = f["id"]
        label = f["label"]
        label_lower = label.lower()
        ftype = f["field_type"]

        val = None
        conf = 0.0
        reason = None

        if "email" in label_lower or ftype == "email":
            if email_match:
                val = email_match.group(0)
                conf = 0.90
            elif lines:
                for line in lines:
                    if "@" in line:
                        val = line
                        conf = 0.70
                        reason = "Extracted potential email line"
                        break

        elif "phone" in label_lower or "mobile" in label_lower or ftype == "phone":
            if phone_match:
                val = phone_match.group(0)
                conf = 0.88
            elif lines:
                for line in lines:
                    if any(c.isdigit() for c in line) and ("phone" in line.lower() or "tel" in line.lower()):
                        val = line
                        conf = 0.65
                        reason = "Extracted phone line match"
                        break

        elif "date" in label_lower or "dob" in label_lower or ftype == "date":
            if date_match:
                val = date_match.group(0)
                conf = 0.85

        elif any(kw in label_lower for kw in ["amount", "total", "price", "subtotal", "cost", "fee"]) or ftype == "number":
            if amount_match:
                val = amount_match.group(0).replace("$", "").strip()
                conf = 0.82
            else:
                for line in lines:
                    if any(kw in line.lower() for kw in ["total", "amount", "price"]):
                        nums = re.findall(r'\d+(?:\.\d+)?', line)
                        if nums:
                            val = nums[-1]
                            conf = 0.75
                            reason = "Found number near keyword in document"
                            break

        elif any(kw in label_lower for kw in ["name", "full name", "contact name", "customer"]):
            for line in lines:
                if "name" in line.lower():
                    clean_line = re.sub(r'(?i)name[:\s]*', '', line).strip()
                    if clean_line:
                        val = clean_line
                        conf = 0.80
                        break
            if not val and lines:
                val = lines[0]
                conf = 0.50
                reason = "Heuristic guess from top document line"

        elif "address" in label_lower:
            for line in lines:
                if any(kw in line.lower() for kw in ["street", "ave", "road", "suite", "blvd", "address"]):
                    val = line
                    conf = 0.75
                    break

        if val is None:
            conf = 0.0
            reason = "Field not found in document"

        results.append({
            "field_id": f_id,
            "field_label": label,
            "field_type": ftype,
            "extracted_value": val,
            "confidence": conf,
            "confidence_reason": reason
        })

    return results
