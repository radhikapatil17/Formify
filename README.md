# Formify — Smart Form Builder & Response Management Platform

Formify is a modern, responsive, and robust form-building and survey collection application. Built using a robust stack of React, FastAPI, and PostgreSQL, it allows creators to design questionnaires dynamically, configure conditional logic rules, manage form availability schedules, limit response collection caps, share forms via live email invites or custom-generated QR codes, and analyze collected submissions in real-time.

---

## 🚀 Key Features

*   **Drag-and-Drop Form Builder**: Visually compose fields (Text, Textarea, Email, Phone, Number, URL, Date, Time, Dropdown, Radio Buttons, Checkboxes, Matrix, File Upload, etc.).
*   **Intuitive Options Editor**: High-fidelity options editor supporting smooth inline renaming, reordering, deleting, and settings tweaks with zero focus loss.
*   **Conditional Logic Rules**: Create powerful triggers and multi-target actions (e.g., show/hide questions based on previous answers).
*   **Form Availability Scheduling**: Automatically open and close forms based on specific start/end timestamps. Enforced at both client-level and API-level.
*   **Response Limit Constraints**: Limit the maximum number of collected submissions. Automatically blocks further submissions when reached, displaying customizable warnings to respondents.
*   **Instant Sharing & QR Codes**:
    *   Dynamic, high-resolution QR Code generation with 1-click PNG download.
    *   Live SMTP email invitations directly to respondents.
    *   1-click Public link copy to clipboard.
*   **Submissions Dashboard**: View, filter, sort, export response sheets, and monitor real-time notifications for collected form entries.

---

## 🛠️ Technology Stack

### Backend
*   **Framework**: FastAPI (Python 3.10+)
*   **ORM**: SQLAlchemy
*   **Database**: PostgreSQL
*   **Authentication**: JWT Token-based OAuth2
*   **Email Service**: Secure SMTP (with support for Gmail App Passwords)

### Frontend
*   **Framework**: React (Vite-powered SPA)
*   **UI Library**: Material-UI (MUI v5)
*   **Animations**: Framer Motion
*   **QR Rendering**: HTML5 Canvas (`qrcode.react`)
*   **Routing**: React Router v6

---

## 💻 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   PostgreSQL running locally or hosted

### 1. Database Setup
Create a PostgreSQL database named `smart_form_builder` (or matching your preferred name in `.env`):
```sql
CREATE DATABASE smart_form_builder;
```

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` directory:
   ```env
   # Database Configurations
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/smart_form_builder

   # Security Configurations
   SECRET_KEY=your-super-secret-jwt-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # SMTP Configurations (Gmail App Password Example)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME=Formify
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Verification & Testing
To verify the features end-to-end, you can execute the Python API integration test suites:
```bash
# Verify Scheduling & Response Limit features
PYTHONPATH=./backend python backend/app/tests/test_response_limit.py
```

---

## 📄 License
This project is licensed under the MIT License.
