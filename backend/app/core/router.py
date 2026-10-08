import re
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.time_utils import getCurrentDateTime
from app.core.logging import logger

class QueryIntent(str, Enum):
    REAL_TIME = "REAL_TIME"
    CURRENT_AFFAIRS = "CURRENT_AFFAIRS"
    GENERAL_KNOWLEDGE = "GENERAL_KNOWLEDGE"
    REASONING = "REASONING"
    CODING = "CODING"
    DOCUMENT = "DOCUMENT"
    IMAGE = "IMAGE"
    CREATIVE = "CREATIVE"

class RoutingDecision(BaseModel):
    intent: str
    detected_intent: QueryIntent
    entity: Optional[str] = None
    entity_type: Optional[str] = None
    requires_web: bool = False
    requires_current_information: bool = False
    requires_images: bool = False
    requires_image_generation: bool = False
    requires_vision: bool = False
    is_follow_up: bool = False
    search_query: Optional[str] = None
    search_queries: List[str] = Field(default_factory=list)
    image_search_query: Optional[str] = None
    image_generation_prompt: Optional[str] = None
    logical_mode: str = "Asura Balanced"
    reasoning: str = ""
    current_date: str = ""
    timezone: str = "Asia/Kolkata"

# Real-time triggers
REAL_TIME_KEYWORDS = [
    r"\b(?:current|currently|now|today|latest|recent|recently|present|presently)\b",
    r"\brecent\s+developments?\b",
    r"\bas\s+of\s+today\b",
    r"\bas\s+of\s+now\b",
    r"\bwho\s+is\s+the\s+current\b",
    r"\bwho\s+is\s+currently\b",
    r"\bwho\s+leads\b",
    r"\bwho\s+heads\b",
    r"\blatest\s+news\b",
    r"\blatest\s+update\b",
    r"\bcurrent\s+status\b",
    r"\bthis\s+week\b",
    r"\bthis\s+month\b",
    r"\b2026\b",
    r"\bnewly\s+appointed\b",
    r"\brecently\s+appointed\b",
    r"\blatest\s+price\b",
    r"\bcurrent\s+price\b",
    r"\bcurrent\s+ceo\b",
    r"\bcurrent\s+cm\b",
    r"\bcurrent\s+pm\b",
    r"\bcurrent\s+president\b",
    r"\bcurrent\s+minister\b",
    r"\belection\s+result[s]?\b",
    r"\btoday'?s\s+news\b",
    r"\blatest\s+ai\s+news\b",
    r"\blatest\s+technology\s+news\b",
    r"\blatest\s+sports\s+news\b",
    r"\blatest\s+movie\s+collection\b",
    r"\blatest\s+company\s+news\b",
    r"\bwhat\s+happened\b",
    r"\bwho\s+won\b",
    r"\blive\s+score\b",
    r"\bwho\s+is\s+in\s+power\b"
]

CURRENT_AFFAIRS_KEYWORDS = [
    r"\bcurrent\s+affairs\b",
    r"\bbreaking\s+news\b",
    r"\blatest\s+news\b",
    r"\bnews\s+today\b",
    r"\bwhat\s+happened\s+in\b",
    r"\bnews\s+this\s+week\b",
    r"\bnews\s+about\b",
    r"\bheadlines\b",
    r"\baffairs\s+of\s+today\b"
]

POLITICAL_OFFICES = [
    r"\b(?:chief\s+minister|cm)[s]?\b",
    r"\b(?:prime\s+minister|pm)[s]?\b",
    r"\b(?:president|vice\s+president)[s]?\b",
    r"\b(?:governor|lieutenant\s+governor|lg)[s]?\b",
    r"\b(?:minister|cabinet\s+minister|deputy\s+cm|deputy\s+pm)[s]?\b",
    r"\b(?:chief\s+justice|cji)[s]?\b",
    r"\b(?:mp|mla|senator|chancellor|premier|mayor)[s]?\b",
    r"\b(?:ceo|cfo|cto|coo)\b",
    r"\b(?:captain\s+of|skipper\s+of)\b",
    r"\b(?:who\s+leads|who\s+heads|who\s+runs|who\s+governs)\b"
]

