import re
import html
import httpx
import asyncio
from typing import Optional, List
from app.core.logging import logger

class WebSearchService:
    """
    Zero-Cost Real-Time Live Web Search Service for Cretivra AI.
    Enables LLMs to answer questions about breaking news, current events,
    current political leaders, live sports, and 2025/2026 updates.
    """

    SEARCH_INTENT_PATTERNS = [
        r"\b(?:current|currently|latest|today|now|recent|recently|breaking|live)\b",
        r"\b(?:who is|who are|what is the current|who is the current)\b",
        r"\b(?:2025|2026|2027)\b",
        r"\b(?:chief minister|prime minister|president|governor|cm of|pm of)\b",
        r"\b(?:stock price|weather in|election results|who won|score)\b",
        r"\b(?:news about|update on|what happened)\b"
    ]

    def should_search_web(self, query: str) -> bool:
        """
        Determines whether the user prompt requires live real-time web search.
        """
        q = query.strip().lower()
        if len(q) < 4:
            return False

        # Exclude pure code/math/translation prompts
        if any(prefix in q for prefix in ["write code", "solve", "calculate", "translate", "generate image", "create image"]):
            return False

        for pattern in self.SEARCH_INTENT_PATTERNS:
            if re.search(pattern, q, re.IGNORECASE):
                return True
        return False

    async def search(self, query: str, max_results: int = 5) -> str:
        """
        Fetches live web search snippets via high-speed HTTP search.
        """
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                res = await client.post(url, data={"q": query}, headers=headers)
                if res.status_code != 200:
                    return ""

                raw_snippets = re.findall(r'<a class="result__snippet"[^>]*>(.*?)</a>', res.text, re.DOTALL)
                results: List[str] = []
                for s in raw_snippets[:max_results]:
                    clean = re.sub(r'<[^>]+>', '', s)
                    clean = html.unescape(clean).strip()
                    if clean and len(clean) > 20:
                        results.append(clean)

                if results:
                    return "\n".join([f"• {r}" for r in results])
        except Exception as e:
            logger.warning(f"Web search error: {e}")

        return ""

web_search_service = WebSearchService()
