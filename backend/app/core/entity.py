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
        stop_words = {
            "Who", "What", "Where", "When", "Why", "How", "Can", "Could", "Would", "Should",
            "Is", "Are", "Was", "Were", "Tell", "Show", "Give", "Explain", "Write",
            "Hello", "Hi", "Hey", "Greetings", "Please", "Thanks", "Thank", "Asura", "Cretivra", "AI"
        }
        assistant_tokens = {"hello", "hi", "hey", "asura", "cretivra", "ai"}

        for w in words:
            clean_w = re.sub(r'^[^\w]+|[^\w]+$', '', w)
            if not clean_w:
                continue
            clean_lower = clean_w.lower()
            if clean_lower in TECHNICAL_TERMS or clean_lower in assistant_tokens:
                if len(current_seq) >= 2:
                    proper_noun_sequences.append(" ".join(current_seq))
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

        # Filter out sequences composed entirely of greetings or assistant brand names
        valid_sequences = [
            seq for seq in proper_noun_sequences
            if not all(tok.lower() in assistant_tokens for tok in seq.split())
        ]

        if valid_sequences:
            return valid_sequences[0], EntityType.PERSON

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

    _office_cache: Dict[str, Any] = {}

    def _get_known_office_holder(self, query: str) -> Optional[str]:
        q_lower = query.lower()
        if "tamil nadu" in q_lower:
            if any(term in q_lower for term in ["cm", "chief minister"]):
                return "C. Joseph Vijay"
            if "governor" in q_lower:
                return "R. N. Ravi"
        if "kerala" in q_lower and any(term in q_lower for term in ["cm", "chief minister"]):
            return "V. D. Satheesan"
        if "karnataka" in q_lower and any(term in q_lower for term in ["cm", "chief minister"]):
            return "Siddaramaiah"
        if "andhra" in q_lower and any(term in q_lower for term in ["cm", "chief minister"]):
            return "N. Chandrababu Naidu"
        if "telangana" in q_lower and any(term in q_lower for term in ["cm", "chief minister"]):
            return "A. Revanth Reddy"
        if "delhi" in q_lower and any(term in q_lower for term in ["cm", "chief minister"]):
            return "Atishi"
        if "maharashtra" in q_lower and any(term in q_lower for term in ["cm", "chief minister"]):
            return "Devendra Fadnavis"
        if ("prime minister" in q_lower or "pm" in q_lower) and "india" in (q_lower + " india"):
            return "Narendra Modi"
        if "president" in q_lower and "india" in q_lower:
            return "Droupadi Murmu"
        return None

    def resolve_office_holder_sync(self, query: str) -> Optional[str]:
        known = self._get_known_office_holder(query)
        if known:
            return known
        clean_q = query.strip().lower()
        if clean_q in self._office_cache:
            import time
            val, exp = self._office_cache[clean_q]
            if time.time() < exp:
                return val
        return None

    async def resolve_office_holder(self, query: str) -> Optional[str]:
        """
        Dynamically resolves the actual person holding the requested office or position.
        Uses verified knowledge first, then live search grounding with in-memory TTL cache.
        """
        known = self._get_known_office_holder(query)
        if known:
            return known

        import time
        clean_q = query.strip().lower()
        now = time.time()
        
        # 1. Fast in-memory cache check (1-hour TTL)
        if clean_q in self._office_cache:
            val, exp = self._office_cache[clean_q]
            if now < exp:
                return val

        try:
            from app.providers.groq import GroqProvider
            from app.services.web_search_service import web_search_service
            from datetime import datetime
            from app.core.logging import logger

            gp = GroqProvider()
            if not gp.is_available():
                return None

            async def _resolve_internal():
                now_dt = datetime.now()
                today_str = now_dt.strftime("%B %d, %Y")
                current_year = now_dt.year

                search_context = ""
                try:
                    live_data = await asyncio.wait_for(
                        web_search_service.search_with_sources(query, max_results=3),
                        timeout=1.2
                    )
                    if live_data and live_data.get("context_text"):
                        search_context = live_data["context_text"]
                except Exception:
                    pass

                context_block = f"\n[Live Verified Intelligence as of {today_str}]:\n{search_context}\n" if search_context else ""

                prompt = (
                    f"Today is {today_str} (Year {current_year}).{context_block}\n"
                    f"Based strictly on the verified live intelligence sources above, who is the current incumbent holding the office or leadership role described in: \"{query}\" as of {today_str}? "
                    "Return ONLY the incumbent person's full name as reported in the live news. Do not mention past leaders, titles, dates, or quotes."
                )
                resp = await gp.chat("fast", [{"role": "user", "content": prompt}])
                raw_name = resp.get("message", {}).get("content", "").strip()
                
                raw_name = re.sub(r'[\s\u202f\xa0]+', ' ', raw_name).strip()
                clean_name = re.sub(r'\(.*?\)', '', raw_name).strip()
                clean_name = re.sub(r'["\'.]', '', clean_name).strip()
                if not clean_name or "unknown" in clean_name.lower() or "sorry" in clean_name.lower() or len(clean_name) > 60:
                    return None
                resolved = clean_name.strip(" '\"`.")
                logger.info(f"[ASURA] Resolved office holder for '{query}': '{resolved}'")
                return resolved

            res = await asyncio.wait_for(_resolve_internal(), timeout=1.8)
            if res:
                self._office_cache[clean_q] = (res, now + 3600)
            return res
        except Exception:
            return None

    def _extract_recent_entity_from_context(self, context: List[Dict[str, Any]], current_query: Optional[str] = None) -> Optional[str]:
        """Extracts the active anchor entity or topic across consecutive conversation turns."""
        if not context:
            return None

        NON_ENTITY_TERMS = {
            "birth date", "date of birth", "age", "current age", "overview", "summary", "details",
            "location", "venue", "schedule", "results", "closing date", "start date", "dates",
            "companies", "company", "net worth", "salary", "biography", "profile", "education",
            "qualification", "family", "wife", "husband", "children", "founder", "ceo", "career",
            "chief minister", "prime minister", "president", "governor", "cm", "pm", "early life",
            "personal life", "achievements", "leadership", "background", "history", "records",
            "key facts", "fast facts", "about", "introduction", "status", "role", "position"
        }

        def _is_valid_candidate(cand: str) -> bool:
            if not cand or len(cand) < 3:
                return False
            c_low = cand.strip().lower()
            if c_low in NON_ENTITY_TERMS:
                return False
            if any(w in c_low for w in [
                "age", "birth", "born", "date", "life", "fact", "detail", "summary",
                "overview", "year", "old", "career", "result", "venue", "location"
            ]):
                return False
            if re.search(r"\d", cand):
                return False
            if any(w in c_low for w in ["asura", "cretivra", "answer"]):
                return False
            return True

        q_clean = (current_query or "").strip().lower()
        prior_messages = [
            m for m in context
            if not q_clean or m.get("content", "").strip().lower() != q_clean
        ]

        # Scan backwards across prior conversation turns for the genuine anchor entity
        for msg in reversed(prior_messages):
            content = (msg.get("content") or "").strip()
            role = msg.get("role")

            # Check for major tournament / sports event first across all messages
            event_m = re.search(
                r"\b((?:(?:19|20)\d{2}\s+)?(?:Asian\s+Games|Olympics?|Olympic\s+Games|World\s+Cup|Commonwealth\s+Games|Champions\s+Trophy)(?:\s+(?:19|20)\d{2})?)\b",
                content,
                re.IGNORECASE
            )
            if event_m:
                return event_m.group(1).strip()

            if role == "user":
                # Check if user message had office query
                if self.is_office_or_role_query(content):
                    holder = self.resolve_office_holder_sync(content)
                    if holder and _is_valid_candidate(holder):
                        return holder

                clean_user = re.sub(
                    r"^(?:who\s+is|who\s+was|when\s+was|when\s+is|where\s+is|where\s+was|what\s+is|tell\s+me\s+about)\s+",
                    "", content, flags=re.IGNORECASE
                ).rstrip("?").strip()
                clean_user = re.sub(
                    r"\b(?:closing\s+date|starting\s+date|start\s+date|end\s+date|schedule|date|born|age|how\s+old|companies|lead)\b",
                    "", clean_user, flags=re.IGNORECASE
                ).strip()
                tokens = clean_user.lower().split()
                if tokens and not any(t in ["he", "him", "his", "she", "her", "it", "its", "they", "them", "that", "this"] for t in tokens):
                    ent, etype = self.detect_entity(content)
                    if ent and _is_valid_candidate(ent):
                        return ent
                    if len(clean_user) > 2 and _is_valid_candidate(clean_user):
                        return self._clean_entity_name(clean_user)

            elif role == "assistant":
                # Check bold entity in assistant message: **Entity Name**
                for m in re.finditer(r"\*\*([^\*]+)\*\*", content):
                    cand = m.group(1).strip()
                    if _is_valid_candidate(cand):
                        return self._clean_entity_name(cand)

                # Check for ## Heading
                heading_match = re.search(r"^##\s+([^\n]+)", content, re.MULTILINE)
                if heading_match:
                    h_text = heading_match.group(1).strip()
                    clean_h = re.sub(
                        r"\b(?:closing\s+date|start\s+date|schedule|results?|venue|location|overview|summary|details)\b",
                        "", h_text, flags=re.IGNORECASE
                    ).strip()
                    if _is_valid_candidate(clean_h):
                        return self._clean_entity_name(clean_h)

        return None

entity_detector = EntityDetector()
