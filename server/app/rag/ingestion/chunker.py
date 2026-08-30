from typing import List, Dict, Any
from app.core.config import settings

class DocumentChunker:
    def __init__(
        self,
        chunk_size: int = getattr(settings, "TARGET_CHUNK_SIZE", 600),
        chunk_overlap: int = getattr(settings, "CHUNK_OVERLAP", 100)
    ):
        self.chunk_size_chars = chunk_size * 4 # Approximate 1 token = 4 chars
        self.overlap_chars = chunk_overlap * 4

    def chunk_document(
        self,
        pages: List[Dict[str, Any]],
        doc_metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Split page content into searchable chunks with preserved metadata.
        """
        chunks = []
        chunk_index = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            text = page.get("text", "")
            if not text or not text.strip():
                continue

            # Split text into overlapping chunks
            start = 0
            text_len = len(text)

            while start < text_len:
                end = start + self.chunk_size_chars
                chunk_text = text[start:end]

                # Adjust to nearest sentence or paragraph end if possible
                if end < text_len:
                    last_period = chunk_text.rfind('.')
                    last_newline = chunk_text.rfind('\n')
                    break_point = max(last_period, last_newline)
                    if break_point > self.chunk_size_chars // 2:
                        end = start + break_point + 1
                        chunk_text = text[start:end]

                chunk_text = chunk_text.strip()

                if chunk_text:
                    chunk_meta = {
                        "document_id": doc_metadata.get("id", ""),
                        "document_name": doc_metadata.get("name", doc_metadata.get("original_filename", "Document")),
                        "page_number": page_num,
                        "section": doc_metadata.get("section", "General"),
                        "category": doc_metadata.get("category", "General"),
                        "department": doc_metadata.get("department", "All"),
                        "collection_id": doc_metadata.get("collection_id"),
                        "is_active": doc_metadata.get("is_active", True),
                        "chunk_index": chunk_index,
                        "text": chunk_text
                    }
                    chunks.append(chunk_meta)
                    chunk_index += 1

                # The final chunk ends the page. This also prevents a short
                # page from generating one near-identical chunk per character
                # when the configured overlap is larger than the page.
                if end >= text_len:
                    break

                # Preserve overlap while guaranteeing forward progress when
                # a sentence boundary produces a small chunk.
                effective_overlap = min(self.overlap_chars, max(0, len(chunk_text) // 2))
                next_start = end - effective_overlap
                start = max(start + 1, next_start)

        return chunks
