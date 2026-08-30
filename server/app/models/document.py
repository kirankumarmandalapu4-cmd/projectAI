import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
import enum
from app.database.postgres import Base

class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_url = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    category = Column(String(100), default="General")
    department = Column(String(100), default="All")
    description = Column(Text, nullable=True)
    status = Column(String(20), default=DocumentStatus.UPLOADED.value, nullable=False)
    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    version = Column(String(20), default="1.0")
    collection_id = Column(String(36), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    summary = Column(Text, nullable=True)
    uploaded_by = Column(String(36), nullable=False) # User ID
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
