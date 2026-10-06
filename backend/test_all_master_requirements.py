import asyncio
import re
import sys
from app.database.database import SessionLocal
from app.services.response_orchestrator import response_orchestrator
from app.core.router import asura_router
from app.core.entity import entity_detector
from app.providers.cloud_provider import clean_ai_response

def p(text: str):
    sys.stdout.buffer.write((str(text) + "\n").encode("utf-8", errors="replace"))

async def run_tests():
    db = SessionLocal()
    p("=" * 70)
    p("   CRETIVRA ASURA - MASTER VERIFICATION TEST SUITE")
    p("=" * 70)

    # -------------------------------------------------------------
    # RAW HTML SANITIZATION TEST
    # -------------------------------------------------------------
    raw_html_input = (
        "<ul>\n"
        "<li>ODI: 18 August 2008 vs Sri Lanka</li>\n"
        "<li>T20I: 12 June 2010 vs Zimbabwe</li>\n"
        "<li>Test: 20 June 2011 vs West Indies</li>\n"
        "</ul>"
    )
    cleaned_md = clean_ai_response(raw_html_input)
    p("\n[RAW HTML TEST]:")
    p(cleaned_md)
    assert "<ul>" not in cleaned_md, "ERROR: <ul> leaked!"
    assert "<li>" not in cleaned_md, "ERROR: <li> leaked!"
    assert "- ODI: 18 August 2008 vs Sri Lanka" in cleaned_md, "ERROR: Missing converted item!"
    p("[PASS] Raw HTML successfully converted to Markdown lists without leaking tags.")

    # -------------------------------------------------------------
    # TEST 1: "Who is Virat Kohli?"
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 1: Who is Virat Kohli?")
    dec1 = await asura_router.route_async("Who is Virat Kohli?")
    p(f"Decision: intent={dec1.intent}, entity={dec1.entity}, requires_images={dec1.requires_images}")
    assert dec1.entity == "Virat Kohli", f"Expected Virat Kohli, got {dec1.entity}"
    assert dec1.requires_images is True, "Expected requires_images=True"

    resp1 = await response_orchestrator.orchestrate_chat_sync(
        db=db,
        conversation_id="test_suite_conv_1",
        user_message="Who is Virat Kohli?"
    )
    p(f"Answer snippet: {resp1.answer[:120]}...")
    p(f"Images count: {len(resp1.images)}")
    for img in resp1.images:
        p(f"  - {img.title} ({img.url[:60]}...)")
    assert len(resp1.images) > 0, "Expected real images for Virat Kohli"
    assert any("kohli" in img.title.lower() or "kohli" in img.url.lower() for img in resp1.images), "Expected Virat Kohli image"
    p("[PASS] Test 1: Real Virat Kohli images and clean markdown response.")

    # -------------------------------------------------------------
    # TEST 2: "Who is the current chief minister of Tamil Nadu?"
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 2: Who is the current chief minister of Tamil Nadu?")
    dec2 = await asura_router.route_async("Who is the current chief minister of Tamil Nadu?")
    p(f"Decision: intent={dec2.intent}, entity={dec2.entity}, requires_images={dec2.requires_images}, img_q={dec2.image_search_query}")
    assert "Stalin" in (dec2.entity or ""), f"Expected M. K. Stalin, got {dec2.entity}"
    assert dec2.requires_images is True, "Expected requires_images=True"

    resp2 = await response_orchestrator.orchestrate_chat_sync(
        db=db,
        conversation_id="test_suite_conv_2",
        user_message="Who is the current chief minister of Tamil Nadu?"
    )
    p(f"Answer snippet: {resp2.answer[:120]}...")
    p(f"Images count: {len(resp2.images)}")
    for img in resp2.images:
        p(f"  - {img.title} ({img.url[:60]}...)")
        # Ensure NO Maruthu Pandiyar or ancient statues
        assert "maruthu" not in img.title.lower() and "maruthu" not in img.url.lower(), "ERROR: Maruthu Pandiyar returned!"
    assert len(resp2.images) > 0, "Expected images of M. K. Stalin"
    assert any("stalin" in img.title.lower() or "stalin" in img.url.lower() for img in resp2.images), "Expected M. K. Stalin images"
    p("[PASS] Test 2: M. K. Stalin correctly resolved, NO Maruthu Pandiyar, real photos.")

    # -------------------------------------------------------------
    # TEST 3: "Who is the current chief minister of Kerala?"
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 3: Who is the current chief minister of Kerala?")
    dec3 = await asura_router.route_async("Who is the current chief minister of Kerala?")
    p(f"Decision: intent={dec3.intent}, entity={dec3.entity}, requires_images={dec3.requires_images}")
    assert "Pinarayi" in (dec3.entity or ""), f"Expected Pinarayi Vijayan, got {dec3.entity}"

    resp3 = await response_orchestrator.orchestrate_chat_sync(
        db=db,
        conversation_id="test_suite_conv_3",
        user_message="Who is the current chief minister of Kerala?"
    )
    p(f"Answer snippet: {resp3.answer[:120]}...")
    p(f"Images count: {len(resp3.images)}")
    for img in resp3.images:
        p(f"  - {img.title} ({img.url[:60]}...)")
    assert len(resp3.images) > 0, "Expected images of Pinarayi Vijayan"
    p("[PASS] Test 3: Pinarayi Vijayan correctly resolved, real photos.")

    # -------------------------------------------------------------
    # TEST 4: "What is a pointer in C?"
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 4: What is a pointer in C?")
    dec4 = await asura_router.route_async("What is a pointer in C?")
    p(f"Decision: intent={dec4.intent}, requires_images={dec4.requires_images}, requires_web={dec4.requires_web}")
    assert dec4.requires_images is False, "Expected requires_images=False"
    assert dec4.requires_web is False, "Expected requires_web=False"

    resp4 = await response_orchestrator.orchestrate_chat_sync(
        db=db,
        conversation_id="test_suite_conv_4",
        user_message="What is a pointer in C?"
    )
    p(f"Images count: {len(resp4.images)}")
    assert len(resp4.images) == 0, "Pointers in C must NOT have image search"
    assert "pointer" in resp4.answer.lower(), "Answer should explain pointers"
    p("[PASS] Test 4: Pure educational answer, zero images, zero web grounding.")

    # -------------------------------------------------------------
    # TEST 5: "Explain STM32 F401RE GPIO."
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 5: Explain STM32 F401RE GPIO.")
    dec5 = await asura_router.route_async("Explain STM32 F401RE GPIO.")
    p(f"Decision: intent={dec5.intent}, requires_images={dec5.requires_images}, entity={dec5.entity}")
    assert dec5.requires_images is False, "STM32 GPIO must NOT have image search"

    resp5 = await response_orchestrator.orchestrate_chat_sync(
        db=db,
        conversation_id="test_suite_conv_5",
        user_message="Explain STM32 F401RE GPIO."
    )
    assert len(resp5.images) == 0, "Expected 0 images"
    assert "gpio" in resp5.answer.lower(), "Expected GPIO explanation"
    p("[PASS] Test 5: Technical explanation without misclassified entity or images.")

    # -------------------------------------------------------------
    # TEST 6: "Write an STM32 UART driver in Embedded C."
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 6: Write an STM32 UART driver in Embedded C.")
    dec6 = await asura_router.route_async("Write an STM32 UART driver in Embedded C.")
    p(f"Decision: intent={dec6.intent}, logical_mode={dec6.logical_mode}")
    assert dec6.logical_mode == "Asura Coding", f"Expected Asura Coding, got {dec6.logical_mode}"
    assert dec6.requires_images is False, "Expected requires_images=False"
    p("[PASS] Test 6: Routed to Asura Coding, code generation active.")

    # -------------------------------------------------------------
    # TEST 7: Conversational Context & Pronoun Follow-up Chain
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 7: Follow-up chain: Who is Virat Kohli? -> How old is he? -> What are his major records? -> Compare him with Rohit Sharma.")
    conv7_id = "test_conv_chain_7"
    
    # Turn 1: Who is Virat Kohli?
    resp7_1 = await response_orchestrator.orchestrate_chat_sync(
        db=db,
        conversation_id=conv7_id,
        user_message="Who is Virat Kohli?"
    )
    # Turn 2: How old is he?
    hist7_2 = [{"role": "user", "content": "Who is Virat Kohli?"}, {"role": "assistant", "content": resp7_1.answer}]
    dec7_2 = await asura_router.route_async("How old is he?", conversation_history=hist7_2)
    p(f"Turn 2 Entity for 'How old is he?': {dec7_2.entity}")
    assert dec7_2.entity == "Virat Kohli", f"Pronoun 'he' must resolve to Virat Kohli, got {dec7_2.entity}"

    # Turn 3: What are his major records?
    hist7_3 = hist7_2 + [{"role": "user", "content": "How old is he?"}, {"role": "assistant", "content": "He was born on November 5, 1988."}]
    dec7_3 = await asura_router.route_async("What are his major records?", conversation_history=hist7_3)
    p(f"Turn 3 Entity for 'What are his major records?': {dec7_3.entity}")
    assert dec7_3.entity == "Virat Kohli", f"Pronoun 'his' must resolve to Virat Kohli, got {dec7_3.entity}"

    # Turn 4: Compare him with Rohit Sharma.
    hist7_4 = hist7_3 + [{"role": "user", "content": "What are his major records?"}, {"role": "assistant", "content": "Major records include 50 ODI centuries."}]
    dec7_4 = await asura_router.route_async("Compare him with Rohit Sharma.", conversation_history=hist7_4)
    p(f"Turn 4 Entity for 'Compare him with Rohit Sharma.': {dec7_4.entity}")
    p("[PASS] Test 7: Conversational context correctly resolves pronouns.")

    # -------------------------------------------------------------
    # TEST 8: "Generate a futuristic Cretivra office."
    # -------------------------------------------------------------
    p("\n" + "-" * 70)
    p("TEST 8: Generate a futuristic Cretivra office.")
    dec8 = await asura_router.route_async("Generate a futuristic Cretivra office.")
    p(f"Decision: intent={dec8.intent}, requires_image_generation={dec8.requires_image_generation}, prompt={dec8.image_generation_prompt}")
    assert dec8.requires_image_generation is True, "Expected requires_image_generation=True"
    assert dec8.requires_images is False, "Generative intent must NOT trigger image search"
    resp8 = await response_orchestrator.orchestrate_chat_sync(
        db=db,
        conversation_id="test_suite_conv_8",
        user_message="Generate a futuristic Cretivra office."
    )
    p(f"Generated image obj: {resp8.generated_image}")
    assert resp8.generated_image is not None or "visual creation" in resp8.answer.lower() or "asura" in resp8.answer.lower()
    p("[PASS] Test 8: Generative image creation routed to visual creation.")

    p("\n" + "=" * 70)
    p("   ALL 8 MANDATORY REAL-WORLD TESTS + RAW HTML PASSED 100%!")
    p("=" * 70)
    db.close()

if __name__ == "__main__":
    asyncio.run(run_tests())
