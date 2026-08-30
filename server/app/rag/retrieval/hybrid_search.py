from typing import List, Dict, Any, Optional
import re
from app.rag.retrieval.vector_search import vector_search_service

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

        # Ignore common stopwords and compare normalized tokens rather than
        # substrings (e.g. "fee" should not match an unrelated word).
        stopwords = {
            "a", "an", "and", "are", "is", "of", "on", "or", "the",
            "to", "what", "when", "where", "which", "who", "how", "does",
            "do", "for", "in", "about", "can", "i", "me", "my",
        }
        query_terms = {
            term for term in re.findall(r"\b[a-z0-9]+\b", query.lower())
            if term not in stopwords
        }

        for chunk in candidates:
            text_terms = set(re.findall(r"\b[a-z0-9]+\b", chunk.get("text", "").lower()))
            # Calculate BM25-like keyword overlap match
            matches = sum(1 for term in query_terms if term in text_terms)
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
