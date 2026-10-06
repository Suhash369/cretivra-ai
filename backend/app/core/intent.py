import re
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple

class AsuraIntent(str, Enum):
    GENERAL_KNOWLEDGE = "GENERAL_KNOWLEDGE"
    CURRENT_INFORMATION = "CURRENT_INFORMATION"
    NEWS = "NEWS"
    PERSON = "PERSON"
    PLACE = "PLACE"
    ORGANIZATION = "ORGANIZATION"
    PRODUCT = "PRODUCT"
    IMAGE_SEARCH = "IMAGE_SEARCH"
    IMAGE_GENERATION = "IMAGE_GENERATION"
    CODE = "CODE"
    DOCUMENT = "DOCUMENT"
    VISION = "VISION"
    VOICE = "VOICE"
    TRANSLATION = "TRANSLATION"
    CALCULATION = "CALCULATION"
    TECHNICAL = "TECHNICAL"
    OTHER = "OTHER"

# Semantic indicators for live temporal / current information queries
TEMPORAL_INDICATORS = [
    r"\blatest\b",
    r"\btoday\b",
    r"\bcurrently\b",
    r"\bcurrent\b",
    r"\brecent\b",
    r"\brecently\b",
    r"\byesterday\b",
    r"\bthis\s+week\b",
    r"\bthis\s+month\b",
    r"\bbreaking\b",
    r"\bnew\b",
    r"\bupdated\b",
    r"\bjust\s+announced\b",
    r"\b2026\b",
    r"\bnow\b",
    r"\bwhat\s+happened\b",
    r"\bwho\s+won\b",
    r"\bscore\b",
    r"\bprice\s+of\b",
    r"\bwho\s+is\s+currently\b",
    r"\bwho\s+is\s+the\s+current\b",
    r"\bstock\s+price\b"
]

# Conversational & non-web patterns
NON_WEB_PATTERNS = [
    r"^\s*(?:what\s+is|explain|describe)\s+(?:a\s+)?(?:pointer\s+in\s+c|binary\s+tree|recursion|polymorphism|interface|closure|async\s+await)\b",
    r"^\s*(?:calculate|solve|evaluate)\s+[-+]?\d+",
    r"^\s*(?:write|code|create)\s+(?:a\s+)?(?:function|script|algorithm|component|regex|sql\s+query)\b",
    r"^\s*(?:hello|hi|hey|good\s+morning|good\s+evening)\b",
    r"^\s*(?:who\s+are\s+you|what\s+are\s+you|who\s+made\s+you|who\s+created\s+you)\b",
    r"^\s*(?:translate|proofread)\b"
]

# Explicit image generation triggers
IMAGE_GENERATION_PATTERNS = [
    r"\b(?:generate|create|design|draw|paint|sketch|make)\s+(?:an?|the|some)?\s*(?:image|picture|photo|logo|poster|illustration|artwork|visual|wallpaper|render)\b",
    r"\b(?:create\s+a\s+logo|design\s+a\s+poster|generate\s+a\s+futuristic|create\s+a\s+cinematic|generate\s+a\s+product\s+concept)\b",
    r"^(?:generate|create|render)\s+a\s+futuristic\b",
    r"^\s*/(?:image|draw|art|flux)\b"
]

# Explicit real image search triggers
IMAGE_SEARCH_PATTERNS = [
    r"\b(?:show\s+me|images?\s+of|photos?\s+of|pictures?\s+of|look\s+like)\b",
    r"\b(?:real\s+images?\s+of|real\s+photos?\s+of)\b"
]

