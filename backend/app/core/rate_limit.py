import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class AsuraRateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory token bucket / sliding window rate limiter for expensive Asura AI operations.
    Protects /api/chat, /api/search, /api/images/generate, /api/images/search, and /api/voice/*.
    """

    def __init__(self, app):
        super().__init__(app)
        # Store timestamp history: key -> list of float timestamps
        self.request_history = defaultdict(list)
        # Rate limits: (max_requests, window_seconds)
        self.limits = {
            "/api/chat": (60, 60.0),             # 60 req / min
            "/api/search": (45, 60.0),           # 45 req / min
            "/api/images/generate": (20, 60.0),  # 20 req / min
            "/api/images/search": (40, 60.0),    # 40 req / min
            "/api/voice": (40, 60.0),            # 40 req / min
            "/api/vision": (30, 60.0),           # 30 req / min
        }

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        # Find matching route limit
        matching_limit = None
        for prefix, limit in self.limits.items():
            if path.startswith(prefix):
                matching_limit = limit
                break

        if matching_limit:
            max_reqs, window_sec = matching_limit
            bucket_key = f"{client_ip}:{prefix}"
            now = time.time()
            timestamps = self.request_history[bucket_key]

            # Evict timestamps older than window
            cutoff = now - window_sec
            self.request_history[bucket_key] = [t for t in timestamps if t > cutoff]
            current_count = len(self.request_history[bucket_key])

            if current_count >= max_reqs:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Asura rate limit reached. Please wait a moment before trying again."
                    }
                )

            self.request_history[bucket_key].append(now)

        return await call_next(request)
