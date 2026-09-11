from app.services.image_service import image_service
from app.models.registry import registry

def test_image_intent_detection():
    # Various natural language trigger phrases
    assert image_service.detect_image_intent("generate an image of a cybernetic dragon") == "a cybernetic dragon"
    assert image_service.detect_image_intent("draw me a cozy coffee shop in rainy Tokyo") == "a cozy coffee shop in rainy Tokyo"
    assert image_service.detect_image_intent("create an image of neon galaxy") == "neon galaxy"
    assert image_service.detect_image_intent("/image futuristic hypercar in matte black") == "futuristic hypercar in matte black"
    assert image_service.detect_image_intent("paint a serene watercolor landscape") == "a serene watercolor landscape"
    
    # Non-image query should return None
    assert image_service.detect_image_intent("What is the capital of France?") is None
    assert image_service.detect_image_intent("Write a Python sorting algorithm") is None

def test_image_dimension_resolution():
    w, h = image_service.resolve_dimensions("16:9")
    assert (w, h) == (1280, 720)

    w, h = image_service.resolve_dimensions("1:1")
    assert (w, h) == (1024, 1024)

    w, h = image_service.resolve_dimensions("9:16")
    assert (w, h) == (720, 1280)

    w, h = image_service.resolve_dimensions(None, 800, 600)
    assert (w, h) == (800, 600)

def test_image_generate_api(client):
    payload = {
        "prompt": "A majestic golden eagle soaring above mountains",
        "aspect_ratio": "16:9",
        "model": "cretivra-flux",
        "style": "photorealistic",
        "seed": 42
    }
    res = client.post("/api/images/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "https://image.pollinations.ai" in data["image_url"]
    assert "proxy_url" in data
    assert "/api/images/proxy?url=" in data["proxy_url"]
    assert data["width"] == 1280
    assert data["height"] == 720
    assert data["seed"] == 42
    assert data["model"] == "flux"

def test_image_proxy_api(client):
    # Test valid image proxy request (fallback svg or image)
    test_url = "https://image.pollinations.ai/prompt/test_art?width=100&height=100&model=turbo"
    res = client.get(f"/api/images/proxy?url={test_url}")
    assert res.status_code == 200
    assert len(res.content) > 100
    assert ("image/" in res.headers.get("content-type", ""))

    # Test invalid URL rejected
    bad_res = client.get("/api/images/proxy?url=ftp://invalid.com")
    assert bad_res.status_code == 400

def test_image_models_catalog_api(client):
    res = client.get("/api/images/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "aspect_ratios" in data
    assert "styles" in data
    assert len(data["models"]) >= 4

def test_enhance_prompt_api(client):
    res = client.post("/api/images/enhance-prompt", json={
        "prompt": "flying car",
        "style": "cyberpunk"
    })
    assert res.status_code == 200
    data = res.json()
    assert "cyberpunk" in data["enhanced_prompt"]

def test_registry_image_models():
    assert registry.is_image_model("cretivra-flux") is True
    assert registry.is_image_model("cretivra-diffusion") is True
    assert registry.is_image_model("cretivra-1") is False

def test_watermark_removal():
    from PIL import Image
    import io
    test_img = Image.new("RGB", (512, 512), color=(100, 150, 200))
    buf = io.BytesIO()
    test_img.save(buf, format="JPEG")
    orig_bytes = buf.getvalue()
    
    clean_bytes = image_service.remove_watermark(orig_bytes)
    assert len(clean_bytes) > 0
    clean_img = Image.open(io.BytesIO(clean_bytes))
    assert clean_img.size == (512, 512)

def test_gemini_model_in_catalog(client):
    res = client.get("/api/images/models")
    assert res.status_code == 200
    models = res.json()["models"]
    engine_ids = [m["id"] for m in models]
    assert "cretivra-gemini" in engine_ids
