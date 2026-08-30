import os
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.core.config import settings

class QdrantVectorDB:
    def __init__(self):
        self.client: Optional[QdrantClient] = None
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.mode = "unavailable"
        self._init_client()

    def _init_client(self):
        """Initialize Qdrant client connection (Remote or Local folder)."""
        try:
            if settings.QDRANT_URL and settings.QDRANT_URL.strip():
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
                )
                self.ensure_collection_exists()
                self.mode = "qdrant-cloud"
            else:
                # Use local persistent storage directory for zero-dependency local dev
                if settings.QDRANT_PATH and settings.QDRANT_PATH.strip():
                    local_dir = settings.QDRANT_PATH
                else:
                    local_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "qdrant_db")
                os.makedirs(local_dir, exist_ok=True)
                self.client = QdrantClient(path=local_dir)
                self.ensure_collection_exists()
                self.mode = "qdrant-local"
        except Exception as e:
            self.client = None
            if settings.QDRANT_URL and settings.QDRANT_URL.strip():
                # Never hide a production Cloud authentication/network error
                # behind an in-memory fallback: that would make uploads appear
                # successful while all vectors disappear on the next restart.
                print(f"[Qdrant DB] Cloud connection failed: {e}")
            else:
                print(f"[Qdrant DB] Local initialization failed: {e}")

    def ensure_collection_exists(self):
        """Ensure the vectors collection exists in Qdrant."""
        if not self.client:
            return
        
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=settings.EMBEDDING_DIMENSION,
                        distance=qmodels.Distance.COSINE
                    )
                )
                print(f"[Qdrant DB] Created collection '{self.collection_name}'.")
        except Exception as e:
            print(f"[Qdrant DB] Error ensuring collection: {e}")
            raise

    def get_client(self) -> QdrantClient:
        return self.client

    def health_status(self) -> dict:
        """Return a safe, live vector-store status without exposing secrets."""
        if not self.client:
            return {"mode": self.mode, "connected": False, "collection": self.collection_name, "points": 0}
        try:
            collection = self.client.get_collection(self.collection_name)
            return {
                "mode": self.mode,
                "connected": True,
                "collection": self.collection_name,
                "points": int(collection.points_count or 0),
            }
        except Exception as e:
            print(f"[Qdrant DB] Health check failed: {e}")
            return {"mode": self.mode, "connected": False, "collection": self.collection_name, "points": 0}

qdrant_db = QdrantVectorDB()

def get_qdrant_client() -> QdrantClient:
    return qdrant_db.get_client()
