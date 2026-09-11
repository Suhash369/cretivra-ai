import io
import os
import pytest
from fastapi.testclient import TestClient
import pptx
from PIL import Image

from app.main import app
from app.services.file_service import file_service
from app.services.presentation_service import presentation_service

client = TestClient(app)

def test_pptx_generation_and_text_extraction(tmp_path):
    # 1. Generate a test presentation using presentation_service
    slides = [
        {"title": "Introduction to AI", "bullets": ["History of neural networks", "Machine learning paradigms", "Modern deep architectures"]},
        {"title": "Autonomous Systems", "bullets": ["Perception pipelines", "Decision theory", "Real-time edge computing"]}
    ]
    res = presentation_service.generate_presentation(
        title="Test Deck",
        slides=slides,
        subtitle="Verification Subtitle"
    )
    assert res["success"] is True
    assert os.path.exists(res["file_path"])
    assert res["slide_count"] == 3

    # 2. Extract text from the generated PPTX
    extracted = file_service.extract_text_content(res["file_path"], res["filename"])
    assert extracted is not None
    assert "Introduction to AI" in extracted
    assert "History of neural networks" in extracted
    assert "Autonomous Systems" in extracted

    # 3. Test download endpoint
    dl_res = client.get(f"/api/files/download/{res['filename']}")
    assert dl_res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.presentationml.presentation" in dl_res.headers.get("content-type", "")

def test_image_describe_endpoint():
    # Create a small dummy image in memory
    img = Image.new("RGB", (640, 480), color=(73, 109, 137))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    res = client.post(
        "/api/images/describe",
        files={"file": ("sample_art.png", img_byte_arr.getvalue(), "image/png")}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "sample art" in data["prompt"].lower()
    assert data["width"] == 640
    assert data["height"] == 480
    assert "aspect_ratio" in data

def test_image_file_metadata_and_data_url(tmp_path):
    img = Image.new("RGB", (200, 200), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_bytes = img_byte_arr.getvalue()

    upload_res = client.post(
        "/api/files/upload",
        files={"file": ("test_avatar.jpg", img_bytes, "image/jpeg")}
    )
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert "data_url" in data
    assert data["data_url"].startswith("data:image/jpeg;base64,")
    assert data["image_metadata"]["width"] == 200
    assert data["image_metadata"]["height"] == 200
    assert "Attached Image File" in data["extracted_text"]

def test_pdf_generation_service_and_export_endpoint(tmp_path):
    from app.services.pdf_service import pdf_service

    # 1. Test intent detection
    assert pdf_service.detect_pdf_request("generate pdf for this content") is True
    assert pdf_service.detect_pdf_request("Can you export this to a pdf report?") is True
    assert pdf_service.detect_pdf_request("Tell me a joke") is False

    # 2. Test title extraction
    title = pdf_service.extract_title_from_prompt("generate a pdf for 2026 Tamil Nadu Election Report")
    assert "Tamil Nadu" in title

    # 3. Test generate_pdf service directly
    res = pdf_service.generate_pdf(
        title="Automated Test PDF",
        content="## Section 1\n- High throughput\n- Zero latency",
        subtitle="Test Verification"
    )
    assert res["success"] is True
    assert os.path.exists(res["file_path"])
    assert res["filename"].endswith(".pdf")

    # 4. Test API endpoint /api/files/export-pdf
    api_res = client.post(
        "/api/files/export-pdf",
        json={
            "title": "API Test Document",
            "content": "# Executive Summary\nVerified API PDF generation.",
            "subtitle": "FastAPI Integration"
        }
    )
    assert api_res.status_code == 200
    data = api_res.json()
    assert data["success"] is True
    assert data["download_url"].startswith("/api/files/download/")

    # 5. Test download of generated PDF
    dl_res = client.get(data["download_url"])
    assert dl_res.status_code == 200
    assert dl_res.headers.get("content-type") == "application/pdf"
    assert len(dl_res.content) > 500
