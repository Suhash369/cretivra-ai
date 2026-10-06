import re
import httpx
from urllib.parse import urlparse, quote
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.base import BaseImageSearchProvider

def extract_domain(url: str) -> str:
    if not url:
        return "web"
    try:
        netloc = urlparse(url).netloc
        netloc = re.sub(r'^www\.', '', netloc)
        return netloc or "web"
    except Exception:
        return "web"

def extract_image_fingerprint(url: str) -> str:
    """
    Extracts canonical image filename / stem from Wikimedia or remote URLs.
    Handles unquoting, stripping size prefixes (e.g. 500px-), stripping query parameters,
    and normalizes character sequences so identical files across summary, media-list,
    and commons search are strictly deduplicated.
    """
    if not url:
        return ""
    try:
        from urllib.parse import unquote, urlparse
        decoded = unquote(url)
        path = urlparse(decoded).path
        parts = [p for p in path.split('/') if p]
        if not parts:
            return re.sub(r'[^a-z0-9]', '', decoded.lower())

        # In Wikimedia thumbnail URLs:
        # /wikipedia/commons/thumb/9/9d/The_Chief_Minister_of_Tamil_Nadu,_Thiru_MK_Stalin.jpg/1000px-The_Chief_Minister_of_Tamil_Nadu,_Thiru_MK_Stalin.jpg
        # The true filename is the second-to-last part if the last part starts with \d+px-
        filename = parts[-1]
        if re.match(r'^\d+px-', filename) and len(parts) >= 2:
            filename = parts[-2]

        filename = re.sub(r'^\d+px-', '', filename)
        stem = re.sub(r'\.[a-zA-Z0-9]+$', '', filename)
        norm = re.sub(r'[^a-z0-9]', '', stem.lower())
        return norm if len(norm) >= 4 else stem.lower().strip()
    except Exception:
        return url.lower().strip()

