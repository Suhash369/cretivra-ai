import os
import sys
import asyncio
from unittest.mock import patch, MagicMock

# Set UTF-8 encoding for stdout on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.router import asura_router
from app.core.model_manager import model_manager
from app.services.response_orchestrator import response_orchestrator
from app.database.database import SessionLocal
from app.providers.image_search import image_search_provider
from app.providers.image_generation import image_generation_provider
from app.providers.speech_to_text import stt_provider
from app.providers.text_to_speech import tts_provider
from app.services.web_grounding import web_grounding_service

async def run_extended_tests():
    db = SessionLocal()
    print("=" * 60)
    print("STARTING CRETIVRA ASURA EXTENDED TEST SUITE")
    print("=" * 60)

    # TEST 7: Vision analysis (with a mock/sample base64 image)
    print("\n[TEST 7] Upload circuit diagram: 'Explain this circuit.'")
    sample_img_attachment = [{
        "filename": "stm32_circuit.png",
        "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }]
    dec7 = asura_router.route(
        query="Explain this STM32 microcontroller circuit diagram.",
        attachments=sample_img_attachment
    )
    print(f"  Intent: {dec7.intent}")
    print(f"  Requires Vision: {dec7.requires_vision}")
    print(f"  Logical Mode: {dec7.logical_mode}")
    assert dec7.requires_vision is True, "Expected requires_vision to be True"
    assert dec7.logical_mode in ["Asura Vision", "asura-vision"], "Expected logical_mode to be Asura Vision"
    print("  PASS: TEST 7 correctly routed to Asura Vision.")

    # TEST 8: Voice Conversation: STT / Prompt -> Voice Service -> LLM Spoken Response
    print("\n[TEST 8] Voice Pipeline: Spoken Prompt -> Voice Service -> LLM Spoken Response")
    from app.services.voice_service import voice_service
    spoken_reply = await voice_service.generate_voice_reply("Hello Asura, what AI are you?")
    print(f"  Spoken reply generated: '{spoken_reply}'")
    assert len(spoken_reply) > 0, "Spoken response must be generated"
    assert "Asura" in spoken_reply or "Cretivra" in spoken_reply, "Must reflect Asura identity"
    print("  PASS: TEST 8 Voice pipeline generated branded conversational reply.")

    # TEST 10: Disable web search -> Reports cannot verify current facts, chat continues
    print("\n[TEST 10] Disable Web Search on current-info request")
    with patch.object(settings, 'WEB_SEARCH_ENABLED', False):
        dec10 = asura_router.route("What is the current price of iPhone?")
        assert dec10.requires_web is False, "Web search should be disabled when setting is False"
        print(f"  Requires web with setting False: {dec10.requires_web}")
        res10 = await response_orchestrator.orchestrate_chat_sync(
            db=db,
            user_message="What is the current stock price of Apple today?",
            conversation_id=None
        )
        print(f"  Web grounded: {res10.web_grounded}")
        print(f"  Answer received: {len(res10.answer)} chars")
        assert res10.web_grounded is False, "Expected web_grounded to be False"
        assert len(res10.answer) > 0, "Chat response must remain functional"
        print("  PASS: TEST 10 Clean fallback when web search disabled.")

    # TEST 11: Disable local AI / Provider fallback
    print("\n[TEST 11] Provider Fallback: Local AI unavailable -> Cloud Fallback")
    with patch.object(settings, 'ENABLE_MOCK_OLLAMA', False):
        # Even if Ollama is not running on localhost, model_manager falls back to Groq / Gemini / OpenRouter
        chunks = []
        async for c in model_manager.stream_orchestrated_chat(
            logical_mode="asura-fast",
            messages=[{"role": "user", "content": "Reply with 'ASURA_ONLINE'"}]
        ):
            chunks.append(c.get("content", ""))
        full_res11 = "".join(chunks)
        print(f"  Response with fallback: {full_res11[:40]}...")
        assert len(full_res11) > 0, "Fallback provider returned response"
        print("  PASS: TEST 11 Provider fallback works seamlessly.")

    # TEST 12: Image search failure -> Answer still appears, images empty
    print("\n[TEST 12] Image search failure handling")
    with patch.object(image_search_provider, 'search', side_effect=Exception("Simulated search timeout")):
        res12 = await response_orchestrator.orchestrate_chat_sync(
            db=db,
            user_message="Who is Roger Federer?",
            conversation_id=None
        )
        print(f"  Images returned on error: {len(res12.images)}")
        print(f"  Answer received: {len(res12.answer)} chars")
        assert len(res12.images) == 0, "Images should be empty on failure"
        assert len(res12.answer) > 0, "Answer must not crash on image search failure"
        print("  PASS: TEST 12 Graceful image search failure handled.")

    # TEST 13: Image generation failure -> Text response remains available
    print("\n[TEST 13] Image generation failure handling")
    with patch.object(image_generation_provider, 'generate', side_effect=Exception("Simulated quota exceeded")):
        res13 = await response_orchestrator.orchestrate_chat_sync(
            db=db,
            user_message="Generate a futuristic flying train in Tokyo",
            conversation_id=None
        )
        print(f"  Answer received: {res13.answer}")
        print(f"  Generated Image: {res13.generated_image}")
        assert "Asura couldn't generate the image right now" in res13.answer, "Clean Asura error message displayed"
        print("  PASS: TEST 13 Image generation failure reported cleanly.")

    # TEST 14: Voice Failure Handling -> Text chat remains fully functional
    print("\n[TEST 14] Voice failure -> Text chat remains fully functional")
    with patch.object(tts_provider, 'synthesize', return_value=None):
        chat_res14 = await response_orchestrator.orchestrate_chat_sync(
            db=db,
            user_message="Hello Asura",
            conversation_id=None
        )
        assert len(chat_res14.answer) > 0, "Text chat must remain functional even if voice/TTS returns None"
        print("  PASS: TEST 14 Text chat fully functional during voice service fallback.")

    print("\n" + "=" * 60)
    print("ALL EXTENDED TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)
    db.close()

if __name__ == "__main__":
    asyncio.run(run_extended_tests())
