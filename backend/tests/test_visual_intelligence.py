"""
TEST SUITE FOR ASURA VISUAL INTELLIGENCE
Tests all 10 core intent & visual retrieval cases specified in the product architecture:
1. "Who is Vijay?" -> Person images (PHOTO)
2. "Where is Peru?" -> Map / Geographic visual (MAP)
3. "Explain STM32 GPIO." -> Technical diagram / pinout (TECHNICAL_DIAGRAM)
4. "How to make chicken biryani?" -> Food visuals (FOOD_IMAGE)
5. "Show me the Eiffel Tower." -> Landmark images (ARCHITECTURE / PHOTO)
6. "Compare iPhone 16 and Galaxy S25." -> Product images + comparison layout (PRODUCT_IMAGE)
7. "What is 25 × 25?" -> No image (NONE)
8. "Write a Python sorting function." -> No unnecessary image (NONE)
9. "Explain photosynthesis." -> Scientific diagram (MEDICAL_SCIENTIFIC_DIAGRAM)
10. "Latest developments in Indian AI." -> Ecosystem visual material (MULTIPLE_VISUALS)

Also tests:
- Image ranking and deduplication
- "Why this image?" rationale generation
- Source attribution metadata
- Contextual answer composition (Sections / Carousel / Comparison)
- Visual API endpoints: /analyze, /search, /rank, /source/:id, /proxy
- Security: SSRF prevention on visual proxy
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.visual_intelligence_service import (
    visual_intelligence_service,
    VisualIntentType,
    VisualPlacement
)

client = TestClient(app)

# ---------------------------------------------------------
# Test Case 1: "Who is Vijay?" -> PHOTO (Person images)
# ---------------------------------------------------------
def test_intent_who_is_vijay():
    analysis = visual_intelligence_service.analyze_visual_intent("Who is Vijay?")
    assert analysis["intent"] == VisualIntentType.PHOTO.value
    assert analysis["is_visual_useful"] is True
    assert "Vijay" in analysis["entity"]
    assert any("actor" in q.lower() or "portrait" in q.lower() for q in analysis["search_queries"])

@pytest.mark.asyncio
async def test_search_who_is_vijay():
    analysis = visual_intelligence_service.analyze_visual_intent("Who is Vijay?")
    visuals = await visual_intelligence_service.search_and_rank_visuals("Who is Vijay?", analysis, max_images=3)
    assert len(visuals) > 0
    primary = visuals[0]
    assert "vijay" in (primary["title"] + primary["caption"]).lower()
    assert primary["source_name"] != ""
    assert primary["license"] != ""
    assert primary["reason"] != ""

# ---------------------------------------------------------
# Test Case 2: "Where is Peru?" -> MAP / LOCATION_IMAGE
# ---------------------------------------------------------
def test_intent_where_is_peru():
    analysis = visual_intelligence_service.analyze_visual_intent("Where is Peru?")
    assert analysis["intent"] == VisualIntentType.MAP.value
    assert analysis["is_visual_useful"] is True
    assert "Peru" in analysis["entity"]
    assert any("map" in q.lower() for q in analysis["search_queries"])

@pytest.mark.asyncio
async def test_search_where_is_peru():
    analysis = visual_intelligence_service.analyze_visual_intent("Where is Peru?")
    visuals = await visual_intelligence_service.search_and_rank_visuals("Where is Peru?", analysis, max_images=3)
    assert len(visuals) > 0
    assert any("map" in (v["title"] + v["caption"]).lower() or "peru" in v["title"].lower() for v in visuals)

# ---------------------------------------------------------
# Test Case 3: "Explain STM32 GPIO." -> TECHNICAL_DIAGRAM
# ---------------------------------------------------------
def test_intent_explain_stm32_gpio():
    analysis = visual_intelligence_service.analyze_visual_intent("Explain STM32 GPIO.")
    assert analysis["intent"] == VisualIntentType.TECHNICAL_DIAGRAM.value
    assert analysis["is_visual_useful"] is True
    assert "STM32" in analysis["entity"]
    assert any("diagram" in q.lower() or "pinout" in q.lower() or "architecture" in q.lower() for q in analysis["search_queries"])

@pytest.mark.asyncio
async def test_search_stm32_gpio():
    analysis = visual_intelligence_service.analyze_visual_intent("Explain STM32 GPIO.")
    visuals = await visual_intelligence_service.search_and_rank_visuals("Explain STM32 GPIO.", analysis, max_images=3)
    assert len(visuals) > 0
    assert any("stm32" in v["title"].lower() or "pinout" in v["title"].lower() for v in visuals)

# ---------------------------------------------------------
# Test Case 4: "How to make chicken biryani?" -> FOOD_IMAGE
# ---------------------------------------------------------
def test_intent_chicken_biryani():
    analysis = visual_intelligence_service.analyze_visual_intent("How to make chicken biryani?")
    assert analysis["intent"] == VisualIntentType.FOOD_IMAGE.value
    assert analysis["is_visual_useful"] is True
    assert "Biryani" in analysis["entity"]

@pytest.mark.asyncio
async def test_search_chicken_biryani():
    analysis = visual_intelligence_service.analyze_visual_intent("How to make chicken biryani?")
    visuals = await visual_intelligence_service.search_and_rank_visuals("How to make chicken biryani?", analysis, max_images=2)
    assert len(visuals) > 0
    assert any("biryani" in v["title"].lower() for v in visuals)

# ---------------------------------------------------------
# Test Case 5: "Show me the Eiffel Tower." -> ARCHITECTURE
# ---------------------------------------------------------
def test_intent_eiffel_tower():
    analysis = visual_intelligence_service.analyze_visual_intent("Show me the Eiffel Tower.")
    assert analysis["intent"] == VisualIntentType.ARCHITECTURE.value
    assert analysis["is_visual_useful"] is True
    assert "Eiffel Tower" in analysis["entity"]

@pytest.mark.asyncio
async def test_search_eiffel_tower():
    analysis = visual_intelligence_service.analyze_visual_intent("Show me the Eiffel Tower.")
    visuals = await visual_intelligence_service.search_and_rank_visuals("Show me the Eiffel Tower.", analysis, max_images=2)
    assert len(visuals) > 0
    assert any("eiffel" in v["title"].lower() for v in visuals)

# ---------------------------------------------------------
# Test Case 6: "Compare iPhone 16 and Galaxy S25." -> PRODUCT_IMAGE + Comparison
# ---------------------------------------------------------
def test_intent_compare_products():
    analysis = visual_intelligence_service.analyze_visual_intent("Compare iPhone 16 and Galaxy S25.")
    assert analysis["intent"] == VisualIntentType.PRODUCT_IMAGE.value
    assert analysis["is_visual_useful"] is True
    assert analysis["is_comparison"] is True
    assert len(analysis["entities"]) == 2

@pytest.mark.asyncio
async def test_search_and_compose_product_comparison():
    analysis = visual_intelligence_service.analyze_visual_intent("Compare iPhone 16 and Galaxy S25.")
    visuals = await visual_intelligence_service.search_and_rank_visuals("Compare iPhone 16 and Galaxy S25.", analysis, max_images=2)
    assert len(visuals) >= 2
    composed = visual_intelligence_service.compose_visual_answer(
        text_content="Here is a comparison between iPhone 16 and Galaxy S25.",
        images=visuals,
        intent_info=analysis
    )
    assert composed["has_visuals"] is True
    assert composed["comparison"] is not None
    assert "product_a" in composed["comparison"]
    assert "product_b" in composed["comparison"]

# ---------------------------------------------------------
# Test Case 7: "What is 25 × 25?" -> NONE (No image!)
# ---------------------------------------------------------
def test_intent_math_calculation():
    analysis = visual_intelligence_service.analyze_visual_intent("What is 25 × 25?")
    assert analysis["intent"] == VisualIntentType.NONE.value
    assert analysis["is_visual_useful"] is False
    assert len(analysis["search_queries"]) == 0

    analysis_2 = visual_intelligence_service.analyze_visual_intent("What is 2 + 2?")
    assert analysis_2["intent"] == VisualIntentType.NONE.value
    assert analysis_2["is_visual_useful"] is False

# ---------------------------------------------------------
# Test Case 8: "Write a Python sorting function." -> NONE (No image!)
# ---------------------------------------------------------
def test_intent_code_function():
    analysis = visual_intelligence_service.analyze_visual_intent("Write a Python sorting function.")
    assert analysis["intent"] == VisualIntentType.NONE.value
    assert analysis["is_visual_useful"] is False
    assert len(analysis["search_queries"]) == 0

# ---------------------------------------------------------
# Test Case 9: "Explain photosynthesis." -> MEDICAL_SCIENTIFIC_DIAGRAM
# ---------------------------------------------------------
def test_intent_photosynthesis():
    analysis = visual_intelligence_service.analyze_visual_intent("Explain photosynthesis.")
    assert analysis["intent"] == VisualIntentType.MEDICAL_SCIENTIFIC_DIAGRAM.value
    assert analysis["is_visual_useful"] is True
    assert "Photosynthesis" in analysis["entity"]

@pytest.mark.asyncio
async def test_search_photosynthesis():
    analysis = visual_intelligence_service.analyze_visual_intent("Explain photosynthesis.")
    visuals = await visual_intelligence_service.search_and_rank_visuals("Explain photosynthesis.", analysis, max_images=2)
    assert len(visuals) > 0
    assert any("photosynthesis" in v["title"].lower() for v in visuals)

# ---------------------------------------------------------
# Test Case 10: "Latest developments in Indian AI." -> MULTIPLE_VISUALS
# ---------------------------------------------------------
def test_intent_latest_developments_indian_ai():
    analysis = visual_intelligence_service.analyze_visual_intent("Latest developments in Indian AI.")
    assert analysis["intent"] == VisualIntentType.MULTIPLE_VISUALS.value
    assert analysis["is_visual_useful"] is True

# ---------------------------------------------------------
# Deduplication & Ranking Verification
# ---------------------------------------------------------
def test_ranking_and_deduplication():
    candidates = [
        {
            "id": "1",
            "title": "Eiffel Tower Paris",
            "caption": "The Eiffel Tower landmark",
            "image_url": "https://example.com/eiffel.jpg",
            "source_name": "Wikimedia Commons",
            "license": "CC BY-SA",
            "width": 1200,
            "height": 800
        },
        # Near duplicate with same URL
        {
            "id": "2",
            "title": "Eiffel Tower Paris Duplicate",
            "caption": "Duplicate",
            "image_url": "https://example.com/eiffel.jpg",
            "source_name": "Wikimedia Commons",
            "license": "CC BY-SA",
            "width": 1200,
            "height": 800
        },
        # Tiny low-res image
        {
            "id": "3",
            "title": "Unrelated Icon",
            "caption": "Icon",
            "image_url": "https://example.com/icon.png",
            "source_name": "IconSite",
            "width": 100,
            "height": 100
        }
    ]

    ranked = visual_intelligence_service.rank_and_deduplicate(
        candidates=candidates,
        entity="Eiffel Tower",
        query="Eiffel Tower Paris",
        intent=VisualIntentType.ARCHITECTURE.value,
        max_results=5
    )

    assert len(ranked) == 2  # Duplicate dropped
    assert ranked[0]["id"] == "1"
    assert ranked[0]["relevance_score"] >= ranked[1]["relevance_score"]

# ---------------------------------------------------------
# Contextual Image Placement Verification
# ---------------------------------------------------------
def test_contextual_section_placement():
    images = [
        {
            "id": "hero_1",
            "title": "Modern Eiffel Tower",
            "caption": "Eiffel tower today in Paris",
            "image_url": "https://example.com/modern.jpg",
            "source_name": "Wikimedia Commons"
        },
        {
            "id": "hist_1",
            "title": "Construction of the Eiffel Tower 1888",
            "caption": "Archival construction photo 1888",
            "image_url": "https://example.com/hist.jpg",
            "source_name": "Historical Archives"
        }
    ]

    text = """
