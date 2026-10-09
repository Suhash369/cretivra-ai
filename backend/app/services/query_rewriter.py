import re
import json
import time
import hashlib
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ValidationError
from app.core.logging import logger
from app.core.model_manager import model_manager

class RewrittenQuery(BaseModel):
    standalone_query: str
    is_followup: bool
    topic_switch: bool
    entities: List[str] = Field(default_factory=list)
    needs_web: bool = True

class QueryRewriterService:
    def __init__(self):
        # 60s TTL cache: {cache_key: (timestamp, RewrittenQuery)}
        self._cache: Dict[str, tuple[float, RewrittenQuery]] = {}

    def _get_cache_key(self, history_last_6_turns: List[Dict[str, Any]], user_msg: str) -> str:
        # Cache by hash(history_tail + message) for 60s
        tail = []
        for m in history_last_6_turns[-2:]:
            role = m.get("role", "")
            content = (m.get("content", "") or "")[:100]
            tail.append(f"{role}:{content}")
        key_raw = f"{'|'.join(tail)}::{user_msg.strip()}"
        return hashlib.sha256(key_raw.encode("utf-8")).hexdigest()

    def _get_from_cache(self, key: str) -> Optional[RewrittenQuery]:
        if key in self._cache:
            ts, item = self._cache[key]
            if time.time() - ts < 60.0:
                logger.debug(f"[QUERY REWRITER] Cache hit for key {key[:8]}")
                return item
            else:
                del self._cache[key]
        return None

    def _set_cache(self, key: str, item: RewrittenQuery) -> None:
        # Periodic purge of expired entries
        now = time.time()
        expired = [k for k, (ts, _) in self._cache.items() if now - ts >= 60.0]
        for k in expired:
            self._cache.pop(k, None)
        self._cache[key] = (now, item)

    def _heuristic_fallback(
        self,
        user_msg: str,
        conversation_state: Optional[Dict[str, Any]],
        history_last_6_turns: List[Dict[str, Any]]
    ) -> RewrittenQuery:
        """
        Fallback if all three providers fail or time out:
        a short message (<= 8 words) that starts with a pronoun or WH-word
        and has no proper noun is a follow-up and gets the last active entity prepended.
        """
        clean_msg = user_msg.strip()
        words = re.findall(r"\b[\w'-]+\b", clean_msg)
        is_short = len(words) <= 8

        wh_pronoun_set = {
            "who", "whom", "whose", "where", "when", "why", "what", "which", "how",
            "he", "she", "it", "they", "his", "her", "their", "its", "him", "them",
            "and", "or", "ok", "okay", "so", "now", "tell", "also"
        }

        first_word = words[0].lower() if words else ""
        starts_with_wh_or_pronoun = first_word in wh_pronoun_set
        if not starts_with_wh_or_pronoun and len(words) > 1 and first_word in {"and", "ok", "so"}:
            starts_with_wh_or_pronoun = words[1].lower() in wh_pronoun_set

        # Check for proper noun: capitalized words not at the beginning of sentence
        has_proper_noun = False
        for i, w in enumerate(words):
            if i > 0 and w[0].isupper() and not w.isupper():
                has_proper_noun = True
                break

        # Extract last active entity from state or history
        last_entity = None
        if conversation_state and conversation_state.get("active_entities"):
            ents = conversation_state["active_entities"]
            if isinstance(ents, list) and ents:
                last_entity = str(ents[-1])

        if not last_entity:
            # Fallback to finding proper nouns in history assistant/user turns
            for turn in reversed(history_last_6_turns):
                c = turn.get("content", "")
                found = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", c)
                # Filter out generic words
                filtered = [f for f in found if f.lower() not in {"asura", "cretivra", "hello", "hi", "today", "the", "what", "who"}]
                if filtered:
                    last_entity = filtered[0]
                    break

        if is_short and starts_with_wh_or_pronoun and not has_proper_noun and last_entity:
            standalone = f"{last_entity}: {clean_msg}"
            return RewrittenQuery(
                standalone_query=standalone,
                is_followup=True,
                topic_switch=False,
                entities=[last_entity],
                needs_web=True
            )

        return RewrittenQuery(
            standalone_query=clean_msg,
            is_followup=False,
            topic_switch=True,
            entities=[],
            needs_web=True
        )

    async def rewrite_query(
        self,
        history_last_6_turns: List[Dict[str, Any]],
        user_msg: str,
        conversation_state: Optional[Dict[str, Any]] = None
    ) -> RewrittenQuery:
        """
        rewrite_query(history_last_6_turns, user_msg, conversation_state)
          -> {standalone_query, is_followup, topic_switch, entities[], needs_web}
        Runs on "Asura Rewriter" (Groq first, then Gemini, then OpenRouter).
        Temperature 0. JSON only. Validate with pydantic.
        """
        clean_msg = user_msg.strip()
        if not clean_msg:
            return RewrittenQuery(standalone_query="", is_followup=False, topic_switch=False, entities=[], needs_web=False)

        # Check cache
        cache_key = self._get_cache_key(history_last_6_turns, clean_msg)
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached

        # If there is no history, a query cannot be a pronoun follow-up
        if not history_last_6_turns:
            result = RewrittenQuery(
                standalone_query=clean_msg,
                is_followup=False,
                topic_switch=True,
                entities=[],
                needs_web=True
            )
            self._set_cache(cache_key, result)
            return result

        # Format history turns for rewriter prompt
        history_formatted = []
        for i, turn in enumerate(history_last_6_turns):
            role = turn.get("role", "user").capitalize()
            content = str(turn.get("content", ""))
            # Truncate content for rewriter prompt efficiency
            if len(content) > 300:
                content = content[:300] + "..."
            history_formatted.append(f"{role}: {content}")

        history_block = "\n".join(history_formatted)

        active_ents = []
        if conversation_state and conversation_state.get("active_entities"):
            active_ents = conversation_state.get("active_entities", [])
        active_entities_hint = f"\nKnown active entities: {', '.join(active_ents)}" if active_ents else ""

        system_prompt = (
            "You are the query rewriter for Asura AI. Your job is to resolve conversational context into a standalone search query.\n"
            "Rules:\n"
            "1. Resolve pronouns (he, she, it, they, his, her, their, him, them) and ellipses/fragments ('where he is born', 'and his wife', 'his age', 'which team does he play for', 'when did he become cm') from conversation history into a clear, complete standalone question (e.g. 'where he is born' -> 'Where was Virat Kohli born?').\n"
            "2. If the user message is self-contained or switches to a new subject/topic (e.g. Kohli -> 'explain e=mc^2', or Tamil Nadu CM -> Kerala CM), return the message unchanged with topic_switch=true and is_followup=false.\n"
            "3. NEVER answer the question.\n"
            "4. Keep the user's language.\n"
            "5. Return JSON ONLY matching this schema:\n"
            "{\n"
            '  "standalone_query": "resolved standalone question or unchanged message",\n'
            '  "is_followup": true,\n'
            '  "topic_switch": false,\n'
            '  "entities": ["entity1", ...],\n'
            '  "needs_web": true\n'
            "}"
        )

        user_prompt = (
            f"Conversation history:\n{history_block}{active_entities_hint}\n\n"
            f"Latest user message to rewrite:\n{clean_msg}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        t0 = time.time()
        raw_response = await model_manager.complete_task(
            logical_mode="Asura Rewriter",
            messages=messages,
            json_mode=True,
            max_tokens=200,
            timeout=3.0,
            temperature=0.0
        )
        duration_ms = int((time.time() - t0) * 1000)
        logger.info(f"[QUERY REWRITER] Asura Rewriter completed in {duration_ms}ms (response length: {len(raw_response or '')})")

        if raw_response:
            try:
                # Defensive parsing: extract JSON block if wrapped
                text_to_parse = raw_response.strip()
                if "```json" in text_to_parse:
                    text_to_parse = text_to_parse.split("```json", 1)[1].split("```", 1)[0].strip()
                elif "```" in text_to_parse:
                    text_to_parse = text_to_parse.split("```", 1)[1].split("```", 1)[0].strip()
                else:
                    match = re.search(r"\{.*\}", text_to_parse, re.DOTALL)
                    if match:
                        text_to_parse = match.group(0)

                data = json.loads(text_to_parse)
                validated = RewrittenQuery(
                    standalone_query=str(data.get("standalone_query") or clean_msg).strip(),
                    is_followup=bool(data.get("is_followup", False)),
                    topic_switch=bool(data.get("topic_switch", False)),
                    entities=[str(e) for e in data.get("entities", []) if e],
                    needs_web=bool(data.get("needs_web", True))
                )
                logger.info(
                    f"[QUERY REWRITER] Success: '{clean_msg}' -> '{validated.standalone_query}' "
                    f"(followup={validated.is_followup}, topic_switch={validated.topic_switch}, entities={validated.entities})"
                )
                self._set_cache(cache_key, validated)
                return validated
            except (json.JSONDecodeError, ValidationError, Exception) as pe:
                logger.warning(f"[QUERY REWRITER] JSON parse/validation error: {pe}, response: {raw_response[:200]}")

        # Fallback if all providers failed or output was invalid
        logger.info("[QUERY REWRITER] Applying heuristic fallback")
        fallback_result = self._heuristic_fallback(clean_msg, conversation_state, history_last_6_turns)
        self._set_cache(cache_key, fallback_result)
        return fallback_result

query_rewriter = QueryRewriterService()
