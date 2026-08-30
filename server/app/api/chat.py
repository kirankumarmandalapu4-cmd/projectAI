import time
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.query_log import QueryLog
from app.schemas.chat import ChatRequest, ChatResponse, ConversationResponse, MessageResponse, UpdateConversationTitle
from app.core.dependencies import get_current_user
from app.rag.pipeline import rag_pipeline

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])


@router.post("", response_model=ChatResponse)
def post_message(
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main Chat API endpoint. Accepts natural language user question,
    executes RAG vector search, generates grounded answer, saves history,
    and returns answer with exact document sources.
    """
    start_time = time.time()
    conv_id = chat_req.conversationId

    # Create or fetch conversation
    if not conv_id:
        title_snippet = chat_req.message[:30] + ("..." if len(chat_req.message) > 30 else "")
        conv = Conversation(user_id=current_user.id, title=title_snippet)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conv_id = conv.id
    else:
        conv = db.query(Conversation).filter(
            Conversation.id == conv_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found."
            )

    # Load recent conversation history for follow-up query context
    history_messages = db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.asc()).all()
    history = [{"role": m.role, "content": m.content} for m in history_messages[-6:]]

    # Save User message
    user_msg = Message(
        conversation_id=conv_id,
        role="user",
        content=chat_req.message,
        answer_status="USER_INPUT"
    )
    db.add(user_msg)
    db.commit()

    # Execute RAG Pipeline
    rag_result = rag_pipeline.execute_rag_query(
        query=chat_req.message,
        conversation_history=history,
        category_filter=chat_req.categoryFilter,
        department_filter=chat_req.departmentFilter,
        collection_filter=chat_req.collectionFilter,
        language=chat_req.language
    )

    total_response_time = round(time.time() - start_time, 3)

    # Save Assistant message
    assistant_msg = Message(
        conversation_id=conv_id,
        role="assistant",
        content=rag_result["answer"],
        sources=rag_result["sources"],
        retrieval_metadata=rag_result["retrieval"],
        answer_status=rag_result["answerStatus"]
    )
    db.add(assistant_msg)
    # Inserting child messages does not trigger Conversation.onupdate.
    # Update explicitly so the conversation list stays newest-first.
    conv.updated_at = datetime.now(timezone.utc)

    # Log query for analytics & audit
    query_log = QueryLog(
        user_id=current_user.id,
        conversation_id=conv_id,
        query=chat_req.message,
        retrieved_chunks=[{"doc_id": c.get("document_id"), "doc_name": c.get("document_name")} for c in rag_result.get("retrievedChunks", [])],
        retrieval_scores=[c.get("score", 0.0) for c in rag_result.get("retrievedChunks", [])],
        response_time=total_response_time,
        answer_status=rag_result["answerStatus"]
    )
    db.add(query_log)
    db.commit()
    db.refresh(assistant_msg)

    return {
        "conversationId": conv_id,
        "messageId": assistant_msg.id,
        "answer": rag_result["answer"],
        "answerStatus": rag_result["answerStatus"],
        "sources": rag_result["sources"],
        "retrieval": rag_result["retrieval"]
    }

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List current user's conversations ordered by newest first."""
    return db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new conversation session."""
    conv = Conversation(user_id=current_user.id, title="New Conversation")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
def get_conversation(conv_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get conversation with full message history."""
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    
    messages = db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.asc()).all()
    
    res = ConversationResponse.model_validate(conv)
    res.messages = [MessageResponse.model_validate(m) for m in messages]
    return res

@router.put("/conversations/{conv_id}", response_model=ConversationResponse)
def rename_conversation(
    conv_id: str,
    body: UpdateConversationTitle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename a conversation title."""
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    conv.title = body.title
    db.commit()
    db.refresh(conv)
    return conv

@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete conversation and its message history."""
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    
    db.query(Message).filter(Message.conversation_id == conv_id).delete()
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully."}
