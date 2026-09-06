"""
E2E Test: Password Reset / Recovery flow
- Generates reset token for registered email
- Validates token lookup
- Consumes token to update password in database
- Verifies new credentials via login endpoint
"""
import json
import urllib.request
import urllib.error
import sys

from app.database.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()

# Ensure clean starting state
test_email = "recovery@example.com"
existing = db.query(User).filter(User.email == test_email).first()
if existing:
    db.delete(existing)
    db.commit()

# Create test user
test_user = User(
    name="Recovery Test User",
    email=test_email,
    password_hash=hash_password("OldPassword123!")
)
db.add(test_user)
db.commit()
db.close()

BASE_URL = "http://localhost:8000"

print("1. Initiating Forgot Password Request...")
forgot_payload = json.dumps({"email": test_email}).encode("utf-8")
req = urllib.request.Request(
    f"{BASE_URL}/auth/forgot-password",
    data=forgot_payload,
    headers={"Content-Type": "application/json", "X-Test-Request": "true"}
)
with urllib.request.urlopen(req) as resp:
    res_forgot = json.loads(resp.read().decode("utf-8"))
print(f"Forgot Password response: {res_forgot}")

# Extract the token from the reset_link returned in response
reset_link = res_forgot.get("reset_link")
assert reset_link is not None, "Password reset link was not returned in test mode response!"

from urllib.parse import urlparse, parse_qs
parsed = urlparse(reset_link)
queries = parse_qs(parsed.query)
token = queries.get("token", [None])[0]

assert token is not None, "Password reset token not found in the link!"
print(f"Generated password reset token found: {token}")

print("\n2. Consuming Reset Password Link...")
reset_payload = json.dumps({
    "token": token,
    "new_password": "NewPassword123!"
}).encode("utf-8")
req = urllib.request.Request(
    f"{BASE_URL}/auth/reset-password",
    data=reset_payload,
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    res_reset = json.loads(resp.read().decode("utf-8"))
print(f"Reset Password response: {res_reset}")
assert "Password updated successfully" in res_reset["message"]

print("\n3. Testing login with new password...")
login_data = urllib.parse.urlencode({
    "username": test_email,
    "password": "NewPassword123!"
}).encode("utf-8")
req = urllib.request.Request(
    f"{BASE_URL}/auth/login",
    data=login_data,
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
with urllib.request.urlopen(req) as resp:
    res_login = json.loads(resp.read().decode("utf-8"))
print("Login successful with new password!")
assert "access_token" in res_login

# 4. Clean up test user
db = SessionLocal()
u = db.query(User).filter(User.email == test_email).first()
if u:
    db.delete(u)
    db.commit()
db.close()
print("Cleanup finished successfully.")

print("\n✅ SUCCESS: Password Recovery Flow E2E Test Passed 100% Cleanly!")
