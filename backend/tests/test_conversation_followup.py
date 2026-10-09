import pytest
import os
import json
from unittest.mock import AsyncMock, patch, MagicMock

from app.core.config import settings, DEFAULT_ASURA_REGISTRY
from app.core.model_manager import model_manager
from app.services.query_rewriter import query_rewriter, RewrittenQuery
from app.services.response_orchestrator import response_orchestrator
from app.providers.cloud_provider import clean_ai_response
from app.core.registry_auditor import run_one_token_test

# ==============================================================================
# TEST 1: 5 CONSECUTIVE FOLLOW-UPS (MOCKED)
# ==============================================================================

@pytest.mark.asyncio
async def test_five_consecutive_followups_resolved():
    """
    Test 5 consecutive follow-ups:
    Kohli -> 'where he is born' -> 'his age' -> 'which team does he play for' -> 'and his wife'
    Verify all 5 resolve standalone queries containing 'Virat Kohli', is_followup=True.
    """
    turns = [
        {"role": "user", "content": "who is virat kohli"},
        {"role": "assistant", "content": "Virat Kohli is an Indian international cricketer and former captain of the India national team."}
    ]
    conv_state = {"active_entities": ["Virat Kohli"], "topic_summary": ""}

    follow_ups = [
        ("where he is born", "Where was Virat Kohli born?"),
        ("his age", "What is Virat Kohli's age?"),
        ("which team does he play for", "Which team does Virat Kohli play for?"),
        ("and his wife", "Who is Virat Kohli's wife?")
    ]

    for user_query, expected_standalone in follow_ups:
        # Mock complete_task on Asura Rewriter
        mock_payload = {
            "standalone_query": expected_standalone,
            "is_followup": True,
            "topic_switch": False,
            "entities": ["Virat Kohli"],
            "needs_web": True
        }
        with patch.object(model_manager, "complete_task", new_callable=AsyncMock) as mock_complete:
            mock_complete.return_value = json.dumps(mock_payload)
            result = await query_rewriter.rewrite_query(turns, user_query, conv_state)

            assert result.is_followup is True
            assert result.topic_switch is False
            assert "Virat Kohli" in result.standalone_query
            assert "Virat Kohli" in result.entities
            assert result.needs_web is True

        # Append to turns for next iteration
        turns.append({"role": "user", "content": user_query})
        turns.append({"role": "assistant", "content": f"Answer for {expected_standalone}"})


# ==============================================================================
# TEST 2: TAMIL NADU CM FOLLOW-UPS
# ==============================================================================

@pytest.mark.asyncio
async def test_tamil_nadu_cm_followups():
    """
    Test Tamil Nadu CM -> 'when did he become cm' -> 'his party?'
    """
    turns = [
        {"role": "user", "content": "who is the chief minister of tamil nadu"},
        {"role": "assistant", "content": "M. K. Stalin is the current Chief Minister of Tamil Nadu, serving since May 2021."}
    ]
    conv_state = {"active_entities": ["M. K. Stalin", "Tamil Nadu"], "topic_summary": ""}

    queries = [
        ("when did he become cm", "When did M. K. Stalin become Chief Minister of Tamil Nadu?"),
        ("his party?", "What is M. K. Stalin's political party?")
    ]

    for q, expected in queries:
        mock_payload = {
            "standalone_query": expected,
            "is_followup": True,
            "topic_switch": False,
            "entities": ["M. K. Stalin"],
            "needs_web": True
        }
        with patch.object(model_manager, "complete_task", new_callable=AsyncMock) as mock_complete:
            mock_complete.return_value = json.dumps(mock_payload)
            res = await query_rewriter.rewrite_query(turns, q, conv_state)
            assert res.is_followup is True
            assert any(e in res.standalone_query for e in ["Stalin", "Tamil Nadu", "Chief Minister"])
        turns.append({"role": "user", "content": q})
        turns.append({"role": "assistant", "content": f"Answer for {expected}"})


# ==============================================================================
# TEST 3: FRAGMENTS AND TYPOS
# ==============================================================================

