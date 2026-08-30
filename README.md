# RAG-Based College Chatbot

An AI-powered college information system built with **FastAPI**, **Next.js**, **SQLAlchemy**, and **Qdrant Vector Database** following the single source of truth specification in [`spec.md`](./spec.md).

It enables students to ask natural-language questions about college admissions, regulations, fees, examinations, campus services, and placements, retrieving grounded answers with transparent document source citations.

---

## 🌟 Feature Status

### ✅ Core features — implemented and verified

- **Full-Stack Architecture**: Python FastAPI REST backend + Next.js React TypeScript frontend.
- **RAG Pipeline**: Text extraction, cleaning, chunking, embeddings, Qdrant indexing, hybrid retrieval, re-ranking, grounded generation, and source references.
- **Supported Resources**: PDF, DOCX, TXT, CSV, Markdown, JSON, XML, HTML, RTF, logs, and common image files. Legacy `.doc` requires LibreOffice or `antiword`.
- **Authenticated Contributions**: Students and faculty can contribute resources from Chatbot; administrators can upload and manage resources from Documents.
- **Grounding Safeguards**: Insufficient-context and no-relevant-information responses, untrusted-document prompt handling, and source display.
- **Authentication and Roles**: JWT sessions, bcrypt password hashing, and `STUDENT`, `FACULTY`, and `ADMIN` roles.
- **Admin Management and Analytics**: Metadata editing, reprocessing, version replacement, deletion, collections, usage metrics, feedback, and system health.
- **Deployment**: Working Next.js frontend on Vercel and FastAPI backend on Render Free for demonstrations, with PostgreSQL migrations, Supabase Storage, and hosted Qdrant configuration for persistent deployments.

### ✅ Optional features — implemented, with browser/provider limitations

- Light/dark themes, department and collection filters, conversation history, rename/delete, export, suggested questions, source highlighting, feedback, extractive summaries, generated FAQs, browser voice input/output, multilingual prompt selection, OCR, hybrid search, and re-ranking.

### ⚠️ Deliberate demo limitations

- The default Render Blueprint is intentionally zero-cost and uses local SQLite/Qdrant storage; uploaded resources and conversations can disappear after a restart or spin-down. Configure external PostgreSQL, Supabase Storage, and Qdrant Cloud to enable persistent mode.
- Gemini embeddings and answer generation are optional. Without an API key, deterministic local embeddings and grounded extractive synthesis are used.
- Streaming responses, PPTX extraction, document approval workflows, rate limiting, and formal RAG benchmark evaluation are not included.

The theme switcher is in the top-right navigation and remembers the selected light or dark mode. In Chatbot, open the contribution panel to add a resource, or open the filter control to choose a department, collection, or answer language; use the microphone, Read, and Export controls for the additional chat features.

---

## 📂 Project Architecture

```text
projectAI/
├── spec.md                   # Single Source of Truth Specification
├── README.md                 # Complete Local Setup Instructions
│
├── server/                   # FastAPI Backend
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, CORS, startup seed
│   │   ├── api/              # API Routers (auth, chat, documents, collections, feedback, admin)
│   │   ├── models/           # SQLAlchemy DB Models (User, Document, Conversation, Message, Feedback, QueryLog)
│   │   ├── schemas/          # Pydantic Request/Response validation models
│   │   ├── services/         # Business logic services
│   │   ├── rag/              # RAG Pipeline (loader, cleaner, chunker, embeddings, vector_search, answer_generator, pipeline)
│   │   ├── database/         # PostgreSQL/SQLite & Qdrant vector DB initialization
│   │   └── core/             # Configuration, JWT security, auth dependencies
│   ├── uploads/              # Uploaded document storage
│   ├── tests/                # Pytest unit & integration test suite
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variable template
│   └── .env                  # Backend configuration settings
│
└── client/                   # Next.js Frontend
    ├── src/
    │   ├── app/              # Next.js App Router pages (/, /login, /register, /chat, /documents, /admin, /settings)
    │   ├── components/       # UI Components (Layout, ChatWindow, SourceCard, DocumentTable, MetricCard, etc.)
    │   ├── services/         # Axios API HTTP client
    │   └── store/            # Zustand state management (AuthStore)
    ├── package.json          # Node.js dependencies
    └── tailwind.config.js    # Tailwind CSS styling configuration
```

---

## 🚀 How to Run the Project Locally

### Prerequisites

- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** and **npm**

---

### Persistent deployment configuration

For restart-safe deployments, set these variables in Render's secret environment settings:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase Storage key; never expose it in the frontend |
| `SUPABASE_STORAGE_BUCKET` | Private bucket for uploaded resources, normally `college-documents` |
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant Cloud API key |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional first administrator account |
| `DEMO_STUDENT_EMAIL` / `DEMO_STUDENT_PASSWORD` | Optional demo student account |

