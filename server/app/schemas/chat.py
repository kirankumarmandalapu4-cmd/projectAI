from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime

class SourceReference(BaseModel):
    documentId: Optional[str] = None
    documentName: str
    pageNumber: Optional[int] = None
    section: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    collectionId: Optional[str] = None
    score: Optional[float] = None
    snippet: Optional[str] = None

class RetrievalMetadata(BaseModel):
    topK: int = 5
    chunksUsed: int = 0
    queryTimeMs: Optional[float] = None
    language: Optional[str] = None

class ChatRequest(BaseModel):
    conversationId: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=4000)
    categoryFilter: Optional[str] = None
    departmentFilter: Optional[str] = None
    collectionFilter: Optional[str] = None
    language: str = Field("auto", pattern="^(auto|en|hi|te)$")

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be blank.")
        return value

class ChatResponse(BaseModel):
    conversationId: str
    messageId: str
    answer: str
    answerStatus: str # GROUNDED, PARTIALLY_GROUNDED, INSUFFICIENT_CONTEXT, NO_RELEVANT_INFORMATION
    sources: List[SourceReference] = []
    retrieval: RetrievalMetadata

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    retrieval_metadata: Optional[Dict[str, Any]] = None
    answer_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageResponse]] = None

    class Config:
        from_attributes = True

class UpdateConversationTitle(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
