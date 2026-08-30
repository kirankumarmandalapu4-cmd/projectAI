import uuid
from typing import List, Dict, Any, Optional
from qdrant_client.http import models as qmodels
from app.database.qdrant import get_qdrant_client
from app.rag.embeddings.embedding_service import embedding_service
from app.core.config import settings

class VectorSearchService:
    def __init__(self):
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    def index_chunks(self, chunks: List[Dict[str, Any]]) -> bool:
        """
        Store chunk vectors and payloads in Qdrant.
        """
        client = get_qdrant_client()
        if not client or not chunks:
            return False

        points = []
        for chunk in chunks:
            text = chunk.get("text", "")
            vector = embedding_service.get_embedding(text)
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{chunk.get('document_id')}_{chunk.get('chunk_index')}"))
            
            points.append(
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=chunk
                )
            )

        try:
            client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            print(f"[VectorSearch] Successfully indexed {len(points)} chunks into Qdrant.")
            return True
        except Exception as e:
            print(f"[VectorSearch] Error indexing chunks to Qdrant: {e}")
            return False

    def search_relevant_chunks(
        self,
        query: str,
        top_k: int = settings.TOP_K,
        category_filter: Optional[str] = None,
        department_filter: Optional[str] = None,
        collection_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute semantic similarity search on Qdrant with query vector.
        """
        client = get_qdrant_client()
        if not client:
            return []

        query_vector = embedding_service.get_query_embedding(query)

        # Only active document versions should be searchable. Keeping this
        # guard in the vector layer also protects retrieval when an old point
        # could not be removed during version replacement.
        must_conditions = [
            qmodels.FieldCondition(
                key="is_active",
                match=qmodels.MatchValue(value=True)
            )
        ]
        if category_filter and category_filter != "All":
            must_conditions.append(
                qmodels.FieldCondition(
                    key="category",
                    match=qmodels.MatchValue(value=category_filter)
                )
            )
        if department_filter and department_filter != "All":
            must_conditions.append(
                qmodels.FieldCondition(
                    key="department",
                    match=qmodels.MatchValue(value=department_filter)
                )
            )
        if collection_filter and collection_filter != "All":
            must_conditions.append(
                qmodels.FieldCondition(
                    key="collection_id",
                    match=qmodels.MatchValue(value=collection_filter)
                )
            )

        query_filter = qmodels.Filter(must=must_conditions) if must_conditions else None

        try:
            # Qdrant 1.10+ uses query_points; older clients expose search.
            # Keep the compatibility branch because the requirements allow
            # older Qdrant clients for existing local environments.
            if hasattr(client, "query_points"):
                response = client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=top_k,
                    query_filter=query_filter,
                    with_payload=True,
                )
                results = response.points
            else:
                results = client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=top_k,
                    query_filter=query_filter
                )

            retrieved = []
            for res in results:
                payload = res.payload or {}
                payload["score"] = float(res.score)
                retrieved.append(payload)

            return retrieved
        except Exception as e:
            print(f"[VectorSearch] Qdrant search error: {e}")
            return []

    def delete_document_chunks(self, document_id: str) -> bool:
        """
        Delete all vector points belonging to a specific document ID.
        """
        client = get_qdrant_client()
        if not client:
            return False
        try:
            client.delete(
                collection_name=self.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[
                            qmodels.FieldCondition(
                                key="document_id",
                                match=qmodels.MatchValue(value=document_id)
                            )
                        ]
                    )
                )
            )
            print(f"[VectorSearch] Deleted chunks for document {document_id}")
            return True
        except Exception as e:
            print(f"[VectorSearch] Error deleting document vectors: {e}")
            return False

vector_search_service = VectorSearchService()
