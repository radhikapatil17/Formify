"""
E2E Test: Form Collaboration feature
- Owner invites User B as Viewer
- User B accepts invitation
- User B attempts to edit form (should fail with 403)
- Owner updates User B's role to Editor
- User B edits form (should succeed)
- Owner removes User B
- User B attempts to read/edit form (should fail with 403)
"""
import json
import urllib.request
import urllib.error
import sys

from app.database.database import SessionLocal
from app.models.user import User
from app.models.form import Form
from app.models.form_collaborator import FormCollaborator
from app.core.security import create_access_token, hash_password

db = SessionLocal()

# Ensure we have at least 2 users (User A and User B)
user_a = db.query(User).filter(User.email == "owner@example.com").first()
if not user_a:
    user_a = User(name="Owner User", email="owner@example.com", password_hash=hash_password("password"))
    db.add(user_a)

user_b = db.query(User).filter(User.email == "collab@example.com").first()
if not user_b:
    user_b = User(name="Collaborator User", email="collab@example.com", password_hash=hash_password("password"))
    db.add(user_b)

db.commit()

token_a = create_access_token({"sub": user_a.email})
token_b = create_access_token({"sub": user_b.email})
db.close()

BASE_URL = "http://localhost:8000"
headers_a = {"Authorization": f"Bearer {token_a}", "Content-Type": "application/json"}
headers_b = {"Authorization": f"Bearer {token_b}", "Content-Type": "application/json"}

# 1. User A (Owner) creates a form
create_payload = json.dumps({"title": "Collaboration Test Form", "description": "Owner created form"}).encode("utf-8")
req = urllib.request.Request(f"{BASE_URL}/forms/", data=create_payload, headers=headers_a)
with urllib.request.urlopen(req) as resp:
    form = json.loads(resp.read().decode("utf-8"))
form_id = form["id"]
print(f"Created Form #{form_id} as Owner (User A)")

# 2. User A invites User B as Viewer
invite_payload = json.dumps({"email": "collab@example.com", "role": "viewer"}).encode("utf-8")
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}/collaborators", data=invite_payload, headers=headers_a)
with urllib.request.urlopen(req) as resp:
    collab = json.loads(resp.read().decode("utf-8"))
collaborator_id = collab["id"]
print(f"Invited collab@example.com as Viewer: collaborator_id={collaborator_id}, status={collab['status']}")

# 3. User B checks pending invitations
req = urllib.request.Request(f"{BASE_URL}/collaborators/invitations", headers=headers_b)
with urllib.request.urlopen(req) as resp:
    invitations = json.loads(resp.read().decode("utf-8"))
print(f"User B pending invitations list: {invitations}")
assert any(i["id"] == collaborator_id for i in invitations), "Invitation not found in User B's list"

# 4. User B accepts invitation
req = urllib.request.Request(f"{BASE_URL}/collaborators/invitations/{collaborator_id}/accept", headers=headers_b, method="POST")
with urllib.request.urlopen(req) as resp:
    accepted = json.loads(resp.read().decode("utf-8"))
print(f"User B accepted invitation: status={accepted['status']}")
assert accepted["status"] == "accepted"

# 5. User B attempts to edit form (should fail with 403 since Viewer role)
update_payload = json.dumps({"title": "Viewer Edited Title"}).encode("utf-8")
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}", data=update_payload, headers=headers_b, method="PUT")
try:
    with urllib.request.urlopen(req) as resp:
        print("ERROR: User B (Viewer) edited form but should have been blocked!")
        sys.exit(1)
except urllib.error.HTTPError as e:
    print(f"Blocked User B edit as Viewer: HTTP {e.code} (Expected 403)")
    assert e.code == 403

# 6. User B retrieves form details (should succeed)
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}", headers=headers_b)
with urllib.request.urlopen(req) as resp:
    fetched = json.loads(resp.read().decode("utf-8"))
print(f"User B read form details: title={fetched['title']}, role={fetched['user_role']}")
assert fetched["user_role"] == "viewer"

# 7. User A updates User B's role to Editor
role_update_payload = json.dumps({"role": "editor"}).encode("utf-8")
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}/collaborators/{collaborator_id}", data=role_update_payload, headers=headers_a, method="PUT")
with urllib.request.urlopen(req) as resp:
    updated = json.loads(resp.read().decode("utf-8"))
print(f"Owner updated role: role={updated['role']}")
assert updated["role"] == "editor"

# 8. User B attempts to edit form (should succeed now since Editor role)
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}", data=update_payload, headers=headers_b, method="PUT")
with urllib.request.urlopen(req) as resp:
    edited = json.loads(resp.read().decode("utf-8"))
print(f"User B edited form successfully as Editor: title={edited['title']}")
assert edited["title"] == "Viewer Edited Title"

# 9. User A removes User B
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}/collaborators/{collaborator_id}", headers=headers_a, method="DELETE")
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode("utf-8"))
print(f"Owner removed collaborator: {res}")

# 10. User B attempts to read form (should fail with 403 since not a collaborator anymore)
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}", headers=headers_b)
try:
    with urllib.request.urlopen(req) as resp:
        print("ERROR: User B read form but should have been blocked!")
        sys.exit(1)
except urllib.error.HTTPError as e:
    print(f"Blocked User B read after removal: HTTP {e.code} (Expected 403)")
    assert e.code == 403

# 11. Cleanup test form
req = urllib.request.Request(f"{BASE_URL}/forms/{form_id}", headers=headers_a, method="DELETE")
with urllib.request.urlopen(req) as resp:
    pass
print("Test completed and cleaned up.")

print("\n✅ SUCCESS: Collaboration E2E Test Passed 100% Cleanly!")
