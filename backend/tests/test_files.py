import io
from app.services.file_service import file_service

def test_file_validation_allowed_and_disallowed():
    # Allowed extensions
    assert file_service.validate_file("document.pdf", 1000)["valid"] is True
    assert file_service.validate_file("notes.txt", 500)["valid"] is True
    assert file_service.validate_file("data.csv", 2000)["valid"] is True
    assert file_service.validate_file("readme.md", 300)["valid"] is True
    assert file_service.validate_file("photo.png", 5000)["valid"] is True

    # Disallowed extensions
    res_exe = file_service.validate_file("malware.exe", 100)
    assert res_exe["valid"] is False
    assert "Unsupported file extension" in res_exe["error"]

    res_sh = file_service.validate_file("script.sh", 100)
    assert res_sh["valid"] is False

    res_py = file_service.validate_file("exploit.py", 100)
    assert res_py["valid"] is False

def test_file_size_limit_validation():
    # Exceeding 25MB (26MB in bytes)
    oversized = 26 * 1024 * 1024
    res = file_service.validate_file("huge.pdf", oversized)
    assert res["valid"] is False
    assert "File size exceeds" in res["error"]

def test_upload_valid_text_file(client):
    file_content = b"Hello, this is a test document with special content."
    files = {
        "file": ("test_doc.txt", io.BytesIO(file_content), "text/plain")
    }
    res = client.post("/api/files/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "test_doc.txt"
    assert data["mime_type"] == "text/plain"
    assert data["size"] == len(file_content)
    assert "Hello, this is a test document" in data["extracted_text"]

def test_upload_disallowed_extension_rejected(client):
    file_content = b"echo 'hacked'"
    files = {
        "file": ("bad_script.sh", io.BytesIO(file_content), "application/x-sh")
    }
    res = client.post("/api/files/upload", files=files)
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]

def test_upload_path_traversal_sanitized(client):
    # Filename attempt with directory traversal
    file_content = b"sensitive info"
    files = {
        "file": ("../../etc/passwd.txt", io.BytesIO(file_content), "text/plain")
    }
    res = client.post("/api/files/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    # The filename must be stripped of traversal path characters
    assert ".." not in data["filename"]
    assert "/" not in data["filename"]
    assert "\\" not in data["filename"]
    assert "passwd.txt" in data["filename"]
