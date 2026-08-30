from typing import List, Dict, Any, Optional
from app.rag.retrieval.vector_search import vector_search_service
from app.rag.retrieval.text_matching import normalized_terms, terms_match

class HybridSearchService:
    @staticmethod
    def search(
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
        department_filter: Optional[str] = None,
        collection_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval combining vector similarity search and keyword matching.
        """
        # Fetch candidates from vector search
        candidates = vector_search_service.search_relevant_chunks(
            query=query,
            top_k=top_k * 2,
            category_filter=category_filter,
            department_filter=department_filter,
            collection_filter=collection_filter
        )

        # Ignore common stopwords and match common singular/plural variants
        # so local retrieval remains useful without an embedding API.
        query_terms = normalized_terms(query)

        for chunk in candidates:
            text_terms = normalized_terms(chunk.get("text", ""))
            # Calculate BM25-like keyword overlap match
            matches = sum(
                1 for query_term in query_terms
                if any(terms_match(query_term, text_term) for text_term in text_terms)
            )
            keyword_score = matches / max(1, len(query_terms))
            
            # Combine vector cosine score and keyword score
            vector_score = chunk.get("score", 0.0)
            # Equal weighting keeps local deterministic embeddings useful while
            # still benefiting from semantic similarity when an API provider is
            # configured.
            combined_score = (vector_score * 0.5) + (keyword_score * 0.5)
            chunk["score"] = round(combined_score, 4)

        # Sort by combined score descending
        candidates.sort(key=lambda x: x.get("score", 0.0), reverse=True)
        return candidates[:top_k]

hybrid_search_service = HybridSearchService()
