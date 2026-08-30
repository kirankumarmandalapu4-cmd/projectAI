from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from sqlalchemy import inspect, text

# Adjust sqlite connect_args if SQLite database URL is used
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True if not settings.DATABASE_URL.startswith("sqlite") else False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to provide database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_schema() -> None:
    """Apply small additive schema changes for the zero-config SQLite setup."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    required_columns = {
        "collection_id": "VARCHAR(36)",
        "is_active": "BOOLEAN NOT NULL DEFAULT 1",
        "summary": "TEXT",
    }
    existing = {column["name"] for column in inspect(engine).get_columns("documents")}
    with engine.begin() as connection:
        for name, definition in required_columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE documents ADD COLUMN {name} {definition}"))
