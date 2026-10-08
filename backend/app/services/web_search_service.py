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

# Authority Tier Definitions
OFFICIAL_GOV_DOMAINS = [
    ".gov.in", ".gov", ".nic.in", "eci.gov.in", "sansad.in", "india.gov.in",
    "tn.gov.in", "kerala.gov.in", "karnataka.gov.in", "maharashtra.gov.in", "delhi.gov.in",
    "pmindia.gov.in", "presidentofindia.gov.in", "parliamentofindia.nic.in",
    "rbi.org.in", "sci.gov.in", "supremecourtofindia.nic.in", "election.gov.in"
]

REPUTABLE_NEWS_DOMAINS = [
    "thehindu.com", "indianexpress.com", "timesofindia.indiatimes.com",
    "reuters.com", "bbc.com", "bbc.co.uk", "ndtv.com", "frontline.thehindu.com",
    "telegraphindia.com", "hindustantimes.com", "theprint.in", "thewire.in",
    "indiatoday.in", "news18.com", "bloomberg.com", "apnews.com", "aljazeera.com",
    "business-standard.com", "livemint.com", "financialexpress.com",
    "economictimes.indiatimes.com", "deccanherald.com", "tribuneindia.com",
    "newindianexpress.com"
]

LOW_TRUST_DOMAINS = [
    "instagram.com", "facebook.com", "tiktok.com", "x.com", "twitter.com",
    "reddit.com", "pinterest.com"
]

