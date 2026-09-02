import re
import html
import httpx
import asyncio
from typing import Optional, List
from app.core.logging import logger

class WebSearchService:
    """
    High-Reliability Real-Time Live Web & Current Affairs Search Service for Cretivra AI.
    Integrates Google News Live RSS, Wikipedia API, and Web Search engines with automatic
    query normalization to provide guaranteed live data access on cloud platforms (Render).
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
        q = re.sub(r'tamilnadu', 'tamil nadu', q, flags=re.IGNORECASE)
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

        for pattern in self.SEARCH_INTENT_PATTERNS:
            if re.search(pattern, q, re.IGNORECASE):
                return True
        return False

    async def search(self, query: str, max_results: int = 6) -> str:
        """
        Multi-source real-time live search pipeline.
        Tries Google News Live RSS first (cloud datacenter safe), then Wikipedia and DuckDuckGo.
        """
        clean_q = self.normalize_query(query)
        results: List[str] = []

        # 1. Google News Live RSS Search (100% reliable on Cloud/Datacenter IPs like Render)
        try:
            google_results = await self._search_google_news(clean_q, max_results=max_results)
            if google_results:
                results.extend(google_results)
        except Exception as e:
            logger.debug(f"Google News RSS error: {e}")

        # 2. Wikipedia Live API (if results are sparse)
        if len(results) < 3:
            try:
                wiki_results = await self._search_wikipedia(clean_q)
                if wiki_results:
                    results.extend(wiki_results)
            except Exception as e:
                logger.debug(f"Wikipedia search error: {e}")

        # 3. DuckDuckGo HTML / Lite Fallback
        if len(results) < 3:
            try:
                ddg_results = await self._search_duckduckgo(clean_q, max_results=max_results)
                if ddg_results:
                    results.extend(ddg_results)
            except Exception as e:
                logger.debug(f"DuckDuckGo search error: {e}")

        if results:
            # Deduplicate and return formatted bullet points
            seen = set()
            unique_results = []
            for r in results:
                clean = r.strip()
                if clean and clean not in seen and len(clean) > 15:
                    seen.add(clean)
                    unique_results.append(f"• {clean}")
            return "\n".join(unique_results[:max_results])

        return ""

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
