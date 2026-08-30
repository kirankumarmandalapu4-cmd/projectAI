from app.rag.ingestion.cleaner import TextCleaner
from app.rag.ingestion.chunker import DocumentChunker
from app.rag.ingestion.loader import DocumentLoader
from app.rag.pipeline import RAGPipeline
from app.services.document_insights import generate_faqs, summarize_text

def test_text_cleaner():
    dirty_text = "  College   Admissions\n\n\n\nSection 1.  "
    cleaned = TextCleaner.clean_text(dirty_text)
    assert "College Admissions" in cleaned
    assert "\n\n\n" not in cleaned

def test_document_chunker():
    chunker = DocumentChunker(chunk_size=100, chunk_overlap=20)
    pages = [
        {"page_number": 1, "text": "This is page one of the college hostel regulation policy. All students must register before 10 PM. Mess charges are included in hostel fee."},
        {"page_number": 2, "text": "This is page two detailing academic regulations and semester exam hall tickets rules."}
    ]
    doc_meta = {"id": "doc-001", "name": "Hostel_Policy.pdf", "category": "Hostel", "department": "All"}
    chunks = chunker.chunk_document(pages, doc_meta)
    
    assert len(chunks) >= 2
    assert len(chunks) < 10
    assert chunks[0]["document_id"] == "doc-001"
    assert chunks[0]["page_number"] == 1
    assert "text" in chunks[0]


def test_document_insights_are_generated_offline():
    text = "The library opens at 8 AM. Students must carry their identity card."
    assert "library opens" in summarize_text(text).lower()
    faqs = generate_faqs(text)
    assert faqs
    assert "question" in faqs[0] and "answer" in faqs[0]


def test_loader_supports_extended_text_and_image_resources(tmp_path):
    markdown_path = tmp_path / "notice.md"
    markdown_path.write_text("# Library Notice\nThe library opens at 8 AM.", encoding="utf-8")
    markdown_pages = DocumentLoader.load_file(str(markdown_path), "md")
    assert "Library Notice" in markdown_pages[0]["text"]

    from PIL import Image
    image_path = tmp_path / "notice.png"
    Image.new("RGB", (12, 8), "white").save(image_path)
    image_pages = DocumentLoader.load_file(str(image_path), "png")
    assert image_pages[0]["page_number"] == 1
    assert "Image dimensions" in image_pages[0]["text"] or image_pages[0]["text"]


def test_pipeline_does_not_report_success_when_vector_indexing_fails(tmp_path, monkeypatch):
    resource_path = tmp_path / "resource.txt"
    resource_path.write_text("The library opens at 8 AM for all students.", encoding="utf-8")
    monkeypatch.setattr("app.rag.pipeline.vector_search_service.index_chunks", lambda chunks: False)

    try:
        RAGPipeline().process_and_index_document(
            str(resource_path),
            "txt",
            {"id": "doc-failure", "name": "resource.txt"},
        )
    except RuntimeError as error:
        assert "vector database" in str(error).lower()
    else:
        raise AssertionError("Pipeline should fail when vector indexing fails")
