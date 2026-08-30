import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer
from app.database.postgres import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=False)
    rating = Column(Integer, nullable=False) # 1 for helpful, -1 for unhelpful
    reason = Column(String(100), nullable=True) # Incorrect, Incomplete, Irrelevant, Wrong source, Other
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
