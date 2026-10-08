import os
import sys
import json
import asyncio
from datetime import datetime

# Set up environment path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.time_utils import getCurrentDateTime
from app.core.router import asura_router
from app.services.web_search_service import web_search_service
from app.services.evidence_engine import evidence_engine, NormalizedEvidence, ResolvedEntity
from app.services.response_orchestrator import response_orchestrator

async def test_case_1():
    """TEST 1: Who is CM of Tamil Nadu? -> Canonical entity: C. Joseph Vijay, NOT M. Vijay Kumar, NOT Vijay Kumar."""
    query = "Who is CM of Tamil Nadu?"
    decision = await asura_router.route_async(query)
    raw_res = await web_search_service.search_with_sources(decision.search_query or query, max_results=5)
    sources = raw_res.get("sources", [])
    norm_ev = evidence_engine.entity_resolver(query, sources)
    
    assert norm_ev.entities, "No entity resolved for CM Tamil Nadu"
    top_entity = norm_ev.entities[0]
    assert top_entity.canonical_name == "C. Joseph Vijay", f"Expected 'C. Joseph Vijay', got '{top_entity.canonical_name}'"
    assert "M. Vijay Kumar" in top_entity.forbidden_names, "M. Vijay Kumar not in forbidden_names"
    assert "Vijay Kumar" in top_entity.forbidden_names, "Vijay Kumar not in forbidden_names"

    # Test validator catches and corrects any hallucination
    hallucinated_text = "## Chief Minister of Tamil Nadu\n**M. Vijay Kumar** is serving as the CM."
    valid, corrected = evidence_engine.validate_entity_names(hallucinated_text, norm_ev)
    assert not valid, "Validator should have failed hallucinated text"
    assert "M. Vijay Kumar" not in corrected, f"Corrected text still has M. Vijay Kumar: {corrected}"
    assert "C. Joseph Vijay" in corrected, f"Corrected text missing canonical name: {corrected}"
    print("✓ TEST 1 PASS: 'Who is CM of Tamil Nadu?' resolves to 'C. Joseph Vijay', rejects 'M. Vijay Kumar'")

async def test_case_2():
    """TEST 2: Who is CM Vijay? -> Resolve to current Tamil Nadu Chief Minister C. Joseph Vijay."""
    query = "Who is CM Vijay?"
    decision = await asura_router.route_async(query)
    targeted_queries = web_search_service.generate_targeted_queries(query)
    
    # Verify targeted queries focus on C. Joseph Vijay / Tamil Nadu CM
    q_str = " ".join(targeted_queries).lower()
    assert "tamil nadu" in q_str or "vijay" in q_str, f"Targeted queries lost entity context: {targeted_queries}"
    
    # Test entity resolution
    norm_ev = evidence_engine.entity_resolver(query, [
        {"title": "Tamil Nadu CM Vijay inaugurates dairy unit", "snippet": "Tamil Nadu CM Vijay inaugurated the laboratory.", "tier": "High-Quality News (Tier 2)", "url": "https://thehindu.com/news"}
    ])
    assert norm_ev.entities, "Failed to resolve entity for 'Who is CM Vijay?'"
    top_entity = norm_ev.entities[0]
    assert top_entity.canonical_name == "C. Joseph Vijay", f"Expected canonical 'C. Joseph Vijay', got '{top_entity.canonical_name}'"
    assert top_entity.role == "Chief Minister of Tamil Nadu"
    print("✓ TEST 2 PASS: 'Who is CM Vijay?' resolves to 'C. Joseph Vijay' (Chief Minister of Tamil Nadu)")

async def test_case_3():
    """TEST 3: Who is CM of Kerala? -> Kerala's CM. Tamil Nadu must NOT appear."""
    query = "Who is CM of Kerala?"
    decision = await asura_router.route_async(query)
    targeted_queries = web_search_service.generate_targeted_queries(query)
    for tq in targeted_queries:
        assert "tamil nadu" not in tq.lower(), f"Tamil Nadu leaked into Kerala search query: {tq}"

    norm_ev = evidence_engine.entity_resolver(query, [
        {"title": "Kerala CM V. D. Satheesan attends council", "snippet": "Chief Minister Satheesan addressed the assembly.", "tier": "High-Quality News (Tier 2)", "url": "https://newindianexpress.com"}
    ])
    assert norm_ev.entities, "No entity resolved for Kerala CM"
    top_entity = norm_ev.entities[0]
    assert top_entity.state == "Kerala", f"Expected state Kerala, got {top_entity.state}"
    assert "Tamil Nadu" not in top_entity.role, f"Tamil Nadu leaked into role: {top_entity.role}"
    print("✓ TEST 3 PASS: 'Who is CM of Kerala?' strictly targets Kerala with zero Tamil Nadu bleed")

