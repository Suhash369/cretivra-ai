import re
import html
import time
import httpx
import asyncio
from datetime import datetime
from urllib.parse import urlparse
from typing import Optional, List, Dict, Any, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.core.http_client import get_shared_client
from app.services.query_classifier import query_classifier, QueryClassification

def extract_domain(url: str) -> str:
    """Extract clean domain name without www."""
    if not url:
        return "web"
    try:
        netloc = urlparse(url).netloc
        netloc = re.sub(r'^www\.', '', netloc)
        return netloc or "web"
    except Exception:
        return "web"

def normalize_source_url(url: str) -> str:
    """Normalize URLs, converting legacy YouTube channel paths and Google Maps links to reliable universal formats."""
    if not url:
        return ""
    url = url.strip()
    url = re.sub(r'^(https?://(?:www\.)?youtube\.com)/(?:c|user)/([^\s/?#]+)', r'\1/@\2', url, flags=re.IGNORECASE)

    if re.search(r'google\.[a-z.]+/maps|maps\.google\.', url, re.IGNORECASE):
        try:
            from urllib.parse import urlparse, parse_qs, quote, unquote
            parsed = urlparse(url if url.startswith("http") else f"https://{url}")
            qs = parse_qs(parsed.query)
            q_val = qs.get("query", [None])[0] or qs.get("q", [None])[0] or qs.get("destination", [None])[0]
            if q_val:
                clean_q = unquote(q_val).replace("+", " ").strip()
                return f"https://www.google.com/maps/search/?api=1&query={quote(clean_q)}"

            place_match = re.search(r'/maps/place/([^/@?#]+)', parsed.path, re.IGNORECASE)
            if place_match:
                clean_p = unquote(place_match.group(1)).replace("+", " ").strip()
                clean_p = re.sub(r'@[0-9.,\-+z]+', '', clean_p).strip()
                return f"https://www.google.com/maps/search/?api=1&query={quote(clean_p)}"
        except Exception:
            pass

    return url

# Authority Tier Definitions per Requirement 9 & 10
OFFICIAL_GOV_DOMAINS = [
    ".gov.in", ".gov", ".nic.in", "eci.gov.in", "sansad.in", "india.gov.in",
    "tn.gov.in", "kerala.gov.in", "karnataka.gov.in", "maharashtra.gov.in", "delhi.gov.in",
    "pmindia.gov.in", "presidentofindia.gov.in", "parliamentofindia.nic.in",
    "rbi.org.in", "sci.gov.in", "supremecourtofindia.nic.in", "election.gov.in",
    "nvidia.com", "openai.com", "google.com", "bcci.tv", "icc-cricket.com"
]

REPUTABLE_NEWS_DOMAINS = [
    "thehindu.com", "indianexpress.com", "reuters.com", "bbc.com", "bbc.co.uk",
    "bloomberg.com", "apnews.com", "aljazeera.com", "ft.com", "wsj.com"
]

SECONDARY_NEWS_DOMAINS = [
    "ndtv.com", "timesofindia.indiatimes.com", "frontline.thehindu.com",
    "telegraphindia.com", "hindustantimes.com", "theprint.in", "thewire.in",
    "indiatoday.in", "news18.com", "business-standard.com", "livemint.com",
    "financialexpress.com", "economictimes.indiatimes.com", "deccanherald.com",
    "tribuneindia.com", "newindianexpress.com", "newsonair.gov.in",
    "techcrunch.com", "theverge.com", "wired.com", "cricbuzz.com", "espncricinfo.com"
]

LOW_TRUST_DOMAINS = [
    "instagram.com", "facebook.com", "tiktok.com", "x.com", "twitter.com",
    "reddit.com", "pinterest.com"
]

def infer_domain_from_publisher_name(name: str) -> str:
    """Infers canonical publisher domain from publisher name when RSS source URL is opaque."""
    n = (name or "").lower()
    if "hindu" in n: return "thehindu.com"
    if "reuters" in n: return "reuters.com"
    if "bbc" in n: return "bbc.com"
    if "ndtv" in n: return "ndtv.com"
    if "news on air" in n or "air news" in n: return "newsonair.gov.in"
    if "express" in n: return "newindianexpress.com" if "new" in n else "indianexpress.com"
    if "times of india" in n: return "timesofindia.indiatimes.com"
    if "hindustan times" in n: return "hindustantimes.com"
    if "business standard" in n: return "business-standard.com"
    if "frontline" in n: return "frontline.thehindu.com"
    if "livemint" in n or "mint" in n: return "livemint.com"
    if "economic times" in n: return "economictimes.indiatimes.com"
    if "deccan herald" in n: return "deccanherald.com"
    if "the print" in n or "theprint" in n: return "theprint.in"
    if "the wire" in n or "thewire" in n: return "thewire.in"
    if "ani" in n: return "aninews.in"
    if "pti" in n: return "ptinews.com"
    if "jagran" in n: return "jagranjosh.com"
    if "techcrunch" in n: return "techcrunch.com"
    if "verge" in n: return "theverge.com"
    if "cricbuzz" in n: return "cricbuzz.com"
    if "espn" in n: return "espncricinfo.com"
    return "news.google.com"

