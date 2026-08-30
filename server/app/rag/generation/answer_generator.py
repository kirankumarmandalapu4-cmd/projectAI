import os
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.rag.generation.prompt_builder import prompt_builder

class AnswerGenerator:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.api_key = settings.LLM_API_KEY or os.getenv("GEMINI_API_KEY")
        self.model_name = settings.LLM_MODEL

    def generate_answer(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None,
        language: str = "auto"
    ) -> Tuple[str, str]:
        """
        Generate grounded answer and determine answer status.
        Returns: (answer_text, answer_status)
        """
        # If no chunks were retrieved or scores are very low
        if not retrieved_chunks:
            return (
                "I couldn't find reliable information about this topic in the college knowledge base. "
                "Please contact the relevant college office for assistance.",
                "NO_RELEVANT_INFORMATION"
            )

        top_score = max(
            [c.get("final_score", c.get("score", 0.0)) for c in retrieved_chunks]
        ) if retrieved_chunks else 0.0

        if top_score < settings.RETRIEVAL_SCORE_THRESHOLD:
            return (
                "I couldn't find reliable information about this topic in the college knowledge base. "
                "Please contact the relevant college office for assistance.",
                "INSUFFICIENT_CONTEXT"
            )

        prompt = prompt_builder.build_prompt(query, retrieved_chunks, conversation_history, language)

        # Try Google Gemini API if configured
        if self.provider in ["gemini", "google"] and self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel(self.model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    status = "GROUNDED" if top_score >= 0.5 else "PARTIALLY_GROUNDED"
                    return (response.text.strip(), status)
            except Exception as e:
                print(f"[AnswerGenerator] Gemini API error ({e}). Using deterministic grounded synthesis fallback...")

        # Fallback Grounded Synthesis: Extract best answer directly from retrieved chunks
        return self._synthesize_grounded_fallback(query, retrieved_chunks, top_score)

    def _synthesize_grounded_fallback(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        top_score: float
    ) -> Tuple[str, str]:
        """
        Synthesize answer directly from retrieved document snippets when API is offline.
        """
        sources_list = []
        snippets = []
        for idx, chunk in enumerate(retrieved_chunks[:3], 1):
            doc_name = chunk.get("document_name", "Document")
            page_num = chunk.get("page_number", 1)
            sources_list.append(f"📄 `{doc_name}` (Page {page_num})")
            text = chunk.get("text", "")
            snippets.append(f"**From `{doc_name}` (Page {page_num}):**\n> {text}")

        synthesized_text = (
            f"Based on the official college documents in the knowledge base:\n\n"
            + "\n\n".join(snippets)
            + "\n\n---\n*Grounded response synthesized directly from verified college documents.*"
        )

        status = "GROUNDED" if top_score >= 0.5 else "PARTIALLY_GROUNDED"
        return (synthesized_text, status)

answer_generator = AnswerGenerator()