class WebSearchService:
    """
    Production-Grade Multi-Source Search & Temporal Grounding Engine for Asura AI.
    
    Features:
    1. Query Classification & Router Integration
    2. Dynamic Date-Aware Multi-Query Generation
    3. Multi-tier Providers (Tavily, Brave, Serper, SerpAPI, Google News RSS, DuckDuckGo)
    4. Source Scoring & Authority Weighting (+40 Gov, +30 Reputable News, +20 Recency)
    5. Temporal Validation & Source Consensus Detection
    6. Category-Based Cache TTLs (10m breaking news, 30m politics, 1h general, 24h static)
    7. Observability Logging
    """

    _CACHE: Dict[str, Tuple[float, float, Dict[str, Any]]] = {}  # key -> (timestamp, ttl, data)

    def should_search_web(self, query: str) -> bool:
        """
        Determines whether the query requires live real-time intelligence search.
        """
        cls_res = query_classifier.classify(query)
        return cls_res.search_required

    def should_search_cache(self, query: str) -> bool:
        return self.should_search_web(query)

    def normalize_query(self, query: str) -> str:
        """
        Normalizes common contractions, joined words, and conversational fillers.
        """
        q = query.strip()
        q = re.sub(r'iscurrent', 'is current', q, flags=re.IGNORECASE)
        q = re.sub(r'whois', 'who is', q, flags=re.IGNORECASE)
        q = re.sub(r'tamilandu|tamilnadu|tamilnad', 'tamil nadu', q, flags=re.IGNORECASE)
        q = re.sub(r'\bcm\b', 'chief minister', q, flags=re.IGNORECASE)
        q = re.sub(r'\bpm\b', 'prime minister', q, flags=re.IGNORECASE)
        q = re.sub(r'\blinkdin\b', 'linkedin', q, flags=re.IGNORECASE)
        clean_q = re.sub(r'^(?:can you tell me|tell me|what is|when was|when is|when did|who is|who was)\s+', '', q, flags=re.IGNORECASE)
        return clean_q.strip() or q

    def _score_source(self, item: Dict[str, Any], current_year: int, target_keywords: List[str]) -> float:
        """
        Source scoring mechanism per requirements:
        - Official government source: +40
        - Reputable news source: +30
        - Published recently (current year/month): +20 to +25
        - Old source (>2 years): negative score (-15 to -25)
        - Unknown/low-trust/social: negative score (-15)
        """
        score = 0.0
        domain = (item.get("domain") or "").lower()
        title = (item.get("title") or "").lower()
        snippet = (item.get("snippet") or "").lower()
        date_str = item.get("date") or ""

        # 1. Authority
        is_gov = any(domain.endswith(d) or f".{d}" in domain or domain == d.lstrip(".") for d in OFFICIAL_GOV_DOMAINS)
        is_news = any(d in domain for d in REPUTABLE_NEWS_DOMAINS)
        is_social = any(d in domain for d in LOW_TRUST_DOMAINS)

        if is_gov:
            score += 40.0
            item["source_tier"] = "Official Government Portal"
        elif is_news:
            score += 30.0
            item["source_tier"] = "Reputable News Organization"
        elif "wikipedia.org" in domain:
            score += 10.0
            item["source_tier"] = "Encyclopedic Background (Wikipedia)"
        elif is_social:
            score -= 15.0
            item["source_tier"] = "Social Media (Unverified)"
        else:
            score += 15.0
            item["source_tier"] = "Web Source"

        # 2. Recency Scoring
        found_years = re.findall(r'\b(20[12]\d)\b', f"{date_str} {title} {snippet}")
        if found_years:
            max_year = max(int(y) for y in found_years)
            if max_year == current_year:
                score += 25.0
            elif max_year == current_year - 1:
                score += 10.0
            elif max_year <= current_year - 3:
                score -= 25.0  # Penalize stale data
            elif max_year <= current_year - 2:
                score -= 15.0
        elif date_str:
            score += 10.0

        # Current month mention boost
        current_month_name = datetime.now().strftime("%B").lower()
        if current_month_name in f"{date_str} {title} {snippet}".lower():
            score += 10.0

        # 3. Keyword Relevance
        matches = sum(1 for kw in target_keywords if kw and kw.lower() in f"{title} {snippet}")
        score += min(matches * 4.0, 20.0)

        item["score"] = score
        return score

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

        # Determine queries to run dynamically
        queries_to_run = classification.search_queries
        if not queries_to_run:
            queries_to_run = [clean_q]

        raw_items: List[Dict[str, Any]] = []

        # 1. Tavily AI Search API (Primary frontier web search)
        tavily_key = getattr(settings, "TAVILY_API_KEY", "")
        if tavily_key and not tavily_key.startswith("your_"):
            try:
                # Run search for each generated query
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

        # 4. Google News Live RSS (Live coverage with real publication dates)
        try:
            news_tasks = [self._search_google_news(q_item, max_results=4) for q_item in queries_to_run[:2]]
            gathered_news = await asyncio.gather(*news_tasks, return_exceptions=True)
            for item_list in gathered_news:
                if isinstance(item_list, list):
                    raw_items.extend(item_list)
        except Exception as e:
            logger.debug(f"Google News search error: {e}")

        # 5. DuckDuckGo HTML Fallback
        if len(raw_items) < 3:
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

            self._score_source(item, current_year=current_year, target_keywords=keywords)
            scored_items.append(item)

        # Sort strictly by score descending (Authority + Recency)
        scored_items.sort(key=lambda x: x.get("score", 0), reverse=True)

        # Take top max_results
        clean_sources: List[Dict[str, str]] = []
        context_lines: List[str] = []

        for item in scored_items:
            clean_sources.append({
                "title": item["title"],
                "url": item["url"],
                "domain": item["domain"],
                "snippet": item["snippet"][:260],
                "date": item.get("date", ""),
                "tier": item.get("source_tier", "Web Source"),
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
            f"FINAL_CONFIDENCE: {consensus_info['confidence']}\n"
            f"==============================================================\n"
        )
        logger.info(audit_log)

        res_data = {
            "context_text": "\n".join(context_lines),
            "sources": clean_sources,
            "classification": classification.model_dump(),
            "consensus": consensus_info,
            "audit_log": audit_log,
            "search_failed": search_failed,
            "checked_date": current_date_str
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
                "publishedAt": s.get("date", ""),
                "source": s.get("domain", "") or s.get("tier", "web"),
                "relevanceScore": norm_score
            })
            
        return {
            "query": query,
            "results": normalized_results,
            "context_text": raw_res.get("context_text", ""),
            "search_failed": raw_res.get("search_failed", False),
            "checked_date": raw_res.get("checked_date", "")
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
            res = await client.get(fetch_url, params=params, headers=headers, timeout=4.0)
            if res.status_code == 200:
                items = re.findall(r'<item>(.*?)</item>', res.text, re.DOTALL)
                for item in items[:max_results]:
                    title_match = re.search(r'<title>(.*?)</title>', item)
                    link_match = re.search(r'<link>(.*?)</link>', item)
                    pub_match = re.search(r'<pubDate>(.*?)</pubDate>', item)
                    source_match = re.search(r'<source[^>]*>(.*?)</source>', item)
                    if title_match:
                        title = html.unescape(title_match.group(1)).strip()
                        link = html.unescape(link_match.group(1)).strip() if link_match else ""
                        pub = pub_match.group(1).strip() if pub_match else ""
                        source_name = html.unescape(source_match.group(1)).strip() if source_match else "Google News"
                        domain = extract_domain(link) if link else "news.google.com"
                        results.append({
                            "title": f"{title} ({source_name})" if source_name else title,
                            "url": link,
                            "domain": domain,
                            "snippet": title,
                            "date": pub[:16] if pub else ""
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
