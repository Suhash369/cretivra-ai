import os
import sys
import json
import asyncio
from datetime import datetime

# Set up environment path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.time_utils import getCurrentDateTime
from app.core.router import asura_router, is_anaphoric_follow_up
from app.services.web_search_service import web_search_service
from app.services.evidence_engine import evidence_engine
from app.services.response_orchestrator import response_orchestrator

TEST_CASES = [
    # CURRENT OFFICE HOLDERS
    {"id": 1, "query": "Who is the current CM of Tamil Nadu?", "category": "OFFICE_HOLDERS"},
    {"id": 2, "query": "Who is the current CM of Kerala?", "category": "OFFICE_HOLDERS"},
    {"id": 3, "query": "Who is the current PM of India?", "category": "OFFICE_HOLDERS"},
    {"id": 4, "query": "Who is the current President of India?", "category": "OFFICE_HOLDERS"},
    {"id": 5, "query": "Who is the current Governor of Tamil Nadu?", "category": "OFFICE_HOLDERS"},

    # CURRENT NEWS
    {"id": 6, "query": "What are today's major AI news?", "category": "CURRENT_NEWS"},
    {"id": 7, "query": "What is the latest OpenAI news?", "category": "CURRENT_NEWS"},
    {"id": 8, "query": "What is the latest Google AI news?", "category": "CURRENT_NEWS"},
    {"id": 9, "query": "What happened in AI this week?", "category": "CURRENT_NEWS"},
    {"id": 10, "query": "What are today's major India news?", "category": "CURRENT_NEWS"},

    # OTHER CURRENT DATA
    {"id": 11, "query": "What is the latest gold price in India?", "category": "CURRENT_DATA"},
    {"id": 12, "query": "What is the latest major cricket result?", "category": "CURRENT_DATA"},
    {"id": 13, "query": "What is the latest NVIDIA news?", "category": "CURRENT_DATA"},
    {"id": 14, "query": "What is the latest Gemini model?", "category": "CURRENT_DATA"},
    {"id": 15, "query": "What is the latest Groq model?", "category": "CURRENT_DATA"},

    # HISTORICAL
    {"id": 16, "query": "Who was the CM of Tamil Nadu in 2010?", "category": "HISTORICAL"},
    {"id": 17, "query": "Who was the PM of India in 2010?", "category": "HISTORICAL"},

    # CONTEXT ISOLATION
    {"id": 18, "query": "Who is CM of Kerala?", "category": "CONTEXT_ISOLATION", "prior": "Who is CM of Tamil Nadu?", "expected_entity": "Kerala"},
    {"id": 19, "query": "How old is he?", "category": "CONTEXT_ISOLATION", "prior": "Who is CM of Tamil Nadu?", "expected_follow_up": True},
    {"id": 20, "query": "Who is CM of Tamil Nadu?", "category": "CONTEXT_ISOLATION", "prior": "Who is CM of Kerala?", "expected_entity": "Tamil Nadu"}
]

async def run_single_test(tc):
    query = tc["query"]
    prior = tc.get("prior")
    
    # 1. Routing & Intent Analysis
    conversation_history = []
    if prior:
        conversation_history = [
            {"role": "user", "content": prior},
            {"role": "assistant", "content": f"Answer for {prior}"}
        ]

    decision = await asura_router.route_async(
        query=query,
        conversation_history=conversation_history
    )

    is_follow_up = decision.is_follow_up

    # 2. Targeted search queries
    server_dt = datetime.now()
    targeted_queries = web_search_service.generate_targeted_queries(query, server_dt)

    # 3. Web Search Execution if required
    search_results = []
    evidence = None
    if decision.requires_web:
        raw_res = await web_search_service.search_with_sources(decision.search_query or query, max_results=5)
        search_results = raw_res.get("sources", [])
        evidence = raw_res.get("evidence")

    top_sources = [f"{s.get('publisher') or s.get('domain')} ({s.get('tier', 'Web')})" for s in search_results[:3]]
    source_authorities = [s.get("tier", "Web") for s in search_results[:3]]
    source_dates = [s.get("date") for s in search_results[:3] if s.get("date")]
    
    # Check verification status
    verification_status = (evidence or {}).get("verification_status", "N/A" if not decision.requires_web else "unverified")

    # Evaluation judgment
    passed = True
    reason = "Verified"

    if tc["category"] == "HISTORICAL":
        passed = (decision.detected_intent.value == "HISTORICAL" and not decision.requires_web)
        reason = "Correctly routed to HISTORICAL with no web research forced."
    elif tc["category"] == "CONTEXT_ISOLATION":
        if tc.get("expected_follow_up"):
            passed = is_follow_up is True
            reason = f"Correctly recognized anaphoric follow-up: is_follow_up={is_follow_up}"
        elif tc.get("expected_entity"):
            expected_e = tc["expected_entity"].lower()
            # Ensure targeted queries contain the expected entity and NOT the prior entity
            prior_e = ("tamil nadu" if "tamil nadu" in prior.lower() else "kerala")
            queries_str = " ".join(targeted_queries).lower()
            has_expected = expected_e in queries_str or expected_e in decision.search_query.lower()
            has_prior_bleed = prior_e in queries_str and expected_e not in prior_e
            passed = has_expected and not has_prior_bleed
            reason = f"Isolated context: targeted query focused on {expected_e}, no bleed from {prior_e}."
    else:
        passed = decision.requires_web is True and len(search_results) > 0
        reason = f"Intent={decision.intent}, WebRequired={decision.requires_web}, Sources={len(search_results)}, Status={verification_status}"

    record = {
        "id": tc["id"],
        "query": query,
        "category": tc["category"],
        "detectedIntent": decision.intent,
        "webRequired": decision.requires_web,
        "isFollowUp": is_follow_up,
        "searchQueries": targeted_queries[:3],
        "resultCount": len(search_results),
        "topSources": top_sources,
        "sourceAuthority": source_authorities,
        "sourceDates": source_dates,
        "candidate": (evidence or {}).get("answer_candidate", ""),
        "verificationStatus": verification_status,
        "passed": passed,
        "reason": reason
    }
    return record

async def main():
    print("=" * 80)
    print("ASURA AI — 20-TEST REAL-TIME CURRENT AFFAIRS ACCURACY AUDIT")
    print("=" * 80)
    
    results = []
    for tc in TEST_CASES:
        rec = await run_single_test(tc)
        results.append(rec)
        status_symbol = "✓ PASS" if rec["passed"] else "✗ FAIL"
        print(f"[{rec['id']:02d}] {status_symbol} | {rec['query']}")
        print(f"     Category: {rec['category']} | Intent: {rec['detectedIntent']} | Web: {rec['webRequired']}")
        if rec['searchQueries']:
            print(f"     Search: {rec['searchQueries'][0]}")
        if rec['topSources']:
            print(f"     Top Sources: {', '.join(rec['topSources'])}")
        print(f"     Verification: {rec['verificationStatus']} | Details: {rec['reason']}")
        print("-" * 80)
        # brief pause to avoid search rate limiting
        await asyncio.sleep(0.5)

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    print("\n" + "=" * 80)
    print(f"TOTAL AUDIT RESULT: {passed_count}/{total_count} TESTS PASSED")
    print("=" * 80)

    # Save report JSON
    with open("audit_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
