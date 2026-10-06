import re
import httpx
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import BaseSearchProvider

def extract_domain(url: str) -> str:
    if not url:
        return "web"
    try:
        netloc = urlparse(url).netloc
        netloc = re.sub(r'^www\.', '', netloc)
        return netloc or "web"
    except Exception:
        return "web"

class TavilyProvider(BaseSearchProvider):
    """
    Internal Tavily web-search infrastructure provider.
    Powering Asura Web Intelligence with live temporal grounding.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "TAVILY_API_KEY", "") or ""

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def health_check(self) -> Dict[str, Any]:
        if not self.is_available():
            return {"status": "unconfigured", "available": False}
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": self.api_key, "query": "test", "max_results": 1}
                )
                if res.status_code == 200:
                    return {"status": "connected", "available": True}
        except Exception as e:
            logger.debug(f"Tavily health check notice: {e}")
        return {"status": "error", "available": False}

    async def search(
        self,
        query: str,
        max_results: int = 5,
        include_images: bool = False,
        days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executes search via Tavily API.
        Returns:
            {
                "results": [{"title": ..., "url": ..., "domain": ..., "snippet": ..., "date": ...}],
                "images": [{"url": ..., "description": ...}],
                "query": query
            }
        """
        if not self.is_available():
            return {"results": [], "images": [], "query": query}

        url = "https://api.tavily.com/search"
        is_news = bool(re.search(
            r"\b(news|affairs|headlines|world|today|breaking|global|geopolitics|war|conflict|election|minister|president|brics|cm|pm|latest)\b",
            query,
            re.IGNORECASE
        ))

        payload: Dict[str, Any] = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "include_images": include_images,
            "max_results": max(max_results, 5)
        }
        if is_news or days:
            payload["topic"] = "news"
            payload["days"] = days or 3

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    clean_results = []
                    seen_urls = set()

                    for r in data.get("results", []):
                        item_url = (r.get("url") or "").strip()
                        if not item_url or item_url in seen_urls:
                            continue
                        seen_urls.add(item_url)

                        title = (r.get("title") or "").strip()
                        content = (r.get("content") or "").strip().replace("\n", " ")
                        domain = extract_domain(item_url)
                        pub_date = r.get("published_date") or ""

                        clean_results.append({
                            "title": title or domain,
                            "url": item_url,
                            "domain": domain,
                            "snippet": content[:300],
                            "date": pub_date[:10] if pub_date else ""
                        })

                    # Real images extracted from search
                    clean_images = []
                    raw_images = data.get("images", [])
                    for img in raw_images:
                        if isinstance(img, str) and img.startswith("http"):
                            clean_images.append({
                                "url": img,
                                "thumbnail": img,
                                "title": query.title(),
                                "source_url": img,
                                "source_domain": extract_domain(img),
                                "attribution": extract_domain(img)
                            })
                        elif isinstance(img, dict) and img.get("url"):
                            img_url = img.get("url")
                            desc = img.get("description") or query.title()
                            clean_images.append({
                                "url": img_url,
                                "thumbnail": img_url,
                                "title": desc,
                                "source_url": img_url,
                                "source_domain": extract_domain(img_url),
                                "attribution": extract_domain(img_url)
                            })

                    return {
                        "results": clean_results[:max_results],
                        "images": clean_images,
                        "query": query
                    }
                else:
                    logger.warning(f"Tavily search API returned status {res.status_code}")
        except Exception as e:
            logger.warning(f"Tavily search exception: {e}")

        return {"results": [], "images": [], "query": query}

tavily_provider = TavilyProvider()
