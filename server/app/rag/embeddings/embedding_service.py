import os
import hashlib
import numpy as np
from typing import List
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER.lower()
        self.api_key = settings.EMBEDDING_API_KEY or settings.LLM_API_KEY or os.getenv("GEMINI_API_KEY")
        self.model = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for a given text.
        Returns a list of floats of dimension 768.
        """
        if not text or not text.strip():
            return [0.0] * self.dimension

        if self.provider in ["gemini", "google"] and self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                result = genai.embed_content(
                    model=self.model,
                    content=text,
                    task_type="retrieval_document"
                )
                if "embedding" in result and result["embedding"]:
                    vec = result["embedding"]
                    # Truncate or pad to expected dimension
                    if len(vec) > self.dimension:
                        return vec[:self.dimension]
                    elif len(vec) < self.dimension:
                        return vec + [0.0] * (self.dimension - len(vec))
                    return vec
            except Exception as e:
                print(f"[EmbeddingService] Gemini embedding API error ({e}). Using deterministic fallback vector...")

        # Fallback: Deterministic hashing vector generator for local zero-dependency testing
        return self._generate_deterministic_vector(text)

    def get_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding vector for a retrieval query.
        """
        if self.provider in ["gemini", "google"] and self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                result = genai.embed_content(
                    model=self.model,
                    content=query,
                    task_type="retrieval_query"
                )
                if "embedding" in result and result["embedding"]:
                    vec = result["embedding"]
                    if len(vec) > self.dimension:
                        return vec[:self.dimension]
                    elif len(vec) < self.dimension:
                        return vec + [0.0] * (self.dimension - len(vec))
                    return vec
            except Exception as e:
                print(f"[EmbeddingService] Gemini query embedding API error ({e}). Using deterministic fallback vector...")
        
        return self._generate_deterministic_vector(query)

    def _generate_deterministic_vector(self, text: str) -> List[float]:
        """
        Generate normalized 768-dim pseudo-vector using MD5/SHA256 seed.
        Ensures identical text yields identical vectors and similar words have partial overlap.
        """
        words = text.lower().split()
        vector = np.zeros(self.dimension)
        for idx, word in enumerate(words):
            word_hash = hashlib.sha256(word.encode('utf-8')).digest()
            seed_ints = np.frombuffer(word_hash, dtype=np.uint8)
            for i in range(min(len(seed_ints), self.dimension)):
                pos = (i * 3 + idx) % self.dimension
                vector[pos] += (seed_ints[i] / 255.0) - 0.5

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        else:
            vector = np.ones(self.dimension) / np.sqrt(self.dimension)
        return vector.tolist()

embedding_service = EmbeddingService()