class WebSearchService:
    """
    Production Evidence-Based Real-Time Search Engine for Asura AI.
    Features:
    1. 5-Tier Authority Hierarchy & Multi-Factor Scoring Formula
    2. Dynamic Date-Aware Multi-Query Generation (3-5 targeted queries)
    3. Multi-tier Providers (Tavily, Brave, Serper, Google News RSS, DuckDuckGo)
    4. Original Domain Resolution (resolves Google News to real publishers)
    5. Temporal Recency Tracking (separates searchedAt from publishedAt)
    6. Cross-State Conflict Penalty (prevents cross-entity contamination)
    7. Evidence Engine & Consensus Validation
    """

    _CACHE: Dict[str, Tuple[float, float, Dict[str, Any]]] = {}

    def should_search_web(self, query: str) -> bool:
        cls_res = query_classifier.classify(query)
        return cls_res.search_required

    def normalize_query(self, query: str) -> str:
        q = query.strip()
        q = re.sub(r'iscurrent', 'is current', q, flags=re.IGNORECASE)
        q = re.sub(r'whois', 'who is', q, flags=re.IGNORECASE)
        q = re.sub(r'tamilandu|tamilnadu|tamilnad', 'tamil nadu', q, flags=re.IGNORECASE)
        q = re.sub(r'\bcm\b', 'chief minister', q, flags=re.IGNORECASE)
        q = re.sub(r'\bpm\b', 'prime minister', q, flags=re.IGNORECASE)
        q = re.sub(r'\blinkdin\b', 'linkedin', q, flags=re.IGNORECASE)
        clean_q = re.sub(r'^(?:can you tell me|tell me|what is|when was|when is|when did|who is|who was)\s+', '', q, flags=re.IGNORECASE)
        return clean_q.strip() or q

    def generate_targeted_queries(self, query: str, server_dt: Any = None) -> List[str]:
        """
        Generates 3-5 targeted queries for important real-time / current questions per Requirement 6 & 7:
        - Incorporates current month & year (e.g., October 2026)
        - Targets official government domains and office keywords
        - Avoids single-keyword noisy queries
        """
        if not isinstance(server_dt, datetime):
            server_dt = datetime.now()

        from app.core.router import extract_concise_search_keywords
        if len(query) > 80 or "\n" in query or "http" in query or "[" in query:
            clean_q = extract_concise_search_keywords(query)
        else:
            clean_q = self.normalize_query(query)

        month_year = server_dt.strftime("%B %Y")
        year_str = str(server_dt.year)
        q_lower = clean_q.lower()

        # Office holder queries: CM, PM, President, Governor, CEO, etc.
        states = {
            "tamil nadu": {"portal": "tn.gov.in", "cm_site": "tn.gov.in"},
            "kerala": {"portal": "kerala.gov.in", "cm_site": "keralacm.gov.in"},
            "karnataka": {"portal": "karnataka.gov.in", "cm_site": "karnataka.gov.in"},
            "andhra pradesh": {"portal": "ap.gov.in", "cm_site": "ap.gov.in"},
            "telangana": {"portal": "telangana.gov.in", "cm_site": "telangana.gov.in"},
            "maharashtra": {"portal": "maharashtra.gov.in", "cm_site": "maharashtra.gov.in"},
            "delhi": {"portal": "delhi.gov.in", "cm_site": "delhi.gov.in"},
            "west bengal": {"portal": "wb.gov.in", "cm_site": "wb.gov.in"}
        }

        detected_state = None
        for s in states:
            if s in q_lower:
                detected_state = s
                break

        # Check for CM Vijay / Vijay leadership query per Requirement 11 & 23
        if "vijay" in q_lower and ("cm" in q_lower or "chief minister" in q_lower or "who is" in query.lower()):
            return [
                f"current Chief Minister Tamil Nadu C Joseph Vijay {month_year}",
                f"Tamil Nadu CM Vijay official {month_year}",
                f"site:tn.gov.in Chief Minister Tamil Nadu",
                f"who is CM Vijay Tamil Nadu {year_str}",
                f"C. Joseph Vijay Chief Minister Tamil Nadu {year_str}"
            ]

        if "chief minister" in q_lower or "cm" in q_lower:
            if detected_state:
                st = detected_state.title()
                portal = states[detected_state]["portal"]
                return [
                    f"current Chief Minister of {st} {month_year}",
                    f"{st} Chief Minister official {month_year}",
                    f"site:{portal} Chief Minister {st}",
                    f"{st} current government Chief Minister {year_str}",
                    f"who is Chief Minister of {st} {year_str}"
                ]
            else:
                return [
                    f"current {clean_q} {month_year}",
                    f"{clean_q} official {month_year}",
                    f"current {clean_q} {year_str}",
                    f"who is {clean_q} {year_str}"
                ]

        if "prime minister" in q_lower or "pm" in q_lower:
            return [
                f"current Prime Minister of India {month_year}",
                f"Prime Minister of India official pmindia.gov.in {month_year}",
                f"site:pmindia.gov.in Prime Minister",
                f"India current government Prime Minister {year_str}",
                f"who is Prime Minister of India {year_str}"
            ]

        if "president" in q_lower and "india" in q_lower:
            return [
                f"current President of India {month_year}",
                f"President of India official presidentofindia.gov.in {month_year}",
                f"site:presidentofindia.gov.in President",
                f"who is President of India {year_str}"
            ]

        if "governor" in q_lower:
            st = detected_state.title() if detected_state else "Tamil Nadu"
            portal = states[detected_state]["portal"] if detected_state else "tn.gov.in"
            return [
                f"current Governor of {st} {month_year}",
                f"{st} Governor official {month_year}",
                f"site:{portal} Governor {st}",
                f"who is Governor of {st} {year_str}"
            ]

        if any(term in q_lower for term in ["gold price", "price of gold", "gold rate"]):
            return [
                f"latest gold price in India today {month_year}",
                f"24k 22k gold rate in India today live {year_str}",
                f"gold price in India today per gram {month_year}",
                f"current gold price India {year_str}"
            ]

        if "cricket" in q_lower or "match" in q_lower:
            return [
                f"latest cricket match result India {month_year}",
                f"recent cricket match score bcci icc {year_str}",
                f"latest cricket tournament results {year_str}"
            ]

        if any(term in q_lower for term in ["ai news", "openai", "google ai", "gemini", "groq", "nvidia"]):
            tech_entity = "AI"
            if "openai" in q_lower: tech_entity = "OpenAI"
            elif "google" in q_lower or "gemini" in q_lower: tech_entity = "Google AI Gemini"
            elif "groq" in q_lower: tech_entity = "Groq"
            elif "nvidia" in q_lower: tech_entity = "NVIDIA"
            return [
                f"latest {tech_entity} news {month_year}",
                f"{tech_entity} latest announcement model release {year_str}",
                f"what happened in {tech_entity} this week {year_str}",
                f"latest {tech_entity} updates {month_year}"
            ]

        # Default multi-query generation (3-4 targeted queries)
        return [
            f"{clean_q} {month_year}",
            f"{clean_q} official {year_str}",
            f"{clean_q} latest update {year_str}",
            f"{clean_q} {year_str}"
        ]

    def _score_source(self, item: Dict[str, Any], current_year: int, target_keywords: List[str], target_query: str) -> float:
        """
        Multi-factor source scoring formula per Requirement 10:
        finalScore = (
            authorityScore * 0.35 +
            relevanceScore * 0.30 +
            recencyScore * 0.20 +
            originalityScore * 0.10 +
            contentQualityScore * 0.05
        )
        With Cross-State conflict penalty.
        """
        domain = (item.get("domain") or "").lower()
        title = (item.get("title") or "").lower()
        snippet = (item.get("snippet") or "").lower()
        date_str = item.get("date") or ""

        # 1. Authority Score (Tier 1: 100, Tier 2: 90, Tier 3: 70, Tier 4: 40, Tier 5: 15)
        is_gov = any(domain.endswith(d) or f".{d}" in domain or domain == d.lstrip(".") for d in OFFICIAL_GOV_DOMAINS)
        is_reputable = any(d in domain for d in REPUTABLE_NEWS_DOMAINS)
        is_secondary = any(d in domain for d in SECONDARY_NEWS_DOMAINS)
        is_social = any(d in domain for d in LOW_TRUST_DOMAINS)

        if is_gov:
            authority_score = 100.0
            item["source_tier"] = "Official Government Source"
            item["source_type"] = "official"
        elif is_reputable:
            authority_score = 90.0
            item["source_tier"] = "High-Quality News (Tier 2)"
            item["source_type"] = "news"
        elif is_secondary:
            authority_score = 70.0
            item["source_tier"] = "Established Publication"
            item["source_type"] = "news"
        elif "wikipedia.org" in domain:
            authority_score = 55.0
            item["source_tier"] = "Encyclopedic Reference"
            item["source_type"] = "reference"
        elif is_social:
            authority_score = 15.0
            item["source_tier"] = "Social Media (Unverified)"
            item["source_type"] = "social"
        else:
            authority_score = 45.0
            item["source_tier"] = "Web Source"
            item["source_type"] = "web"

        # 2. Relevance Score (0-100)
        kw_matches = sum(1 for kw in target_keywords if kw and kw.lower() in f"{title} {snippet}")
        relevance_score = min(kw_matches * 25.0, 100.0)

        # 3. Recency Score (0-100)
        recency_score = 50.0
        found_years = re.findall(r'\b(20[12]\d)\b', f"{date_str} {title} {snippet}")
        if found_years:
            max_year = max(int(y) for y in found_years)
            if max_year == current_year:
                recency_score = 100.0
            elif max_year == current_year - 1:
                recency_score = 65.0
            elif max_year <= current_year - 3:
                recency_score = 10.0  # severely penalize obsolete knowledge
            elif max_year <= current_year - 2:
                recency_score = 25.0
        elif date_str:
            recency_score = 75.0

        current_month_name = datetime.now().strftime("%B").lower()
        if current_month_name in f"{date_str} {title} {snippet}".lower():
            recency_score = min(recency_score + 15.0, 100.0)

        # 4. Originality Score (0-100)
        originality_score = 90.0 if not item.get("is_aggregator") else 40.0

        # 5. Content Quality Score (0-100)
        content_quality = min(len(snippet) / 1.5, 100.0)

        # Weighted composite score
        final_score = (
            authority_score * 0.35 +
            relevance_score * 0.30 +
            recency_score * 0.20 +
            originality_score * 0.10 +
            content_quality * 0.05
        )

        # Cross-State Conflict Penalty per Requirement 18:
        # If query is for Kerala and article is about Tamil Nadu without mentioning Kerala, severely penalize!
        q_clean = target_query.lower()
        t_clean = (title + " " + snippet).lower()
        if "kerala" in q_clean and "tamil nadu" in t_clean and "kerala" not in t_clean:
            final_score -= 60.0
        elif "tamil nadu" in q_clean and "kerala" in t_clean and "tamil nadu" not in t_clean:
            final_score -= 60.0

        item["score"] = round(final_score, 1)
        return final_score

    def _analyze_consensus(self, sources: List[Dict[str, Any]], query: str, current_year: int) -> Dict[str, Any]:
        """
        Determines consensus across multiple sources and identifies timeline validity.
        """
        if not sources:
            return {"status": "NO_SOURCES", "confidence": "NONE", "details": "No search sources available."}

        # Check dates
        recent_sources = []
        older_sources = []

        for s in sources:
            try:
                score = float(s.get("score", 0))
            except (ValueError, TypeError):
                score = 0.0
            date_str = s.get("date", "")
            title_snip = f"{s.get('title', '')} {s.get('snippet', '')}"
            years = [int(y) for y in re.findall(r'\b(20[12]\d)\b', f"{date_str} {title_snip}")]
            is_recent = any(y >= current_year - 1 for y in years) or (not years and score >= 30.0)
            if is_recent:
                recent_sources.append(s)
            else:
                older_sources.append(s)

        confidence = "HIGH" if len(recent_sources) >= 3 else ("MEDIUM" if len(recent_sources) >= 1 else "LOW")

        return {
            "status": "CONSENSUS_VERIFIED" if len(recent_sources) >= 2 else "SINGLE_SOURCE",
            "confidence": confidence,
            "recent_count": len(recent_sources),
            "older_count": len(older_sources),
            "top_source_tier": sources[0].get("source_tier", "Web Source") if sources else "Unknown"
        }

    async def search_with_sources(self, query: str, max_results: int = 6) -> Dict[str, Any]:
        """
        Multi-tier accelerated intelligence retrieval pipeline with source scoring,
        consensus validation, dynamic date awareness, and category caching.
        """
        now_dt = datetime.now()
        current_year = now_dt.year
        current_date_str = now_dt.strftime("%B %d, %Y")

        classification = query_classifier.classify(query, server_time=now_dt)
        clean_q = self.normalize_query(query)
        cache_key = clean_q.lower().strip()

        # Check TTL cache
        now_ts = time.time()
        if cache_key in self._CACHE:
            cached_time, cached_ttl, cached_res = self._CACHE[cache_key]
            if now_ts - cached_time < cached_ttl:
                logger.info(f"Serving real-time search from cache ({round(now_ts - cached_time)}s old, TTL {cached_ttl}s)")
                return cached_res

        # Determine queries to run dynamically (generate 3-5 targeted queries per Requirement 6 & 7)
        queries_to_run = self.generate_targeted_queries(clean_q, now_dt)
        if not queries_to_run:
            queries_to_run = classification.search_queries or [clean_q]

        raw_items: List[Dict[str, Any]] = []

        # 1. Tavily AI Search API (Primary frontier web search)
        tavily_key = getattr(settings, "TAVILY_API_KEY", "")
        if tavily_key and not tavily_key.startswith("your_"):
            try:
                tasks = [self._search_tavily(q_item, tavily_key, max_results=max_results) for q_item in queries_to_run[:2]]
                res_lists = await asyncio.gather(*tasks, return_exceptions=True)
                for res_list in res_lists:
                    if isinstance(res_list, list):
                        raw_items.extend(res_list)
            except Exception as e:
                logger.warning(f"Tavily search error: {e}")

        # 2. Brave Search API (if configured)
        if len(raw_items) < 3:
            brave_key = getattr(settings, "BRAVE_API_KEY", "")
            if brave_key and not brave_key.startswith("your_"):
                try:
                    for q_item in queries_to_run[:2]:
                        brave_res = await self._search_brave(q_item, brave_key, max_results=max_results)
                        if brave_res:
                            raw_items.extend(brave_res)
                except Exception as e:
                    logger.warning(f"Brave search error: {e}")

        # 3. Serper / Google Search API (if configured)
        if len(raw_items) < 3:
            serper_key = getattr(settings, "SERPER_API_KEY", "")
            if serper_key and not serper_key.startswith("your_"):
                try:
                    for q_item in queries_to_run[:2]:
                        serper_res = await self._search_serper(q_item, serper_key, max_results=max_results)
                        if serper_res:
                            raw_items.extend(serper_res)
                except Exception as e:
                    logger.warning(f"Serper search error: {e}")

        # 4. Google News Live RSS across generated queries
        try:
            news_tasks = [self._search_google_news(q_item, max_results=4) for q_item in queries_to_run[:3]]
            gathered_news = await asyncio.gather(*news_tasks, return_exceptions=True)
            for item_list in gathered_news:
                if isinstance(item_list, list):
                    raw_items.extend(item_list)
        except Exception as e:
            logger.debug(f"Google News search error: {e}")

        # 5. DuckDuckGo HTML Fallback
        if len(raw_items) < 4:
            try:
                for q_item in queries_to_run[:2]:
                    ddg_res = await self._search_duckduckgo(q_item, max_results=4)
                    if ddg_res:
                        raw_items.extend(ddg_res)
            except Exception as e:
                logger.debug(f"DuckDuckGo search error: {e}")

        # 6. Wikipedia (Secondary background reference only)
        if len(raw_items) < max_results:
            try:
                wiki_res = await self._search_wikipedia(clean_q)
                if wiki_res:
                    raw_items.extend(wiki_res)
            except Exception as e:
                logger.debug(f"Wikipedia search error: {e}")

        # Target keywords for relevance calculation
        keywords = [w for w in re.split(r'\W+', clean_q) if len(w) > 2]

        # Score, filter, and deduplicate
        seen_urls = set()
        scored_items: List[Dict[str, Any]] = []

        for item in raw_items:
            title = (item.get("title") or "Source").strip()
            url = normalize_source_url((item.get("url") or "").strip())
            snippet = (item.get("snippet") or "").strip()
            domain = item.get("domain") or extract_domain(url)

            if not snippet and not title:
                continue

            dedup_key = url.lower() if url else title.lower()[:40]
            if dedup_key in seen_urls:
                continue
            seen_urls.add(dedup_key)

            item["title"] = title
            item["url"] = url
            item["snippet"] = snippet
            item["domain"] = domain

            self._score_source(item, current_year=current_year, target_keywords=keywords, target_query=clean_q)
            scored_items.append(item)

        # Sort strictly by multi-factor score descending (Authority + Recency + Relevance)
        scored_items.sort(key=lambda x: x.get("score", 0), reverse=True)

        # Take top max_results
        clean_sources: List[Dict[str, Any]] = []
        context_lines: List[str] = []
        searched_at_str = now_dt.strftime("%d %b %Y, %I:%M %p IST")

        for item in scored_items:
            clean_sources.append({
                "title": item["title"],
                "url": item["url"],
                "domain": item["domain"],
                "publisher": item.get("publisher", item["domain"]),
                "snippet": item["snippet"][:260],
                "date": item.get("date", ""),
                "published_at": item.get("date", ""),
                "searched_at": searched_at_str,
                "tier": item.get("source_tier", "Web Source"),
                "source_type": item.get("source_type", "web"),
                "score": round(float(item.get("score", 0)), 1)
            })

            citation_num = len(clean_sources)
            date_str = f" [{item['date']}]" if item.get("date") else ""
            tier_str = f" ({item.get('source_tier', 'Web Source')})"
            if item["url"]:
                context_lines.append(f"[{citation_num}] [{item['title']}]({item['url']}){date_str}{tier_str}: {item['snippet']}")
            else:
                context_lines.append(f"[{citation_num}] {item['title']}{date_str}{tier_str}: {item['snippet']}")

            if len(clean_sources) >= max_results:
                break

        from app.services.evidence_engine import evidence_engine
        evidence_item = evidence_engine.evaluate_evidence(clean_q, clean_sources, current_date_str)
        consensus_info = self._analyze_consensus(clean_sources, query, current_year)
        search_failed = len(clean_sources) == 0

        # Structured Observability Audit Logging
        source_dates = [s.get("date") for s in clean_sources if s.get("date")]
        audit_log = (
            f"\n==================== REAL-TIME QUERY AUDIT ====================\n"
            f"QUERY: {query}\n"
            f"CLASSIFICATION: {classification.category}\n"
            f"CURRENT_DATE: {current_date_str}\n"
            f"SEARCH_REQUIRED: {classification.search_required}\n"
            f"SEARCH_QUERIES:\n" + "\n".join([f"  {idx+1}. {sq}" for idx, sq in enumerate(queries_to_run)]) + "\n"
            f"SOURCES_FOUND: {len(raw_items)}\n"
            f"VALID_SOURCES: {len(clean_sources)}\n"
            f"SOURCE_DATES: {', '.join(source_dates) if source_dates else 'N/A'}\n"
            f"EVIDENCE_STATUS: {evidence_item.verification_status}\n"
            f"FINAL_CONFIDENCE: {consensus_info['confidence']}\n"
            f"==============================================================\n"
        )
        logger.info(audit_log)

        res_data = {
            "context_text": "\n".join(context_lines),
            "sources": clean_sources,
            "evidence": evidence_item.model_dump(),
            "classification": classification.model_dump(),
            "consensus": consensus_info,
            "audit_log": audit_log,
            "search_failed": search_failed,
            "checked_date": current_date_str,
            "searched_at": searched_at_str
        }

        # Cache with category-specific TTL (capped at 5 minutes / 300s for real-time / current affairs)
        ttl = classification.cache_ttl_seconds
        if classification.is_real_time or classification.category in ["breaking_news", "political_leadership", "market_price"]:
            ttl = min(ttl, 300)
        self._CACHE[cache_key] = (now_ts, ttl, res_data)

        return res_data

    async def search_web(self, query: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Provider-independent web search service returning normalized results per Requirement 6:
        {
          "query": "...",
          "results": [
            {
              "title": "...",
              "url": "...",
              "snippet": "...",
              "publishedAt": "...",
              "source": "...",
              "relevanceScore": 0.95
            }
          ]
        }
        """
        max_results = (options or {}).get("max_results", 6)
        raw_res = await self.search_with_sources(query, max_results=max_results)
        sources = raw_res.get("sources", [])
        
        normalized_results = []
        for s in sources:
            score_val = float(s.get("score", 0))
            norm_score = round(min(max(score_val / 100.0, 0.5), 1.0), 2)
            normalized_results.append({
                "title": s.get("title", ""),
                "url": s.get("url", ""),
                "snippet": s.get("snippet", ""),
                "publishedAt": s.get("published_at") or s.get("date", ""),
                "searchedAt": s.get("searched_at", ""),
                "source": s.get("domain", "") or s.get("tier", "web"),
                "publisher": s.get("publisher", s.get("domain", "")),
                "tier": s.get("tier", "Web Source"),
                "relevanceScore": norm_score
            })
            
        return {
            "query": query,
            "results": normalized_results,
            "evidence": raw_res.get("evidence"),
            "context_text": raw_res.get("context_text", ""),
            "search_failed": raw_res.get("search_failed", False),
            "checked_date": raw_res.get("checked_date", ""),
            "searched_at": raw_res.get("searched_at", "")
        }

    async def searchWeb(self, query: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return await self.search_web(query, options)

    async def search(self, query: str, max_results: int = 6) -> str:
        """Backward-compatible search returning text string."""
        res = await self.search_with_sources(query, max_results=max_results)
        return res.get("context_text", "")

    async def _search_tavily(self, query: str, api_key: str, max_results: int = 6) -> List[Dict[str, Any]]:
        url = "https://api.tavily.com/search"
        is_news = bool(re.search(r"\b(news|affairs|headlines|world|today|breaking|global|geopolitics|war|conflict|election|minister|president|brics|cm|pm)\b", query, re.IGNORECASE))
        target_count = 8 if is_news else max_results
        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "max_results": target_count
        }
        if is_news:
            payload["topic"] = "news"
            payload["days"] = 7

        client = get_shared_client()
        try:
            res = await client.post(url, json=payload, timeout=5.0)
            if res.status_code == 200:
                data = res.json()
                results = []
                for r in data.get("results", [])[:target_count]:
                    title = r.get("title", "").strip()
                    item_url = r.get("url", "").strip()
                    content = r.get("content", "").strip()[:300].replace("\n", " ")
                    pub = r.get("published_date") or ""
                    domain = extract_domain(item_url)
                    if content or title:
                        results.append({
                            "title": title or domain,
                            "url": item_url,
                            "domain": domain,
                            "snippet": content,
                            "date": pub[:10] if pub else ""
                        })
                return results
        except Exception:
            pass
        return []

    async def _search_brave(self, query: str, api_key: str, max_results: int = 4) -> List[Dict[str, Any]]:
        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": api_key
        }
        params = {"q": query, "count": max_results}
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url, headers=headers, params=params)
            if res.status_code == 200:
                data = res.json()
                results = []
                infobox = data.get("infobox", {}).get("results", [])
                if infobox and isinstance(infobox, list):
                    info_desc = infobox[0].get("description") or infobox[0].get("title")
                    info_url = infobox[0].get("url") or ""
                    if info_desc:
                        results.append({
                            "title": "Direct Fact",
                            "url": info_url,
                            "domain": extract_domain(info_url),
                            "snippet": info_desc,
                            "date": ""
                        })
                
                web_results = data.get("web", {}).get("results", [])
                for item in web_results[:max_results]:
                    title = item.get("title", "").strip()
                    item_url = item.get("url", "").strip()
                    desc = item.get("description", "").strip()[:240].replace("\n", " ")
                    if desc or title:
                        results.append({
                            "title": title,
                            "url": item_url,
                            "domain": extract_domain(item_url),
                            "snippet": desc,
                            "date": ""
                        })
                return results
        return []

    async def _search_serper(self, query: str, api_key: str, max_results: int = 4) -> List[Dict[str, Any]]:
        url = "https://google.serper.dev/search"
        headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
        payload = {"q": query, "num": max_results}
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                results = []
                if data.get("answerBox"):
                    ans = data["answerBox"].get("snippet") or data["answerBox"].get("title") or ""
                    link = data["answerBox"].get("link") or ""
                    if ans:
                        results.append({
                            "title": "Direct Answer",
                            "url": link,
                            "domain": extract_domain(link),
                            "snippet": ans,
                            "date": ""
                        })
                for item in data.get("organic", [])[:max_results]:
                    title = item.get("title", "").strip()
                    item_url = item.get("link", "").strip()
                    snippet = item.get("snippet", "").strip()[:240].replace("\n", " ")
                    if snippet or title:
                        results.append({
                            "title": title,
                            "url": item_url,
                            "domain": extract_domain(item_url),
                            "snippet": snippet,
                            "date": ""
                        })
                return results
        return []

    async def _search_google_news(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        results = []
        fetch_url = "https://news.google.com/rss/search"
        params = {"q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"}

        client = get_shared_client()
        try:
            res = await client.get(fetch_url, params=params, headers=headers, timeout=5.0)
            if res.status_code == 200:
                items = re.findall(r'<item>(.*?)</item>', res.text, re.DOTALL)
                for item in items[:max_results]:
                    title_match = re.search(r'<title>(.*?)</title>', item)
                    link_match = re.search(r'<link>(.*?)</link>', item)
                    pub_match = re.search(r'<pubDate>(.*?)</pubDate>', item)
                    source_match = re.search(r'<source[^>]*>(.*?)</source>', item)
                    source_url_match = re.search(r'<source[^>]*url="([^"]+)"', item)
                    if title_match:
                        raw_title = html.unescape(title_match.group(1)).strip()
                        link = html.unescape(link_match.group(1)).strip() if link_match else ""
                        pub = pub_match.group(1).strip() if pub_match else ""
                        source_name = html.unescape(source_match.group(1)).strip() if source_match else ""

                        # Resolve original publisher domain per Requirement 8
                        pub_domain = None
                        if source_url_match:
                            s_dom = extract_domain(source_url_match.group(1))
                            if s_dom and s_dom != "news.google.com":
                                pub_domain = s_dom
                        if not pub_domain and source_name:
                            inferred = infer_domain_from_publisher_name(source_name)
                            if inferred != "news.google.com":
                                pub_domain = inferred
                        if not pub_domain:
                            link_dom = extract_domain(link)
                            pub_domain = link_dom if link_dom != "news.google.com" else "news.google.com"

                        # Clean title by removing trailing " - Publisher Name"
                        clean_title = raw_title
                        if source_name:
                            clean_title = re.sub(rf'\s*-\s*{re.escape(source_name)}$', '', raw_title, flags=re.IGNORECASE).strip()

                        is_aggregator = (pub_domain == "news.google.com")

                        results.append({
                            "title": clean_title or raw_title,
                            "url": link,
                            "domain": pub_domain,
                            "publisher": source_name or pub_domain,
                            "snippet": clean_title or raw_title,
                            "date": pub[:16] if pub else "",
                            "is_aggregator": is_aggregator
                        })
        except Exception:
            pass
        return results

    async def _search_wikipedia(self, query: str) -> List[Dict[str, Any]]:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "opensearch",
            "search": query,
            "limit": "2",
            "namespace": "0",
            "format": "json"
        }
        headers = {"User-Agent": "CretivraAI/1.0 (https://ai.cretivra.com)"}

        client = get_shared_client()
        try:
            res = await client.get(url, params=params, headers=headers, timeout=4.0)
            if res.status_code == 200:
                data = res.json()
                results = []
                titles = data[1] if len(data) > 1 else []
                snippets = data[2] if len(data) > 2 else []
                urls = data[3] if len(data) > 3 else []
                for t, s, u in zip(titles, snippets, urls):
                    clean_s = html.unescape(s).strip()
                    if clean_s or t:
                        results.append({
                            "title": f"Wikipedia: {t}",
                            "url": u,
                            "domain": "wikipedia.org",
                            "snippet": clean_s or f"Reference article for {t}",
                            "date": ""
                        })
                return results
        except Exception:
            pass
        return []

    async def _search_duckduckgo(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        client = get_shared_client()
        try:
            res = await client.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers, timeout=4.0)
            if res.status_code == 200:
                results = []
                blocks = re.findall(r'<div class="result__body"[^>]*>([\s\S]*?)</div>\s*</div>', res.text)
                for b in blocks[:max_results]:
                    link_match = re.search(r'<a class="result__url"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', b)
                    snippet_match = re.search(r'<a class="result__snippet"[^>]*>(.*?)</a>', b)
                    title_match = re.search(r'<a class="result__a"[^>]*>(.*?)</a>', b)
                    
                    raw_url = link_match.group(1).strip() if link_match else ""
                    if "uddg=" in raw_url:
                        from urllib.parse import unquote
                        uddg_match = re.search(r'uddg=([^&]+)', raw_url)
                        if uddg_match:
                            raw_url = unquote(uddg_match.group(1))
                    
                    title = re.sub(r'<[^>]+>', '', title_match.group(1)) if title_match else ""
                    snippet = re.sub(r'<[^>]+>', '', snippet_match.group(1)) if snippet_match else ""
                    
                    title = html.unescape(title).strip()
                    snippet = html.unescape(snippet).strip()
                    
                    if snippet or title:
                        results.append({
                            "title": title or "DuckDuckGo Result",
                            "url": raw_url,
                            "domain": extract_domain(raw_url),
                            "snippet": snippet,
                            "date": ""
                        })
                return results
        except Exception:
            pass
        return []

    async def search_multi_provider(self, query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        """
        Executes multi-provider search and returns the extracted list of search results.
        """
        search_res = await self.search_with_sources(query, max_results=max_results)
        return search_res.get("sources", [])

web_search_service = WebSearchService()

async def search_web(query: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return await web_search_service.search_web(query, options)

async def searchWeb(query: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return await web_search_service.search_web(query, options)