The application runs `alembic upgrade head` automatically for external PostgreSQL databases. SQLite keeps the existing local development path. Existing local files are not automatically copied to external services; upload them again after switching storage mode.

Do not commit real values to `.env`, `.env.local`, Vercel, or the repository. The frontend's optional `NEXT_PUBLIC_DEMO_*_EMAIL` variables only prefill an email; they never carry a password.

### Step 1: Backend Setup (FastAPI)

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **(Optional) Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   The backend comes pre-configured with SQLite and local folder Qdrant for zero-dependency out-of-the-box running in `.env`. If `.env` is missing, copy `.env.example` to `.env`, set `JWT_SECRET` to a long random value, and optionally set `ADMIN_EMAIL`/`ADMIN_PASSWORD` for a local administrator account.
   
   If you have a Google Gemini API Key, add it to `server/.env`:
   ```env
   LLM_PROVIDER=gemini
   LLM_API_KEY=your_gemini_api_key_here
   EMBEDDING_PROVIDER=gemini
   EMBEDDING_API_KEY=your_gemini_api_key_here
   ```
   *(Note: If no API key is provided, the backend seamlessly falls back to local deterministic embeddings and grounded synthesis so the application runs completely offline!)*

   Image and scanned-PDF OCR uses Tesseract when it is installed. For full image-text extraction, install the Python packages with `python -m pip install -r requirements.txt`, then install Tesseract OCR for Windows and ensure `tesseract.exe` is on `PATH`; without it, image resources are still accepted and indexed with their file metadata.

5. **Start the FastAPI backend server**:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The backend server will run at: **`http://localhost:8000`**
   Interactive API docs (Swagger UI) will be available at: **`http://localhost:8000/docs`**

---

### Step 2: Frontend Setup (Next.js)

1. **Open a new terminal and navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```
   On Windows PowerShell systems where script execution is restricted, use `npm.cmd install`.

3. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   On the same restricted PowerShell systems, use `npm.cmd run dev`.
   The frontend application will run at: **`http://localhost:3000`**

### Local verification checklist

1. Open **`http://localhost:8000/api/health`** and confirm the response status is `HEALTHY`.
2. Open **`http://localhost:3000`** and sign in with one of the demo accounts below.
3. As the admin, upload a `.pdf`, `.doc`/`.docx`, text/data/web resource, or image from **Documents**. Any signed-in user can also contribute a resource from the Chatbot page.
4. Wait for its status to become `COMPLETED`, then ask a question supported by that document in **Chatbot**.
5. Confirm the answer shows `GROUNDED` and a source card with the document name and page number.

---

## 🔑 Account provisioning

When `ADMIN_EMAIL` and `ADMIN_PASSWORD` are supplied in the backend environment, the FastAPI server provisions that administrator account on first start. `DEMO_STUDENT_EMAIL` and `DEMO_STUDENT_PASSWORD` work the same way for an optional student account. Public registration creates student or faculty accounts; administrator accounts cannot be created through public registration.

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Student** | `DEMO_STUDENT_EMAIL` | `DEMO_STUDENT_PASSWORD` | Chatbot, Contribute Resources, Ask Questions, View Sources, Give Feedback |
| **Admin** | `ADMIN_EMAIL` | `ADMIN_PASSWORD` | Full Access + Document Management + Admin Analytics Dashboard |

---

## 🧪 Running Backend Unit Tests

To run the automated backend test suite:
```bash
# Run pytest from the project root
python -m pytest server/tests
```

The 14-test suite across authentication, ingestion, storage, RAG, and retrieval modules verifies:
- Password hashing & JWT generation
- Text cleaner & recursive document chunker
- Embedding vector dimensions
- Grounded prompt builder formatting
- Unknown question handling & hallucination prevention

---

## 📊 Quick Walkthrough Guide

1. Open **`http://localhost:3000`** in your browser.
2. Register a student/faculty account, or sign in with the administrator credentials configured in `server/.env`.
3. Go to **Documents** page (`/documents`) and upload a sample college notice, syllabus, text/data resource, Word file, or image. Alternatively, open **Chatbot** (`/chat`) and expand **Contribute a resource to the knowledge base**.
4. Ask a question regarding the uploaded document (e.g. *"What are the hostel fee rules?"*).
5. Notice the **Grounded Status Badge** (`100% Grounded in Knowledge Base`) and exact **Source Citation Cards** displaying the file name and page number!
6. Visit **Admin Dashboard** (`/admin`) to inspect live query analytics, average response times, user satisfaction, and system health status.
