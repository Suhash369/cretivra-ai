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

TECHNICAL_TERMS = {
    "stm32", "esp32", "gpio", "uart", "spi", "i2c", "pwm", "adc", "dac",
    "arm", "cortex", "avr", "pic", "microcontroller", "embedded", "driver",
    "pinout", "datasheet", "interrupt", "interrupts", "firmware", "register",
    "pointer", "array", "struct", "class", "function", "algorithm", "react",
    "python", "javascript", "typescript", "compiler", "kernel", "linux",
    "f401re", "nucleo", "arduino", "raspberry", "pi", "freertos", "hal"
}

class EntityDetector:
    """
    Dynamic Entity extraction & disambiguation module for CRETIVRA ASURA.
    Extracts persons, landmarks, places, products, and concepts dynamically from any prompt.
    Supports pronoun & conversational context resolution.
    Accurately identifies technical & embedded hardware concepts without misclassifying them as persons.
    """

    def detect_entity(
        self,
        query: str,
        conversation_context: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[Optional[str], EntityType]:
        q = (query or "").strip()
        q_lower = q.lower()

        # 0. Check for technical / embedded architecture concepts
        for t in TECHNICAL_TERMS:
            if re.search(rf"\b{re.escape(t)}\b", q_lower):
                return None, EntityType.TECHNOLOGY

        # 1. Check for pronoun referential queries (e.g. "How old is he?", "What are his records?")
        has_pronoun = bool(re.search(r"\b(he|him|his|she|her|hers|they|them|their|it|its)\b", q_lower))
        if has_pronoun and conversation_context:
            context_entity = self._extract_recent_entity_from_context(conversation_context)
            if context_entity:
                return context_entity, EntityType.PERSON

        # 1.5 Check for Office / Role / Position Queries (e.g. "Who is the current chief minister of Tamil Nadu?")
        if self.is_office_or_role_query(q):
            return None, EntityType.POLITICIAN

        # 2. Who is / Who was / Tell me about [Subject]
        who_patterns = [
            r"^\s*who\s+(?:is|was)\s+([A-Za-z0-9\s\.\-'\"]+?)(?:\?|$)",
            r"^\s*(?:tell\s+me\s+about|biography\s+of|profile\s+of|who's)\s+([A-Za-z0-9\s\.\-'\"]+?)(?:\?|$)",
            r"^\s*(?:what\s+do\s+you\s+know\s+about)\s+([A-Za-z0-9\s\.\-'\"]+?)(?:\?|$)",
            r"\b(?:career\s+of|records\s+of|stats\s+of|achievements\s+of)\s+([A-Za-z0-9\s\.\-'\"]+?)(?:\?|$)"
        ]
        for pat in who_patterns:
            m = re.search(pat, q, re.IGNORECASE)
            if m:
                cand = m.group(1).strip().strip("'\"")
                if len(cand) > 1 and not any(cand.lower() == w for w in ["the", "a", "an", "this", "that"]):
                    if not self.is_office_or_role_query(cand):
                        return self._clean_entity_name(cand), EntityType.PERSON

        # 3. Where is / Visit / Location of [Place / Landmark]
        where_match = re.search(r"\b(?:where\s+is|map\s+of|location\s+of|capital\s+of|visit)\s+([A-Za-z\s\.\-']+?)(?:\?|$)", q, re.IGNORECASE)
        if where_match:
            place = where_match.group(1).strip().strip("'\"")
            if len(place) > 2:
                return self._clean_entity_name(place), EntityType.PLACE

        # 4. Show me / Pictures of / Photos of [Subject]
        show_match = re.search(r"\b(?:show\s+me|images?\s+of|photos?\s+of|pictures?\s+of)\s+([A-Za-z0-9\s\.\-]+?)(?:\?|$)", q, re.IGNORECASE)
        if show_match:
            subject = show_match.group(1).strip().strip("'\"")
            if len(subject) > 1:
                return self._clean_entity_name(subject), EntityType.OTHER

        # 5. Dynamic Proper Noun Extraction (Capitalized multi-word phrases)
        words = q.split()
        proper_noun_sequences = []
        current_seq = []
        stop_words = {"Who", "What", "Where", "When", "Why", "How", "Can", "Could", "Would", "Should", "Is", "Are", "Was", "Were", "Tell", "Show", "Give", "Explain", "Write"}

        for w in words:
            clean_w = re.sub(r'^[^\w]+|[^\w]+$', '', w)
            if not clean_w:
                continue
            clean_lower = clean_w.lower()
            if clean_lower in TECHNICAL_TERMS:
                current_seq = []
                continue
            if clean_w[0].isupper() and clean_w not in stop_words:
                current_seq.append(clean_w)
            else:
                if len(current_seq) >= 2:
                    proper_noun_sequences.append(" ".join(current_seq))
                current_seq = []
        if len(current_seq) >= 2:
            proper_noun_sequences.append(" ".join(current_seq))

        if proper_noun_sequences:
            return proper_noun_sequences[0], EntityType.PERSON

        return None, EntityType.OTHER

    def extract_multiple_entities(self, query: str) -> List[str]:
        """Extracts multiple entities from comparison requests (e.g. Compare Virat Kohli with Rohit Sharma)."""
        q = (query or "").strip()
        comp_match = re.search(r"\bcompare\s+([A-Za-z0-9\s\.\-']+?)\s+(?:with|and|to|vs|versus)\s+([A-Za-z0-9\s\.\-']+?)(?:\?|$)", q, re.IGNORECASE)
        if comp_match:
            e1 = self._clean_entity_name(comp_match.group(1).strip())
            e2 = self._clean_entity_name(comp_match.group(2).strip())
            return [e1, e2]
        return []

    def _clean_entity_name(self, name: str) -> str:
        cleaned = re.sub(r'[\s\u202f\xa0]+', ' ', name or '')
        cleaned = re.sub(r'^(?:the|a|an|about|pictures? of|photos? of)\s+', '', cleaned, flags=re.IGNORECASE).strip()
        return cleaned.title()

    def is_office_or_role_query(self, query: str) -> bool:
        """Detects if query or entity candidate is an office, title, or position rather than a literal person's name."""
        q_lower = (query or "").lower()
        role_patterns = [
            r"\b(?:chief\s+minister|cm)\b",
            r"\b(?:prime\s+minister|pm)\b",
            r"\b(?:president|vice\s+president)\b",
            r"\b(?:governor|lieutenant\s+governor)\b",
            r"\b(?:ceo|chief\s+executive\s+officer)\b",
            r"\b(?:cfo|cto|coo)\b",
            r"\b(?:captain\s+of|skipper\s+of)\b",
            r"\b(?:chairman|chairperson|director\s+general)\b",
            r"\b(?:chancellor|mayor|head\s+of\s+state)\b"
        ]
        return any(re.search(p, q_lower) for p in role_patterns)

    async def resolve_office_holder(self, query: str) -> Optional[str]:
        """
        Dynamically resolves the actual person holding the requested office or position.
        Uses fast Groq inference (with temporal 2026 reality).
        Guarantees NO static hardcoding.
        """
        try:
            from app.providers.groq import GroqProvider
            from app.core.logging import logger
            gp = GroqProvider()
            if not gp.is_available():
                return None

            prompt = (
                f"Identify the real-world person who holds the office or leadership role described in: \"{query}\" "
                "(the current incumbent). Return ONLY the person's full name (e.g., 'M. K. Stalin' or 'Pinarayi Vijayan' or 'Satya Nadella'). "
                "Do not include any extra words, explanation, titles, or quotes."
            )
            resp = await gp.chat("fast", [{"role": "user", "content": prompt}])
            raw_name = resp.get("message", {}).get("content", "").strip()
            
            # Normalize all unicode whitespace to standard ASCII space
            raw_name = re.sub(r'[\s\u202f\xa0]+', ' ', raw_name).strip()
            clean_name = re.sub(r'["\'.]', '', raw_name).strip()
            if not raw_name or "unknown" in clean_name.lower() or len(raw_name) > 60:
                return None
            resolved = raw_name.strip(" '\"`.")
            logger.info(f"[ASURA] Resolved office holder for '{query}': '{resolved}'")
            return resolved
        except Exception:
            return None

    def _extract_recent_entity_from_context(self, context: List[Dict[str, Any]]) -> Optional[str]:
        """Extracts the active entity from previous conversation turns."""
        for msg in reversed(context):
            content = msg.get("content", "")
            if msg.get("role") == "user":
                ent, etype = self.detect_entity(content)
                if ent and etype != EntityType.TECHNOLOGY and ent.lower() not in ["he", "she", "it", "they"]:
                    return self._clean_entity_name(ent)
            elif msg.get("role") == "assistant":
                m = re.search(r"\b([A-Z][a-z]+(?:[\s\u202f\xa0]+[A-Z][a-z]+)+)\b", content)
                if m:
                    cand = m.group(1)
                    if not any(w in cand for w in ["Asura", "Cretivra", "Artificial Intelligence", "United States"]):
                        return self._clean_entity_name(cand)
        return None

entity_detector = EntityDetector()