HISTORICAL_INDICATORS = [
    r"\bin\s+(?:19\d\d|200\d|201\d|202[0-4])\b",
    r"\b(?:was\s+the\s+first|who\s+was\s+the\s+first|first\s+chief\s+minister|first\s+prime\s+minister)\b",
    r"\b(?:first\s+president|first\s+governor|founder\s+of|origin\s+of|history\s+of)\b",
    r"\b(?:former|ex-cm|ex-pm|previous|preceding|predecessor|earlier|who\s+served\s+as)\b",
    r"\b(?:between\s+\d{4}\s+and\s+\d{4}|during\s+(?:19\d\d|20[01]\d))\b",
    r"\b(?:when\s+did\s+.+\s+resign|when\s+was\s+.+\s+born|when\s+did\s+.+\s+die)\b"
]

CODE_KEYWORDS = [
    r"\b(?:write\s+code|implement|function|algorithm|bug|error|stack\s+trace|regex)\b",
    r"\b(?:python|javascript|typescript|c\+\+|java|rust|golang|sql|html|css|react)\b",
    r"\b(?:pointer|struct|class|variable|compiler|github|api\s+endpoint)\b"
]

REASONING_KEYWORDS = [
    r"\b(?:prove\s+that|step-by-step\s+reasoning|logical\s+proof|solve\s+the\s+puzzle)\b",
    r"\b(?:deduce|formal\s+proof|mathematical\s+induction|complex\s+reasoning)\b"
]

CREATIVE_KEYWORDS = [
    r"^\s*/(?:image|draw|art|flux)\b",
    r"\b(?:generate|create|design|draw|paint|render)\s+(?:an?|the)?\s*(?:image|picture|photo|visual|logo|wallpaper|poster|illustration)\b"
]

IMAGE_SEARCH_KEYWORDS = [
    r"\b(?:show\s+me|images?\s+of|photos?\s+of|pictures?\s+of)\b"
]

DOCUMENT_KEYWORDS = [
    r"\b(?:summarize\s+this\s+document|analyze\s+this\s+pdf|extract\s+from\s+file)\b"
]

def is_anaphoric_follow_up(query: str) -> bool:
    """
    Checks if a query is an anaphoric follow-up relying on prior conversation turn.
    Returns True for: 'How old is he?', 'What is his party?', 'Tell me more about them'.
    Returns False for standalone queries or queries introducing new entities or locations.
    """
    q_lower = query.strip().lower()
    
    # If the query mentions a new state/country/subject, it is NOT a follow-up
    entities_locations = [
        "tamil nadu", "kerala", "karnataka", "andhra", "telangana", "maharashtra",
        "delhi", "punjab", "bengal", "gujarat", "bihar", "uttar pradesh",
        "india", "usa", "us", "uk", "russia", "china", "japan", "germany",
        "gemini", "openai", "nvidia", "gold", "silver", "cricket"
    ]
    for loc in entities_locations:
        if loc in q_lower:
            return False

    # Check for pronoun continuity
    pronoun_patterns = [
        r"^(?:how\s+old\s+is\s+(?:he|she|they))\b",
        r"\b(?:what\s+about\s+(?:him|her|them|it|his|hers))\b",
        r"\b(?:tell\s+me\s+more\s+about\s+(?:him|her|them|that|this))\b",
        r"\b(?:what\s+is\s+(?:his|her|their)\s+(?:party|age|net\s+worth|career|salary|background))\b",
        r"^(?:and\s+his|and\s+her|and\s+their)\b",
        r"^(?:why\s+did\s+(?:he|she|they))\b"
    ]
    return any(re.search(pat, q_lower) for pat in pronoun_patterns)

