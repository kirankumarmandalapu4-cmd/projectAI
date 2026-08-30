from app.rag.retrieval.text_matching import normalized_terms, terms_match


def test_normalized_terms_ignores_question_stopwords():
    assert normalized_terms("What does the library do?") == {"library"}


def test_terms_match_common_word_variants():
    assert terms_match("open", "opens")
    assert terms_match("close", "closes")
    assert not terms_match("fee", "faculty")
