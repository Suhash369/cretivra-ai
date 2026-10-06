import asyncio
import json
import re
from typing import List, Dict, Any

from app.core.config import settings
from app.core.router import asura_router
from app.core.entity import entity_detector
from app.providers.image_search import image_search_provider
from app.core.model_manager import model_manager
from app.services.response_orchestrator import response_orchestrator
from app.database.database import get_db, SessionLocal
from app.database.models import UserDB, ConversationDB, MessageDB

async def run_master_test_suite():
    print("=" * 60)
    print("CRETIVRA ASURA — FULL ENGINE MASTER VERIFICATION SUITE")
    print("=" * 60)

    all_passed = True

    # -------------------------------------------------------------
    # TEST 1: Virat Kohli Intent, Entity & Image Search Pipeline
    # -------------------------------------------------------------
    print("\n--- TEST 1: Virat Kohli Pipeline ---")
    query_vk = "Who is Virat Kohli?"
    decision_vk = asura_router.route(query=query_vk)
    print(f"[ASURA] intent={decision_vk.intent}")
    print(f"[ASURA] entity={decision_vk.entity}")
    print(f"[ASURA] requires_images={decision_vk.requires_images}")
    print(f"[ASURA] requires_current_info={decision_vk.requires_current_information}")

    assert decision_vk.intent == "PERSON", f"Expected PERSON, got {decision_vk.intent}"
    assert "Virat Kohli" in (decision_vk.entity or ""), f"Expected Virat Kohli, got {decision_vk.entity}"
    assert decision_vk.requires_images is True, "requires_images must be True"

    # Test Image Search
    images = await image_search_provider.search(decision_vk.image_search_query or "Virat Kohli", max_results=4)
    print(f"[ASURA] image_results={len(images)} response_images={len(images)}")
    assert len(images) > 0, "Image search must return authentic images"
    for img in images:
        assert img["url"].startswith("http"), f"Invalid image URL: {img['url']}"
        assert img["title"], "Missing image title"
        assert img["attribution"], "Missing image attribution"
        print(f"  [OK] Image: {img['title'][:40]} | URL: {img['url'][:50]}... | Source: {img['sourceName']}")
    print("[OK] TEST 1 PASSED: Entity detected & authentic images retrieved")

    # -------------------------------------------------------------
    # TEST 2: Follow-up Questions & Conversational Context
    # -------------------------------------------------------------
    print("\n--- TEST 2: Conversational Memory & Context Resolution ---")
    context_msgs = [
        {"role": "user", "content": "Who is Virat Kohli?"},
        {"role": "assistant", "content": "Virat Kohli is an Indian international cricketer..."}
    ]

    # Follow-up 1: "How old is he?"
    ent_followup1, _ = entity_detector.detect_entity("How old is he?", conversation_context=context_msgs)
    print(f"Follow-up 'How old is he?' -> Resolved entity: {ent_followup1}")
    assert ent_followup1 == "Virat Kohli", f"Expected Virat Kohli, got {ent_followup1}"

    # Follow-up 2: "What are his records?"
    decision_rec = asura_router.route("What are his records?", conversation_history=context_msgs)
    print(f"Follow-up 'What are his records?' -> Resolved entity: {decision_rec.entity}")
    assert decision_rec.entity == "Virat Kohli", f"Expected Virat Kohli, got {decision_rec.entity}"

    # Follow-up 3: "Compare him with Rohit Sharma"
    ent_comp, _ = entity_detector.detect_entity("Compare him with Rohit Sharma", conversation_context=context_msgs)
    mult_comp = entity_detector.extract_multiple_entities("Compare him with Rohit Sharma")
    print(f"Comparison -> Multiple entities: {mult_comp or ent_comp}")
    assert "Rohit Sharma" in str(mult_comp) or "Rohit Sharma" in str(ent_comp), "Failed to detect Rohit Sharma in comparison"
    print("[OK] TEST 2 PASSED: Follow-up pronouns & entities resolved from context")

    # -------------------------------------------------------------
    # TEST 3: Image Search vs Image Generation Distinction
    # -------------------------------------------------------------
    print("\n--- TEST 3: Image Search vs Image Generation Distinction ---")
    dec_search = asura_router.route("Show me Virat Kohli")
    print(f"'Show me Virat Kohli' -> requires_images={dec_search.requires_images}, requires_image_gen={dec_search.requires_image_generation}")
    assert dec_search.requires_images is True, "Must be real image search"
    assert dec_search.requires_image_generation is False, "Must NOT be image generation"

    dec_gen = asura_router.route("Generate a futuristic Cretivra office")
    print(f"'Generate a futuristic Cretivra office' -> requires_images={dec_gen.requires_images}, requires_image_gen={dec_gen.requires_image_generation}")
    assert dec_gen.requires_image_generation is True, "Must be image generation"
    assert dec_gen.requires_images is False, "Must NOT be real image search"
    print("[OK] TEST 3 PASSED: Search vs Generation correctly distinguished")

    # -------------------------------------------------------------
    # TEST 4: Technical & Coding Routing (No Unnecessary Images)
    # -------------------------------------------------------------
    print("\n--- TEST 4: Technical & Coding Routing ---")
    dec_tech = asura_router.route("Explain STM32 F401RE GPIO")
    print(f"'Explain STM32 F401RE GPIO' -> intent={dec_tech.intent}, requires_images={dec_tech.requires_images}")
    assert dec_tech.requires_images is False, "Technical explanation must NOT trigger images"

    dec_code = asura_router.route("Write an STM32 UART driver in Embedded C")
    print(f"'Write an STM32 UART driver in Embedded C' -> intent={dec_code.intent}, mode={dec_code.logical_mode}")
    assert dec_code.intent == "CODE", f"Expected CODE, got {dec_code.intent}"
    assert "Coding" in dec_code.logical_mode, f"Expected Asura Coding mode, got {dec_code.logical_mode}"
    print("[OK] TEST 4 PASSED: Coding routed accurately without images")

    # -------------------------------------------------------------
    # TEST 5: End-to-End Streaming Orchestration
    # -------------------------------------------------------------
    print("\n--- TEST 5: End-to-End Streaming Orchestration ---")
    db = SessionLocal()
    try:
        # Create a test conversation
        test_conv = ConversationDB(title="Virat Kohli Test", model_id="asura-balanced")
        db.add(test_conv)
        db.commit()
        db.refresh(test_conv)

        chunks_received = 0
        got_images_in_stream = False
        full_text = ""
        structured_received = False

        async for chunk_str in response_orchestrator.orchestrate_chat_stream(
            db=db,
            conversation_id=test_conv.id,
            user_message="Who is Virat Kohli?"
        ):
            if chunk_str.startswith("data: "):
                payload = json.loads(chunk_str[6:].strip())
                chunks_received += 1
                if payload.get("content"):
                    full_text += payload["content"]
                if payload.get("images") and len(payload["images"]) > 0:
                    got_images_in_stream = True
                if payload.get("structured_response"):
                    structured_received = True

        print(f"Chunks received: {chunks_received}")
        print(f"Images in stream: {got_images_in_stream}")
        print(f"Structured response received: {structured_received}")
        print(f"Generated text length: {len(full_text)} characters")

        assert chunks_received > 2, "Expected multiple SSE streaming chunks"
        assert got_images_in_stream is True, "SSE stream must yield images array"
        assert structured_received is True, "Final event must contain structured_response"
        assert len(full_text) > 100, "Expected substantive generated answer"

        # Check for vendor leaks
        forbidden_vendors = ["Gemini", "Groq", "OpenRouter", "Ollama", "Tavily", "gpt-oss", "liquid", "nemotron"]
        for v in forbidden_vendors:
            assert v.lower() not in full_text.lower(), f"Vendor leak detected in generated response: {v}"

        print("[OK] TEST 5 PASSED: Full streaming pipeline succeeded with zero vendor leaks and images")
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("ALL 5 MASTER ACCEPTANCE CRITERIA TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_master_test_suite())
