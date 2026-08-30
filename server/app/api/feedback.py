from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User
from app.models.feedback import Feedback
from app.models.message import Message
from app.models.conversation import Conversation
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.core.dependencies import get_current_user, get_current_active_admin

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    fb_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit user feedback for an AI chatbot answer."""
    msg = db.query(Message).join(
        Conversation, Message.conversation_id == Conversation.id
    ).filter(
        Message.id == fb_in.message_id,
        Message.role == "assistant",
        Conversation.user_id == current_user.id,
    ).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target message not found.")

    existing_fb = db.query(Feedback).filter(
        Feedback.message_id == fb_in.message_id,
        Feedback.user_id == current_user.id
    ).first()

    if existing_fb:
        existing_fb.rating = fb_in.rating
        existing_fb.reason = fb_in.reason
        existing_fb.comment = fb_in.comment
        db.commit()
        db.refresh(existing_fb)
        return existing_fb

    fb = Feedback(
        message_id=fb_in.message_id,
        user_id=current_user.id,
        rating=fb_in.rating,
        reason=fb_in.reason,
        comment=fb_in.comment
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb

@router.get("", response_model=List[FeedbackResponse])
def get_all_feedback(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Get all submitted feedback (Admin only)."""
    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()
