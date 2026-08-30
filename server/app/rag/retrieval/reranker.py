from typing import List, Dict, Any
import re

class RerankerService:
    @staticmethod
    def rerank(query: str, chunks: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Re-rank retrieved context chunks based on query alignment and exact phrase matching.
        """
        if not chunks:
            return []

        query_lower = query.lower()
        query_terms = set(re.findall(r"\b[a-z0-9]+\b", query_lower))
        for chunk in chunks:
            text = chunk.get("text", "").lower()
            text_terms = set(re.findall(r"\b[a-z0-9]+\b", text))
            bonus = 0.0
            # Give bonus for exact key phrase matches
            if query_lower in text:
                bonus += 0.15
            if query_terms:
                overlap = len(query_terms & text_terms) / len(query_terms)
                bonus += min(0.2, overlap * 0.2)
            
            chunk["final_score"] = min(1.0, round(chunk.get("score", 0.0) + bonus, 4))

        chunks.sort(key=lambda x: x.get("final_score", 0.0), reverse=True)
        return chunks[:top_k]

reranker_service = RerankerService()