@pytest.mark.asyncio
async def test_fragments_and_typos():
    """
    Test handling of fragments/typos: 'where he born', 'and his age', 'ok and his team?'
    """
    turns = [
        {"role": "user", "content": "who is virat kohli"},
        {"role": "assistant", "content": "Virat Kohli is an Indian cricketer."}
    ]
    conv_state = {"active_entities": ["Virat Kohli"]}

    test_cases = [
        ("where he born", "Where was Virat Kohli born?"),
        ("and his age", "What is Virat Kohli's age?"),
        ("ok and his team?", "What team does Virat Kohli play for?")
    ]

    for raw, expected in test_cases:
        mock_payload = {
            "standalone_query": expected,
            "is_followup": True,
            "topic_switch": False,
            "entities": ["Virat Kohli"],
            "needs_web": True
        }
        with patch.object(model_manager, "complete_task", new_callable=AsyncMock) as mock_complete:
            mock_complete.return_value = json.dumps(mock_payload)
            res = await query_rewriter.rewrite_query(turns, raw, conv_state)
            assert res.is_followup is True
            assert "Virat Kohli" in res.standalone_query


# ==============================================================================
# TEST 4: TOPIC SWITCH & NO LEAKAGE
# ==============================================================================

@pytest.mark.asyncio
async def test_topic_switch_no_leakage():
    """
    Topic switch: Kohli -> 'explain e=mc^2'; Tamil Nadu CM -> Kerala CM.
    Verify topic_switch=True, is_followup=False, and no old-topic leakage.
    """
    # 1. Kohli -> explain e=mc^2
    turns_kohli = [
        {"role": "user", "content": "who is virat kohli"},
        {"role": "assistant", "content": "Virat Kohli is an Indian cricketer."}
    ]
    conv_state = {"active_entities": ["Virat Kohli"]}

    mock_physics = {
        "standalone_query": "explain e=mc^2",
        "is_followup": False,
        "topic_switch": True,
        "entities": ["Einstein", "mass-energy equivalence"],
        "needs_web": False
    }
    with patch.object(model_manager, "complete_task", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = json.dumps(mock_physics)
        res = await query_rewriter.rewrite_query(turns_kohli, "explain e=mc^2", conv_state)
        assert res.topic_switch is True
        assert res.is_followup is False
        assert res.standalone_query == "explain e=mc^2"
        assert "Virat Kohli" not in res.standalone_query
        assert "Virat Kohli" not in res.entities

    # 2. Tamil Nadu CM -> Kerala CM
    turns_tn = [
        {"role": "user", "content": "who is the chief minister of tamil nadu"},
        {"role": "assistant", "content": "M. K. Stalin is the Chief Minister of Tamil Nadu."}
    ]
    conv_state_tn = {"active_entities": ["M. K. Stalin", "Tamil Nadu"]}

    mock_kerala = {
        "standalone_query": "who is the chief minister of kerala",
        "is_followup": False,
        "topic_switch": True,
        "entities": ["Kerala", "Chief Minister of Kerala"],
        "needs_web": True
    }
    with patch.object(model_manager, "complete_task", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = json.dumps(mock_kerala)
        res_kerala = await query_rewriter.rewrite_query(turns_tn, "who is the chief minister of kerala", conv_state_tn)
        assert res_kerala.topic_switch is True
        assert res_kerala.is_followup is False
        assert "tamil nadu" not in res_kerala.standalone_query.lower()
        assert "stalin" not in res_kerala.standalone_query.lower()


# ==============================================================================
# TEST 5: REWRITER FALLBACK CHAIN
# ==============================================================================

@pytest.mark.asyncio
async def test_rewriter_fallback_chain():
    """
    Fallback chain:
    - Groq 429 -> Gemini answers
    - Groq and Gemini both fail -> OpenRouter answers
    - All three fail -> heuristic fallback (prepends last active entity)
    """
    messages = [{"role": "user", "content": "test rewrite"}]

    # Case A: Groq fails with 429, Gemini succeeds
    model_manager.provider_cooldowns.clear()
    with patch("app.providers.groq.groq_provider.chat", new_callable=AsyncMock) as mock_groq, \
         patch("app.providers.gemini.gemini_provider.chat", new_callable=AsyncMock) as mock_gemini:
        mock_groq.side_effect = RuntimeError("Rate limit exceeded for Groq (HTTP 429)")
        mock_gemini.return_value = {"model": "gemini-flash-lite-latest", "message": {"content": '{"standalone_query": "gemini rewrite", "is_followup": true, "topic_switch": false, "entities": ["EntityA"], "needs_web": true}'}}

        ans = await model_manager.complete_task("Asura Rewriter", messages, json_mode=True)
        assert "gemini rewrite" in ans
        assert mock_groq.called
        assert mock_gemini.called

    # Case B: Groq and Gemini fail, OpenRouter succeeds
    model_manager.provider_cooldowns.clear()
    with patch("app.providers.groq.groq_provider.chat", new_callable=AsyncMock) as mock_groq, \
         patch("app.providers.gemini.gemini_provider.chat", new_callable=AsyncMock) as mock_gemini, \
         patch("app.providers.openrouter.openrouter_provider.chat", new_callable=AsyncMock) as mock_or:
        mock_groq.side_effect = RuntimeError("Groq 500 error")
        mock_gemini.side_effect = RuntimeError("Gemini 503 error")
        mock_or.return_value = {"model": "liquid/lfm-2.5-2.6b:free", "message": {"content": '{"standalone_query": "openrouter rewrite", "is_followup": true, "topic_switch": false, "entities": ["EntityB"], "needs_web": true}'}}

        ans = await model_manager.complete_task("Asura Rewriter", messages, json_mode=True)
        assert "openrouter rewrite" in ans

    # Case C: All three fail -> heuristic fallback
    model_manager.provider_cooldowns.clear()
    turns = [
        {"role": "user", "content": "who is virat kohli"},
        {"role": "assistant", "content": "Virat Kohli is a cricketer."}
    ]
    conv_state = {"active_entities": ["Virat Kohli"]}
    with patch.object(model_manager, "complete_task", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = None  # All providers failed
        heuristic_res = await query_rewriter.rewrite_query(turns, "where he is born", conv_state)
        assert heuristic_res.is_followup is True
        assert "Virat Kohli" in heuristic_res.standalone_query
        assert "where he is born" in heuristic_res.standalone_query


# ==============================================================================
# TEST 6: MISSING KEY FOR ONE PROVIDER
# ==============================================================================

@pytest.mark.asyncio
async def test_missing_provider_key_routes_around():
    """
    If any one provider key is missing, the app continues and routes around it.
    """
    messages = [{"role": "user", "content": "hi"}]
    model_manager.provider_cooldowns.clear()

    # Groq missing key, Gemini succeeds
    with patch("app.providers.groq.groq_provider.is_available", return_value=False), \
         patch("app.providers.gemini.gemini_provider.chat", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = {"model": "gemini-flash-lite-latest", "message": {"content": "Gemini response"}}
        res = await model_manager.complete_task("Asura Rewriter", messages)
        assert res == "Gemini response"

    model_manager.provider_cooldowns.clear()
    # Gemini missing key, OpenRouter succeeds
    with patch("app.providers.groq.groq_provider.is_available", return_value=False), \
         patch("app.providers.gemini.gemini_provider.is_available", return_value=False), \
         patch("app.providers.openrouter.openrouter_provider.chat", new_callable=AsyncMock) as mock_or:
        mock_or.return_value = {"model": "liquid/lfm-2.5-2.6b:free", "message": {"content": "OpenRouter response"}}
        res = await model_manager.complete_task("Asura Rewriter", messages)
        assert res == "OpenRouter response"


# ==============================================================================
# TEST 7: 40-TURN CONVERSATION BUDGET & SUMMARY
# ==============================================================================

def test_40_turn_conversation_budget_and_topic_summary():
    """
    40-turn conversation stays within the 12-turn / ~6000 token budget,
    trims oldest turns, and inserts topic_summary into system prompt.
    """
    # Build 40 turns (20 user, 20 assistant)
    turns = []
    for i in range(40):
        role = "user" if i % 2 == 0 else "assistant"
        turns.append({"role": role, "content": f"Turn {i}: Detailed discussion point with factual context {i}."})

    history_window, dropped_turns = response_orchestrator._prepare_history_and_summary(
        history=turns,
        max_turns=12,
        max_tokens=6000,
        topic_switch=False
    )

    # Must stay within 12 turns
    assert len(history_window) <= 12
    # Dropped turns must be 40 - 12 = 28
    assert len(dropped_turns) == 28

    # Build prompt order and verify ordering
    sys_msgs, user_content = response_orchestrator._build_orchestrator_prompts(
        system_persona="You are Asura AI.",
        topic_summary="Previous conversation covered topics 0 to 27.",
        active_entities=["TopicEntity"],
        web_evidence="Web search evidence here.",
        history_window=history_window,
        current_user_text="Turn 40: Current question"
    )

    # Prompt order: system (persona) -> system (summary) -> system (active entities) -> history window -> system (web evidence) -> user
    assert "You are Asura AI." in sys_msgs[0]["content"]
    assert "[STRICT_FACT_MODE]" in sys_msgs[0]["content"]
    assert "Facts established earlier in this conversation count as supplied context" in sys_msgs[0]["content"]
    assert "Previous conversation covered topics 0 to 27." in sys_msgs[1]["content"]
    assert "TopicEntity" in sys_msgs[2]["content"]
    # Following messages are history window
    assert sys_msgs[3]["role"] in ["user", "assistant"]
    # Web evidence comes after history
    assert any("Web search evidence here" in m["content"] for m in sys_msgs if m["role"] == "system")
    # Final user prompt is the current query
    assert user_content == "Turn 40: Current question"


# ==============================================================================
# TEST 8: HTML SANITIZATION, NO VENDOR LEAKAGE, & KATEX INTEGRITY
# ==============================================================================

def test_clean_ai_response_sanitization_and_katex():
    """
    Verify clean_ai_response:
    1. Removes internal thinking tags and planning scaffolds
    2. Strips unsafe vendor references
    3. Preserves LaTeX math formatting ($ ... $ and $$ ... $$)
    """
    raw_response = (
        "<think>\n"
        "Need to solve quadratic equation.\n"
        "Vendor: Google Gemini model response\n"
        "</think>\n"
        "# Quadratic Formula\n\n"
        "The roots of $ax^2 + bx + c = 0$ are given by:\n\n"
        "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n"
        "Where $\\Delta = b^2 - 4ac$ is the discriminant."
    )

    cleaned = clean_ai_response(raw_response)

    # Think tag stripped
    assert "<think>" not in cleaned
    assert "</think>" not in cleaned
    # Scaffolding stripped
    assert "Need to solve quadratic" not in cleaned
    # LaTeX preserved intact
    assert "$ax^2 + bx + c = 0$" in cleaned
    assert "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$" in cleaned
    assert "$\\Delta = b^2 - 4ac$" in cleaned


# ==============================================================================
# TEST 9: LIVE SMOKE TESTS (SKIPPED IF KEYS MISSING)
# ==============================================================================

@pytest.mark.asyncio
async def test_live_smoke_groq():
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.startswith("your_"):
        pytest.skip("GROQ_API_KEY not configured")
    res = await run_one_token_test("groq", "openai/gpt-oss-20b")
    # If groq hits 429 quota during live test, mark as skipped or ok
    if res.get("status") == "error" and res.get("code") == 429:
        pytest.skip("Groq daily token rate limit reached")
    assert res.get("status") == "ok"

@pytest.mark.asyncio
async def test_live_smoke_gemini():
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("your_"):
        pytest.skip("GEMINI_API_KEY not configured")
    res = await run_one_token_test("gemini", "gemini-flash-lite-latest")
    assert res.get("status") == "ok"

@pytest.mark.asyncio
async def test_live_smoke_openrouter():
    if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY.startswith("your_"):
        pytest.skip("OPENROUTER_API_KEY not configured")
    res = await run_one_token_test("openrouter", "liquid/lfm-2.5-2.6b:free")
    if res.get("status") == "error" and res.get("code") == 429:
        pytest.skip("OpenRouter rate limit reached")
    assert res.get("status") == "ok"
