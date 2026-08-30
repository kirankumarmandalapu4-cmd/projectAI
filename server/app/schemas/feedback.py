from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    message_id: str
    rating: int = Field(..., description="1 for helpful, -1 for unhelpful")
    reason: Optional[str] = Field(None, description="Incorrect, Incomplete, Irrelevant, Wrong source, Other")
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, value: int) -> int:
        if value not in (-1, 1):
            raise ValueError("rating must be 1 (helpful) or -1 (unhelpful)")
        return value

class FeedbackResponse(BaseModel):
    id: str
    message_id: str
    user_id: str
    rating: int
    reason: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
