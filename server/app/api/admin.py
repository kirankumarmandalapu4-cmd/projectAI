from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.database.postgres import get_db
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.query_log import QueryLog
from app.models.feedback import Feedback
from app.models.conversation import Conversation
from app.models.message import Message
from app.core.dependencies import get_current_active_admin
from app.database.qdrant import get_qdrant_client
from app.database.postgres import engine
from app.core.config import settings

router = APIRouter(prefix="/api/admin", tags=["Administrator Dashboard"])


def _component_health():
    """Probe dependencies instead of reporting hard-coded status."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = "CONNECTED"
    except Exception:
        database = "ERROR"

    try:
        q_client = get_qdrant_client()
        if q_client:
            q_client.get_collection(settings.QDRANT_COLLECTION_NAME)
        vector_database = "CONNECTED" if q_client else "OFFLINE"
    except Exception:
        vector_database = "OFFLINE"

    return {
        "status": "OPERATIONAL" if database == "CONNECTED" and vector_database == "CONNECTED" else "DEGRADED",
        "database": database,
        "vectorDatabase": vector_database,
        "ragPipeline": "READY" if database == "CONNECTED" and vector_database == "CONNECTED" else "DEGRADED",
    }

@router.get("/dashboard")
def get_dashboard_metrics(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Retrieve administrator dashboard metrics."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    processed_documents = db.query(func.count(Document.id)).filter(Document.status == DocumentStatus.COMPLETED.value).scalar() or 0
    failed_documents = db.query(func.count(Document.id)).filter(Document.status == DocumentStatus.FAILED.value).scalar() or 0

    total_questions = db.query(func.count(QueryLog.id)).scalar() or 0
    questions_today = db.query(func.count(QueryLog.id)).filter(QueryLog.created_at >= today_start).scalar() or 0

    avg_response_time = db.query(func.avg(QueryLog.response_time)).scalar() or 0.0

    helpful_feedback = db.query(func.count(Feedback.id)).filter(Feedback.rating == 1).scalar() or 0
    unhelpful_feedback = db.query(func.count(Feedback.id)).filter(Feedback.rating == -1).scalar() or 0

    health = _component_health()

    return {
        "metrics": {
            "totalUsers": total_users,
            "totalDocuments": total_documents,
            "processedDocuments": processed_documents,
            "failedDocuments": failed_documents,
            "totalQuestions": total_questions,
            "questionsToday": questions_today,
            "avgResponseTimeMs": round(avg_response_time * 1000, 2),
            "feedback": {
                "helpful": helpful_feedback,
                "unhelpful": unhelpful_feedback,
                "satisfactionRate": round((helpful_feedback / (helpful_feedback + unhelpful_feedback)) * 100, 1) if helpful_feedback + unhelpful_feedback else 0
            }
        },
        "systemHealth": health
    }

@router.get("/query-logs")
def get_query_logs(
    limit: int = Query(50, ge=1, le=500),
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Get recent user query logs for evaluation."""
    logs = db.query(QueryLog).order_by(QueryLog.created_at.desc()).limit(limit).all()
    return logs


@router.get("/analytics")
def get_analytics(
    days: int = Query(7, ge=1, le=90),
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """Return query-volume and answer-status analytics for the dashboard."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    logs = db.query(QueryLog).filter(QueryLog.created_at >= since).order_by(QueryLog.created_at.asc()).all()

    daily = {}
    status_counts = {}
    for log in logs:
        day = log.created_at.date().isoformat()
        daily[day] = daily.get(day, 0) + 1
        status_counts[log.answer_status] = status_counts.get(log.answer_status, 0) + 1

    response_times = [log.response_time for log in logs]
    return {
        "periodDays": days,
        "totalQueries": len(logs),
        "averageResponseTimeMs": round((sum(response_times) / len(response_times)) * 1000, 2) if response_times else 0,
        "answerStatusCounts": status_counts,
        "queriesByDay": [{"date": date, "count": count} for date, count in sorted(daily.items())],
    }

@router.get("/system-health")
def get_system_health(current_admin: User = Depends(get_current_active_admin)):
    """Get system components health status."""
    health = _component_health()
    return {
        **health,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "api": "UP",
            "database": "UP" if health["database"] == "CONNECTED" else "DOWN",
            "qdrant": "UP" if health["vectorDatabase"] == "CONNECTED" else "DOWN",
            "embedding": "UP" if health["ragPipeline"] == "READY" else "DEGRADED"
        }
    }
