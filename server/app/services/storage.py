"""Document storage abstraction with a local and Supabase Storage backend."""

from contextlib import contextmanager
import mimetypes
import os
from pathlib import Path
import tempfile
from typing import Iterator, Optional
from urllib.parse import quote

import httpx

from app.core.config import settings


class DocumentStorage:
    def __init__(self) -> None:
        self.base_url = (settings.SUPABASE_URL or "").rstrip("/")
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY or ""
        self.bucket = settings.SUPABASE_STORAGE_BUCKET.strip()

    @property
    def is_remote(self) -> bool:
        return bool(self.base_url and self.service_key and self.bucket)

    @staticmethod
    def is_remote_reference(reference: str) -> bool:
        return reference.startswith("supabase://")

    def _headers(self, content_type: Optional[str] = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    def _object_path(self, reference: str) -> tuple[str, str]:
        if not self.is_remote_reference(reference):
            raise ValueError("Not a Supabase Storage reference")
        value = reference.removeprefix("supabase://")
        bucket, separator, object_key = value.partition("/")
        if not separator or not bucket or not object_key:
            raise ValueError("Invalid Supabase Storage reference")
        return bucket, object_key

    def upload_file(self, file_path: str, object_key: str) -> str:
        if not self.is_remote:
            return file_path
        content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        endpoint = f"{self.base_url}/storage/v1/object/{quote(self.bucket)}/{quote(object_key, safe='/')}"
        with open(file_path, "rb") as file_handle:
            response = httpx.post(
                endpoint,
                headers={**self._headers(content_type), "x-upsert": "true"},
                content=file_handle.read(),
                timeout=60.0,
            )
        response.raise_for_status()
        return f"supabase://{self.bucket}/{object_key}"

    def download_file(self, reference: str, destination: str) -> str:
        bucket, object_key = self._object_path(reference)
        endpoint = f"{self.base_url}/storage/v1/object/{quote(bucket)}/{quote(object_key, safe='/')}"
        response = httpx.get(endpoint, headers=self._headers(), timeout=60.0)
        response.raise_for_status()
        with open(destination, "wb") as file_handle:
            file_handle.write(response.content)
        return destination

    def delete(self, reference: str) -> None:
        if not self.is_remote_reference(reference):
            return
        bucket, object_key = self._object_path(reference)
        endpoint = f"{self.base_url}/storage/v1/object/remove/{quote(bucket)}"
        response = httpx.post(endpoint, headers=self._headers("application/json"), json={"prefixes": [object_key]}, timeout=30.0)
        response.raise_for_status()

    @contextmanager
    def local_copy(self, reference: str, file_type: str) -> Iterator[str]:
        """Yield a readable local path, cleaning remote temporary files afterward."""
        if not self.is_remote_reference(reference):
            yield reference
            return

        suffix = f".{file_type.lstrip('.')}" if file_type else ""
        temporary_dir = tempfile.mkdtemp(prefix="college-rag-")
        temporary_path = os.path.join(temporary_dir, f"document{suffix}")
        try:
            yield self.download_file(reference, temporary_path)
        finally:
            try:
                Path(temporary_path).unlink(missing_ok=True)
                Path(temporary_dir).rmdir()
            except OSError:
                pass


document_storage = DocumentStorage()
