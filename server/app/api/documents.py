import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.collection import Collection
from app.schemas.document import DocumentResponse, DocumentUpdate
from app.core.dependencies import get_current_active_admin, get_current_user
from app.core.config import settings
from app.rag.pipeline import rag_pipeline
from app.rag.retrieval.vector_search import vector_search_service
from app.services.document_insights import build_document_insights, summarize_document
from app.services.storage import document_storage

router = APIRouter(prefix="/api/documents", tags=["Document Management"])

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt", ".csv", ".md", ".markdown", ".json", ".xml", ".html", ".htm", ".rtf", ".log",
    ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff", ".gif",
}

def process_document_background(doc_id: str, file_path: str, file_type: str, db_session_factory) -> bool:
    """Background task to run RAG ingestion pipeline asynchronously."""
    db = db_session_factory()
    doc = None
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return False
        
        doc.status = DocumentStatus.PROCESSING.value
        db.commit()

        doc_meta = {
            "id": doc.id,
            "name": doc.name,
            "original_filename": doc.original_filename,
            "category": doc.category,
            "department": doc.department,
            "collection_id": doc.collection_id,
            "is_active": doc.is_active,
        }

        with document_storage.local_copy(file_path, file_type) as local_file_path:
            page_count, chunk_count = rag_pipeline.process_and_index_document(local_file_path, file_type, doc_meta)

            doc.page_count = page_count
            doc.chunk_count = chunk_count
            doc.summary = summarize_document(local_file_path, file_type)

            # Persist the source outside Render's ephemeral filesystem when
            # Supabase Storage is configured. Local mode keeps the existing
            # path-based behavior for zero-configuration development.
            if document_storage.is_remote and not document_storage.is_remote_reference(doc.storage_url):
                object_key = f"documents/{doc.id}_{Path(doc.original_filename).name}"
                doc.storage_url = document_storage.upload_file(local_file_path, object_key)
                try:
                    Path(file_path).unlink(missing_ok=True)
                except OSError:
                    pass

        doc.status = DocumentStatus.COMPLETED.value
        db.commit()
        print(f"[Document Ingestion] Successfully processed '{doc.name}' ({chunk_count} chunks).")
        return True
    except Exception as e:
        print(f"[Document Ingestion] Processing failed for doc {doc_id}: {e}")
        db.rollback()
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = DocumentStatus.FAILED.value
            db.commit()
        return False
    finally:
        db.close()

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    category: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List documents with optional category, department, or status filtering."""
    query = db.query(Document)
    if category and category != "All":
        query = query.filter(Document.category == category)
    if department and department != "All":
        query = query.filter(Document.department == department)
    if status_filter and status_filter != "All":
        query = query.filter(Document.status == status_filter)
    
    return query.order_by(Document.created_at.desc()).all()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    category: str = Form("General"),
    department: str = Form("All"),
    description: Optional[str] = Form(None),
    version: str = Form("1.0"),
    collection_id: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a supported resource and trigger RAG vector ingestion."""
    original_filename = Path(file.filename or "").name
    if not original_filename or original_filename in {".", ".."}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid filename is required."
        )

    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file format '{ext or '(none)'}'. "
                "Allowed formats: PDF, DOC/DOCX, TXT, CSV, Markdown, JSON, HTML, RTF, and common image files."
            )
        )

    doc_title = (name.strip() if name and name.strip() else original_filename)

    if len(doc_title) > 255 or len(category) > 100 or len(department) > 100 or len(version) > 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document metadata is too long.")

    if collection_id:
        collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if not collection:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found.")

    # Validate all request metadata before persisting a file so rejected
    # requests never leave orphaned uploads on disk.
    max_upload_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = await file.read(max_upload_bytes + 1)
    if len(contents) > max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    unique_filename = f"{uuid.uuid4()}_{original_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Keep the old active version searchable until the new resource finishes
    # processing. This prevents a failed upload from removing a working source.
    previous_versions = db.query(Document).filter(
        Document.name == doc_title,
        Document.collection_id == collection_id,
        Document.is_active.is_(True),
    ).all()
    doc = Document(
        name=doc_title,
        original_filename=original_filename,
        storage_url=file_path,
        file_type=ext.replace(".", ""),
        category=category,
        department=department,
        description=description,
        status=DocumentStatus.UPLOADED.value,
        version=version,
        collection_id=collection_id,
        is_active=True,
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process ingestion synchronously or in background
    from app.database.postgres import SessionLocal
    processed = process_document_background(doc.id, file_path, doc.file_type, SessionLocal)
    if processed:
        # A newer upload with the same title replaces the active searchable
        # version. Previous versions remain visible to administrators as archived.
        for previous in previous_versions:
            previous.is_active = False
            vector_search_service.delete_document_chunks(previous.id)
        db.commit()
    db.refresh(doc)

    return doc

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get single document details."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


@router.get("/{doc_id}/insights")
def get_document_insights(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return an offline-safe summary and generated FAQ set."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    with document_storage.local_copy(doc.storage_url, doc.file_type) as local_file_path:
        insights = build_document_insights(local_file_path, doc.file_type)
    return {"documentId": doc.id, **insights}

@router.put("/{doc_id}", response_model=DocumentResponse)
def update_document(
    doc_id: str,
    update_data: DocumentUpdate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Update document metadata."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    
    values = update_data.model_dump(exclude_unset=True)
    if values.get("collection_id"):
        if not db.query(Collection).filter(Collection.id == values["collection_id"]).first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found.")
    retrieval_metadata_changed = any(
        key in values for key in ("name", "category", "department", "collection_id")
    )
    for key, value in values.items():
        setattr(doc, key, value)
    db.commit()
    db.refresh(doc)

    # Qdrant stores retrieval metadata in each payload. Re-index after a
    # metadata edit so category/department/collection filters stay correct.
    if retrieval_metadata_changed and doc.is_active:
        vector_search_service.delete_document_chunks(doc.id)
        from app.database.postgres import SessionLocal
        process_document_background(doc.id, doc.storage_url, doc.file_type, SessionLocal)
        db.refresh(doc)
    return doc

@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    doc_id: str,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Delete document and its vector embeddings from Qdrant."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Remove vector points from Qdrant
    vector_search_service.delete_document_chunks(doc.id)

    # Delete local stored file
    if document_storage.is_remote_reference(doc.storage_url):
        try:
            document_storage.delete(doc.storage_url)
        except Exception as e:
            print(f"Error removing remote file {doc.storage_url}: {e}")
    elif os.path.exists(doc.storage_url):
        try:
            os.remove(doc.storage_url)
        except Exception as e:
            print(f"Error removing file {doc.storage_url}: {e}")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully."}

@router.post("/{doc_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(
    doc_id: str,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Reprocess document chunking and vector embeddings."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    if not doc.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Archived documents cannot be reprocessed. Upload a new version instead.")

    vector_search_service.delete_document_chunks(doc.id)
    from app.database.postgres import SessionLocal
    process_document_background(doc.id, doc.storage_url, doc.file_type, SessionLocal)
    db.refresh(doc)
    return doc
