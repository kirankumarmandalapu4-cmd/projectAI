import re
from typing import Set


STOPWORDS = {
    "a", "an", "and", "are", "is", "of", "on", "or", "the",
    "to", "what", "when", "where", "which", "who", "how", "does",
    "do", "for", "in", "about", "can", "i", "me", "my",
}


def normalized_terms(text: str) -> Set[str]:
    """Return useful lowercase terms for lightweight hybrid retrieval."""
    return {
        term
        for term in re.findall(r"\b[a-z0-9]+\b", text.lower())
        if term not in STOPWORDS
    }


def terms_match(query_term: str, text_term: str) -> bool:
    """Match exact terms and common singular/plural verb variants."""
    if query_term == text_term:
        return True
    if len(query_term) < 3 or len(text_term) < 3:
        return False
    return query_term in text_term or text_term in query_term
