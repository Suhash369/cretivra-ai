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
    assert data["width"] == 1280
    assert data["height"] == 720
    assert data["seed"] == 42
    assert data["model"] == "flux"

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
