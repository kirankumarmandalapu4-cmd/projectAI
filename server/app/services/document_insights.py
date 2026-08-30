from typing import Any, Dict, List

from app.rag.ingestion.cleaner import TextCleaner
from app.rag.ingestion.loader import DocumentLoader


def _load_clean_text(file_path: str, file_type: str) -> str:
    pages = DocumentLoader.load_file(file_path, file_type)
    return "\n".join(
        TextCleaner.clean_text(page.get("text", ""))
        for page in pages
        if page.get("text", "").strip()
    ).strip()


def summarize_text(text: str, max_sentences: int = 4) -> str:
    """Create a deterministic extractive summary for offline local use."""
    if not text:
        return "No extractable text was found in this document."
    sentences = [part.strip() for part in text.replace("\n", " ").split(".") if part.strip()]
    summary = ". ".join(sentences[:max_sentences])
    return summary + ("." if summary and not summary.endswith(".") else "")


def summarize_document(file_path: str, file_type: str) -> str:
    try:
        return summarize_text(_load_clean_text(file_path, file_type))
    except Exception:
        return "Summary unavailable because the document text could not be extracted."


def generate_faqs(text: str, limit: int = 5) -> List[Dict[str, str]]:
    """Generate useful extractive FAQs without requiring an external LLM."""
    sentences = [part.strip() for part in text.replace("\n", " ").split(".") if len(part.strip()) > 25]
    faqs = []
    for sentence in sentences[:limit]:
        words = sentence.split()
        topic = " ".join(words[:7]).rstrip(",:;")
        faqs.append({
            "question": f"What does the document say about {topic.lower()}?",
            "answer": sentence + ("." if not sentence.endswith(".") else ""),
        })
    return faqs


def build_document_insights(file_path: str, file_type: str) -> Dict[str, Any]:
    text = _load_clean_text(file_path, file_type)
    return {"summary": summarize_text(text), "faqs": generate_faqs(text)}
