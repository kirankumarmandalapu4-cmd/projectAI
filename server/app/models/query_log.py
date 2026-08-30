import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Float, JSON
from app.database.postgres import Base

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    conversation_id = Column(String(36), nullable=True)
    query = Column(Text, nullable=False)
    retrieved_chunks = Column(JSON, nullable=True)
    retrieval_scores = Column(JSON, nullable=True)
    response_time = Column(Float, nullable=False) # In seconds
    answer_status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