The Eiffel Tower is Paris's most famous landmark.

## Construction
The Eiffel Tower was constructed between 1887 and 1889 by Gustave Eiffel.

## Today
Today it attracts millions of visitors annually.
"""
    intent_info = {"intent": VisualIntentType.ARCHITECTURE.value, "is_comparison": False}
    composed = visual_intelligence_service.compose_visual_answer(text, images, intent_info)

    assert composed["has_visuals"] is True
    assert len(composed["sections"]) > 0
    assert any("Construction" in s["header"] for s in composed["sections"])

# ---------------------------------------------------------
# API Endpoints Verification
# ---------------------------------------------------------
def test_api_visual_analyze():
    res = client.post("/api/visual/analyze", json={"query": "Who is Vijay?"})
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "PHOTO"
    assert data["is_visual_useful"] is True

def test_api_visual_search():
    res = client.post("/api/visual/search", json={"query": "Where is Peru?", "max_images": 2})
    assert res.status_code == 200
    data = res.json()
    assert data["is_visual_useful"] is True
    assert len(data["results"]) > 0

def test_api_visual_source():
    res = client.get("/api/visual/source/asura_vis_vijay_portrait")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "asura_vis_vijay_portrait"
    assert "Vijay" in data["title"]
    assert "source_url" in data

def test_api_visual_proxy_ssrf_blocked():
    # Attempting to access localhost should return 403 Forbidden
    res = client.get("/api/visual/proxy?url=http://127.0.0.1:8000/secret")
    assert res.status_code == 403

    res2 = client.get("/api/visual/proxy?url=http://localhost:3000")
    assert res2.status_code == 403
