import asyncio
import json
import time
from app.core.router import queryRouter, QueryIntent, is_anaphoric_follow_up
from app.services.web_search_service import search_web
from app.services.response_orchestrator import response_orchestrator
from app.core.time_utils import getCurrentDateTime

TEST_QUERIES = [
    "Who is the current CM of Tamil Nadu?",
    "Who is the current CM of Kerala?",
    "Who is the current PM of India?",
    "What are today's major AI news?",
    "What happened in AI this week?",
    "What is the latest Gemini model?",
    "What is the latest OpenAI model?",
    "Who won the latest major cricket match?",
    "What is today's gold price in India?",
    "What is the latest news about NVIDIA?"
]

async def run_tests():
    print("=" * 70)
    print("ASURA REAL-TIME WEB SEARCH & GROUNDING ARCHITECTURE AUDIT")
    time_info = getCurrentDateTime()
    print(f"Verified Server Time: {time_info['formatted_date']} {time_info['time']} ({time_info['timezone']})")
    print("=" * 70)

    # 1. Test Context Isolation between TN and Kerala
    print("\n--- TEST: CONTEXT ISOLATION (TN -> Kerala) ---")
    tn_q = "Who is the current CM of Tamil Nadu?"
    ke_q = "Who is the current CM of Kerala?"
    follow_q = "How old is he?"

    print(f"Query 1: '{tn_q}' -> is_follow_up: {is_anaphoric_follow_up(tn_q)}")
    print(f"Query 2: '{ke_q}' -> is_follow_up: {is_anaphoric_follow_up(ke_q)}")
    print(f"Query 3: '{follow_q}' -> is_follow_up: {is_anaphoric_follow_up(follow_q)}")
    assert not is_anaphoric_follow_up(ke_q), "Error: Kerala query wrongly classified as follow-up!"
    assert is_anaphoric_follow_up(follow_q), "Error: 'How old is he?' should be classified as follow-up!"
    print("✓ Context Isolation Assertion Passed: Kerala query is cleanly isolated from Tamil Nadu.")

    # 2. Run the 10 Test Cases
    results_summary = []

    for idx, query in enumerate(TEST_QUERIES, 1):
        print(f"\n[Test Case {idx}/10] Query: '{query}'")
        t0 = time.time()
        
        # Step A: Query Intent Router
        route_decision = queryRouter(query)
        intent = route_decision["intent"]
        web_req = route_decision["requires_web"]
        print(f"  -> Router: Intent={intent}, RequiresWeb={web_req}, SearchQuery={route_decision.get('search_query')}")
        
        # Step B: Web Search Retrieval
        search_res = await search_web(query, {"max_results": 4})
        count = len(search_res.get("results", []))
        top_src = search_res["results"][0] if count > 0 else {}
        print(f"  -> Search: SourcesCount={count}, TopSource={top_src.get('title', 'N/A')} ({top_src.get('source', 'N/A')})")
        
        # Step C: Full Orchestration Execution (End-to-End)
        resp = await response_orchestrator.orchestrate_chat_sync(
            db=None,
            conversation_id=f"test-conv-{idx}",
            user_message=query
        )
        
        elapsed = round(time.time() - t0, 2)
        answer_preview = (resp.answer or "").strip()[:140].replace("\n", " ")
        sources_count = len(resp.sources)
        
        status = "PASSED" if (web_req and count > 0 and len(resp.answer) > 20) else "FAILED"
        print(f"  -> Orchestration ({elapsed}s): Answer={answer_preview}...")
        print(f"  -> Sources in Final Contract: {sources_count}")
        print(f"  -> Result: {status}")

        results_summary.append({
            "test_num": idx,
            "query": query,
            "intent": intent,
            "web_required": web_req,
            "sources_found": count,
            "sources_returned": sources_count,
            "elapsed_seconds": elapsed,
            "status": status,
            "answer_snippet": answer_preview
        })

    print("\n" + "=" * 70)
    print("FINAL TEST AUDIT SUMMARY TABLE")
    print("=" * 70)
    print(f"{'#':<3} | {'Query':<36} | {'Intent':<15} | {'Sources':<8} | {'Status'}")
    print("-" * 70)
    for r in results_summary:
        print(f"{r['test_num']:<3} | {r['query'][:36]:<36} | {r['intent']:<15} | {r['sources_returned']:<8} | {r['status']}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_tests())
