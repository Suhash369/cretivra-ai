import re
import httpx
from urllib.parse import quote, urlparse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.core.logging import logger

def extract_domain(url: str) -> str:
    if not url:
        return "web"
    try:
        netloc = urlparse(url).netloc
        netloc = re.sub(r'^www\.', '', netloc)
        return netloc or "web"
    except Exception:
        return "web"

class AsuraSource(BaseModel):
    title: str
    url: str
    domain: str
    snippet: str

class WebGroundingResult(BaseModel):
    success: bool
    context_text: str
    sources: List[AsuraSource]
    query_used: str
    error: Optional[str] = None

class WebGroundingService:
    """
    Dedicated Web Grounding Service for CRETIVRA ASURA.
    Retrieves and preserves verified encyclopedic and web sources without Tavily.
    Guarantees:
    - Zero fake citations
    - Zero invented URLs
    - Transparent disclosure if current information cannot be verified
    """

    def __init__(self):
        self.enabled = getattr(settings, "WEB_SEARCH_ENABLED", True)

    async def ground_query(self, query: str, max_sources: int = 4) -> WebGroundingResult:
        if not self.enabled:
            return WebGroundingResult(
                success=False,
                context_text="",
                sources=[],
                query_used=query,
                error="Asura web search is currently disabled."
            )

        clean_q = self._generate_search_query(query)
        sources: List[AsuraSource] = []
        context_lines: List[str] = []

        headers = {
            "User-Agent": "CretivraAsura/2.0 (https://asura.cretivra.com; assistant@cretivra.com)"
        }

        # 1. Authoritative Wikipedia Search Grounding
        try:
            async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=5.0) as client:
                search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(clean_q)}&format=json"
                res = await client.get(search_url)
                if res.status_code == 200:
                    hits = res.json().get("query", {}).get("search", [])
                    for idx, hit in enumerate(hits[:max_sources], 1):
                        title = hit.get("title", "")
                        snippet_html = hit.get("snippet", "")
                        snippet_clean = re.sub(r'<[^>]+>', '', snippet_html).strip()
                        article_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"

                        sources.append(AsuraSource(
                            title=title,
                            url=article_url,
                            domain="wikipedia.org",
                            snippet=snippet_clean
                        ))
                        context_lines.append(f"[{idx}] [{title}]({article_url}): {snippet_clean} (Domain: wikipedia.org)")
        except Exception as e:
            logger.debug(f"Web grounding lookup notice: {e}")

        if sources:
            return WebGroundingResult(
                success=True,
                context_text="\n".join(context_lines),
                sources=sources,
                query_used=clean_q
            )

        # Transparent disclosure when current info cannot be verified
        return WebGroundingResult(
            success=False,
            context_text="[Asura Notice]: Live information could not be conclusively verified with the available intelligence sources.",
            sources=[],
            query_used=clean_q,
            error="I can't verify that information with the available information."
        )

    def _generate_search_query(self, user_prompt: str) -> str:
        """Generates an optimized search query from user prompt."""
        q = user_prompt.strip()
        q = re.sub(r"^(?:please\s+)?(?:can\s+you\s+)?(?:tell\s+me|search|look\s+up|find)\s+(?:about\s+)?", "", q, flags=re.IGNORECASE)
        q = re.sub(r"^(?:what\s+is\s+the\s+latest\s+news\s+about|what\s+is\s+the\s+latest\s+on)\s+", "", q, flags=re.IGNORECASE)
        q = re.sub(r"^(?:what\s+is\s+the\s+current\s+price\s+of)\s+", "", q, flags=re.IGNORECASE)
        return q.strip() or user_prompt.strip()

web_grounding_service = WebGroundingService()
