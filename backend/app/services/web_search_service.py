import re
import html
import httpx
import asyncio
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.core.logging import logger

class WebSearchService:
    """
    Production-Grade Multi-Source Search Engine Service for Cretivra AI.
    
    Supports:
    1. Tavily AI Search API (Designed specifically for LLM search grounding)
    2. Google Search via Serper.dev API
    3. Google Search via SerpAPI
    4. Google News Live RSS (Zero-cost, reliable on cloud servers)
    5. Wikipedia Live API (Instant verified factual grounding)
    6. DuckDuckGo Search (Fallback)
    """

    SEARCH_INTENT_PATTERNS = [
        r"(?:current|currently|latest|today|now|recent|recently|breaking|live)",
        r"(?:who is|who are|what is the current|who is the current|who is currently|who iscurrent)",
        r"(?:2024|2025|2026|2027)",
        r"(?:chief minister|prime minister|president|governor|cm of|pm of|minister)",
        r"(?:stock price|weather in|election results|who won|score|match|gold rate)",
        r"(?:news about|update on|what happened|current affairs)",
        r"(?:tamilnadu|tamil nadu|india|usa|government|parliament|assembly)"
    ]

    def normalize_query(self, query: str) -> str:
        """
        Normalizes common contractions, joined words, and typos in search queries.
        """
        q = query.strip()
        q = re.sub(r'iscurrent', 'is current', q, flags=re.IGNORECASE)
        q = re.sub(r'whois', 'who is', q, flags=re.IGNORECASE)
        q = re.sub(r'tamilandu|tamilnadu|tamilnad', 'tamil nadu', q, flags=re.IGNORECASE)
        q = re.sub(r'\bcm\b', 'chief minister', q, flags=re.IGNORECASE)
        q = re.sub(r'\bpm\b', 'prime minister', q, flags=re.IGNORECASE)
        return q.strip()

    def should_search_web(self, query: str) -> bool:
        """
        Determines whether the user prompt requires live real-time web search.
        """
        q = query.strip().lower()
        if len(q) < 4:
            return False

        # Exclude pure code/math/translation/image generation prompts
        if any(prefix in q for prefix in ["write code", "solve", "calculate", "translate", "generate image", "create image", "draw", "render"]):
            return False

        # Exclude self-identity, origin, and architecture queries to always assert Cretivra Engine persona
        if any(w in q for w in ["who are you", "who built you", "how were you built", "how you built", "who created you", "what is your name", "what are you", "tell me about yourself"]):
            return False

        for pattern in self.SEARCH_INTENT_PATTERNS:
            if re.search(pattern, q, re.IGNORECASE):
                return True
        return False

    async def search(self, query: str, max_results: int = 6) -> str:
        """
        Multi-tier search pipeline.
        Tries dedicated search APIs first (Tavily, Serper, SerpAPI), then falls back
        to zero-cost Google News RSS, Wikipedia, and DuckDuckGo.
        """
        clean_q = self.normalize_query(query)
        results: List[str] = []

        # 1. Tavily AI Search API (if configured)
        tavily_key = getattr(settings, "TAVILY_API_KEY", "")
        if tavily_key:
            try:
                tavily_res = await self._search_tavily(clean_q, tavily_key, max_results=max_results)
                if tavily_res:
                    return "\n".join(tavily_res[:max_results])
            except Exception as e:
                logger.warning(f"Tavily search error: {e}")

        # 2. Serper (Google Search JSON API, if configured)
        serper_key = getattr(settings, "SERPER_API_KEY", "")
        if serper_key:
            try:
                serper_res = await self._search_serper(clean_q, serper_key, max_results=max_results)
                if serper_res:
                    return "\n".join(serper_res[:max_results])
            except Exception as e:
                logger.warning(f"Serper search error: {e}")

        # 3. SerpAPI (Google Search API, if configured)
        serpapi_key = getattr(settings, "SERPAPI_API_KEY", "")
        if serpapi_key:
            try:
                serpapi_res = await self._search_serpapi(clean_q, serpapi_key, max_results=max_results)
                if serpapi_res:
                    return "\n".join(serpapi_res[:max_results])
            except Exception as e:
                logger.warning(f"SerpAPI search error: {e}")

        # 4. Google News Live RSS Search (Zero-cost, 100% reliable on Cloud/Datacenter IPs)
        try:
            google_results = await self._search_google_news(clean_q, max_results=max_results)
            if google_results:
                results.extend(google_results)
        except Exception as e:
            logger.debug(f"Google News RSS error: {e}")

        # 5. Wikipedia Live API (if results are sparse)
        if len(results) < 3:
            try:
                wiki_results = await self._search_wikipedia(clean_q)
                if wiki_results:
                    results.extend(wiki_results)
            except Exception as e:
                logger.debug(f"Wikipedia search error: {e}")

        # 6. DuckDuckGo HTML / Lite Fallback
        if len(results) < 3:
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
            return "\n".join(unique_results[:max_results])

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
        async with httpx.AsyncClient(timeout=8.0) as client:
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
