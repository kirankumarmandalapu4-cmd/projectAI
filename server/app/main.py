from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.postgres import Base, engine, SessionLocal, ensure_sqlite_schema
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.api import auth, chat, documents, collections, feedback, admin

# Create DB tables
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
    """Seed initial default Administrator and Student accounts if empty."""
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@college.edu").first()
        if not admin_user:
            admin_user = User(
                name="College Administrator",
                email="admin@college.edu",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN.value
            )
            db.add(admin_user)
            print("[Seed] Created default Admin account: admin@college.edu / admin123")

        student_user = db.query(User).filter(User.email == "student@college.edu").first()
        if not student_user:
            student_user = User(
                name="Demo Student",
                email="student@college.edu",
                password_hash=hash_password("student123"),
                role=UserRole.STUDENT.value
            )
            db.add(student_user)
            print("[Seed] Created default Student account: student@college.edu / student123")

        db.commit()
    except Exception as e:
        print(f"[Seed] Error creating seed users: {e}")
    finally:
        db.close()

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint required by Section 11 & Phase 1 of spec.md."""
    return {
        "status": "HEALTHY",
        "service": "RAG-Based College Chatbot API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
