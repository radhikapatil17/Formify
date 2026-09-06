"""
E2E Integration Test: Form Builder Core functionality
- Creates a form and form version
- Adds a Text field and a Select/Choice field
- Adds options to the Choice field
- Reorders the fields and verifies order persistence
- Creates a ConditionalRule linking the two fields
- Deletes the trigger field and verifies cascade delete triggers cleanly without foreign key constraint errors
"""
import json
import sys
from app.database.database import SessionLocal
from app.models.user import User
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.field import Field
from app.models.field_option import FieldOption
from app.models.conditional_rule import ConditionalRule
from app.models.response_value import ResponseValue

db = SessionLocal()

from app.models.submission import Submission

def delete_form_completely(db, form_id):
    versions = db.query(FormVersion).filter(FormVersion.form_id == form_id).all()
    for v in versions:
        # Delete rules
        db.query(ConditionalRule).filter(ConditionalRule.form_version_id == v.id).delete(synchronize_session=False)
        # Delete submissions and their response values
        submissions = db.query(Submission).filter(Submission.form_version_id == v.id).all()
        for s in submissions:
            db.query(ResponseValue).filter(ResponseValue.submission_id == s.id).delete(synchronize_session=False)
            db.delete(s)
        # Delete fields and their options
        fields = db.query(Field).filter(Field.form_version_id == v.id).all()
        for f in fields:
            db.query(FieldOption).filter(FieldOption.field_id == f.id).delete(synchronize_session=False)
            db.query(ResponseValue).filter(ResponseValue.field_id == f.id).delete(synchronize_session=False)
            db.delete(f)
        db.commit()
        db.delete(v)
    db.commit()
    # Delete form collaborators
    from app.models.form_collaborator import FormCollaborator
    db.query(FormCollaborator).filter(FormCollaborator.form_id == form_id).delete(synchronize_session=False)
    # Delete form
    form = db.query(Form).filter(Form.id == form_id).first()
    if form:
        db.delete(form)
    db.commit()

# 1. Setup a test owner user
test_owner_email = "formbuilder_test@formify.com"
owner = db.query(User).filter(User.email == test_owner_email).first()
if not owner:
    owner = User(name="Builder Tester", email=test_owner_email, password_hash="dummy")
    db.add(owner)
    db.commit()
    db.refresh(owner)

# Cleanup existing test forms if any
old_forms = db.query(Form).filter(Form.owner_id == owner.id).all()
for f in old_forms:
    delete_form_completely(db, f.id)

# 2. Create test form & version
form = Form(owner_id=owner.id, title="Form Builder Test Form", description="Testing form builder functionality")
db.add(form)
db.commit()
db.refresh(form)

version = FormVersion(form_id=form.id, version_number=1, is_published=False)
db.add(version)
db.commit()
db.refresh(version)

print("✅ Setup: Created test form and version.")

# 3. Create two fields (Text & Select)
from app.repositories.field_repository import create_field, delete_field

field_text = Field(
    form_version_id=version.id,
    label="First Name",
    field_type="text",
    placeholder="Enter your name",
    is_required=True,
    field_order=1
)
create_field(db, field_text)

field_select = Field(
    form_version_id=version.id,
    label="Choose Option",
    field_type="select",
    placeholder="Select choice",
    is_required=False,
    field_order=2
)
create_field(db, field_select)

print(f"✅ Fields: Created Text field (ID: {field_text.id}) and Select field (ID: {field_select.id}).")

# 4. Create field options for Select field
from app.repositories.field_option_repository import create_option
from app.schemas.field_option_schema import FieldOptionCreate

opt1 = create_option(FieldOptionCreate(field_id=field_select.id, option_text="Option A", option_order=0), db)
opt2 = create_option(FieldOptionCreate(field_id=field_select.id, option_text="Option B", option_order=1), db)

print(f"✅ Options: Created Option A (ID: {opt1.id}) and Option B (ID: {opt2.id}).")

# 5. Verify field reordering works
from app.repositories.field_repository import get_fields_by_version
fields = get_fields_by_version(db, version.id)
assert len(fields) == 2
assert fields[0].field_order == 1
assert fields[1].field_order == 2

# Perform swap
fields[0].field_order = 2
fields[1].field_order = 1
db.commit()

# Reload and assert updated order
fields_reloaded = get_fields_by_version(db, version.id)
assert fields_reloaded[0].id == field_select.id
assert fields_reloaded[1].id == field_text.id
print("✅ Reorder: Successfully verified question reordering logic.")

# 6. Create a Conditional Rule linking the two questions
rule = ConditionalRule(
    form_version_id=version.id,
    trigger_field_id=field_select.id,
    operator="equals",
    comparison_value="Option A",
    target_field_id=field_text.id,
    action="show",
    rule_order=1
)
db.add(rule)
db.commit()
db.refresh(rule)
rule_id = rule.id

print(f"✅ Logic Rules: Created conditional rule linking field {field_select.id} to field {field_text.id}.")

# 7. Delete field and verify programmatical cascade delete of conditional rule
delete_field(db, field_select)

# Verify conditional rule is programmatically deleted
rule_check = db.query(ConditionalRule).filter(ConditionalRule.id == rule_id).first()
assert rule_check is None, "ConditionalRule was not cascade deleted!"

# Verify options are also programmatically deleted
opts_check = db.query(FieldOption).filter(FieldOption.field_id == field_select.id).all()
assert len(opts_check) == 0, "Select options were not cascade deleted!"

print("✅ Integrity: Verified cascade delete successfully removed associated rules and options without foreign key constraint errors!")

# Clean up
delete_form_completely(db, form.id)
db.delete(owner)
db.commit()
db.close()
print("✅ Cleanup: All temporary E2E test data removed successfully.")

print("\n🎉 SUCCESS: All Form Builder E2E integrity tests passed cleanly!")
