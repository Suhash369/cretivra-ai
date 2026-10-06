import re
import httpx
from urllib.parse import urlparse, quote
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import BaseImageSearchProvider
from app.providers.tavily import tavily_provider

def extract_domain(url: str) -> str:
    if not url:
        return "web"
    try:
        netloc = urlparse(url).netloc
        netloc = re.sub(r'^www\.', '', netloc)
        return netloc or "web"
    except Exception:
        return "web"

class ImageSearchProvider(BaseImageSearchProvider):
    """
    Dedicated Real Image Search Provider for Asura AI by Cretivra.
    Retrieves verified real-world images for persons, landmarks, locations, products, and visual concepts.
    Preserves complete source domain and attribution without fabrication.
    """
    def __init__(self):
        self.enabled = getattr(settings, "IMAGE_SEARCH_ENABLED", True)
        self.provider = getattr(settings, "IMAGE_SEARCH_PROVIDER", "tavily")

    async def search(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves authentic real images for a subject or entity.
        Returns:
            [
                {
                    "url": "...",
                    "thumbnail": "...",
                    "title": "...",
                    "source_url": "...",
                    "source_domain": "...",
                    "attribution": "..."
                }
            ]
        """
        if not self.enabled or not query or not query.strip():
            return []

        clean_q = query.strip()
        candidates: List[Dict[str, Any]] = []

        # 1. Tavily Real Image Search (High quality web photos with real URLs)
        if tavily_provider.is_available():
            try:
                tav_res = await tavily_provider.search(clean_q, max_results=max_results, include_images=True)
                for img in tav_res.get("images", []):
                    if await self.validate_result(img):
                        candidates.append(img)
            except Exception as e:
                logger.debug(f"Tavily image search notice: {e}")

        # 2. Wikipedia / Wikimedia Commons authoritative image lookup if needed
        if len(candidates) < max_results:
            try:
                wiki_images = await self._search_wikimedia(clean_q, limit=max_results)
                for img in wiki_images:
                    if await self.validate_result(img):
                        candidates.append(img)
            except Exception as e:
                logger.debug(f"Wikimedia image search notice: {e}")

        # Deduplicate and return verified images
        seen_urls = set()
        verified_images = []
        for item in candidates:
            u = item.get("url", "").strip()
            if not u or u in seen_urls:
                continue
            seen_urls.add(u)
            verified_images.append({
                "url": u,
                "thumbnail": item.get("thumbnail") or u,
                "title": item.get("title") or clean_q.title(),
                "source_url": item.get("source_url") or u,
                "source_domain": item.get("source_domain") or extract_domain(u),
                "attribution": item.get("attribution") or extract_domain(u)
            })
            if len(verified_images) >= max_results:
                break

        return verified_images

    async def validate_result(self, result: Dict[str, Any]) -> bool:
        """
        Validates candidate image URL to guarantee it's a valid remote HTTP/HTTPS resource.
        """
        if not isinstance(result, dict):
            return False
        url = result.get("url") or ""
        if not url or not url.startswith(("http://", "https://")):
            return False
        # Reject data URIs or localhost
        if "localhost" in url or "127.0.0.1" in url or "data:" in url:
            return False
        return True

    async def get_image_details(self, image_id: str) -> Optional[Dict[str, Any]]:
        return None

    async def _search_wikimedia(self, query: str, limit: int = 4) -> List[Dict[str, Any]]:
        """Searches Wikimedia Commons API for verified open-licensed photos."""
        endpoint = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": f"{query} filetype:bitmap",
            "gsrlimit": limit,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "format": "json"
        }
        headers = {"User-Agent": "CretivraAsura/1.0 (info@cretivra.com)"}
        results = []
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=headers) as client:
                res = await client.get(endpoint, params=params)
                if res.status_code == 200:
                    data = res.json()
                    pages = data.get("query", {}).get("pages", {})
                    for page in pages.values():
                        infos = page.get("imageinfo", [])
                        if infos:
                            img_url = infos[0].get("url")
                            thumb_url = infos[0].get("thumburl") or img_url
                            title = page.get("title", "").replace("File:", "")
                            if img_url:
                                results.append({
                                    "url": img_url,
                                    "thumbnail": thumb_url,
                                    "title": title[:60],
                                    "source_url": f"https://commons.wikimedia.org/wiki/{quote(page.get('title', ''))}",
                                    "source_domain": "wikimedia.org",
                                    "attribution": "Wikimedia Commons"
                                })
        except Exception:
            pass
        return results

image_search_provider = ImageSearchProvider()
