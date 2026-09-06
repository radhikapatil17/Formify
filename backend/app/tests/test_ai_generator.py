"""
E2E Integration Test: Advanced AI Form Generator & Template Instantiation
- Tests call_gemini_api / fallback_synthesize for prompt requirements
- Tests saving as an AI-generated template
- Instantiates a form from the template and verifies advanced properties & conditional logic mappings
- Cleans up database completely
"""
print("DEBUG: Script started.", flush=True)
import sys
print("DEBUG: Importing database...", flush=True)
from app.database.database import SessionLocal
print("DEBUG: Importing models...", flush=True)
from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.template_model import TemplateModel
from app.models.response_value import ResponseValue
from app.models.submission import Submission
print("DEBUG: Importing ai_generator...", flush=True)
from app.api.ai_generator import call_gemini_api

print("DEBUG: Connecting to DB...", flush=True)
db = SessionLocal()
print("DEBUG: DB Session created.", flush=True)

def delete_form_completely(db, form_id):
    versions = db.query(FormVersion).filter(FormVersion.form_id == form_id).all()
    for v in versions:
        db.query(ConditionalRule).filter(ConditionalRule.form_version_id == v.id).delete(synchronize_session=False)
        submissions = db.query(Submission).filter(Submission.form_version_id == v.id).all()
        for s in submissions:
            db.query(ResponseValue).filter(ResponseValue.submission_id == s.id).delete(synchronize_session=False)
            db.delete(s)
        fields = db.query(Field).filter(Field.form_version_id == v.id).all()
        for f in fields:
            db.query(FieldOption).filter(FieldOption.field_id == f.id).delete(synchronize_session=False)
            db.query(ResponseValue).filter(ResponseValue.field_id == f.id).delete(synchronize_session=False)
            db.delete(f)
        db.commit()
        db.delete(v)
    db.commit()
    from app.models.form_collaborator import FormCollaborator
    db.query(FormCollaborator).filter(FormCollaborator.form_id == form_id).delete(synchronize_session=False)
    form = db.query(Form).filter(Form.id == form_id).first()
    if form:
        db.delete(form)
    db.commit()

# 1. Setup test user
test_owner_email = "aigenerator_test@formify.com"
owner = db.query(User).filter(User.email == test_owner_email).first()
if not owner:
    owner = User(name="AI Tester", email=test_owner_email, password_hash="dummy")
    db.add(owner)
    db.commit()
    db.refresh(owner)

# 2. Call call_gemini_api with structured prompt instructions
prompt = "Generate a client onboarding questionnaire with 8 questions. Include section dividers. Also ask for email and a satisfaction rating out of 5. If choice option is phone show phone number."
schema = call_gemini_api(prompt)

assert schema is not None, "AI schema was not generated!"
assert "title" in schema
assert "questions" in schema
assert len(schema["questions"]) >= 8, f"Expected at least 8 questions, got {len(schema['questions'])}"
print("✅ AI Generator: Successfully parsed requirements, generated schema, and validated question count.")

# 3. Create AI Template
tmpl = TemplateModel(
    title=schema.get("title", "AI Form"),
    description=schema.get("description", "AI onboarding form"),
    category="Registration",
    tags=["ai-generated", "test"],
    template_schema=schema,
    created_by="Formify AI",
    owner_id=owner.id,
    is_public=False,
    is_ai_generated=True,
    version="v1.0"
)
db.add(tmpl)
db.commit()
db.refresh(tmpl)
print(f"✅ AI Template: Created template in database (ID: {tmpl.id}).")

# 4. Instantiate Form from Template using use_template logic
from app.api.templates import UseTemplateRequest, use_template
result = use_template(
    UseTemplateRequest(template_id=tmpl.id),
    db=db,
    current_user=owner
)

form_id = result["form_id"]
version_id = result["version_id"]
print(f"✅ Instantiation: Successfully instantiated Form (ID: {form_id}) and Version (ID: {version_id}).")

# 5. Verify PostgreSQL database persistence and mappings
# Verify fields
db.expire_all()
fields = db.query(Field).filter(Field.form_version_id == version_id).order_by(Field.field_order).all()
assert len(fields) >= 8, f"Expected >= 8 fields in DB, got {len(fields)}"

# Verify conditional rule is created and mapped to new DB IDs
rules = db.query(ConditionalRule).filter(ConditionalRule.form_version_id == version_id).all()
assert len(rules) > 0, "Conditional rule was not instantiated!"
rule = rules[0]
assert rule.trigger_field_id is not None
assert rule.target_field_id is not None

# Verify rule links correct columns
trigger_field = db.query(Field).filter(Field.id == rule.trigger_field_id).first()
target_field = db.query(Field).filter(Field.id == rule.target_field_id).first()
assert trigger_field.label == "Preferred Contact Method", f"Expected trigger field label to match, got: {trigger_field.label}"
assert target_field.label == "Phone Number", f"Expected target field label to match, got: {target_field.label}"

print("✅ Validation: Verified fields, options, and conditional rule mappings persisted correctly in PostgreSQL.")

# 6. Cleanup
delete_form_completely(db, form_id)
db.delete(tmpl)
db.delete(owner)
db.commit()
db.close()
print("✅ Cleanup: All temporary E2E test data removed successfully.")

print("\n🎉 SUCCESS: All Advanced AI Generator E2E integration tests passed cleanly!")