class IntentDetector:
    """
    Intelligent semantic intent classification for Cretivra Asura.
    Distinguishes factual general knowledge, live current events, real person/place queries,
    real image searches, and creative generative media.
    """

    def detect_intent(
        self,
        query: str,
        has_image_attachment: bool = False,
        has_doc_attachment: bool = False
    ) -> Tuple[AsuraIntent, Dict[str, Any]]:
        q = query.strip()
        q_lower = q.lower()

        # 1. Attachment-based intent
        if has_image_attachment:
            return AsuraIntent.VISION, {"reasoning": "User uploaded visual image for inspection."}
        if has_doc_attachment:
            return AsuraIntent.DOCUMENT, {"reasoning": "User attached document for extraction & analysis."}

        # 2. Math & Calculation
        if re.search(r"^\s*(?:what\s+is\s+)?[-+]?\d+(?:\.\d+)?\s*[\+\-\*\/\^\%×÷]\s*[-+]?\d+", q) or re.search(r"^\s*(?:calculate|evaluate|solve)\s+[-+]?\d+", q_lower):
            return AsuraIntent.CALCULATION, {"reasoning": "Mathematical expression detected."}

        # 3. Translation
        if re.search(r"\b(?:translate\s+(?:this|the\s+following|to|into)\b)", q_lower):
            return AsuraIntent.TRANSLATION, {"reasoning": "Text translation requested."}

        # 4. Code & Programming
        if re.search(r"\b(?:write\s+a\s+(?:python|javascript|typescript|c|c\+\+|java|go|rust|sql)?\s*(?:function|script|code|class|component|hook|query))\b", q_lower) or re.search(r"\b(?:debug|refactor|fix\s+syntax\s+error|implement\s+algorithm)\b", q_lower):
            return AsuraIntent.CODE, {"reasoning": "Software engineering or code synthesis request."}

        # 5. Image Generation (Creative creation of new synthetic visual)
        for pattern in IMAGE_GENERATION_PATTERNS:
            if re.search(pattern, q_lower):
                return AsuraIntent.IMAGE_GENERATION, {"reasoning": "Creative image synthesis requested."}

        # 6. Technical Explanations (e.g. "What is a pointer in C?")
        if any(re.search(pat, q_lower) for pat in NON_WEB_PATTERNS):
            if "pointer" in q_lower or "c" in q_lower or "algorithm" in q_lower:
                return AsuraIntent.CODE, {"reasoning": "Technical programming concept definition."}
            return AsuraIntent.GENERAL_KNOWLEDGE, {"reasoning": "General knowledge query not requiring live web search."}

        # 7. Real Image Search (e.g. "Show me Virat Kohli", "Images of Chennai", "Show me Tesla Model 3")
        for pattern in IMAGE_SEARCH_PATTERNS:
            if re.search(pattern, q_lower):
                return AsuraIntent.IMAGE_SEARCH, {"reasoning": "Explicit request for real photos / visual imagery."}

        # 8. News & Breaking Events
        if re.search(r"\b(?:news|headlines|breaking|happening\s+now|world\s+news|daily\s+briefing)\b", q_lower):
            return AsuraIntent.NEWS, {"reasoning": "News and breaking headlines request."}

        # 9. Temporal / Current Information (e.g. "What is the latest news about...", "Current price of...", "Who is currently...")
        if any(re.search(ind, q_lower) for ind in TEMPORAL_INDICATORS):
            return AsuraIntent.CURRENT_INFORMATION, {"reasoning": "Semantic temporal indicator detected requiring live grounding."}

        # 10. Person Query (e.g. "Who is Virat Kohli?")
        if re.search(r"^\s*who\s+(?:is|was)\s+([A-Za-z0-9\s\.\-]+)\??\s*$", q_lower):
            return AsuraIntent.PERSON, {"reasoning": "Biographical subject inquiry for real individual."}

        # 11. Place / Landmark Query (e.g. "Where is Paris?", "Capital of Peru")
        if re.search(r"^\s*(?:where\s+is|map\s+of|location\s+of|capital\s+of)\s+([A-Za-z\s]+)\??\s*$", q_lower):
            return AsuraIntent.PLACE, {"reasoning": "Geographic location or place inquiry."}

        # 12. Product Query (e.g. "iPhone 16 specs", "Tesla Model 3 review")
        if re.search(r"\b(?:iphone|galaxy\s*s|macbook|pixel|playstation|xbox|tesla\s*model)\b", q_lower):
            return AsuraIntent.PRODUCT, {"reasoning": "Consumer product inquiry."}

        # Default fallback
        return AsuraIntent.GENERAL_KNOWLEDGE, {"reasoning": "General knowledge conversational query."}

intent_detector = IntentDetector()
