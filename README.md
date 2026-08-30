# RAG-Based College Chatbot

An AI-powered college information system built with **FastAPI**, **Next.js**, **SQLAlchemy**, and **Qdrant Vector Database** following the single source of truth specification in [`spec.md`](./spec.md).

It enables students to ask natural-language questions about college admissions, regulations, fees, examinations, campus services, and placements, retrieving grounded answers with transparent document source citations.

---

## 🌟 Key Features

- **Full-Stack Architecture**: Python FastAPI REST backend + Next.js React TypeScript frontend.
- **RAG Vector Search**: Document chunking (500–800 tokens target, 100 token overlap) with Qdrant vector database embedding indexing.
- **Source Citation Cards**: Grounded AI responses featuring verified document name, page number, section, and similarity match percentage.
- **Zero-Hallucination Guardrails**: Detects when context is insufficient or ungrounded and safely declines rather than inventing college policies.
- **Untrusted Document Security**: System prompts treat uploaded documents strictly as data references, protecting against prompt injection.
- **Admin Resource Management**: PDF, DOC/DOCX, TXT, CSV, Markdown, JSON, HTML, RTF, and common image upload with OCR fallback, status tracking (`UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`), re-indexing, and deletion.
- **Admin Analytics Dashboard**: Live metrics tracking total users, documents, query latency, user satisfaction ratings, and system health status.
- **User Authentication & Role Authorization**: JWT authentication with bcrypt password hashing supporting `STUDENT`, `FACULTY`, and `ADMIN` roles.
- **Bonus Features**: Light/dark themes, collections, department filters, active document versions, metadata editing, highlighted source passages, conversation export, browser voice input/output, summaries, generated FAQs, analytics, hybrid search, reranking, and optional OCR for scanned PDFs.

The theme switcher is in the top-right navigation and remembers the selected light or dark mode. In Chatbot, open the filter control to choose a department, collection, or answer language; use the microphone, Read, and Export controls for the additional chat features.

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
   The backend comes pre-configured with SQLite and local folder Qdrant for zero-dependency out-of-the-box running in `.env`. If `.env` is missing, copy `.env.example` to `.env` and set `JWT_SECRET` to a long random value.
   
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
3. As the admin, upload a `.pdf`, `.doc`/`.docx`, text/data/web resource, or image from **Documents**.
4. Wait for its status to become `COMPLETED`, then ask a question supported by that document in **Chatbot**.
5. Confirm the answer shows `GROUNDED` and a source card with the document name and page number.

---

## 🔑 Pre-seeded Default Accounts

When the FastAPI server starts, it automatically seeds initial accounts into the database. Public registration creates student or faculty accounts; administrator access uses the seeded admin account (or must be provisioned directly by an administrator).

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Student** | `student@college.edu` | `student123` | Chatbot, Ask Questions, View Sources, Give Feedback |
| **Admin** | `admin@college.edu` | `admin123` | Full Access + Document Management + Admin Analytics Dashboard |

---

## 🧪 Running Backend Unit Tests

To run the automated backend test suite:
```bash
# Run pytest from the project root
python -m pytest server/tests
```

All 7 test suites verify:
- Password hashing & JWT generation
- Text cleaner & recursive document chunker
- Embedding vector dimensions
- Grounded prompt builder formatting
- Unknown question handling & hallucination prevention

---

## 📊 Quick Walkthrough Guide

1. Open **`http://localhost:3000`** in your browser.
2. Click **Log In** and select **Demo Admin** (`admin@college.edu` / `admin123`).
3. Go to **Documents** page (`/documents`) and upload a sample college notice, syllabus, text/data resource, Word file, or image.
4. Switch to **Chatbot** (`/chat`) and ask a question regarding the uploaded document (e.g. *"What are the hostel fee rules?"*).
5. Notice the **Grounded Status Badge** (`100% Grounded in Knowledge Base`) and exact **Source Citation Cards** displaying the file name and page number!
6. Visit **Admin Dashboard** (`/admin`) to inspect live query analytics, average response times, user satisfaction, and system health status.
