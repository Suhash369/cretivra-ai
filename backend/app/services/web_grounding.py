import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.core.logging import logger
from app.providers.tavily import tavily_provider, extract_domain

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
    Dedicated Web Grounding Service for Asura AI by Cretivra.
    Retrieves, deduplicates, and preserves verified real-time sources without fabrication.
    """

    def __init__(self):
        self.enabled = getattr(settings, "WEB_SEARCH_ENABLED", True)

    async def ground_query(self, query: str, max_sources: int = 5) -> WebGroundingResult:
        if not self.enabled:
            return WebGroundingResult(
                success=False,
                context_text="",
                sources=[],
                query_used=query,
                error="Asura web search is currently disabled."
            )

        clean_q = self._generate_search_query(query)
        if not tavily_provider.is_available():
            logger.warning("Tavily provider unconfigured or unavailable for web grounding.")
            return WebGroundingResult(
                success=False,
                context_text="",
                sources=[],
                query_used=clean_q,
                error="Asura couldn't access current information right now."
            )

        try:
            search_res = await tavily_provider.search(clean_q, max_results=max_sources)
            raw_results = search_res.get("results", [])

            if not raw_results:
                return WebGroundingResult(
                    success=False,
                    context_text="",
                    sources=[],
                    query_used=clean_q,
                    error="Asura could not find verified current information for this query."
                )

            # Filter duplicates and build clean sources
            sources: List[AsuraSource] = []
            context_lines: List[str] = []
            seen_urls = set()

            for idx, r in enumerate(raw_results, 1):
                url = (r.get("url") or "").strip()
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)

                title = (r.get("title") or "Source").strip()
                snippet = (r.get("snippet") or "").strip()
                domain = r.get("domain") or extract_domain(url)

                sources.append(AsuraSource(
                    title=title,
                    url=url,
                    domain=domain,
                    snippet=snippet
                ))

                context_lines.append(f"[{idx}] [{title}]({url}): {snippet} (Domain: {domain})")
                if len(sources) >= max_sources:
                    break

            return WebGroundingResult(
                success=True,
                context_text="\n".join(context_lines),
                sources=sources,
                query_used=clean_q
            )
        except Exception as e:
            logger.error(f"Error executing Asura web grounding: {e}")
            return WebGroundingResult(
                success=False,
                context_text="",
                sources=[],
                query_used=clean_q,
                error="Asura couldn't access current information right now."
            )

    def _generate_search_query(self, user_prompt: str) -> str:
        """Generates an optimized web search query from user prompt."""
        q = user_prompt.strip()
        # Strip common conversation prefixes
        q = re.sub(r"^(?:please\s+)?(?:can\s+you\s+)?(?:tell\s+me|search|look\s+up|find)\s+(?:about\s+)?", "", q, flags=re.IGNORECASE)
        q = re.sub(r"^(?:what\s+is\s+the\s+latest\s+news\s+about|what\s+is\s+the\s+latest\s+on)\s+", "", q, flags=re.IGNORECASE)
        q = re.sub(r"^(?:what\s+is\s+the\s+current\s+price\s+of)\s+", "", q, flags=re.IGNORECASE)
        return q.strip() or user_prompt.strip()

web_grounding_service = WebGroundingService()
