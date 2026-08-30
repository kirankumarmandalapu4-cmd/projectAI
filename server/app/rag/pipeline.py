import time
from typing import List, Dict, Any, Optional, Tuple
from app.rag.ingestion.loader import DocumentLoader
from app.rag.ingestion.cleaner import TextCleaner
from app.rag.ingestion.chunker import DocumentChunker
from app.rag.retrieval.hybrid_search import hybrid_search_service
from app.rag.retrieval.reranker import reranker_service
from app.rag.retrieval.vector_search import vector_search_service
from app.rag.generation.answer_generator import answer_generator
from app.core.config import settings

class RAGPipeline:
    def __init__(self):
        self.chunker = DocumentChunker()

    def process_and_index_document(self, file_path: str, file_type: str, doc_metadata: Dict[str, Any]) -> Tuple[int, int]:
        """
        Ingestion Pipeline:
        Document -> Text Extraction -> Cleaning -> Page Metadata -> Chunking -> Vector Embeddings -> Qdrant
        Returns (page_count, chunk_count)
        """
        # 1. Load pages
        raw_pages = DocumentLoader.load_file(file_path, file_type)
        page_count = len(raw_pages)

        # 2. Clean text
        cleaned_pages = []
        for page in raw_pages:
            cleaned_text = TextCleaner.clean_text(page["text"])
            if cleaned_text:
                cleaned_pages.append({
                    "page_number": page["page_number"],
                    "text": cleaned_text
                })

        # 3. Chunk
        chunks = self.chunker.chunk_document(cleaned_pages, doc_metadata)
        chunk_count = len(chunks)

        # 4. Index in Qdrant
        if chunks:
            if not vector_search_service.index_chunks(chunks):
                raise RuntimeError("The vector database could not index the document chunks.")
        else:
            raise ValueError("No readable text was found in this resource.")

        return (page_count, chunk_count)

    def execute_rag_query(
        self,
        query: str,
        conversation_history: List[Dict[str, str]] = None,
        category_filter: Optional[str] = None,
        department_filter: Optional[str] = None,
        collection_filter: Optional[str] = None,
        language: str = "auto"
    ) -> Dict[str, Any]:
        """
        Query Pipeline:
        Query -> Hybrid Retrieval -> Re-ranking -> Relevance Check -> Prompt Building -> LLM Generation -> Sources
        """
        start_time = time.time()
        if language == "auto":
            if any("\u0900" <= character <= "\u097f" for character in query):
                language = "hi"
            elif any("\u0c00" <= character <= "\u0c7f" for character in query):
                language = "te"
            else:
                language = "en"

        # 1. Hybrid Retrieval (Vector + Keyword)
        retrieved_candidates = hybrid_search_service.search(
            query=query,
            top_k=settings.TOP_K * 2,
            category_filter=category_filter,
            department_filter=department_filter,
            collection_filter=collection_filter
        )

        # 2. Re-ranking
        top_chunks = reranker_service.rerank(query, retrieved_candidates, top_k=settings.TOP_K)

        # 3. LLM Answer Generation
        answer, answer_status = answer_generator.generate_answer(
            query=query,
            retrieved_chunks=top_chunks,
            conversation_history=conversation_history,
            language=language
        )

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        # 4. Source Formatting
        sources = []
        seen_sources = set()

        if answer_status in ["GROUNDED", "PARTIALLY_GROUNDED"]:
            for chunk in top_chunks:
                doc_id = chunk.get("document_id")
                doc_name = chunk.get("document_name", "Document")
                page_num = chunk.get("page_number", 1)
                sec = chunk.get("section", "General")
                score = chunk.get("final_score", chunk.get("score", 0.0))

                source_key = f"{doc_name}_{page_num}"
                if source_key not in seen_sources:
                    seen_sources.add(source_key)
                    sources.append({
                        "documentId": doc_id,
                        "documentName": doc_name,
                        "pageNumber": page_num,
                        "section": sec,
                        "category": chunk.get("category", "General"),
                        "department": chunk.get("department", "All"),
                        "collectionId": chunk.get("collection_id"),
                        "score": score,
                        "snippet": chunk.get("text", "")[:280],
                    })

        return {
            "answer": answer,
            "answerStatus": answer_status,
            "sources": sources,
            "retrievedChunks": top_chunks,
            "retrieval": {
                "topK": settings.TOP_K,
                "chunksUsed": len(top_chunks),
                "queryTimeMs": elapsed_ms,
                "language": language,
            }
        }

rag_pipeline = RAGPipeline()
