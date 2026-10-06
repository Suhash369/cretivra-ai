import re
from enum import Enum
from typing import Optional, Dict, Any, Tuple, List

class EntityType(str, Enum):
    PERSON = "PERSON"
    PLACE = "PLACE"
    COMPANY = "COMPANY"
    ORGANIZATION = "ORGANIZATION"
    PRODUCT = "PRODUCT"
    LANDMARK = "LANDMARK"
    ANIMAL = "ANIMAL"
    HISTORICAL_PERSON = "HISTORICAL_PERSON"
    ATHLETE = "ATHLETE"
    ACTOR = "ACTOR"
    POLITICIAN = "POLITICIAN"
    TECHNOLOGY = "TECHNOLOGY"
    OTHER = "OTHER"

# Known prominent entities and categories for instant authoritative disambiguation
KNOWN_ENTITIES = {
    "virat kohli": ("Virat Kohli", EntityType.ATHLETE),
    "kohli": ("Virat Kohli", EntityType.ATHLETE),
    "rohit sharma": ("Rohit Sharma", EntityType.ATHLETE),
    "ms dhoni": ("MS Dhoni", EntityType.ATHLETE),
    "lionel messi": ("Lionel Messi", EntityType.ATHLETE),
    "messi": ("Lionel Messi", EntityType.ATHLETE),
    "cristiano ronaldo": ("Cristiano Ronaldo", EntityType.ATHLETE),
    "ronaldo": ("Cristiano Ronaldo", EntityType.ATHLETE),
    "vijay": ("Vijay", EntityType.ACTOR),
    "thalapathy vijay": ("Vijay", EntityType.POLITICIAN),
    "actor vijay": ("Vijay", EntityType.ACTOR),
    "c. joseph vijay": ("Vijay", EntityType.POLITICIAN),
    "c joseph vijay": ("Vijay", EntityType.POLITICIAN),
    "joseph vijay": ("Vijay", EntityType.POLITICIAN),
    "shah rukh khan": ("Shah Rukh Khan", EntityType.ACTOR),
    "srk": ("Shah Rukh Khan", EntityType.ACTOR),
    "rajinikanth": ("Rajinikanth", EntityType.ACTOR),
    "kamal haasan": ("Kamal Haasan", EntityType.ACTOR),
    "elon musk": ("Elon Musk", EntityType.PERSON),
    "narendra modi": ("Narendra Modi", EntityType.POLITICIAN),
    "modi": ("Narendra Modi", EntityType.POLITICIAN),
    "donald trump": ("Donald Trump", EntityType.POLITICIAN),
    "trump": ("Donald Trump", EntityType.POLITICIAN),
    "steve jobs": ("Steve Jobs", EntityType.HISTORICAL_PERSON),
    "albert einstein": ("Albert Einstein", EntityType.HISTORICAL_PERSON),
    "einstein": ("Albert Einstein", EntityType.HISTORICAL_PERSON),
    "isaac newton": ("Isaac Newton", EntityType.HISTORICAL_PERSON),
    "nikola tesla": ("Nikola Tesla", EntityType.HISTORICAL_PERSON),
    "sundar pichai": ("Sundar Pichai", EntityType.PERSON),
    "sam altman": ("Sam Altman", EntityType.PERSON),
    "chennai": ("Chennai", EntityType.PLACE),
    "paris": ("Paris", EntityType.PLACE),
    "tokyo": ("Tokyo", EntityType.PLACE),
    "eiffel tower": ("Eiffel Tower", EntityType.LANDMARK),
    "taj mahal": ("Taj Mahal", EntityType.LANDMARK),
    "colosseum": ("Colosseum", EntityType.LANDMARK),
    "apple": ("Apple Inc.", EntityType.COMPANY),
    "google": ("Google", EntityType.COMPANY),
    "tesla": ("Tesla", EntityType.COMPANY),
    "microsoft": ("Microsoft", EntityType.COMPANY),
    "openai": ("OpenAI", EntityType.ORGANIZATION),
    "iphone": ("iPhone", EntityType.PRODUCT),
    "iphone 16": ("iPhone 16", EntityType.PRODUCT),
    "macbook": ("MacBook", EntityType.PRODUCT),
    "tesla model 3": ("Tesla Model 3", EntityType.PRODUCT),
}

class EntityDetector:
    """
    Entity extraction & disambiguation module for Cretivra Asura.
    Identifies persons, athletes, actors, politicians, landmarks, products, and organizations.
    """

    def detect_entity(self, query: str) -> Tuple[Optional[str], EntityType]:
        q = query.strip()
        q_lower = q.lower()

        # 1. Direct dictionary match against known prominent entities
        clean_stripped = re.sub(r'^[^\w]+|[^\w]+$', '', q_lower).strip()
        for key, (canonical_name, etype) in KNOWN_ENTITIES.items():
            if key in q_lower or clean_stripped == key:
                return canonical_name, etype

        # 2. Extract subject from "Who is [Subject]?"
        who_match = re.search(r"^\s*who\s+(?:is|was)\s+([A-Za-z0-9\s\.\-]+?)(?:\?|$)", q, re.IGNORECASE)
        if who_match:
            cand = who_match.group(1).strip()
            cand_lower = cand.lower()
            if cand_lower in KNOWN_ENTITIES:
                return KNOWN_ENTITIES[cand_lower]
            return cand.title(), EntityType.PERSON

        # 3. Extract location from "Where is [Place]?" or "Location of [Place]"
        where_match = re.search(r"\b(?:where\s+is|map\s+of|location\s+of|capital\s+of)\s+([A-Za-z\s]+?)(?:\?|$)", q, re.IGNORECASE)
        if where_match:
            place = where_match.group(1).strip()
            return place.title(), EntityType.PLACE

        # 4. Extract subject from "Show me [Entity]" or "Images of [Entity]"
        show_match = re.search(r"\b(?:show\s+me|images?\s+of|photos?\s+of|pictures?\s+of)\s+([A-Za-z0-9\s]+?)(?:\?|$)", q, re.IGNORECASE)
        if show_match:
            subject = show_match.group(1).strip().title()
            return subject, EntityType.OTHER

        # 5. Extract company/product
        if any(w in q_lower for w in ["iphone", "ipad", "macbook", "galaxy", "pixel", "ps5", "xbox"]):
            prod_match = re.search(r"\b(iphone(?:\s*\d+)?(?:\s*pro)?|galaxy\s*s\d+|macbook(?:\s*pro|\s*air)?|pixel\s*\d+|tesla\s*model\s*[3ysx])\b", q_lower)
            if prod_match:
                return prod_match.group(1).title(), EntityType.PRODUCT

        return None, EntityType.OTHER

entity_detector = EntityDetector()
