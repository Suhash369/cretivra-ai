import sys
import os
import asyncio

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.router import is_anaphoric_follow_up, query_router
from app.core.entity import entity_detector

def test_elon_musk_sequence():
    print("==================================================")
    print("TEST: ELON MUSK MULTI-TURN FOLLOW-UP SEQUENCE")
    print("==================================================")
    conv = []

    # Turn 1: Who is Elon Musk?
    q1 = "Who is Elon Musk?"
    assert not is_anaphoric_follow_up(q1), f"Turn 1 should not be anaphoric follow-up"
    r1 = query_router(q1, conversation_history=conv)
    assert r1.get("entity") == "Elon Musk", f"Turn 1 entity expected 'Elon Musk', got {r1.get('entity')}"
    assert r1.get("requires_images") is True
    assert r1.get("image_search_query") == "Elon Musk"
    print(f"✓ Turn 1 '{q1}': entity={r1.get('entity')}, intent={r1.get('intent')}, image_q={r1.get('image_search_query')}")

    conv.append({"role": "user", "content": q1})
    conv.append({"role": "assistant", "content": "## Elon Musk\n**Elon Musk** is a visionary technology entrepreneur, investor, and engineer. He is the CEO and Chief Engineer of SpaceX and CEO of Tesla."})

    # Turn 2: When was he born?
    q2 = "When was he born?"
    assert is_anaphoric_follow_up(q2), f"Turn 2 '{q2}' should be anaphoric follow-up"
    r2 = query_router(q2, conversation_history=conv)
    assert r2.get("is_follow_up") is True
    assert r2.get("entity") == "Elon Musk", f"Turn 2 entity expected 'Elon Musk', got {r2.get('entity')}"
    assert r2.get("requires_web") is True
    assert r2.get("requires_images") is True
    assert r2.get("image_search_query") == "Elon Musk"
    assert "date of birth" in r2.get("search_query") or "born" in r2.get("search_query")
    print(f"✓ Turn 2 '{q2}': entity={r2.get('entity')}, search_q={r2.get('search_query')}, image_q={r2.get('image_search_query')}")

    conv.append({"role": "user", "content": q2})
    conv.append({"role": "assistant", "content": "## Birth Date\n**June 28, 1971**\nElon Musk was born on June 28, 1971 in Pretoria, South Africa."})

    # Turn 3: How old is he?
    q3 = "How old is he?"
    assert is_anaphoric_follow_up(q3), f"Turn 3 '{q3}' should be anaphoric follow-up"
    r3 = query_router(q3, conversation_history=conv)
    assert r3.get("is_follow_up") is True
    assert r3.get("entity") == "Elon Musk", f"Turn 3 entity expected 'Elon Musk', got {r3.get('entity')}"
    assert r3.get("requires_web") is True
    assert r3.get("requires_images") is True
    assert r3.get("image_search_query") == "Elon Musk"
    assert "age" in r3.get("search_query")
    print(f"✓ Turn 3 '{q3}': entity={r3.get('entity')}, search_q={r3.get('search_query')}, image_q={r3.get('image_search_query')}")

    conv.append({"role": "user", "content": q3})
    conv.append({"role": "assistant", "content": "## Current Age\n**55 years old**\nAs of 2026, Elon Musk is 55 years old."})

    # Turn 4: What companies does he lead?
    q4 = "What companies does he lead?"
    assert is_anaphoric_follow_up(q4), f"Turn 4 '{q4}' should be anaphoric follow-up"
    r4 = query_router(q4, conversation_history=conv)
    assert r4.get("is_follow_up") is True
    assert r4.get("entity") == "Elon Musk", f"Turn 4 entity expected 'Elon Musk', got {r4.get('entity')}"
    assert r4.get("requires_web") is True
    assert r4.get("requires_images") is True
    assert r4.get("image_search_query") == "Elon Musk"
    assert any(term in r4.get("search_query") for term in ["companies", "lead", "founded", "CEO"])
    print(f"✓ Turn 4 '{q4}': entity={r4.get('entity')}, search_q={r4.get('search_query')}, image_q={r4.get('image_search_query')}")

def test_kerala_cm_sequence():
    print("\n==================================================")
    print("TEST: KERALA CM MULTI-TURN FOLLOW-UP SEQUENCE")
    print("==================================================")
    conv = []

    # Turn 1: who is cm of kerala now
    q1 = "who is cm of kerala now"
    r1 = query_router(q1, conversation_history=conv)
    assert r1.get("requires_web") is True
    assert r1.get("requires_images") is True
    print(f"✓ Turn 1 '{q1}': intent={r1.get('intent')}, web={r1.get('requires_web')}")

    conv.append({"role": "user", "content": q1})
    conv.append({"role": "assistant", "content": "## Chief Minister of Kerala\n**V. D. Satheesan**\nAs of October 2026, V. D. Satheesan serves as the Chief Minister of Kerala."})

    # Turn 2: date of birth of him
    q2 = "date of birth of him"
    assert is_anaphoric_follow_up(q2), f"Turn 2 '{q2}' should be anaphoric follow-up"
    r2 = query_router(q2, conversation_history=conv)
    assert r2.get("is_follow_up") is True
    assert r2.get("entity") == "V. D. Satheesan", f"Turn 2 entity expected 'V. D. Satheesan', got {r2.get('entity')}"
    assert r2.get("requires_web") is True
    assert r2.get("requires_images") is True
    assert r2.get("image_search_query") == "V. D. Satheesan"
    assert "date of birth" in r2.get("search_query") or "born" in r2.get("search_query")
    print(f"✓ Turn 2 '{q2}': entity={r2.get('entity')}, search_q={r2.get('search_query')}, image_q={r2.get('image_search_query')}")

def test_asian_games_sequence():
    print("\n==================================================")
    print("TEST: ASIAN GAMES MULTI-TURN FOLLOW-UP SEQUENCE")
    print("==================================================")
    conv = []

    # Turn 1: when will asian games close
    q1 = "when will asian games close"
    r1 = query_router(q1, conversation_history=conv)
    print(f"✓ Turn 1 '{q1}': entity={r1.get('entity')}")

    conv.append({"role": "user", "content": q1})
    conv.append({"role": "assistant", "content": "## 2026 Asian Games Closing Ceremony\n**October 4, 2026**\nThe 2026 Asian Games in Aichi-Nagoya, Japan will close on October 4, 2026."})

    # Turn 2: where it is conducted
    q2 = "where it is conducted"
    assert is_anaphoric_follow_up(q2), f"Turn 2 '{q2}' should be anaphoric follow-up"
    r2 = query_router(q2, conversation_history=conv)
    assert r2.get("is_follow_up") is True
    assert "Asian Games" in (r2.get("entity") or "")
    assert r2.get("requires_web") is True
    assert r2.get("requires_images") is True
    assert "venue" in r2.get("search_query") or "host" in r2.get("search_query") or "where" in r2.get("search_query")
    print(f"✓ Turn 2 '{q2}': entity={r2.get('entity')}, search_q={r2.get('search_query')}, image_q={r2.get('image_search_query')}")

if __name__ == "__main__":
    test_elon_musk_sequence()
    test_kerala_cm_sequence()
    test_asian_games_sequence()
    print("\n==================================================")
    print("ALL MULTI-TURN FOLLOW-UP TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")
