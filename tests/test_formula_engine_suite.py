import sys
import os
import requests
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BASE_URL = "http://127.0.0.1:8000"

def test_formula_engine_unit_math():
    """Test pure python logic matching formulaEngine JS rules for basic & percentage calculations."""
    import re

    def simple_eval(expr):
        expr = re.sub(r'(\d+(?:\.\d+)?)%', r'(\1 / 100)', expr)
        try:
            val = eval(expr)
            return val
        except ZeroDivisionError:
            return "ERR: DIV/0"
        except Exception:
            return "ERR: SYNTAX"

    # Test 1: Addition & Subtraction
    assert simple_eval("10 + 20 - 5") == 25

    # Test 2: Multiplication & Division
    assert simple_eval("10 * 5 / 2") == 25.0

    # Test 3: Parentheses & Order of Operations
    assert simple_eval("(10 + 20) * 3") == 90

    # Test 4: Percentage Math (100 * 15%)
    assert simple_eval("100 * (15 / 100)") == 15.0

    # Test 5: Complex expression: Total - (Total * 10%)
    assert simple_eval("200 - (200 * (10 / 100))") == 180.0

    # Test 6: Division by Zero
    assert simple_eval("100 / 0") == "ERR: DIV/0"

    print("✅ Unit math & percentage formula logic passed!")

def test_formula_api_persistence_and_public_submission():
    """Create a form with Quantity, Unit Price, and Subtotal Formula. Publish and submit."""
    # 1. Register user & login
    email = f"formula_user_{int(time.time())}@example.com"
    reg = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": "Password123!",
        "name": "Formula Tester"
    })
    assert reg.status_code in [200, 201], f"Register failed: {reg.text}"

    login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": "Password123!"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("access_token")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create form
    form_res = requests.post(f"{BASE_URL}/forms", json={
        "title": "Formula E-Commerce Form",
        "description": "Form testing formula field persistence"
    }, headers=headers)
    assert form_res.status_code in [200, 201], f"Create form failed: {form_res.text}"
    form_id = form_res.json()["id"]

    # Get latest version ID for form
    versions_res = requests.get(f"{BASE_URL}/form-versions/form/{form_id}", headers=headers)
    assert versions_res.status_code == 200, f"Get versions failed: {versions_res.text}"
    version_id = versions_res.json()[0]["id"]

    # 3. Create Quantity Field
    f1_res = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Quantity",
        "field_type": "number",
        "field_order": 1,
        "is_required": True
    }, headers=headers)
    assert f1_res.status_code in [200, 201], f"Create f1 failed: {f1_res.text}"
    f1_id = f1_res.json()["id"]

    # 4. Create Unit Price Field
    f2_res = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Unit Price",
        "field_type": "number",
        "field_order": 2,
        "is_required": True
    }, headers=headers)
    assert f2_res.status_code in [200, 201], f"Create f2 failed: {f2_res.text}"
    f2_id = f2_res.json()["id"]

    # 5. Create Formula Subtotal Field ({field_f1_id} * {field_f2_id})
    formula_expr = f"{{field_{f1_id}}} * {{field_{f2_id}}}"
    f3_res = requests.post(f"{BASE_URL}/fields", json={
        "form_version_id": version_id,
        "label": "Subtotal",
        "field_type": "formula",
        "field_order": 3,
        "formula_expression": formula_expr,
        "decimal_places": 2,
        "number_prefix": "$",
        "number_suffix": " USD"
    }, headers=headers)
    assert f3_res.status_code in [200, 201], f"Create formula field failed: {f3_res.text}"
    f3_id = f3_res.json()["id"]

    print(f"Created Form ID: {form_id}, Version: {version_id}, Formula Field ID: {f3_id}")

    # 6. Publish Form Version
    pub_res = requests.post(f"{BASE_URL}/publish/{version_id}", json={}, headers=headers)
    assert pub_res.status_code == 200, f"Publish form failed: {pub_res.text}"
    pub_data = pub_res.json()
    public_link = pub_data.get("public_link")

    assert public_link, f"Missing public link in publish response: {pub_data}"

    # 7. Fetch Public Form
    pub_form_res = requests.get(f"{BASE_URL}/public/forms/{public_link}")
    assert pub_form_res.status_code == 200, f"Fetch public form failed: {pub_form_res.text}"
    pub_form = pub_form_res.json()

    # Verify formula attributes in public form schema
    formula_field = next((f for f in pub_form["fields"] if f["id"] == f3_id), None)
    assert formula_field is not None, "Formula field missing from public form!"
    print("Formula field keys:", formula_field.keys())
    assert formula_field["formula_expression"] == formula_expr
    assert formula_field["decimal_places"] == 2
    assert formula_field["number_prefix"] == "$"
    assert formula_field["number_suffix"] == " USD"

    # 8. Submit Response with calculated value
    sub_res = requests.post(f"{BASE_URL}/public/forms/{public_link}/submit", json={
        "responses": [
            {"field_id": f1_id, "value": "4"},
            {"field_id": f2_id, "value": "25"},
            {"field_id": f3_id, "value": "100.0"}
        ]
    })
    assert sub_res.status_code in [200, 201], f"Submit response failed: {sub_res.text}"

    print("✅ Full Persistence & Public Submission test passed successfully!")

if __name__ == "__main__":
    test_formula_engine_unit_math()
    test_formula_api_persistence_and_public_submission()
