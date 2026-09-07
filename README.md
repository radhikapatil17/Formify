# ⚡ Formify — Smart Form Builder & AI Response Management Platform

[![Deploy Status](https://img.shields.io/badge/Production-Deployed-success?style=flat-square&logo=netlify)](https://formify-studio.netlify.app)
[![Frontend](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=flat-square&logo=netlify)](https://formify-studio.netlify.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)](https://formify-ljk2.onrender.com)
[![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?style=flat-square&logo=postgresql)](https://neon.tech)
[![License](https://img.shields.io/badge/License-MIT-blue.style=flat-square)](#-license)

**Formify** is an enterprise-grade, modern, and intelligent form builder and survey collection platform. Powered by **React**, **FastAPI**, **Neon PostgreSQL**, and **Google Gemini AI**, Formify allows creators to design interactive questionnaires, configure conditional logic rules, perform cross-field math formulas, trigger secure external API lookups, collaborate with teams, and analyze respondent submissions in real-time.

🌐 **Live Production Frontend**: [https://formify-studio.netlify.app](https://formify-studio.netlify.app)  
⚙️ **Live Production Backend API**: [https://formify-ljk2.onrender.com](https://formify-ljk2.onrender.com)

---

## 🌟 Key Features

### 🎨 Form Builder & Customization
* **Visual Form Builder**: Clean, drag-and-drop & click-to-add canvas supporting Text, Textarea, Email, Phone, Number, Select, Multi-Select Radio/Checkbox, Rating (1-5 stars), Matrix, Date, Time, File Upload, and Formula fields.
* **Theme Customizer**: Tailor primary colors, background themes, typography, border radius, and label alignments with live canvas previews.
* **Multi-Page & Section Layouts**: Organize long surveys into clean, multi-step sections with progress bars.

### 🤖 Formify AI Suite (Powered by Gemini)
* **AI Form Generator**: Generate complete, tailored form schemas from a single text prompt.
* **AI Assistant & Copilot**: Get real-time design and question suggestions as you build.
* **AI Form Doctor**: Run automated health diagnostics on accessibility, question clarity, and conversion rate optimizations.
* **AI Response Simulator**: Simulate synthetic respondent submissions to validate form logic before publishing.
* **Document Scan-to-Fill**: Perform AI OCR on uploaded PDFs/images to extract data and auto-fill form responses.
* **AI Response Insights**: Automatically summarize submission trends, sentiment, and key respondent feedback.

### 🧮 Advanced Logic, Formulas & External Lookups
* **Conditional Logic Engine**: Build multi-condition rule trees (`AND`/`OR`) for actions such as `show`, `hide`, `make_required`, `make_optional`, `skip_to_question`, and `end_form`.
* **Cross-Field Math & Formulas**: Evaluate dynamic math expressions (e.g., `{Price} * {Quantity}`) live as respondents type, complete with custom prefixes/suffixes and decimal formatting.
* **Dynamic REST API Lookups**: Proxy external REST API queries securely from form inputs (e.g. ZIP code or SKU lookups) with built-in **SSRF security protection** blocking localhost, private subnets, and cloud metadata.

### 🔒 Respondent Experience, Verification & Recovery
* **Access Control & Password Protection**: Lock public forms behind visitor passwords or schedule access windows.
* **Response Limit Caps**: Set submission caps with custom limit-reached notifications.
* **Micro-Verification Gates**: Enforce Email or Phone OTP verification before submission.
* **Offline-First & Draft Recovery**: Auto-save respondent progress locally and generate shareable draft resume links to restore progress across browsers/devices.
* **Instant QR & Share**: Generate high-res QR codes for 1-click PNG download, copy public links, or dispatch live SMTP email invitations.

### 📊 Analytics & Team Collaboration
* **Master-Detail Question Analytics**: Scoped analytics explorer featuring category filter chips (`Choices`, `Text`, `Rating`, `Number`), visual choice progress bars, 5-star rating breakdowns, and stat summary cards.
* **Data Export**: Export response sheets to CSV with 1 click.
* **Team Collaboration & RBAC**: Assign `Owner`, `Editor`, or `Viewer` roles to collaborators.
* **Workspace Settings**: Configure profile details, brand swatches, workspace subdomain slugs, and manage API keys with live rotation.

---

## 🛠️ Technology Stack

### Frontend (Netlify)
* **Framework**: React 18 (Vite-powered SPA)
* **UI & Component Library**: Material-UI (MUI v5) & Emotion
* **Styling**: Vanilla CSS3 + Custom Design Tokens (Purple/Indigo SaaS palette)
* **Icons**: MUI Icons & Lucide React
* **State & HTTP**: Axios, React Router v6, React Hot Toast
* **Build Tool**: Vite 8.2

### Backend (Render)
* **Framework**: FastAPI (Python 3.11)
* **ASGI Server**: Uvicorn
* **Database & ORM**: PostgreSQL via SQLAlchemy 2.0 & Alembic
* **Authentication**: OAuth2 with Password Flow & JWT (`python-jose`, `passlib`, `bcrypt`)
* **AI Engine**: Google Gemini API (`google-genai` / REST integration)
* **HTTP Client**: HTTPX & Requests
* **Email Service**: Python SMTP (Gmail App Passwords supported)

---

## 💻 Local Development & Setup

### Prerequisites
* **Node.js**: v18+
* **Python**: v3.10+
* **PostgreSQL**: Local PostgreSQL or Cloud instance (Neon)

---

### 1. Backend Setup

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
4. Create a `.env` file in the project root or `backend/` directory (see [`backend/.env.example`](backend/.env.example)):
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_forms
   SECRET_KEY=your_secure_random_32_character_jwt_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   FRONTEND_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   GEMINI_API_KEY=your_gemini_api_key
   ```
5. Run database initialization and start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Create a `.env` file in `frontend/` (see [`frontend/.env.example`](frontend/.env.example)):
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 🚀 Production Deployment Architecture

Formify is configured for 1-click cloud deployment:

### 1. Netlify (Frontend SPA)
* **Build Command**: `npm run build`
* **Publish Directory**: `dist`
* **SPA Routing**: Handled via `frontend/public/_redirects` (`/* /index.html 200`) & `frontend/netlify.toml`.
* **Environment Variable**: `VITE_API_URL=https://formify-ljk2.onrender.com`

### 2. Render (FastAPI Backend)
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Blueprint**: Defined in [`render.yaml`](render.yaml).

### 3. Neon (Cloud PostgreSQL)
* Connection string format: `postgresql://user:password@ep-instance.neon.tech/neondb?sslmode=require`
* Auto-normalized by SQLAlchemy engine in `backend/app/database/database.py`.

---

## 🧪 E2E Integration Testing

To execute the automated Master 33-test End-to-End Audit Suite:

```bash
/Users/radhikaapatil/Desktop/smart-form-builder/venv/bin/python backend/scratch/test_audit_suite.py
```

To run frontend build verification:
```bash
cd frontend && npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
