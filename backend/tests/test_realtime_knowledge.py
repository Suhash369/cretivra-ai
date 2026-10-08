import pytest
import asyncio
from datetime import datetime
from app.services.query_classifier import query_classifier, QueryClassification
from app.services.web_search_service import web_search_service

def test_query_classification_test_cases():
    now = datetime(2026, 10, 8)

    # 1. Who is the current Chief Minister of Tamil Nadu?
    r1 = query_classifier.classify("Who is the current Chief Minister of Tamil Nadu?", server_time=now)
    assert r1.is_real_time is True
    assert r1.search_required is True
    assert r1.category == "political_leadership"
    assert not r1.is_historical
    assert any("Chief Minister" in q for q in r1.search_queries)
    assert any("2026" in q for q in r1.search_queries)

    # 2. Who is the current Prime Minister of India?
    r2 = query_classifier.classify("Who is the current Prime Minister of India?", server_time=now)
    assert r2.is_real_time is True
    assert r2.search_required is True
    assert r2.category == "political_leadership"

    # 3. What is the latest political news in Tamil Nadu?
    r3 = query_classifier.classify("What is the latest political news in Tamil Nadu?", server_time=now)
    assert r3.is_real_time is True
    assert r3.search_required is True
    assert r3.category == "breaking_news"

    # 4. Who was the Chief Minister of Tamil Nadu in 2021?
    r4 = query_classifier.classify("Who was the Chief Minister of Tamil Nadu in 2021?", server_time=now)
    assert r4.is_historical is True
    assert r4.search_required is False
    assert r4.is_real_time is False

    # 5. Who was the first Chief Minister of Tamil Nadu?
    r5 = query_classifier.classify("Who was the first Chief Minister of Tamil Nadu?", server_time=now)
    assert r5.is_historical is True
    assert r5.search_required is False
    assert r5.is_real_time is False

    # 6. What is the current population of Chennai?
    r6 = query_classifier.classify("What is the current population of Chennai?", server_time=now)
    assert r6.is_real_time is True
    assert r6.search_required is True

    # 7. What is the latest price of gold in India?
    r7 = query_classifier.classify("What is the latest price of gold in India?", server_time=now)
    assert r7.is_real_time is True
    assert r7.search_required is True
    assert r7.category == "market_price"

    # 8. Explain who M. K. Stalin is.
    r8 = query_classifier.classify("Explain who M. K. Stalin is.", server_time=now)
    assert r8.category == "general_knowledge"
    assert r8.is_historical is False

def test_source_scoring():
    current_year = 2026
    keywords = ["chief", "minister", "tamil", "nadu"]

    # Official gov source (e.g. tn.gov.in)
    gov_item = {
        "domain": "tn.gov.in",
        "title": "Government of Tamil Nadu - Chief Minister Portfolio",
        "snippet": "Official portal of the Chief Minister of Tamil Nadu",
        "date": "2026-09-15"
    }
    web_search_service._score_source(gov_item, current_year=current_year, target_keywords=keywords)
    assert gov_item["score"] >= 65.0
    assert gov_item["source_tier"] == "Official Government Portal"

    # Reputable news source from current year
    news_item = {
        "domain": "thehindu.com",
        "title": "Tamil Nadu Chief Minister launches new initiative",
        "snippet": "Chief Minister of Tamil Nadu announced the scheme today in Chennai",
        "date": "2026-10-02"
    }
    web_search_service._score_source(news_item, current_year=current_year, target_keywords=keywords)
    assert news_item["score"] >= 55.0
    assert news_item["source_tier"] == "Reputable News Organization"

    # Old stale source from 2021
    old_item = {
        "domain": "randomblog.com",
        "title": "Elections in Tamil Nadu in 2021",
        "snippet": "May 2021 assembly election updates and results",
        "date": "2021-05-07"
    }
    web_search_service._score_source(old_item, current_year=current_year, target_keywords=keywords)
    assert old_item["score"] < 0.0

@pytest.mark.asyncio
async def test_live_search_for_current_cm():
    # Test that search_with_sources executes and returns valid sources with confidence
    res = await web_search_service.search_with_sources("Who is the current Chief Minister of Tamil Nadu?", max_results=6)
    assert len(res.get("sources", [])) > 0
    assert not res.get("search_failed")
    assert res.get("consensus", {}).get("confidence") in ["HIGH", "MEDIUM"]
    assert len(res.get("context_text", "")) > 50
