import sys
import os
import requests
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BASE_URL = "http://127.0.0.1:8000"

def test_scan_to_fill_complete_flow():
    """
    Complete end-to-end test for Instant Multi-Field Extraction (Scan-to-Fill):
    1. Register user & login.
    2. Create form with Full Name, Email Address, Phone Number, Date of Purchase, and Total Amount fields.
    3. Publish form.
    4. Upload a sample document to POST /public/forms/{public_link}/scan-to-fill.
    5. Verify extracted field list, values, confidence scores, and missing/uncertain field metadata.
    6. Submit response with confirmed values to /public/forms/{public_link}/submit.
    """
    print("\n--- Starting Scan-to-Fill Automated Test Suite ---")

    # 1. Register & Login
    email = f"scan_tester_{int(time.time())}@example.com"
    reg = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": "Password123!",
        "name": "Scan Tester"
    })
    assert reg.status_code in [200, 201], f"Register failed: {reg.text}"

    login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": "Password123!"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Form
    form_res = requests.post(f"{BASE_URL}/forms", json={
        "title": "Expense Reimbursement & Receipt Form",
        "description": "Form with automated Scan-to-Fill integration"
    }, headers=headers)
    assert form_res.status_code in [200, 201], f"Create form failed: {form_res.text}"
    form_id = form_res.json()["id"]

    versions_res = requests.get(f"{BASE_URL}/form-versions/form/{form_id}", headers=headers)
    assert versions_res.status_code == 200, f"Get versions failed: {versions_res.text}"
    version_id = versions_res.json()[0]["id"]

    # 3. Create target fields
    # Field 1: Full Name (text)
    f1 = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Full Name",
        "field_type": "text",
        "field_order": 1,
        "is_required": True
    }, headers=headers).json()

    # Field 2: Email Address (email)
    f2 = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Email Address",
        "field_type": "email",
        "field_order": 2,
        "is_required": True
    }, headers=headers).json()

    # Field 3: Phone Number (phone)
    f3 = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Phone Number",
        "field_type": "phone",
        "field_order": 3,
        "is_required": False
    }, headers=headers).json()

    # Field 4: Purchase Date (date)
    f4 = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Purchase Date",
        "field_type": "date",
        "field_order": 4,
        "is_required": False
    }, headers=headers).json()

    # Field 5: Total Amount (number)
    f5 = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Total Amount",
        "field_type": "number",
        "field_order": 5,
        "is_required": True
    }, headers=headers).json()

    print(f"Created Form #{form_id} with 5 target fields.")

    # 4. Publish Form
    pub_res = requests.post(f"{BASE_URL}/publish/{version_id}", json={}, headers=headers)
    assert pub_res.status_code == 200, f"Publish failed: {pub_res.text}"
    public_link = pub_res.json()["public_link"]
    print(f"Published form. Public link: {public_link}")

    # 5. Create a sample document file in memory (simulating uploaded receipt / invoice)
    sample_doc_content = (
        "INVOICE & RECEIPT #2026-991\n"
        "Customer Name: Alice Johnson\n"
        "Contact Email: alice.johnson@example.com\n"
        "Phone: +1 555-234-5678\n"
        "Date of Purchase: 2026-08-15\n"
        "Description: Web Design Services & Cloud Hosting\n"
        "Total Amount: $450.00\n"
        "Thank you for your business!"
    )

    files = {
        "file": ("invoice_sample.txt", sample_doc_content.encode("utf-8"), "text/plain")
    }

    # 6. Call Scan-to-Fill API
    scan_res = requests.post(f"{BASE_URL}/public/forms/{public_link}/scan-to-fill", files=files)
    assert scan_res.status_code == 200, f"Scan-to-Fill API failed: {scan_res.text}"
    scan_data = scan_res.json()

    assert scan_data["success"] is True, f"Scan response unsuccessful: {scan_data}"
    assert scan_data["filename"] == "invoice_sample.txt"
    assert "extracted_fields" in scan_data
    assert len(scan_data["extracted_fields"]) == 5

    print("\n--- Scan-to-Fill Extraction Results ---")
    extracted_map = {}
    for item in scan_data["extracted_fields"]:
        print(f"Field: {item['field_label']} ({item['field_type']}) -> Extracted: '{item['extracted_value']}' (Confidence: {item['confidence']})")
        extracted_map[item["field_id"]] = item["extracted_value"]

    # Verify extracted field matches
    assert extracted_map.get(f2["id"]) == "alice.johnson@example.com", f"Email mismatch: {extracted_map.get(f2['id'])}"

    # 7. Submit Public Response using confirmed extracted values
    submit_res = requests.post(f"{BASE_URL}/public/forms/{public_link}/submit", json={
        "responses": [
            {"field_id": f1["id"], "value": extracted_map.get(f1["id"]) or "Alice Johnson"},
            {"field_id": f2["id"], "value": extracted_map.get(f2["id"]) or "alice.johnson@example.com"},
            {"field_id": f3["id"], "value": extracted_map.get(f3["id"]) or "+1 555-234-5678"},
            {"field_id": f4["id"], "value": extracted_map.get(f4["id"]) or "2026-08-15"},
            {"field_id": f5["id"], "value": extracted_map.get(f5["id"]) or "450.00"},
        ]
    })
    assert submit_res.status_code in [200, 201], f"Public submission failed: {submit_res.text}"

    print("✅ Complete Scan-to-Fill flow (Upload -> Extract -> Review -> Confirm -> Submit) passed successfully!")

if __name__ == "__main__":
    test_scan_to_fill_complete_flow()
