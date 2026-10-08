import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.intent import intent_detector, AsuraIntent
from app.core.entity import entity_detector, EntityType
from app.core.logging import logger

class RoutingDecision(BaseModel):
    intent: str
    entity: Optional[str] = None
    entity_type: Optional[str] = None
    requires_web: bool = False
    requires_current_information: bool = False
    requires_images: bool = False
    requires_image_generation: bool = False
    requires_vision: bool = False
    search_query: Optional[str] = None
    image_search_query: Optional[str] = None
    image_generation_prompt: Optional[str] = None
    logical_mode: str = "Asura Balanced"
    reasoning: str = ""

class AsuraRouter:
    """
    Intelligent Router for CRETIVRA ASURA.
    Decides routing, tool selection, web grounding necessity, real image search vs generative media,
    and logical model capabilities based on semantic intent, entity extraction, and conversational context.
    """

    async def route_async(
        self,
        query: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        force_web_search: Optional[bool] = None,
        force_image_mode: Optional[bool] = None,
        selected_model: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> RoutingDecision:
        """
        Asynchronous routing with dynamic office-holder resolution.
        Resolves leaders, chief ministers, CEOs, and positions to actual persons before image search.
        """
        resolved_holder = None
        if entity_detector.is_office_or_role_query(query):
            resolved_holder = await entity_detector.resolve_office_holder(query)

        return self.route(
            query=query,
            attachments=attachments,
            force_web_search=force_web_search,
            force_image_mode=force_image_mode,
            selected_model=selected_model,
            conversation_history=conversation_history,
            resolved_office_holder=resolved_holder
        )

    def route(
        self,
        query: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        force_web_search: Optional[bool] = None,
        force_image_mode: Optional[bool] = None,
        selected_model: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        resolved_office_holder: Optional[str] = None
    ) -> RoutingDecision:
        q = (query or "").strip()
        q_lower = q.lower()

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

        # 1. Detect Intent
        intent, intent_meta = intent_detector.detect_intent(
            q,
            has_image_attachment=has_image_attachment,
            has_doc_attachment=has_doc_attachment
        )

        # 2. Extract Entity with Conversational Context (handles follow-ups like 'How old is he?')
        entity, entity_type = entity_detector.detect_entity(q, conversation_context=conversation_history)
        multiple_entities = entity_detector.extract_multiple_entities(q)
        if multiple_entities:
            entity = " and ".join(multiple_entities)

        # If office-holder was dynamically resolved, attach real person's name
        if resolved_office_holder:
            entity = resolved_office_holder
            entity_type = EntityType.POLITICIAN

        # 3. Defaults
        requires_web = False
        requires_current_info = False
        requires_images = False
        requires_image_gen = False
        requires_vision = False
        logical_mode = "Asura Balanced"
        search_query = None
        image_search_query = None
        image_gen_prompt = None

        # 4. Vision Mode
        if has_image_attachment or intent == AsuraIntent.VISION:
            requires_vision = True
            logical_mode = "Asura Vision"
            intent_val = AsuraIntent.VISION.value

        # 5. Image Generation Intent (e.g. "Generate a futuristic Cretivra office")
        elif intent == AsuraIntent.IMAGE_GENERATION or force_image_mode is True:
            requires_image_gen = True
            logical_mode = "Asura Creative"
            intent_val = AsuraIntent.IMAGE_GENERATION.value
            clean_prompt = re.sub(
                r"^/(?:image|draw|art|flux)\s*",
                "",
                q,
                flags=re.IGNORECASE
            ).strip()
            clean_prompt = re.sub(
                r"\b(?:generate|create|design|draw|paint|sketch|make)\s+(?:an?|the)?\s*(?:image|picture|photo|visual|logo|poster|wallpaper|render)\s*(?:of|for)?\s*",
                "",
                clean_prompt,
                flags=re.IGNORECASE
            ).strip()
            image_gen_prompt = clean_prompt or q

        # 6. Real Image Search (e.g. "Show me Virat Kohli", "Pictures of Paris")
        elif intent == AsuraIntent.IMAGE_SEARCH:
            intent_val = AsuraIntent.IMAGE_SEARCH.value
            requires_images = True
            clean_sub = re.sub(r"\b(?:show\s+me|images?\s+of|photos?\s+of|pictures?\s+of)\s*", "", q, flags=re.IGNORECASE).strip()
            image_search_query = entity or clean_sub or q
            requires_web = False
            logical_mode = "Asura Balanced"

        # 7. Office-Holder Queries (e.g. "Who is the current CM of Tamil Nadu?", "Current CEO of Microsoft")
        elif entity_detector.is_office_or_role_query(q):
            intent_val = AsuraIntent.CURRENT_INFORMATION.value
            requires_web = settings.WEB_GROUNDING_AUTO
            requires_current_info = True
            clean_role = re.sub(r'^(?:who\s+is\s+|tell\s+me\s+about\s+)?(?:the\s+)?(?:current\s+)?', '', q, flags=re.IGNORECASE).rstrip('?').strip()
            if entity:
                # Entity resolved to specific person - search by person name directly
                requires_images = settings.IMAGE_SEARCH_AUTO
                image_search_query = entity
                search_query = q
            else:
                # If office-holder could not be verified, do NOT do generic image search (prevents random statues/monuments)
                requires_images = False
                image_search_query = None
                search_query = q
            logical_mode = "Asura Balanced"

        # 8. Person & Biographical Queries (e.g. "Who is Virat Kohli?", "Tell me about Rohit Sharma")
        elif intent == AsuraIntent.PERSON or (entity and entity_type in [EntityType.PERSON, EntityType.ATHLETE, EntityType.ACTOR, EntityType.POLITICIAN]):
            intent_val = AsuraIntent.PERSON.value
            target_entity = entity or re.sub(r"^\s*who\s+(?:is|was)\s+", "", q, flags=re.IGNORECASE).rstrip("?").strip()
            requires_web = settings.WEB_GROUNDING_AUTO
            requires_current_info = True
            requires_images = settings.IMAGE_SEARCH_AUTO
            search_query = f"{target_entity} biography records achievements"
            image_search_query = target_entity
            logical_mode = "Asura Balanced"

        # 9. Current Information & News (e.g. "What is the latest news about X?", "Current price of iPhone")
        elif intent in [AsuraIntent.CURRENT_INFORMATION, AsuraIntent.NEWS]:
            intent_val = intent.value
            requires_web = settings.WEB_GROUNDING_AUTO
            requires_current_info = True
            search_query = q
            if entity:
                requires_images = settings.IMAGE_SEARCH_AUTO
                image_search_query = entity
            logical_mode = "Asura Balanced"

        # 10. Places & Landmarks (e.g. "Where is Paris?", "Eiffel Tower")
        elif intent == AsuraIntent.PLACE or entity_type in [EntityType.LANDMARK, EntityType.PLACE]:
            intent_val = AsuraIntent.PLACE.value
            requires_web = False
            requires_images = settings.IMAGE_SEARCH_AUTO
            image_search_query = entity or q
            logical_mode = "Asura Balanced"

        # 10. Code & Technical Hardware / Architecture
        elif intent in [AsuraIntent.CODE, AsuraIntent.TECHNICAL]:
            intent_val = intent.value
            requires_web = False
            requires_current_info = False
            requires_images = False
            requires_image_gen = False
            logical_mode = "Asura Coding" if intent == AsuraIntent.CODE else "Asura Balanced"

        elif intent == AsuraIntent.CALCULATION:
            intent_val = AsuraIntent.CALCULATION.value
            requires_web = False
            requires_current_info = False
            requires_images = False
            requires_image_gen = False
            logical_mode = "Asura Fast"

        # 11. General Knowledge & Simple Prompts (e.g. "What is a pointer in C?", "What is 2+2?")
        elif intent == AsuraIntent.GENERAL_KNOWLEDGE:
            intent_val = intent.value
            requires_web = False
            requires_current_info = False
            requires_images = False
            requires_image_gen = False
            # Simple short queries default to Fast mode for low latency
            if len(q.split()) <= 8 and not any(w in q_lower for w in ["compare", "architect", "deep", "analyze"]):
                logical_mode = "Asura Fast"
            else:
                logical_mode = "Asura Balanced"

        else:
            intent_val = intent.value
            logical_mode = "Asura Balanced"

        # Handle explicit client mode overrides
        if selected_model:
            sm = selected_model.lower()
            if any(k in sm for k in ["reason", "deep", "r1"]):
                logical_mode = "Asura Reasoning"
            elif any(k in sm for k in ["code", "coder"]):
                logical_mode = "Asura Coding"
            elif any(k in sm for k in ["fast", "mini", "quick"]):
                logical_mode = "Asura Fast"
            elif any(k in sm for k in ["vision"]):
                logical_mode = "Asura Vision"
            elif any(k in sm for k in ["creative", "art"]):
                logical_mode = "Asura Creative"

        if force_web_search is True:
            requires_web = True
            search_query = search_query or q
        elif force_web_search is False:
            requires_web = False

        if not getattr(settings, "WEB_SEARCH_ENABLED", True):
            requires_web = False
        if not getattr(settings, "IMAGE_SEARCH_ENABLED", True):
            requires_images = False
        if not getattr(settings, "IMAGE_GENERATION_ENABLED", True):
            requires_image_gen = False

        logger.info(
            f"[ASURA] intent={intent_val} entity={entity} "
            f"requires_images={requires_images} requires_web={requires_web} "
            f"logical_mode={logical_mode}"
        )

        return RoutingDecision(
            intent=intent_val,
            entity=entity,
            entity_type=entity_type.value if entity_type else None,
            requires_web=requires_web,
            requires_current_information=requires_current_info,
            requires_images=requires_images,
            requires_image_generation=requires_image_gen,
            requires_vision=requires_vision,
            search_query=search_query,
            image_search_query=image_search_query,
            image_generation_prompt=image_gen_prompt,
            logical_mode=logical_mode,
            reasoning=intent_meta.get("reasoning", "")
        )

asura_router = AsuraRouter()
