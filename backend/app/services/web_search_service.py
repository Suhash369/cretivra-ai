import re
import html
import httpx
import asyncio
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.core.logging import logger

class WebSearchService:
    """
    Production-Grade Multi-Source Search Engine Service for Asura AI by Cretivra.
    
    Supports:
    1. Tavily AI Search API (Designed specifically for LLM search grounding)
    2. Google Search via Serper.dev API
    3. Google Search via SerpAPI
    4. Google News Live RSS (Zero-cost, reliable on cloud servers)
    5. Wikipedia Live API (Instant verified factual grounding)
    6. DuckDuckGo Search (Fallback)
    """

    SEARCH_INTENT_PATTERNS = [
        r"(?:current|currently|latest|today|now|recent|recently|breaking|live|upcoming|new)",
        r"(?:who is|who are|what is the current|who is the current|who is currently|who iscurrent)",
        r"(?:202[3-9])",
        r"(?:chief minister|prime minister|president|governor|cm of|pm of|minister)",
        r"(?:stock price|weather in|election results|who won|score|match|gold rate|cryptocurrency|crypto|bitcoin)",
        r"(?:news about|update on|what happened|current affairs)",
        r"(?:tamilnadu|tamil nadu|india|usa|government|parliament|assembly)",
        r"(?:release|released|releasing|launch|launched|launching|premiere|premiered|air date|ott|trailer|teaser)",
        r"(?:movie|film|cinema|box office|review|cast of|actor|actress|director)",
        r"(?:winner|won|champion|cup|tournament|vs|final)",
        r"(?:alive|dead|age of|net worth|died|born|salary|price of)",
        r"(?:status of|when is|when will|when was|is\s+.+\s+(?:released|out|available|alive|dead|delayed|cancelled|postponed|open|closed))",
        r"^(?:is|was|did|has|will)\b.+\b(?:released|finished|started|happened|true|real|available|active)\b"
    ]

    _CACHE: Dict[str, Any] = {}
    _CACHE_TTL: float = 600.0  # 10 minutes cache

    def normalize_query(self, query: str) -> str:
        """
        Normalizes common contractions, joined words, and typos in search queries,
        and extracts key search intent keywords.
        """
        q = query.strip()
        q = re.sub(r'iscurrent', 'is current', q, flags=re.IGNORECASE)
        q = re.sub(r'whois', 'who is', q, flags=re.IGNORECASE)
        q = re.sub(r'tamilandu|tamilnadu|tamilnad', 'tamil nadu', q, flags=re.IGNORECASE)
        q = re.sub(r'\bcm\b', 'chief minister', q, flags=re.IGNORECASE)
        q = re.sub(r'\bpm\b', 'prime minister', q, flags=re.IGNORECASE)
        q = re.sub(r'\blinkdin\b', 'linkedin', q, flags=re.IGNORECASE)
        
        # Strip conversational prefix filler for faster, sharper search hits
        clean_q = re.sub(r'^(?:can you tell me|tell me|what is|when was|when is|when did|who is|who was)\s+', '', q, flags=re.IGNORECASE)
        return clean_q.strip() or q

    async def search(self, query: str, max_results: int = 6) -> str:
        """
        Multi-tier accelerated intelligence retrieval pipeline.
        Utilizes in-memory caching and concurrent source querying.
        """
        import time
        clean_q = self.normalize_query(query)
        cache_key = clean_q.lower().strip()

        # Check in-memory cache for instant 0ms response
        now = time.time()
        if cache_key in self._CACHE:
            cached_time, cached_res = self._CACHE[cache_key]
            if now - cached_time < self._CACHE_TTL:
                return cached_res

        # 1. Tavily AI Search API (if configured) - fastest & highest quality
        tavily_key = getattr(settings, "TAVILY_API_KEY", "")
        if tavily_key:
            try:
                tavily_res = await self._search_tavily(clean_q, tavily_key, max_results=max_results)
                if tavily_res:
                    res_str = "\n".join(tavily_res[:max_results])
                    self._CACHE[cache_key] = (now, res_str)
                    return res_str
            except Exception as e:
                logger.warning(f"Tavily search error: {e}")

        # 2. Brave Search API (if configured)
        brave_key = getattr(settings, "BRAVE_API_KEY", "")
        if brave_key:
            try:
                brave_res = await self._search_brave(clean_q, brave_key, max_results=max_results)
                if brave_res:
                    res_str = "\n".join(brave_res[:max_results])
                    self._CACHE[cache_key] = (now, res_str)
                    return res_str
            except Exception as e:
                logger.warning(f"Brave search error: {e}")

        # 3. Serper (Google Search JSON API, if configured)
        serper_key = getattr(settings, "SERPER_API_KEY", "")
        if serper_key:
            try:
                serper_res = await self._search_serper(clean_q, serper_key, max_results=max_results)
                if serper_res:
                    res_str = "\n".join(serper_res[:max_results])
                    self._CACHE[cache_key] = (now, res_str)
                    return res_str
            except Exception as e:
                logger.warning(f"Serper search error: {e}")

        # 4. Concurrent zero-cost fallback (Google News RSS & Wikipedia concurrently)
        results: List[str] = []
        try:
            tasks = [
                self._search_wikipedia(clean_q),
                self._search_google_news(clean_q, max_results=max_results)
            ]
            gathered = await asyncio.gather(*tasks, return_exceptions=True)
            for item in gathered:
                if isinstance(item, list):
                    results.extend(item)
        except Exception as e:
            logger.debug(f"Concurrent search fallback error: {e}")

        # 5. DuckDuckGo HTML Fallback if still empty
        if len(results) < 2:
            try:
                ddg_results = await self._search_duckduckgo(clean_q, max_results=max_results)
                if ddg_results:
                    results.extend(ddg_results)
            except Exception as e:
                logger.debug(f"DuckDuckGo search error: {e}")

        if results:
            seen = set()
            unique_results = []
            for r in results:
                clean = r.strip()
                if clean and clean not in seen and len(clean) > 15:
                    seen.add(clean)
                    unique_results.append(f"• {clean}")
            final_res = "\n".join(unique_results[:max_results])
            self._CACHE[cache_key] = (now, final_res)
            return final_res

        return ""

    async def _search_tavily(self, query: str, api_key: str, max_results: int = 4) -> List[str]:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": True,
            "max_results": max_results
        }
        async with httpx.AsyncClient(timeout=3.5) as client:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                results = []
                if data.get("answer"):
                    results.append(f"• Direct Fact: {data['answer']}")
                for r in data.get("results", [])[:max_results]:
                    title = r.get("title", "").strip()
                    content = r.get("content", "").strip()[:160].replace("\n", " ")
                    if content:
                        results.append(f"• {title}: {content}")
                return results
        return []

    async def _search_brave(self, query: str, api_key: str, max_results: int = 4) -> List[str]:
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
                    if info_desc:
                        results.append(f"• Direct Fact: {info_desc}")
                
                web_results = data.get("web", {}).get("results", [])
                for item in web_results[:max_results]:
                    title = item.get("title", "").strip()
                    desc = item.get("description", "").strip()[:160].replace("\n", " ")
                    if desc:
                        results.append(f"• {title}: {desc}")
                return results
        return []

    async def _search_serper(self, query: str, api_key: str, max_results: int = 4) -> List[str]:
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
                    if ans:
                        results.append(f"• Direct Fact: {ans}")
                for item in data.get("organic", [])[:max_results]:
                    title = item.get("title", "").strip()
                    snippet = item.get("snippet", "").strip()[:160].replace("\n", " ")
                    if snippet:
                        results.append(f"• {title}: {snippet}")
                return results
        return []

    async def _search_serpapi(self, query: str, api_key: str, max_results: int = 4) -> List[str]:
        url = "https://serpapi.com/search.json"
        params = {"q": query, "api_key": api_key, "num": max_results}
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url, params=params)
            if res.status_code == 200:
                data = res.json()
                results = []
                if data.get("answer_box"):
                    ans = data["answer_box"].get("answer") or data["answer_box"].get("snippet") or ""
                    if ans:
                        results.append(f"• Direct Fact: {ans}")
                for item in data.get("organic_results", [])[:max_results]:
                    title = item.get("title", "").strip()
                    snippet = item.get("snippet", "").strip()[:160].replace("\n", " ")
                    if snippet:
                        results.append(f"• {title}: {snippet}")
                return results
        return []

    async def _search_google_news(self, query: str, max_results: int = 5) -> List[str]:
        url = "https://news.google.com/rss/search"
        params = {
            "q": query,
            "hl": "en-IN",
            "gl": "IN",
            "ceid": "IN:en"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            res = await client.get(url, params=params, headers=headers)
            if res.status_code != 200:
                return []

            items = re.findall(r'<item>(.*?)</item>', res.text, re.DOTALL)
            results = []
            for item in items[:max_results]:
                title_match = re.search(r'<title>(.*?)</title>', item)
                pub_match = re.search(r'<pubDate>(.*?)</pubDate>', item)
                if title_match:
                    title = html.unescape(title_match.group(1)).strip()
                    pub = pub_match.group(1).strip() if pub_match else ""
                    results.append(f"{title} ({pub})" if pub else title)
            return results

    async def _search_wikipedia(self, query: str) -> List[str]:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "opensearch",
            "search": query,
            "limit": "2",
            "namespace": "0",
            "format": "json"
        }
        headers = {"User-Agent": "CretivraAI/1.0 (https://ai.cretivra.com)"}

        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            res = await client.get(url, params=params, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if len(data) >= 3 and data[2]:
                    return [html.unescape(d).strip() for d in data[2] if d.strip()]
        return []

    async def _search_duckduckgo(self, query: str, max_results: int = 4) -> List[str]:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            res = await client.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers)
            if res.status_code == 200:
                raw_snippets = re.findall(r'<a class="result__snippet"[^>]*>(.*?)</a>', res.text, re.DOTALL)
                results = []
                for s in raw_snippets[:max_results]:
                    clean = re.sub(r'<[^>]+>', '', s)
                    clean = html.unescape(clean).strip()
                    if clean:
                        results.append(clean)
                return results
        return []

web_search_service = WebSearchService()