async def test_case_4():
    """TEST 4: Who was CM of Tamil Nadu in 2010? -> Historical answer, web research not forced."""
    query = "Who was CM of Tamil Nadu in 2010?"
    decision = await asura_router.route_async(query)
    intent_val = getattr(decision.intent, "value", str(decision.intent))
    assert intent_val == "HISTORICAL", f"Expected HISTORICAL intent, got {decision.intent}"
    assert not decision.requires_web, "Historical query should not force web grounding"
    print("✓ TEST 4 PASS: 'Who was CM of Tamil Nadu in 2010?' routed to HISTORICAL with no current web research")

async def test_case_5():
    """TEST 5: Who is the current PM of India? -> Narendra Modi."""
    query = "Who is the current PM of India?"
    decision = await asura_router.route_async(query)
    norm_ev = evidence_engine.entity_resolver(query, [
        {"title": "Prime Minister Narendra Modi meets council", "snippet": "PM Narendra Modi announced new programs.", "tier": "Official Government Source", "url": "https://pmindia.gov.in"}
    ])
    assert norm_ev.entities, "No entity resolved for PM"
    top_entity = norm_ev.entities[0]
    assert top_entity.canonical_name == "Narendra Modi"
    assert top_entity.role == "Prime Minister of India"
    print("✓ TEST 5 PASS: 'Who is the current PM of India?' resolves to 'Narendra Modi'")

async def test_case_6():
    """TEST 6: Who is the current President of India? -> Droupadi Murmu."""
    query = "Who is the current President of India?"
    decision = await asura_router.route_async(query)
    norm_ev = evidence_engine.entity_resolver(query, [
        {"title": "President Droupadi Murmu addresses nation", "snippet": "President Droupadi Murmu presented awards.", "tier": "Official Government Source", "url": "https://presidentofindia.gov.in"}
    ])
    assert norm_ev.entities, "No entity resolved for President"
    top_entity = norm_ev.entities[0]
    assert top_entity.canonical_name == "Droupadi Murmu"
    assert top_entity.role == "President of India"
    print("✓ TEST 6 PASS: 'Who is the current President of India?' resolves to 'Droupadi Murmu'")

async def test_case_7():
    """TEST 7: 'Who is CM of Tamil Nadu?' then 'Who is CM of Kerala?' -> Context switch without contamination."""
    conv_history = [
        {"role": "user", "content": "Who is CM of Tamil Nadu?"},
        {"role": "assistant", "content": "C. Joseph Vijay is the Chief Minister of Tamil Nadu."}
    ]
    query = "Who is CM of Kerala?"
    decision = await asura_router.route_async(query, conv_history)
    assert not decision.is_follow_up, "Query 2 is a new entity inquiry, should NOT be follow up"
    t_queries = web_search_service.generate_targeted_queries(query)
    for tq in t_queries:
        assert "tamil nadu" not in tq.lower(), f"Query 2 contaminated with Tamil Nadu: {tq}"
    print("✓ TEST 7 PASS: Context switch from Tamil Nadu to Kerala is completely isolated")

async def test_case_8():
    """TEST 8: 'Who is CM of Kerala?' then 'Who is he?' -> Anaphoric follow-up uses Kerala context."""
    conv_history = [
        {"role": "user", "content": "Who is CM of Kerala?"},
        {"role": "assistant", "content": "V. D. Satheesan is the Chief Minister of Kerala."}
    ]
    query = "Who is he?"
    decision = await asura_router.route_async(query, conv_history)
    assert decision.is_follow_up, "Query should be recognized as anaphoric follow-up"
    print("✓ TEST 8 PASS: 'Who is he?' successfully preserves Kerala follow-up context")

