import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

SERVER_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./college_rag.db"
    AUTO_MIGRATE: bool = True
    
    # Vector DB
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_PATH: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "college_chunks"

    # Supabase Storage (optional; local filesystem remains the development fallback)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "college-documents"
    
    # LLM
    LLM_PROVIDER: str = "gemini"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-2.5-flash"
    
    # Embedding
    EMBEDDING_PROVIDER: str = "gemini"
    EMBEDDING_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "models/text-embedding-004"
    EMBEDDING_DIMENSION: int = 768
    
    # Security
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # Optional seed accounts. Set these in the deployment platform, never in source.
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None
    ADMIN_NAME: str = "College Administrator"
    DEMO_STUDENT_EMAIL: Optional[str] = None
    DEMO_STUDENT_PASSWORD: Optional[str] = None
    DEMO_STUDENT_NAME: str = "Demo Student"

    # Web application
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ENVIRONMENT: str = "development"
    
    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 20
    
    # RAG Settings
    TOP_K: int = 5
    RETRIEVAL_SCORE_THRESHOLD: float = 0.3
    TARGET_CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100
    
    model_config = SettingsConfigDict(
        env_file=SERVER_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

def _resolve_local_path(value: str) -> str:
    """Resolve relative local paths from the server directory, not the shell cwd."""
    path = Path(value)
    return str(path if path.is_absolute() else SERVER_DIR / path)


if settings.DATABASE_URL.startswith("sqlite:///./"):
    database_path = SERVER_DIR / settings.DATABASE_URL.removeprefix("sqlite:///./")
    settings.DATABASE_URL = f"sqlite:///{database_path.as_posix()}"
elif settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

settings.UPLOAD_DIR = _resolve_local_path(settings.UPLOAD_DIR)

if not settings.JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not configured. Copy server/.env.example to server/.env "
        "and set a long random JWT_SECRET before starting the API."
    )

# Ensure local storage exists before the application or ingestion pipeline starts.
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