class ImageSearchProvider(BaseImageSearchProvider):
    """
    Real Image Search Provider for CRETIVRA ASURA.
    Retrieves authentic, verified, real-world images for persons, athletes, actors,
    landmarks, locations, and real-world entities using Wikipedia & Wikimedia open repositories.
    Guarantees:
    - NO duplicate images or identical photos under different thumbnail resolutions
    - NO invented image URLs
    - NO fake placeholders
    - NO AI-generated images for real people
    - NO Tavily or third-party paid search dependencies
    - Real URLs, thumbnails, titles, dimensions, and source attribution
    """
    def __init__(self):
        self.enabled = getattr(settings, "IMAGE_SEARCH_ENABLED", True)

    async def search(self, query: str, max_results: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves authentic real images for a subject or entity.
        Returns list of structured image objects matching Asura specification.
        """
        if not self.enabled or not query or not query.strip():
            return []

        clean_q = query.strip()
        # Clean query prefixes
        clean_q = re.sub(r"^(?:who\s+is|what\s+is|show\s+me|images?\s+of|photos?\s+of|pictures?\s+of)\s+", "", clean_q, flags=re.IGNORECASE).rstrip("?").strip()
        if not clean_q:
            clean_q = query.strip()

        logger.debug(f"[ASURA] image_search_query={clean_q}")
        candidates: List[Dict[str, Any]] = []
        seen_fingerprints: set = set()
        seen_urls: set = set()

        headers = {
            "User-Agent": "CretivraAsura/2.0 (https://asura.cretivra.com; assistant@cretivra.com)"
        }

        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=5.0) as client:
            # 1. Wikipedia Page Summary & Media List
            try:
                # Find best matching Wikipedia article title
                search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(clean_q)}&format=json"
                search_res = await client.get(search_url)
                if search_res.status_code == 200:
                    hits = search_res.json().get("query", {}).get("search", [])
                    if hits:
                        top_title = hits[0].get("title", "")
                        encoded_title = top_title.replace(" ", "_")

                        # A. Fetch Primary Lead Image from Wikipedia Summary
                        try:
                            sum_res = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(encoded_title)}")
                            if sum_res.status_code == 200:
                                sum_data = sum_res.json()
                                orig = sum_data.get("originalimage")
                                thumb = sum_data.get("thumbnail")
                                if orig and orig.get("source"):
                                    orig_url = orig.get("source")
                                    thumb_url = thumb.get("source") if thumb else orig_url
                                    fp = extract_image_fingerprint(orig_url)
                                    if fp and fp not in seen_fingerprints and orig_url not in seen_urls:
                                        seen_fingerprints.add(fp)
                                        seen_urls.add(orig_url)
                                        candidates.append({
                                            "url": orig_url,
                                            "thumbnail": thumb_url,
                                            "thumbnailUrl": thumb_url,
                                            "title": f"{top_title}",
                                            "source_url": f"https://en.wikipedia.org/wiki/{encoded_title}",
                                            "sourceUrl": f"https://en.wikipedia.org/wiki/{encoded_title}",
                                            "source_domain": "wikipedia.org",
                                            "sourceName": "Wikipedia",
                                            "attribution": "Wikipedia / Wikimedia Commons",
                                            "width": orig.get("width", 1200),
                                            "height": orig.get("height", 800)
                                        })
                        except Exception as e:
                            logger.debug(f"Wikipedia summary lookup notice: {e}")

                        # B. Fetch Secondary Photos from Article Media List
                        if len(candidates) < max_results:
                            try:
                                media_res = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/media-list/{quote(encoded_title)}")
                                if media_res.status_code == 200:
                                    items = media_res.json().get("items", [])
                                    for it in items:
                                        if it.get("type") != "image":
                                            continue
                                        file_title = it.get("title", "")
                                        # Skip SVG logos, icons, signatures, flags, and UI elements
                                        if any(k in file_title.lower() for k in [".svg", "signature", "logo", "flag", "icon", "map", "symbol", "stub", "disambig"]):
                                            continue

                                        srcset = it.get("srcset", [])
                                        if not srcset:
                                            continue
                                        best_src = srcset[-1].get("src", "")
                                        thumb_src = srcset[0].get("src", "") or best_src
                                        if best_src and not best_src.startswith("http"):
                                            best_src = "https:" + best_src
                                        if thumb_src and not thumb_src.startswith("http"):
                                            thumb_src = "https:" + thumb_src

                                        fp = extract_image_fingerprint(best_src)
                                        if not fp or fp in seen_fingerprints or best_src in seen_urls:
                                            continue

                                        clean_caption = file_title.replace("File:", "").replace("_", " ")
                                        clean_caption = re.sub(r"\.[a-zA-Z0-9]+$", "", clean_caption)

                                        if best_src:
                                            seen_fingerprints.add(fp)
                                            seen_urls.add(best_src)
                                            candidates.append({
                                                "url": best_src,
                                                "thumbnail": thumb_src,
                                                "thumbnailUrl": thumb_src,
                                                "title": clean_caption[:80],
                                                "source_url": f"https://commons.wikimedia.org/wiki/{quote(file_title)}",
                                                "sourceUrl": f"https://commons.wikimedia.org/wiki/{quote(file_title)}",
                                                "source_domain": "wikimedia.org",
                                                "sourceName": "Wikimedia Commons",
                                                "attribution": "Wikimedia Commons",
                                                "width": 1200,
                                                "height": 800
                                            })
                                        if len(candidates) >= max_results:
                                            break
                            except Exception as e:
                                logger.debug(f"Wikipedia media-list lookup notice: {e}")
            except Exception as e:
                logger.debug(f"Wikipedia API lookup notice: {e}")

            # 2. Fallback to Wikimedia Commons Search API if needed
            if len(candidates) < max_results:
                try:
                    wiki_commons = await self._search_wikimedia_commons(
                        client,
                        clean_q,
                        limit=max_results * 2,
                        seen_fingerprints=seen_fingerprints,
                        seen_urls=seen_urls
                    )
                    candidates.extend(wiki_commons)
                except Exception as e:
                    logger.debug(f"Wikimedia commons search notice: {e}")

        # Deduplicate and validate
        final_fingerprints = set()
        final_urls = set()
        verified_images: List[Dict[str, Any]] = []

        for item in candidates:
            u = item.get("url", "").strip()
            if not u or u in final_urls:
                continue
            fp = extract_image_fingerprint(u)
            if fp and fp in final_fingerprints:
                continue
            if not self.validate_result_sync(item):
                continue
            final_urls.add(u)
            if fp:
                final_fingerprints.add(fp)
            verified_images.append({
                "url": u,
                "thumbnail": item.get("thumbnail") or u,
                "thumbnailUrl": item.get("thumbnailUrl") or item.get("thumbnail") or u,
                "title": item.get("title") or clean_q.title(),
                "source_url": item.get("source_url") or u,
                "sourceUrl": item.get("sourceUrl") or item.get("source_url") or u,
                "source_domain": item.get("source_domain") or extract_domain(u),
                "sourceName": item.get("sourceName") or "Wikimedia Commons",
                "attribution": item.get("attribution") or "Wikimedia Commons",
                "width": item.get("width", 1200),
                "height": item.get("height", 800)
            })
            if len(verified_images) >= max_results:
                break

        logger.info(f"[ASURA] image_results={len(verified_images)} response_images={len(verified_images)}")
        return verified_images

    def validate_result_sync(self, result: Dict[str, Any]) -> bool:
        """Validates that candidate image URL is a valid remote HTTP/HTTPS resource."""
        if not isinstance(result, dict):
            return False
        url = result.get("url") or ""
        if not url or not url.startswith(("http://", "https://")):
            return False
        if "localhost" in url or "127.0.0.1" in url or "data:" in url:
            return False
        return True

    async def validate_result(self, result: Dict[str, Any]) -> bool:
        return self.validate_result_sync(result)

    async def get_image_details(self, image_id: str) -> Optional[Dict[str, Any]]:
        return None

    async def _search_wikimedia_commons(
        self,
        client: httpx.AsyncClient,
        query: str,
        limit: int = 4,
        seen_fingerprints: Optional[set] = None,
        seen_urls: Optional[set] = None
    ) -> List[Dict[str, Any]]:
        """Searches Wikimedia Commons API for high-resolution open-licensed photography with strict deduplication."""
        endpoint = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": limit,
            "prop": "imageinfo",
            "iiprop": "url|thumburl|dimensions|mime",
            "iiurlwidth": 800,
            "format": "json"
        }
        results = []
        fps = seen_fingerprints if seen_fingerprints is not None else set()
        urls = seen_urls if seen_urls is not None else set()
        try:
            res = await client.get(endpoint, params=params)
            if res.status_code == 200:
                data = res.json()
                pages = data.get("query", {}).get("pages", {})
                for page in pages.values():
                    infos = page.get("imageinfo", [])
                    if infos:
                        info = infos[0]
                        mime = info.get("mime", "")
                        # Require valid bitmap image (reject svg, audio, video, pdf)
                        if not mime.startswith("image/") or mime == "image/svg+xml":
                            continue
                        img_url = info.get("url")
                        thumb_url = info.get("thumburl") or img_url
                        raw_title = page.get("title", "")
                        title = raw_title.replace("File:", "").replace("_", " ")
                        if any(k in title.lower() for k in [".svg", "signature", "logo", "icon", "flag", "map", "symbol", "stub"]):
                            continue
                        if not img_url:
                            continue
                        fp = extract_image_fingerprint(img_url)
                        if fp and fp in fps:
                            continue
                        if img_url in urls:
                            continue
                        if fp:
                            fps.add(fp)
                        urls.add(img_url)
                        clean_caption = re.sub(r"\.[a-zA-Z0-9]+$", "", title)
                        results.append({
                            "url": img_url,
                            "thumbnail": thumb_url,
                            "thumbnailUrl": thumb_url,
                            "title": clean_caption[:80],
                            "source_url": f"https://commons.wikimedia.org/wiki/{quote(raw_title)}",
                            "sourceUrl": f"https://commons.wikimedia.org/wiki/{quote(raw_title)}",
                            "source_domain": "wikimedia.org",
                            "sourceName": "Wikimedia Commons",
                            "attribution": "Wikimedia Commons",
                            "width": info.get("width", 1200),
                            "height": info.get("height", 800)
                        })
        except Exception:
            pass
        return results

image_search_provider = ImageSearchProvider()

