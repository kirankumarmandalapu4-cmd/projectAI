import os
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.core.config import settings

class QdrantVectorDB:
    def __init__(self):
        self.client: Optional[QdrantClient] = None
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self._init_client()

    def _init_client(self):
        """Initialize Qdrant client connection (Remote or Local folder)."""
        try:
            if settings.QDRANT_URL and settings.QDRANT_URL.strip():
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
                )
            else:
                # Use local persistent storage directory for zero-dependency local dev
                if settings.QDRANT_PATH and settings.QDRANT_PATH.strip():
                    local_dir = settings.QDRANT_PATH
                else:
                    local_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "qdrant_db")
                os.makedirs(local_dir, exist_ok=True)
                self.client = QdrantClient(path=local_dir)
            
            self.ensure_collection_exists()
        except Exception as e:
            print(f"[Qdrant DB] Warning: Initializing client failed ({e}). Retrying with fallback...")
            try:
                self.client = QdrantClient(location=":memory:")
                self.ensure_collection_exists()
            except Exception as inner_e:
                print(f"[Qdrant DB] Error initializing memory fallback: {inner_e}")

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

    def get_client(self) -> QdrantClient:
        return self.client

qdrant_db = QdrantVectorDB()

def get_qdrant_client() -> QdrantClient:
    return qdrant_db.get_client()
