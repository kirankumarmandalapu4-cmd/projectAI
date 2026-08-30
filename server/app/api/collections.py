from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User
from app.models.collection import Collection
from app.models.document import Document
from app.core.dependencies import get_current_user, get_current_active_admin
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(prefix="/api/collections", tags=["Collections"])

class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    category: str = Field("General", max_length=100)
    department: str = Field("All", max_length=100)


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)

class CollectionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    department: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[CollectionResponse])
def list_collections(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List document collections."""
    return db.query(Collection).order_by(Collection.created_at.desc()).all()

@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    body: CollectionCreate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Create document collection."""
    col = Collection(
        name=body.name,
        description=body.description,
        category=body.category,
        department=body.department,
        created_by=current_admin.id
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return col


@router.get("/{col_id}", response_model=CollectionResponse)
def get_collection(
    col_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single document collection."""
    col = db.query(Collection).filter(Collection.id == col_id).first()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found.")
    return col


@router.put("/{col_id}", response_model=CollectionResponse)
def update_collection(
    col_id: str,
    body: CollectionUpdate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Update collection metadata (administrator only)."""
    col = db.query(Collection).filter(Collection.id == col_id).first()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found.")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(col, key, value)
    db.commit()
    db.refresh(col)
    return col

@router.delete("/{col_id}")
def delete_collection(
    col_id: str,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Delete a collection."""
    col = db.query(Collection).filter(Collection.id == col_id).first()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found.")
    documents = db.query(Document).filter(
        Document.collection_id == col_id,
        Document.is_active.is_(True),
    ).all()
    db.query(Document).filter(Document.collection_id == col_id).update({"collection_id": None})
    db.delete(col)
    db.commit()

    # Collection membership is part of each Qdrant payload. Re-index active
    # documents after unassigning them so retrieval matches the database.
    from app.api.documents import process_document_background
    from app.database.postgres import SessionLocal
    from app.rag.retrieval.vector_search import vector_search_service
    for document in documents:
        vector_search_service.delete_document_chunks(document.id)
        process_document_background(document.id, document.storage_url, document.file_type, SessionLocal)
    return {"message": "Collection deleted successfully."}
