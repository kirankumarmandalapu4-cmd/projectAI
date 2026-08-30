"""
SQLAlchemy database models for RAG College Chatbot.
"""
from app.database.postgres import Base
from app.models.user import User
from app.models.document import Document
from app.models.collection import Collection
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.feedback import Feedback
from app.models.query_log import QueryLog

__all__ = [
    "Base",
    "User",
    "Document",
    "Collection",
    "Conversation",
    "Message",
    "Feedback",
    "QueryLog"
]
