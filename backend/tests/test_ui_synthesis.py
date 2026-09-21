import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import init_db
from app.services.stitch_engine import stitch_engine

init_db()
client = TestClient(app)

def test_ui_synthesis_no_labels():
    html = stitch_engine.synthesize_ui("Build a modern portfolio for a cloud architect")
    assert "Google Stitch" not in html
    assert "google stitch" not in html.lower()
    assert "<!DOCTYPE html>" in html
    assert "cloud architect" in html.lower() or "portfolio" in html.lower()

def test_ui_variants_generation():
    variants = stitch_engine.generate_variants("Build a CRM for sales pipeline")
    assert len(variants) == 3
    for v in variants:
        assert "Google Stitch" not in v["html"]
        assert "google stitch" not in v["html"].lower()
        assert "<!DOCTYPE html>" in v["html"]

def test_ui_refine():
    initial_html = stitch_engine.synthesize_ui("Build a sneaker store")
    refined_html = stitch_engine.edit_ui("Build a sneaker store", initial_html, "Make theme violet with neon glow")
    assert "Google Stitch" not in refined_html
    assert "<!DOCTYPE html>" in refined_html

def test_api_playground_ui_synthesize():
    res = client.post("/api/playground/ui/synthesize", json={
        "prompt": "Build a task management kanban board app"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Google Stitch" not in data["html"]
    assert "<!DOCTYPE html>" in data["html"]

def test_api_playground_ui_variants():
    res = client.post("/api/playground/ui/variants", json={
        "prompt": "Build an e-commerce storefront for electronics"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["variants"]) == 3
    for v in data["variants"]:
        assert "Google Stitch" not in v["html"]

def test_api_playground_ui_refine():
    res = client.post("/api/playground/ui/refine", json={
        "prompt": "Build an e-commerce storefront",
        "instruction": "Add customer reviews section and make it dark theme",
        "current_html": "<!DOCTYPE html><html><body>Store</body></html>"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Google Stitch" not in data["html"]
