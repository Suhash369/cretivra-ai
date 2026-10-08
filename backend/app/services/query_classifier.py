import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class QueryClassification(BaseModel):
    is_real_time: bool = False
    category: str = "general_knowledge"
    search_required: bool = False
    is_historical: bool = False
    time_sensitivity: str = "NONE"  # HIGH, MEDIUM, LOW, NONE
    cache_ttl_seconds: int = 3600
    search_queries: List[str] = Field(default_factory=list)
    confidence: str = "HIGH"
    detected_intent_reasons: List[str] = Field(default_factory=list)

class QueryClassifier:
    """
    Intelligent Query Classifier & Router for Real-Time Knowledge & Current Affairs.
    Accurately classifies queries into real-time, historical, market, or static categories,
    and dynamically formulates multi-source search query variations.
    """

    # Terms that strictly trigger real-time search
    REAL_TIME_TRIGGER_TERMS = [
        r"\b(?:current|currently|now|today|latest|recent|recently|present|presently)\b",
        r"\brecent\s+developments?\b",
        r"\bas\s+of\s+today\b",
        r"\bas\s+of\s+now\b",
        r"\bwho\s+is\s+the\s+current\b",
        r"\bwho\s+is\s+currently\b",
        r"\blatest\s+news\b",
        r"\blatest\s+update\b",
        r"\bcurrent\s+status\b",
        r"\bthis\s+week\b",
        r"\bthis\s+month\b",
        r"\bnewly\s+appointed\b",
        r"\brecently\s+appointed\b",
        r"\blatest\s+price\b",
        r"\bcurrent\s+ceo\b",
        r"\bcurrent\s+cm\b",
        r"\bcurrent\s+pm\b",
        r"\bcurrent\s+president\b",
        r"\bcurrent\s+minister\b",
        r"\blatest\s+election\s+result[s]?\b",
        r"\bcurrent\s+affairs\b",
        r"\bbreaking\s+news\b",
        r"\bwho\s+won\b",
        r"\blive\s+score\b",
        r"\bstanding[s]?\b"
    ]

    # Political offices & governance roles that require live verification
    POLITICAL_OFFICES = [
        r"\b(?:chief\s+minister|cm)[s]?\b",
        r"\b(?:prime\s+minister|pm)[s]?\b",
        r"\b(?:president|vice\s+president)[s]?\b",
        r"\b(?:governor|lieutenant\s+governor|lg)[s]?\b",
        r"\b(?:minister|cabinet\s+minister|deputy\s+cm|deputy\s+pm)[s]?\b",
        r"\b(?:chief\s+justice|cji)[s]?\b",
        r"\b(?:mp|mla|mpp|senator|chancellor|premier|mayor)[s]?\b",
        r"\b(?:election|elections|bypoll|bypolls|assembly\s+election)\b",
        r"\b(?:cabinet\s+reshuffle|resignation|appointment|sworn\s+in|oath)\b",
        r"\b(?:government\s+scheme|policy|parliament|lok\s+sabha|rajya\s+sabha)\b"
    ]

    # Market, price & economic data
    MARKET_INDICATORS = [
        r"\b(?:gold|silver|petrol|diesel|crude\s+oil|stock|share)\s+(?:price|rate)\b",
        r"\b(?:price|rate)\s+of\s+(?:gold|silver|petrol|diesel|oil|bitcoin|crypto)\b",
        r"\b(?:latest|current)\s+price\b",
        r"\b(?:stock\s+price|sensex|nifty|nasdaq|crypto|bitcoin|btc|ethereum)\b",
        r"\b(?:inflation\s+rate|gdp\s+growth|repo\s+rate|exchange\s+rate|dollar\s+rate)\b",
        r"\b(?:market\s+cap|net\s+worth\s+of)\b"
    ]

    # Demographic / factual queries with live status
    FACTUAL_CURRENT_INDICATORS = [
        r"\b(?:current\s+population|population\s+of|weather\s+in|forecast)\b",
        r"\b(?:who\s+is\s+the\s+ceo\s+of|who\s+is\s+the\s+owner\s+of|who\s+heads)\b",
        r"\b(?:is\s+.+\s+(?:alive|dead|in\s+office|still\s+the\s+cm|still\s+the\s+pm|acting))\b"
    ]

    # Explicit historical patterns (past years or retrospective markers)
    HISTORICAL_INDICATORS = [
        r"\bin\s+(?:19\d\d|200\d|201\d|202[0-3])\b",  # e.g., in 2021, in 2019
        r"\b(?:was\s+the\s+first|who\s+was\s+the\s+first|first\s+chief\s+minister|first\s+prime\s+minister)\b",
        r"\b(?:first\s+president|first\s+governor|founder\s+of|origin\s+of|history\s+of)\b",
        r"\b(?:former|ex-cm|ex-pm|previous|preceding|predecessor|earlier)\b",
        r"\b(?:between\s+\d{4}\s+and\s+\d{4}|during\s+(?:19\d\d|20[01]\d))\b",
        r"\b(?:when\s+did\s+.+\s+resign|when\s+was\s+.+\s+born|when\s+did\s+.+\s+die)\b"
    ]

    def classify(self, query: str, server_time: Optional[datetime] = None) -> QueryClassification:
        now = server_time or datetime.now()
        current_year = now.year
        current_month = now.strftime("%B")
        q = query.strip()
        lower_q = q.lower()

        reasons = []

        # 1. Check for pure non-search code/math/translation prompts
        if any(lower_q.startswith(prefix) for prefix in [
            "write code", "implement a function", "solve math", "calculate",
            "translate to", "fix this code", "regex for"
        ]) and not any(term in lower_q for term in ["current", "latest", "today", "news"]):
            return QueryClassification(
                is_real_time=False,
                category="code_math",
                search_required=False,
                is_historical=False,
                time_sensitivity="NONE",
                cache_ttl_seconds=86400,
                confidence="HIGH"
            )

        # 2. Check for explicit historical indicators
        is_historical = False
        for pattern in self.HISTORICAL_INDICATORS:
            if re.search(pattern, lower_q):
                # Ensure it's not a mixed query like "Who was CM in 2021 and who is current CM"
                if not any(rt in lower_q for rt in ["current", "now", "today", "latest", "who is the current"]):
                    is_historical = True
                    reasons.append(f"Historical indicator match: {pattern}")
                    break

        if is_historical:
            return QueryClassification(
                is_real_time=False,
                category="historical_static",
                search_required=False,
                is_historical=True,
                time_sensitivity="NONE",
                cache_ttl_seconds=86400,
                confidence="HIGH",
                detected_intent_reasons=reasons
            )

        # 3. Check for Real-time triggers
        has_rt_trigger = False
        for pattern in self.REAL_TIME_TRIGGER_TERMS:
            if re.search(pattern, lower_q):
                has_rt_trigger = True
                reasons.append(f"Real-time trigger: {pattern}")
                break

        # 4. Check for Political leadership queries
        has_political = False
        for pattern in self.POLITICAL_OFFICES:
            if re.search(pattern, lower_q):
                has_political = True
                reasons.append(f"Political leadership: {pattern}")
                break

        # 5. Check for Market / Price queries
        has_market = False
        for pattern in self.MARKET_INDICATORS:
            if re.search(pattern, lower_q):
                has_market = True
                reasons.append(f"Market / price indicator: {pattern}")
                break

        # 6. Check for Factual current status indicators
        has_factual_status = False
        for pattern in self.FACTUAL_CURRENT_INDICATORS:
            if re.search(pattern, lower_q):
                has_factual_status = True
                reasons.append(f"Factual status indicator: {pattern}")
                break

        # Check for queries about "who is [Entity]" or "status of [Entity]"
        is_who_is_entity = bool(re.search(r"^who\s+is\s+([a-zA-Z\s.]{2,40})\??$", lower_q))
        
        # Categorize
        if has_market:
            cat = "market_price"
            is_rt = True
            time_sens = "HIGH"
            ttl = 900  # 15 minutes
        elif has_political:
            cat = "political_leadership"
            is_rt = True
            time_sens = "HIGH"
            ttl = 1800  # 30 minutes
        elif has_rt_trigger:
            cat = "breaking_news" if any(w in lower_q for w in ["news", "developments", "breaking", "headlines"]) else "general_current"
            is_rt = True
            time_sens = "HIGH" if "news" in cat else "MEDIUM"
            ttl = 600 if cat == "breaking_news" else 3600
        elif has_factual_status:
            cat = "current_facts"
            is_rt = True
            time_sens = "MEDIUM"
            ttl = 3600
        elif is_who_is_entity:
            # e.g., "Explain who M. K. Stalin is" or "Who is M. K. Stalin"
            # If no "current" term, this is general entity info (search optional, low time sensitivity)
            cat = "general_knowledge"
            is_rt = False
            time_sens = "LOW"
            ttl = 86400
        else:
            cat = "general_knowledge"
            is_rt = False
            time_sens = "NONE"
            ttl = 86400

        search_req = is_rt

        search_queries = []
        if search_req:
            search_queries = self.generate_search_queries(q, now=now, category=cat)

        return QueryClassification(
            is_real_time=is_rt,
            category=cat,
            search_required=search_req,
            is_historical=False,
            time_sensitivity=time_sens,
            cache_ttl_seconds=ttl,
            search_queries=search_queries,
            confidence="HIGH",
            detected_intent_reasons=reasons
        )

    def generate_search_queries(
        self,
        query: str,
        now: Optional[datetime] = None,
        category: str = "general_current"
    ) -> List[str]:
        """
        Dynamically generates 2 to 4 complementary search queries for high factual yield.
        Uses server date (e.g. October 2026), never hardcoded dates or politicians.
        """
        current_dt = now or datetime.now()
        current_year = current_dt.year
        current_month = current_dt.strftime("%B")
        
        # Clean basic conversational wrappers and temporal prefixes for crisp search terms
        clean_q = query.strip()
        clean_q = re.sub(r'^(?:can you tell me|tell me|please tell me|what is|who is|who are)\s+', '', clean_q, flags=re.IGNORECASE)
        clean_q = re.sub(r'\b(?:the current|current|currently|now|today|latest|recent|as of today)\b', '', clean_q, flags=re.IGNORECASE)
        clean_q = clean_q.rstrip('?.,! ').strip()
        clean_q = re.sub(r'\s+', ' ', clean_q)

        # Normalize common abbreviations
        clean_q = re.sub(r'\bcm\b', 'Chief Minister', clean_q, flags=re.IGNORECASE)
        clean_q = re.sub(r'\bpm\b', 'Prime Minister', clean_q, flags=re.IGNORECASE)
        clean_q = clean_q.strip()

        queries = []

        if category == "political_leadership":
            # 1. Direct temporal query: entity + month + year
            queries.append(f"current {clean_q} {current_month} {current_year}")
            # 2. Official authority query: official government portal
            queries.append(f"{clean_q} official government portal")
            # 3. Latest news & developments query
            queries.append(f"{clean_q} latest news developments {current_year}")
        elif category == "market_price":
            queries.append(f"{clean_q} price rate today {current_month} {current_year}")
            queries.append(f"{clean_q} latest live price")
        elif category == "breaking_news":
            queries.append(f"{clean_q} latest news today {current_month} {current_year}")
            queries.append(f"{clean_q} breaking updates")
        else:
            queries.append(f"current {clean_q} {current_year}")
            queries.append(f"{clean_q} latest verified status {current_year}")

        # Deduplicate
        seen = set()
        final_queries = []
        for query_item in queries:
            normalized_item = re.sub(r'\s+', ' ', query_item).strip()
            if normalized_item.lower() not in seen:
                seen.add(normalized_item.lower())
                final_queries.append(normalized_item)

        return final_queries

query_classifier = QueryClassifier()
