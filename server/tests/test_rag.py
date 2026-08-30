from app.rag.embeddings.embedding_service import embedding_service
from app.rag.generation.prompt_builder import prompt_builder
from app.rag.generation.answer_generator import answer_generator

def test_embedding_service():
    vec = embedding_service.get_embedding("What are the hostel fee rules?")
    assert isinstance(vec, list)
    assert len(vec) == 768

def test_prompt_builder():
    chunks = [
        {"document_name": "Fees.pdf", "page_number": 3, "section": "Tuition", "text": "Annual tuition fee is $5000 payable per semester."}
    ]
    prompt = prompt_builder.build_prompt("What is tuition fee?", chunks)
    assert "Fees.pdf — Page 3" in prompt
    assert "Annual tuition fee is $5000" in prompt

def test_unknown_question_fallback():
    # Empty context should trigger unknown handling
    answer, status = answer_generator.generate_answer("What is alien language policy?", [])
    assert status == "NO_RELEVANT_INFORMATION"
    assert "couldn't find reliable information" in answer
