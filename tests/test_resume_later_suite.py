import sys
import json
import urllib.request
import urllib.error
import uuid
import os

sys.path.append(os.path.abspath("backend"))

from app.database.database import SessionLocal
from app.models.form_draft import FormDraft
from app.models.submission import Submission

BASE_URL = "http://localhost:8000"
PUBLIC_LINK = "pub_yesno_flow_267"

print("=" * 60)
print("STARTING SAVE & CONTINUE LATER / RESUME SUITE")
print("=" * 60)

test_results = {}

def run_suite():
    db = SessionLocal()

    # 1. Save new draft
    print("\n--- TEST 1: Save Draft ---")
    try:
        payload = {
            "resume_token": None,
            "answers": {
                "1": "John Doe",
                "2": "john.doe@example.com",
                "3": "Yes"
            },
            "current_page": 0,
            "respondent_email": "john.doe@example.com"
        }
        post_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/public/forms/{PUBLIC_LINK}/draft",
            data=post_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            save_res = json.loads(resp.read().decode())

        token = save_res.get("resume_token")
        assert token is not None and len(token) > 10, "Invalid resume_token"
        assert save_res.get("resume_url") is not None, "Missing resume_url"

        draft_db = db.query(FormDraft).filter(FormDraft.resume_token == token).first()
        assert draft_db is not None, "FormDraft missing in DB"
        assert draft_db.is_submitted == False, "Draft incorrectly marked as submitted"

        print(f"PASS: Draft saved successfully! Resume Token: {token}")
        test_results["Test 1 – Save Draft"] = "PASS"
    except Exception as e:
        print(f"FAIL: Test 1 failed: {e}")
        test_results["Test 1 – Save Draft"] = f"FAIL: {e}"
        return

    # 2. Update existing draft
    print("\n--- TEST 2: Update Draft ---")
    try:
        update_payload = {
            "resume_token": token,
            "answers": {
                "1": "John Doe Updated",
                "2": "john.doe@example.com",
                "3": "Yes",
                "4": "Additional Notes Added"
            },
            "current_page": 1,
            "respondent_email": "john.doe@example.com"
        }
        post_data = json.dumps(update_payload).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/public/forms/{PUBLIC_LINK}/draft",
            data=post_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            update_res = json.loads(resp.read().decode())

        assert update_res.get("resume_token") == token, "Resume token changed unexpectedly"

        count = db.query(FormDraft).filter(FormDraft.resume_token == token).count()
        assert count == 1, f"Expected 1 draft row, found {count}"

        print("PASS: Existing draft updated cleanly in database.")
        test_results["Test 2 – Update Draft"] = "PASS"
    except Exception as e:
        print(f"FAIL: Test 2 failed: {e}")
        test_results["Test 2 – Update Draft"] = f"FAIL: {e}"

    # 3. Retrieve draft (Cross-Device Simulation)
    print("\n--- TEST 3: Retrieve Draft Across Devices ---")
    try:
        req = urllib.request.Request(f"{BASE_URL}/public/forms/{PUBLIC_LINK}/draft/{token}")
        with urllib.request.urlopen(req) as resp:
            get_res = json.loads(resp.read().decode())

        assert get_res.get("resume_token") == token, "Mismatched resume token"
        answers = get_res.get("answers", {})
        assert answers.get("1") == "John Doe Updated", f"Unexpected answer value: {answers.get('1')}"
        assert answers.get("4") == "Additional Notes Added", "New field answer missing"

        print("PASS: Cross-device draft retrieval restored exact saved answers & page state.")
        test_results["Test 3 – Retrieve Draft"] = "PASS"
    except Exception as e:
        print(f"FAIL: Test 3 failed: {e}")
        test_results["Test 3 – Retrieve Draft"] = f"FAIL: {e}"

    # 4. Email Resume Link
    print("\n--- TEST 4: Send Resume Email Endpoint ---")
    try:
        email_payload = {
            "email": "john.doe@example.com",
            "resume_url": f"http://localhost:5173/public/forms/{PUBLIC_LINK}?resume={token}"
        }
        post_data = json.dumps(email_payload).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/public/forms/{PUBLIC_LINK}/draft-send-email",
            data=post_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            email_res = json.loads(resp.read().decode())

        assert "message" in email_res, "Email response missing message"
        print(f"PASS: Email endpoint response: {email_res['message']}")
        test_results["Test 4 – Send Resume Email"] = "PASS"
    except Exception as e:
        print(f"FAIL: Test 4 failed: {e}")
        test_results["Test 4 – Send Resume Email"] = f"FAIL: {e}"

    # 5. Final Form Submission & Draft Cleanup
    print("\n--- TEST 5: Final Submission Draft Cleanup ---")
    try:
        sub_payload = {
            "client_id": f"client_sub_{uuid.uuid4()}",
            "resume_token": token,
            "responses": [
                {"field_id": 1, "value": "John Doe Updated"}
            ]
        }
        post_data = json.dumps(sub_payload).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/public/forms/{PUBLIC_LINK}/submit",
            data=post_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            sub_res = json.loads(resp.read().decode())

        assert sub_res.get("submission_id") is not None, "Submission ID missing"

        db.expire_all()
        draft_check = db.query(FormDraft).filter(FormDraft.resume_token == token).first()
        assert draft_check is not None and draft_check.is_submitted == True, f"Draft was not archived upon final submission (is_submitted={getattr(draft_check, 'is_submitted', None)})"

        print("PASS: Final submission succeeded and marked draft as completed/archived.")
        test_results["Test 5 – Final Submission Cleanup"] = "PASS"
    except Exception as e:
        print(f"FAIL: Test 5 failed: {e}")
        test_results["Test 5 – Final Submission Cleanup"] = f"FAIL: {e}"

    # 6. Revoked Token Access Prevention
    print("\n--- TEST 6: Prevent Access to Submitted Draft Token ---")
    try:
        token_revoked = False
        try:
            req = urllib.request.Request(f"{BASE_URL}/public/forms/{PUBLIC_LINK}/draft/{token}")
            with urllib.request.urlopen(req) as resp:
                pass
        except urllib.error.HTTPError as err:
            token_revoked = err.code == 404

        assert token_revoked, "Submitted draft token was still accessible!"

        print("PASS: Access to submitted/archived draft token correctly denied with HTTP 404.")
        test_results["Test 6 – Revoked Token Security"] = "PASS"
    except Exception as e:
        print(f"FAIL: Test 6 failed: {e}")
        test_results["Test 6 – Revoked Token Security"] = f"FAIL: {e}"

    db.close()

if __name__ == "__main__":
    run_suite()
    print("\n" + "=" * 60)
    print("SAVE & CONTINUE TEST SUITE SUMMARY")
    print("=" * 60)
    for t_name, status in test_results.items():
        print(f"{t_name}: {status}")
