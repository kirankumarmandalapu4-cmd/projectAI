from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.postgres import Base, engine, SessionLocal, ensure_sqlite_schema, run_database_migrations
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.services.storage import document_storage
from app.database.qdrant import qdrant_db
from app.api import auth, chat, documents, collections, feedback, admin

# Apply repeatable migrations for external databases before the fallback
# create_all used by the zero-configuration SQLite development setup.
run_database_migrations()
Base.metadata.create_all(bind=engine)
ensure_sqlite_schema()

app = FastAPI(
    title="RAG-Based College Chatbot API",
    description="Full-stack AI college information system with vector search retrieval and grounded answer generation.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(collections.router)
app.include_router(feedback.router)
app.include_router(admin.router)

@app.on_event("startup")
def startup_db_seed():
    """Provision optional accounts from deployment environment variables."""
    db = SessionLocal()
    try:
        configured_accounts = [
            (
                settings.ADMIN_EMAIL,
                settings.ADMIN_PASSWORD,
                settings.ADMIN_NAME,
                UserRole.ADMIN.value,
            ),
            (
                settings.DEMO_STUDENT_EMAIL,
                settings.DEMO_STUDENT_PASSWORD,
                settings.DEMO_STUDENT_NAME,
                UserRole.STUDENT.value,
            ),
        ]

        for email, password, name, role in configured_accounts:
            if not email and not password:
                continue
            if not email or not password:
                print(f"[Seed] Skipping incomplete {role} account configuration.")
                continue
            normalized_email = email.strip().lower()
            if not normalized_email:
                continue
            existing_user = db.query(User).filter(User.email == normalized_email).first()
            if not existing_user:
                db.add(User(
                    name=name,
                    email=normalized_email,
                    password_hash=hash_password(password),
                    role=role,
                ))
                print(f"[Seed] Provisioned configured {role} account: {normalized_email}")

        if settings.ENVIRONMENT.lower() == "production" and not settings.ADMIN_EMAIL:
            print("[Seed] ADMIN_EMAIL/ADMIN_PASSWORD are not configured; no admin account will be created.")

        db.commit()
    except Exception as e:
        print(f"[Seed] Error creating seed users: {e}")
    finally:
        db.close()

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint required by Section 11 & Phase 1 of spec.md."""
    vector_status = qdrant_db.health_status()
    return {
        "status": "HEALTHY",
        "service": "RAG-Based College Chatbot API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
        "documentStorage": "supabase" if document_storage.is_remote else "local",
        # Keep the original string field for existing clients and expose the
        # live collection details separately for diagnostics.
        "vectorStorage": vector_status["mode"] if vector_status["connected"] else "unavailable",
        "vectorStore": vector_status,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
