from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.web_grounding import web_grounding_service

router = APIRouter(prefix="/search", tags=["Search"])

class WebSearchRequest(BaseModel):
    query: str = Field(..., description="Query to search web intelligence for")
    max_results: Optional[int] = Field(5, ge=1, le=10)

@router.api_route("", methods=["GET", "POST"])
async def web_search_endpoint(
    query: Optional[str] = Query(None),
    payload: Optional[WebSearchRequest] = None
):
    target_q = ""
    max_res = 5
    if payload and payload.query:
        target_q = payload.query.strip()
        max_res = payload.max_results or 5
    elif query:
        target_q = query.strip()

    if not target_q:
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    res = await web_grounding_service.ground_query(target_q, max_sources=max_res)
    return {
        "success": res.success,
        "query": res.query_used,
        "sources": [s.model_dump() for s in res.sources],
        "context": res.context_text,
        "error": res.error
    }
