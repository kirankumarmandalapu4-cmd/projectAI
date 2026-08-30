from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DocumentCreate(BaseModel):
    name: str = Field(..., max_length=255)
    category: str = Field("General", max_length=100)
    department: str = Field("All", max_length=100)
    description: Optional[str] = None
    version: str = Field("1.0", max_length=20)

class DocumentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=5000)
    version: Optional[str] = Field(None, max_length=20)
    collection_id: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    name: str
    original_filename: str
    storage_url: str
    file_type: str
    category: str
    department: str
    description: Optional[str] = None
    status: str
    page_count: int
    chunk_count: int
    version: str
    collection_id: Optional[str] = None
    is_active: bool = True
    summary: Optional[str] = None
    uploaded_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
