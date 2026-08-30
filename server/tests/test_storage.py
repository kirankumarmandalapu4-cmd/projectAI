from app.services.storage import DocumentStorage, document_storage


def test_storage_recognizes_remote_references():
    assert DocumentStorage.is_remote_reference("supabase://college-documents/documents/a.pdf")
    assert not DocumentStorage.is_remote_reference("uploads/a.pdf")


def test_local_storage_keeps_local_path(tmp_path):
    file_path = tmp_path / "notice.txt"
    file_path.write_text("Library notice", encoding="utf-8")

    with document_storage.local_copy(str(file_path), "txt") as local_path:
        assert local_path == str(file_path)
        assert open(local_path, "r", encoding="utf-8").read() == "Library notice"