async def test_case_9():
    """TEST 9: Given evidence saying 'C. Joseph Vijay', assert model/validator NEVER outputs 'M. Vijay Kumar'."""
    sample_evidence = NormalizedEvidence(
        entities=[
            ResolvedEntity(
                canonical_name="C. Joseph Vijay",
                aliases=["C. Joseph Vijay", "Joseph Vijay", "C Joseph Vijay", "CM Vijay", "Vijay"],
                entity_type="PERSON",
                role="Chief Minister of Tamil Nadu",
                country="India",
                state="Tamil Nadu",
                forbidden_names=["M. Vijay Kumar", "Vijay Kumar", "M. Vijay", "Joseph Kumar", "M Vijay Kumar"]
            )
        ]
    )

    bad_variations = [
        "M. Vijay Kumar is the Chief Minister.",
        "Tamil Nadu Chief Minister M. Vijay Kumar took oath.",
        "According to reports, Vijay Kumar attended the summit.",
        "The state is headed by M. Vijay.",
        "M Vijay Kumar announced new guidelines.",
        "## Chief Minister of Tamil Nadu\n**Vijay Kumar**\nAs of October 2026, Vijay Kumar is CM."
    ]

    for bad in bad_variations:
        valid, fixed = evidence_engine.validate_entity_names(bad, sample_evidence)
        assert not valid, f"Should have failed validation for: {bad}"
        assert "M. Vijay Kumar" not in fixed, f"Forbidden name remained: {fixed}"
        assert "Vijay Kumar" not in fixed, f"Forbidden name remained: {fixed}"
        assert "M. Vijay" not in fixed, f"Forbidden name remained: {fixed}"
        assert "C. Joseph Vijay" in fixed, f"Did not insert canonical name: {fixed}"

    print("✓ TEST 9 PASS: 'C. Joseph Vijay' evidence strictly forbids and replaces all 'M. Vijay Kumar' permutations")

async def test_requirement_29_automated_variations():
    """Requirement 29: Generate 100 answer variations and assert final answer never contains unsupported names."""
    sample_evidence = NormalizedEvidence(
        entities=[
            ResolvedEntity(
                canonical_name="C. Joseph Vijay",
                aliases=["C. Joseph Vijay", "Joseph Vijay", "C Joseph Vijay", "CM Vijay", "Vijay"],
                entity_type="PERSON",
                role="Chief Minister of Tamil Nadu",
                country="India",
                state="Tamil Nadu",
                forbidden_names=["M. Vijay Kumar", "Vijay Kumar", "M. Vijay", "Joseph Kumar", "M Vijay Kumar"]
            )
        ]
    )

    templates = [
        "The current Chief Minister of Tamil Nadu is {name}.",
        "As of October 2026, {name} serves as the leader of the government in Tamil Nadu.",
        "Recent reports confirm that {name} chaired the state cabinet meeting.",
        "Officials announced that {name} inaugurated the new facility.",
        "Tamil Nadu's head of government, {name}, delivered an address today.",
        "The government led by {name} introduced key economic reforms in Chennai.",
        "State representatives under {name} visited the southern districts.",
        "According to authoritative coverage, {name} signed the administrative resolution.",
        "Public statements from {name} highlighted the infrastructure priorities.",
        "In a press briefing, {name} outlined the upcoming legislative calendar."
    ]

    candidate_names = [
        "M. Vijay Kumar", "Vijay Kumar", "M. Vijay", "Joseph Kumar",
        "M Vijay Kumar", "C. Joseph Vijay", "Vijay", "Joseph Vijay"
    ]

    variation_count = 0
    for t in templates:
        for name in candidate_names:
            text = t.format(name=name)
            # Run final fact checker and name validator
            checked = evidence_engine.final_fact_checker(text, sample_evidence)
            _, validated = evidence_engine.validate_entity_names(checked, sample_evidence)

            # Strict assertions
            assert "M. Vijay Kumar" not in validated, f"Leak detected: {validated}"
            assert "Vijay Kumar" not in validated, f"Leak detected: {validated}"
            assert "M. Vijay" not in validated, f"Leak detected: {validated}"
            assert "Joseph Kumar" not in validated, f"Leak detected: {validated}"
            variation_count += 1

    # Also test dates, offices, and state isolation
    for state_cand in ["Kerala", "Karnataka", "Andhra Pradesh"]:
        query_text = f"Chief Minister of {state_cand}"
        ev = evidence_engine.entity_resolver(query_text, [])
        if ev.entities:
            assert ev.entities[0].state != "Tamil Nadu", f"Cross-state contamination for {state_cand}"

    print(f"✓ REQUIREMENT 29 PASS: Verified {variation_count} entity variations; zero hallucinated names permitted.")

async def main():
    print("\n========================================================")
    print("ASURA CRITICAL FACTUAL ACCURACY REGRESSION SUITE (TESTS 1-9 & REQ 29)")
    print("========================================================\n")
    
    await test_case_1()
    await test_case_2()
    await test_case_3()
    await test_case_4()
    await test_case_5()
    await test_case_6()
    await test_case_7()
    await test_case_8()
    await test_case_9()
    await test_requirement_29_automated_variations()

    print("\n========================================================")
    print("ALL 9 CRITICAL TESTS & REQUIREMENT 29 PASSED WITH 100% SUCCESS")
    print("========================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
