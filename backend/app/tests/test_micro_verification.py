import unittest
import hashlib
from datetime import datetime, timezone, timedelta
from app.database.database import SessionLocal
from app.models.user import User
from app.models.form import Form
from app.models.field import Field
from app.models.form_verification import FormVerification
from app.api.public_verification import is_disposable_email, is_valid_phone_number

class TestMicroVerification(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Create a test user
        self.test_user = User(
            name="Verif Tester",
            email=f"verif_test_{datetime.now().timestamp()}@example.com",
            password_hash="testpassword123"
        )
        self.db.add(self.test_user)
        self.db.commit()
        self.db.refresh(self.test_user)

        # Create a form with micro-verification enabled
        self.form = Form(
            title="Verification Test Form",
            status="published",
            is_email_otp_enabled=True,
            is_phone_otp_enabled=True,
            otp_expiry_minutes=10,
            max_otp_attempts=3,
            otp_cooldown_seconds=60,
            require_verification_to_submit=True,
            owner_id=self.test_user.id
        )
        self.db.add(self.form)
        self.db.commit()
        self.db.refresh(self.form)

    def tearDown(self):
        # Clean up database records
        self.db.query(FormVerification).filter(FormVerification.form_id == self.form.id).delete()
        self.db.query(Form).filter(Form.id == self.form.id).delete()
        self.db.query(User).filter(User.id == self.test_user.id).delete()
        self.db.commit()
        self.db.close()

    def test_disposable_email_detection(self):
        self.assertTrue(is_disposable_email("user@tempmail.com"))
        self.assertTrue(is_disposable_email("test@mailinator.com"))
        self.assertTrue(is_disposable_email("person@10minutemail.com"))
        self.assertFalse(is_disposable_email("alice@gmail.com"))
        self.assertFalse(is_disposable_email("bob@company.org"))

    def test_phone_format_validation(self):
        self.assertTrue(is_valid_phone_number("+14155552671"))
        self.assertTrue(is_valid_phone_number("9876543210"))
        self.assertFalse(is_valid_phone_number("0000000000"))
        self.assertFalse(is_valid_phone_number("123"))
        self.assertFalse(is_valid_phone_number("invalid-phone"))

    def test_otp_hashing_and_verification_record(self):
        otp_code = "123456"
        otp_hash = hashlib.sha256(f"formify_otp_salt:{otp_code}".encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        record = FormVerification(
            form_id=self.form.id,
            verification_type="email",
            destination="test@example.com",
            otp_hash=otp_hash,
            expires_at=expires_at,
            attempts=0,
            max_attempts=3
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        self.assertIsNotNone(record.id)
        self.assertFalse(record.is_verified)

        # Test verification logic
        submitted_hash = hashlib.sha256(f"formify_otp_salt:{otp_code}".encode()).hexdigest()
        self.assertEqual(record.otp_hash, submitted_hash)

        record.is_verified = True
        record.otp_hash = None
        record.session_token = f"verif_test_token_{record.id}"
        self.db.commit()

        fetched = self.db.query(FormVerification).filter(FormVerification.id == record.id).first()
        self.assertTrue(fetched.is_verified)
        self.assertIsNone(fetched.otp_hash)
        self.assertIsNotNone(fetched.session_token)

if __name__ == "__main__":
    unittest.main()
