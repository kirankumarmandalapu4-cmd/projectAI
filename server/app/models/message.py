import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, JSON
from app.database.postgres import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), nullable=False, index=True)
    role = Column(String(20), nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True) # Array of source metadata dicts
    retrieval_metadata = Column(JSON, nullable=True)
    answer_status = Column(String(50), default="GROUNDED") # GROUNDED, PARTIALLY_GROUNDED, INSUFFICIENT_CONTEXT, NO_RELEVANT_INFORMATION
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
