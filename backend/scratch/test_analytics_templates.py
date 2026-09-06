import sys
from app.database.database import SessionLocal
from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.repositories.dashboard_repository import get_dashboard_summary
from app.api.templates import get_templates, use_template
from app.schemas.template_schema import UseTemplateRequest

def test_dashboard_and_templates():
    db = SessionLocal()
    print("========================================")
    print("1. TESTING DASHBOARD FOR ACTIVE USERS")
    print("========================================")
    active_user = db.query(User).filter(User.id == 4).first()
    assert active_user is not None, "User 4 not found"
    
    summary = get_dashboard_summary(db, active_user)
    print(f"User 4 ({active_user.email}):")
    print(f"  Total Forms: {summary['total_forms']}")
    print(f"  Published: {summary['published_forms']}")
    print(f"  Total Submissions: {summary['total_submissions']}")
    print(f"  Responses Today: {summary['responses_today']}")
    print(f"  Avg Completion Rate: {summary['avg_completion_rate']}")
    print(f"  Chart Data items: {len(summary['chart_data'])}")
    for c in summary['chart_data']:
        print(f"    - {c['name']} (submissions: {c['submissions']}, value: {c['value']})")
        assert "submissions" in c, "submissions key missing from chart item"
        assert "value" in c, "value key missing from chart item"
        assert c["submissions"] == c["value"], "submissions and value mismatch"

    print(f"  Response Trend days: {len(summary['response_trend'])}")
    assert len(summary['response_trend']) == 7, "Response trend must have 7 days"
    for t in summary['response_trend']:
        print(f"    - {t['date']}: {t['responses']} responses")

    print("\n========================================")
    print("2. TESTING DASHBOARD FOR EMPTY/NEW USER")
    print("========================================")
    # Check if a user with 0 submissions exists or create/test empty user
    empty_user = db.query(User).filter(User.email == "empty_test_user@example.com").first()
    if not empty_user:
        empty_user = User(
            email="empty_test_user@example.com",
            password_hash="hashed_pw_test",
            name="Empty Test User",
            role="admin"
        )
        db.add(empty_user)
        db.commit()
        db.refresh(empty_user)

    empty_summary = get_dashboard_summary(db, empty_user)
    print(f"Empty user ({empty_user.email}):")
    print(f"  Total Forms: {empty_summary['total_forms']}")
    print(f"  Published: {empty_summary['published_forms']}")
    print(f"  Total Submissions: {empty_summary['total_submissions']}")
    print(f"  Avg Completion: {empty_summary['avg_completion_rate']}")
    print(f"  Chart Data: {empty_summary['chart_data']}")
    assert empty_summary["total_forms"] == 0
    assert empty_summary["total_submissions"] == 0
    assert empty_summary["avg_completion_rate"] == "0%"
    assert len(empty_summary["chart_data"]) == 0
    assert len(empty_summary["response_trend"]) == 7
    assert all(d["responses"] == 0 for d in empty_summary["response_trend"])

    print("\n========================================")
    print("3. TESTING TEMPLATES RETRIEVAL & SCOPES")
    print("========================================")
    all_templates = get_templates(category=None, q=None, scope="all", db=db, current_user=active_user)
    print(f"Total templates returned: {len(all_templates)}")
    unique_ids = set(t.id for t in all_templates)
    assert len(unique_ids) == len(all_templates), "Duplicate template IDs returned in response!"

    official_templates = get_templates(category=None, q=None, scope="official", db=db, current_user=active_user)
    print(f"Official templates: {len(official_templates)}")
    for t in official_templates:
        assert t.owner_id is None, f"Official template {t.id} has owner_id {t.owner_id}"

    custom_templates = get_templates(category=None, q=None, scope="custom", db=db, current_user=active_user)
    print(f"Custom user templates: {len(custom_templates)}")
    for t in custom_templates:
        assert t.owner_id == active_user.id, f"Custom template {t.id} owner is {t.owner_id}, expected {active_user.id}"

    # Test category filtering
    feedback_templates = get_templates(category="Feedback", q=None, scope="all", db=db, current_user=active_user)
    print(f"Feedback category templates: {len(feedback_templates)}")
    for t in feedback_templates:
        assert "feedback" in t.category.lower(), f"Unexpected category {t.category}"

    print("\n========================================")
    print("4. TESTING USE TEMPLATE FLOW")
    print("========================================")
    target_template = official_templates[0]
    print(f"Instantiating template {target_template.id}: '{target_template.title}'")
    use_req = UseTemplateRequest(template_id=target_template.id)
    use_res = use_template(use_req, db=db, current_user=active_user)
    print(f"use_template response: {use_res}")
    new_form_id = use_res["form_id"]

    # Verify form in database
    new_form = db.query(Form).filter(Form.id == new_form_id).first()
    assert new_form is not None, f"Form {new_form_id} was not created in database"
    assert new_form.owner_id == active_user.id, f"Owner mismatch on created form"
    
    # Verify version and fields
    latest_v = db.query(FormVersion).filter(FormVersion.form_id == new_form_id).first()
    assert latest_v is not None, "Form version not created"
    fields = db.query(Field).filter(Field.form_version_id == latest_v.id).all()
    print(f"Created form has {len(fields)} fields populated from template schema:")
    for f in fields:
        print(f"  - [{f.field_type}] {f.label} (required={f.is_required})")
    assert len(fields) > 0, "Fields were not copied into the instantiated form!"

    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dashboard_and_templates()