def query_router(
    query: str,
    attachments: Optional[List[Dict[str, Any]]] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Production Intent Router for Asura AI.
    Classifies queries into:
    - REAL_TIME
    - GENERAL_KNOWLEDGE
    - REASONING
    - CODING
    - DOCUMENT
    - IMAGE
    - CREATIVE
    - CURRENT_AFFAIRS

    Supports semantic intent detection and dynamic temporal formulation.
    """
    q = (query or "").strip()
    q_lower = q.lower()
    time_info = getCurrentDateTime()
    current_year = time_info["year"]
    current_date_str = time_info["formatted_date"]

    has_image_attachment = False
    has_doc_attachment = False
    if attachments:
        for att in attachments:
            mime = (att.get("mime_type") or "").lower()
            fname = (att.get("filename") or "").lower()
            durl = att.get("data_url") or ""
            if durl or mime.startswith("image/") or any(fname.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]):
                has_image_attachment = True
            else:
                has_doc_attachment = True

    # 1. DOCUMENT
    if has_doc_attachment or any(re.search(p, q_lower) for p in DOCUMENT_KEYWORDS):
        return {
            "intent": QueryIntent.DOCUMENT.value,
            "detected_intent": QueryIntent.DOCUMENT,
            "requires_web": False,
            "force_web_search": False,
            "requires_images": False,
            "logical_mode": "Asura Balanced",
            "reasoning": "Document analysis requested",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 2. IMAGE (Multimodal understanding)
    if has_image_attachment:
        return {
            "intent": QueryIntent.IMAGE.value,
            "detected_intent": QueryIntent.IMAGE,
            "requires_web": False,
            "force_web_search": False,
            "requires_images": False,
            "requires_vision": True,
            "logical_mode": "Asura Vision",
            "reasoning": "Image attachment provided for visual analysis",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 3. CREATIVE (Generative image creation)
    if any(re.search(p, q_lower) for p in CREATIVE_KEYWORDS):
        clean_prompt = re.sub(r"^/(?:image|draw|art|flux)\s*", "", q, flags=re.IGNORECASE).strip()
        clean_prompt = re.sub(
            r"\b(?:generate|create|design|draw|paint|sketch|make)\s+(?:an?|the)?\s*(?:image|picture|photo|visual|logo|poster|wallpaper|render)\s*(?:of|for)?\s*",
            "",
            clean_prompt,
            flags=re.IGNORECASE
        ).strip()
        return {
            "intent": QueryIntent.CREATIVE.value,
            "detected_intent": QueryIntent.CREATIVE,
            "requires_web": False,
            "force_web_search": False,
            "requires_images": False,
            "requires_image_generation": True,
            "image_generation_prompt": clean_prompt or q,
            "logical_mode": "Asura Creative",
            "reasoning": "Generative media creation requested",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 4. Check for Explicit Historical Knowledge (Overrides real-time)
    is_historical = False
    for pat in HISTORICAL_INDICATORS:
        if re.search(pat, q_lower):
            # Only consider historical if not explicitly asking for "current" or "now" or "today"
            if not any(re.search(rt, q_lower) for rt in [r"\bcurrent\b", r"\bnow\b", r"\btoday\b", r"\blatest\b", r"\bright now\b"]):
                is_historical = True
                break

    if is_historical:
        return {
            "intent": QueryIntent.GENERAL_KNOWLEDGE.value,
            "detected_intent": QueryIntent.GENERAL_KNOWLEDGE,
            "requires_web": False,
            "force_web_search": False,
            "requires_images": False,
            "logical_mode": "Asura Balanced",
            "reasoning": "Historical query detected; answered from general knowledge",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 5. CURRENT_AFFAIRS
    is_current_affairs = any(re.search(p, q_lower) for p in CURRENT_AFFAIRS_KEYWORDS)

    # 6. REAL_TIME Detection (Semantic intent + keywords + office holders)
    has_rt_keyword = any(re.search(p, q_lower) for p in REAL_TIME_KEYWORDS)
    is_office_query = any(re.search(p, q_lower) for p in POLITICAL_OFFICES)
    
    # Semantic office holders or leadership query is inherently REAL_TIME (e.g. "who is cm of kerala", "who leads tamil nadu")
    is_real_time = has_rt_keyword or is_office_query or ("who is" in q_lower and ("cm" in q_lower or "pm" in q_lower or "ceo" in q_lower or "president" in q_lower))

    if is_current_affairs or is_real_time:
        detected = QueryIntent.CURRENT_AFFAIRS if is_current_affairs else QueryIntent.REAL_TIME
        
        # Formulate search queries with current date/month/year
        month_name = time_info["month"]
        search_queries = [
            f"{q} {month_name} {current_year}".strip(),
            f"{q} official {current_year}".strip(),
            q
        ]
        
        return {
            "intent": detected.value,
            "detected_intent": detected,
            "requires_web": True,
            "force_web_search": True,
            "requires_current_information": True,
            "requires_images": False,
            "search_query": search_queries[0],
            "search_queries": search_queries,
            "logical_mode": "Asura Balanced",
            "reasoning": f"Real-time knowledge requested; requires live web grounding as of {current_date_str}",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 7. CODING
    if any(re.search(p, q_lower) for p in CODE_KEYWORDS) and any(w in q_lower for w in ["code", "function", "script", "program", "error", "debug"]):
        return {
            "intent": QueryIntent.CODING.value,
            "detected_intent": QueryIntent.CODING,
            "requires_web": False,
            "force_web_search": False,
            "requires_images": False,
            "logical_mode": "Asura Coding",
            "reasoning": "Programming or software engineering request",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 8. REASONING
    if any(re.search(p, q_lower) for p in REASONING_KEYWORDS):
        return {
            "intent": QueryIntent.REASONING.value,
            "detected_intent": QueryIntent.REASONING,
            "requires_web": False,
            "force_web_search": False,
            "requires_images": False,
            "logical_mode": "Asura Reasoning",
            "reasoning": "Deep chain-of-thought mathematical or formal reasoning requested",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 9. IMAGE SEARCH (visual retrieval, separate from web search)
    if any(re.search(p, q_lower) for p in IMAGE_SEARCH_KEYWORDS):
        clean_sub = re.sub(r"\b(?:show\s+me|images?\s+of|photos?\s+of|pictures?\s+of)\s*", "", q, flags=re.IGNORECASE).strip()
        return {
            "intent": QueryIntent.IMAGE.value,
            "detected_intent": QueryIntent.IMAGE,
            "requires_web": False,
            "force_web_search": False,
            "requires_images": True,
            "image_search_query": clean_sub or q,
            "logical_mode": "Asura Balanced",
            "reasoning": "Visual image retrieval requested",
            "current_date": current_date_str,
            "timezone": time_info["timezone"]
        }

    # 10. GENERAL_KNOWLEDGE
    return {
        "intent": QueryIntent.GENERAL_KNOWLEDGE.value,
        "detected_intent": QueryIntent.GENERAL_KNOWLEDGE,
        "requires_web": False,
        "force_web_search": False,
        "requires_images": False,
        "logical_mode": "Asura Balanced",
        "reasoning": "General knowledge query answered from internal intelligence",
        "current_date": current_date_str,
        "timezone": time_info["timezone"]
    }

# Function alias matching Requirement 1
def queryRouter(query: str, attachments: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    return query_router(query, attachments)

class AsuraRouter:
    """Class wrapper for backward compatibility with existing orchestrator."""

    async def route_async(
        self,
        query: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        force_web_search: Optional[bool] = None,
        force_image_mode: Optional[bool] = None,
        selected_model: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> RoutingDecision:
        res = query_router(query, attachments, conversation_history)
        
        # Follow-up check
        is_follow = is_anaphoric_follow_up(query)
        res["is_follow_up"] = is_follow

        # Honor explicit web toggle
        if force_web_search is True:
            res["requires_web"] = True
            res["search_query"] = res.get("search_query") or query
        elif force_web_search is False and not (res["detected_intent"] in [QueryIntent.REAL_TIME, QueryIntent.CURRENT_AFFAIRS]):
            res["requires_web"] = False

        if force_image_mode is True:
            res["requires_image_generation"] = True
            res["logical_mode"] = "Asura Creative"

        # Model selection overrides
        if selected_model:
            sm = selected_model.lower()
            if any(k in sm for k in ["reason", "deep", "r1"]):
                res["logical_mode"] = "Asura Reasoning"
            elif any(k in sm for k in ["code", "coder"]):
                res["logical_mode"] = "Asura Coding"
            elif any(k in sm for k in ["fast", "mini", "quick"]):
                res["logical_mode"] = "Asura Fast"
            elif any(k in sm for k in ["vision"]):
                res["logical_mode"] = "Asura Vision"
            elif any(k in sm for k in ["creative", "art"]):
                res["logical_mode"] = "Asura Creative"

        return RoutingDecision(
            intent=res["intent"],
            detected_intent=res["detected_intent"],
            requires_web=res.get("requires_web", False),
            requires_current_information=res.get("requires_current_information", False),
            requires_images=res.get("requires_images", False),
            requires_image_generation=res.get("requires_image_generation", False),
            requires_vision=res.get("requires_vision", False),
            is_follow_up=res.get("is_follow_up", False),
            search_query=res.get("search_query"),
            search_queries=res.get("search_queries", []),
            image_search_query=res.get("image_search_query"),
            image_generation_prompt=res.get("image_generation_prompt"),
            logical_mode=res.get("logical_mode", "Asura Balanced"),
            reasoning=res.get("reasoning", ""),
            current_date=res.get("current_date", ""),
            timezone=res.get("timezone", "Asia/Kolkata")
        )

asura_router = AsuraRouter()
