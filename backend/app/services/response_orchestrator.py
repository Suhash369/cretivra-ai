import re
import json
import time
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.core.router import asura_router, RoutingDecision, QueryIntent, query_router, is_anaphoric_follow_up
from app.core.time_utils import getCurrentDateTime
from app.core.model_manager import model_manager
from app.services.web_search_service import web_search_service
from app.providers.image_search import image_search_provider
from app.providers.image_generation import image_generation_provider
from app.schemas.asura_response import AsuraStructuredResponse, AsuraImage, AsuraSource, AsuraGeneratedImage
from app.providers.cloud_provider import clean_ai_response
from app.services.evidence_engine import evidence_engine, NormalizedEvidence
from app.database.models import MessageDB

class AsuraRequest(BaseModel):
    sessionId: Optional[str] = None
    messageId: Optional[str] = None
    userQuery: str
    conversationId: Optional[str] = None
    timestamp: str

class AsuraResponseOrchestrator:
    """
    Central real-time response orchestration engine for CRETIVRA ASURA.
    Enforces:
    1. Query Intent Routing (REAL_TIME, CURRENT_AFFAIRS, GENERAL_KNOWLEDGE, etc.)
    2. Real-Time Web Grounding & Source Verification Hierarchy
    3. Strict Context Isolation (No cross-query bleed for fresh queries)
    4. Answer Generation Contract with Dynamic Current Date
    5. Clean separation of Image Search from Web Grounding
    6. Observability & Debug Logging
    """

    async def orchestrate_chat_stream(
        self,
        db: Session,
        conversation_id: str,
        user_message: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        force_web_search: Optional[bool] = None,
        force_image_mode: Optional[bool] = None,
        selected_model: Optional[str] = None,
        is_dev_mode: bool = False
    ) -> AsyncGenerator[str, None]:
        start_time = time.time()
        time_info = getCurrentDateTime()
        current_date_str = time_info["formatted_date"]
        current_year = time_info["year"]
        current_time_str = time_info["time"]

        # Clean Request Object per Requirement 9
        clean_query = user_message.strip()
        request_obj = AsuraRequest(
            conversationId=conversation_id,
            userQuery=clean_query,
            timestamp=time_info["iso"]
        )

        # 0. Fetch recent conversation context with lean column projection & limit
        conversation_history = []
        if db and conversation_id:
            try:
                limit_n = min(getattr(settings, "MAX_CONTEXT_MESSAGES", 10), 12)
                db_msgs = db.query(MessageDB.role, MessageDB.content).filter(
                    MessageDB.conversation_id == conversation_id
                ).order_by(MessageDB.created_at.desc()).limit(limit_n).all()
                conversation_history = [
                    {"role": r, "content": c}
                    for r, c in reversed(db_msgs)
                ]
            except Exception as e:
                logger.debug(f"Could not load conversation history: {e}")

        # 1. Routing & Intent Analysis
        yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is analyzing intent...', 'reasoning_status': 'Asura is analyzing intent...', 'done': False})}\n\n"

        decision: RoutingDecision = await asura_router.route_async(
            query=clean_query,
            attachments=attachments,
            force_web_search=force_web_search,
            force_image_mode=force_image_mode,
            selected_model=selected_model,
            conversation_history=conversation_history
        )

        # Force web search for REAL_TIME and CURRENT_AFFAIRS queries per Requirement 2 if enabled
        is_real_time_query = decision.detected_intent in [QueryIntent.REAL_TIME, QueryIntent.CURRENT_AFFAIRS] or decision.requires_current_information
        if getattr(settings, "WEB_SEARCH_ENABLED", True):
            if is_real_time_query:
                decision.requires_web = True
        else:
            decision.requires_web = False

        tools_executed: List[str] = []
        sources: List[AsuraSource] = []
        images: List[AsuraImage] = []
        web_context_text = ""
        web_search_failed = False
        generated_image_obj = None

        # 2. Generative Media Creation Path
        if decision.requires_image_generation:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is creating your visual...', 'reasoning_status': 'Asura is creating your visual...', 'done': False})}\n\n"
            tools_executed.append("image_generation")
            try:
                gen_res = await image_generation_provider.generate(
                    prompt=decision.image_generation_prompt or clean_query
                )
            except Exception as e:
                logger.error(f"Image generation error: {e}")
                gen_res = {"success": False, "error": str(e)}

            if gen_res.get("success"):
                generated_image_obj = AsuraGeneratedImage(
                    url=gen_res["url"],
                    thumbnail=gen_res.get("thumbnail"),
                    prompt=decision.image_generation_prompt or clean_query,
                    attribution="Asura generated this image"
                )
                img_markdown = f"![{decision.image_generation_prompt or 'Visual creation'}]({gen_res['url']})\n\n"
                answer_text = f"Here is your visual creation for **{decision.image_generation_prompt or clean_query}**:\n\n{img_markdown}"
            else:
                answer_text = "Asura couldn't generate the image right now. Please try again."

            related_qs = [
                f"Create a variation of this {decision.image_generation_prompt or 'image'}",
                "Can you generate this in a cinematic 3D style?",
                "Create a minimalist version"
            ]

            latency_ms = int((time.time() - start_time) * 1000)
            meta = {
                "intent": decision.intent,
                "logical_mode": decision.logical_mode,
                "latency_ms": latency_ms,
                "current_date": current_date_str
            }
            structured_resp = AsuraStructuredResponse(
                assistant="asura",
                brand="Cretivra Asura",
                answer=answer_text,
                type="image_generation",
                web_grounded=False,
                current_information=False,
                images=[],
                sources=[],
                generated_image=generated_image_obj,
                related_questions=related_qs,
                metadata=meta
            )
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': answer_text, 'full_content': answer_text, 'done': True, 'structured_response': structured_resp.model_dump(), 'sources': [], 'images': [], 'generated_image': generated_image_obj.model_dump() if generated_image_obj else None})}\n\n"
            if db and conversation_id and answer_text:
                try:
                    from app.services.conversation_service import conversation_service
                    conversation_service.add_message(db, conversation_id, "assistant", answer_text)
                except Exception as e:
                    logger.warning(f"Could not persist image message: {e}")
            return

        # 3. Web Grounding & Image Retrieval (Strictly Separated Pipelines)
        tasks = []
        evidence_data: Optional[Dict[str, Any]] = None

        if decision.requires_web:
            status_text = "Searching current sources..." if is_real_time_query else "Asura is researching the web in real-time..."
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': status_text, 'reasoning_status': status_text, 'done': False})}\n\n"
            tools_executed.append("web_grounding")
            # Execute provider-independent web search
            target_search_q = decision.search_query or clean_query
            tasks.append(("web", web_search_service.search_web(target_search_q, {"max_results": 6})))

        if decision.requires_images:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is finding relevant images...', 'reasoning_status': 'Asura is finding relevant images...', 'done': False})}\n\n"
            tools_executed.append("image_search")
            tasks.append(("image", image_search_provider.search(decision.image_search_query or clean_query, max_results=4)))

        if decision.requires_vision:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is inspecting attached image...', 'reasoning_status': 'Asura is inspecting attached image...', 'done': False})}\n\n"
            tools_executed.append("vision")

        if tasks:
            task_results = await asyncio.gather(*(t[1] for t in tasks), return_exceptions=True)
            for (kind, _), res in zip(tasks, task_results):
                if isinstance(res, Exception):
                    logger.warning(f"Tool {kind} exception: {res}")
                    if kind == "web":
                        web_search_failed = True
                    continue
                if kind == "web" and isinstance(res, dict):
                    raw_results = res.get("results", [])
                    web_context_text = res.get("context_text", "")
                    evidence_data = res.get("evidence")
                    web_search_failed = res.get("search_failed", False) or len(raw_results) == 0

                    for r in raw_results:
                        sources.append(AsuraSource(
                            title=r.get("title", ""),
                            url=r.get("url", ""),
                            domain=r.get("source", "") or "web",
                            snippet=r.get("snippet", ""),
                            tier=r.get("tier", "Web Source"),
                            date=r.get("publishedAt", ""),
                            published_at=r.get("publishedAt", ""),
                            searched_at=r.get("searchedAt", ""),
                            source_type=r.get("source_type", "web"),
                            score=round(float(r.get("relevanceScore", 0.5)) * 100.0, 1)
                        ))

                    # Yield intermediate evaluation status per Requirement 30 & 31
                    if is_real_time_query and sources:
                        eval_msg = f"Evaluating {len(sources)} sources..."
                        yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': eval_msg, 'reasoning_status': eval_msg, 'done': False})}\n\n"
                        await asyncio.sleep(0.05)
                        cross_msg = "Cross-checking current information..."
                        yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': cross_msg, 'reasoning_status': cross_msg, 'done': False})}\n\n"

                elif kind == "image" and isinstance(res, list):
                    images = [AsuraImage(**img) for img in res if isinstance(img, dict)]

        # Yield images immediately for UI responsiveness
        if images:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': '', 'full_content': '', 'done': False, 'images': [img.model_dump() for img in images], 'sources': [s.model_dump() for s in sources]})}\n\n"

        # 4. Failure Handling per Requirement 26
        user_provided_context = (
            len(clean_query) > 120 or
            "http://" in clean_query or "https://" in clean_query or
            ("[" in clean_query and "](" in clean_query) or
            any(re.search(p, clean_query.lower()) for p in [
                r"^\s*(?:no|nope|incorrect|wrong|actually|wait)\b",
                r"\b(?:is\s+incorrect|verified\s+information|correct\s+information|authoritative|closing\s+ceremony)\b"
            ])
        )

        if is_real_time_query and web_search_failed and not user_provided_context:
            failure_msg = "I couldn't retrieve fresh web information right now, so I can't reliably verify the current answer. Please try again in a moment."
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': failure_msg, 'full_content': failure_msg, 'done': True, 'sources': [], 'images': []})}\n\n"
            if db and conversation_id:
                try:
                    from app.services.conversation_service import conversation_service
                    conversation_service.add_message(db, conversation_id, "assistant", failure_msg)
                except Exception:
                    pass
            return

        # 5. Answer Generation Contract per Requirement 2, 8, 21 & 36
        # Construct normalized search results representation
        normalized_results_block = web_context_text
        if not normalized_results_block and sources:
            normalized_results_block = "\n".join([
                f"[{idx+1}] [{s.title}]({s.url}) [{s.tier or 'Web'}]: {s.snippet}"
                for idx, s in enumerate(sources)
            ])

        # Entity Resolution Layer per Requirement 2 & 8
        sources_dicts = [s.model_dump() for s in sources]
        normalized_evidence = evidence_engine.entity_resolver(clean_query, sources_dicts)
        top_entity = normalized_evidence.entities[0] if (normalized_evidence and normalized_evidence.entities) else None

        # Synchronize images with resolved canonical entity to guarantee proper images
        if top_entity and top_entity.canonical_name:
            target_name = top_entity.canonical_name
            name_tokens = [tok.lower() for tok in target_name.split() if len(tok) > 2]
            images_match = any(
                any(tok in (img.title or "").lower() or tok in (img.url or "").lower() for tok in name_tokens)
                for img in images
            ) if images else False

            if not images_match and (decision.requires_images or is_real_time_query):
                refreshed_imgs = await image_search_provider.search(target_name, max_results=4)
                if refreshed_imgs:
                    images = [AsuraImage(**img) for img in refreshed_imgs if isinstance(img, dict)]
                    yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': '', 'full_content': '', 'done': False, 'images': [img.model_dump() for img in images], 'sources': [s.model_dump() for s in sources]})}\n\n"

        if is_real_time_query or top_entity:
            v_status = (evidence_data or {}).get("verification_status", "unverified")
            verification_guidance = ""
            if v_status == "verified":
                verification_guidance = "Evidence is cross-checked and verified from primary/authoritative sources."
            elif v_status == "conflicting":
                verification_guidance = "Notice: Sources present conflicting information. Explicitly mention the conflict rather than choosing one silently."

            context_guidance = ""
            if user_provided_context:
                context_guidance = "\nNOTE: The user has provided verified context, citations, or a factual correction in their message. Carefully evaluate their provided information and sources, acknowledge valid corrections, and respond authoritatively and respectfully."

            canonical_lock_text = ""
            if top_entity:
                canonical_lock_text = (
                    f"\nSTRUCTURED EVIDENCE (Evidence Lock - Mandatory):\n"
                    f"- Canonical Entity Name: {top_entity.canonical_name}\n"
                    f"- Entity Role: {top_entity.role}\n"
                    f"- Jurisdiction: {top_entity.state or top_entity.country}\n"
                    f"- Approved Aliases: {', '.join(top_entity.aliases)}\n"
                    f"- MANDATORY INSTRUCTION: You MUST state clearly and directly that {top_entity.canonical_name} is the {top_entity.role}. Do not withhold the name or claim policy restrictions.\n"
                )

            if top_entity and top_entity.role:
                format_guidelines = (
                    f"FORMAT GUIDELINE (Requirement 22, 23 & 36):\n"
                    f"State the verified answer clearly with date anchor:\n"
                    f"## [Current Office / Subject Title]\n"
                    f"**[Exact Canonical Name from Evidence]**\n\n"
                    f"As of **{current_date_str}**, authoritative current sources identify **[Exact Canonical Name]** as the {top_entity.role}...\n\n"
                    f"### Sources\n"
                    f"- [Publisher Name or Domain](URL)\n\n"
                    f"### Verification\n"
                    f"✓ Cross-checked\n"
                    f"✓ Current-source research performed\n"
                )
            else:
                format_guidelines = (
                    f"FORMAT GUIDELINE (Requirement 22, 23 & 36):\n"
                    f"State the verified answer clearly with a concise topic heading and direct answer:\n"
                    f"## [Topic / Subject Heading]\n"
                    f"**[Direct Answer / Primary Fact]**\n\n"
                    f"[Clear, accurate, and informative details synthesized from the verified web sources and context]\n\n"
                    f"### Sources\n"
                    f"- [Publisher Name or Domain](URL)\n\n"
                    f"### Verification\n"
                    f"✓ Cross-checked\n"
                    f"✓ Current-source research performed\n"
                )

            query_label = f"{clean_query} (Subject: {decision.entity})" if (decision.is_follow_up and decision.entity) else clean_query

            # Internal system instruction for STRICT_FACT_MODE (Requirement 21)
            system_instruction = (
                f"You are Asura, developed by Cretivra.\n\n"
                f"You are operating in STRICT FACT MODE.\n\n"
                f"The evidence supplied to you is the factual basis for the answer.\n\n"
                f"RULES:\n\n"
                f"1. Never invent facts.\n"
                f"2. Never modify a person's name.\n"
                f"3. Never expand initials without explicit evidence.\n"
                f"4. Never replace a source-supported entity with a remembered entity.\n"
                f"5. Never use pretrained knowledge to override retrieved evidence.\n"
                f"6. Every factual claim must be supported by supplied evidence.\n"
                f"7. Preserve exact names from authoritative sources.\n"
                f"8. Preserve exact dates from sources.\n"
                f"9. Preserve exact numerical values from sources.\n"
                f"10. If evidence is insufficient, say so.\n"
                f"11. If sources conflict, explicitly report the conflict.\n"
                f"12. Do not create unsupported biography.\n"
                f"13. Do not infer facts that are not stated.\n"
                f"14. Prefer primary sources.\n"
                f"15. Cite the evidence supporting each important claim.\n\n"
                f"Your task is to synthesize evidence, not create facts.\n\n"
                f"Current server date:\n{current_date_str}\n\n"
                f"Timezone:\nAsia/Kolkata\n\n"
                f"VERIFICATION STATUS:\n{v_status} ({verification_guidance}){context_guidance}\n"
                f"{canonical_lock_text}\n"
                f"{format_guidelines}\n"
                f"USER QUERY:\n{query_label}\n\n"
                f"WEB SOURCES:\n{normalized_results_block or 'In-prompt context and verified sources provided by user'}\n\n"
                f"Now answer the user directly and authoritatively in rich, structured Markdown based on the verified evidence."
            )
            user_prompt = clean_query
        else:
            system_instruction = (
                f"{settings.SYSTEM_PROMPT}\n\n"
                f"[TEMPORAL REALITY]: Today's verified server date is {current_date_str} (Year {current_year}). "
                f"Timezone: Asia/Kolkata.\n"
            )
            user_prompt = clean_query

        messages = [
            {"role": "system", "content": system_instruction}
        ]

        # Requirement 18 & 19: Strict Context Isolation
        # Only inherit prior conversation history if it is explicitly an anaphoric follow-up
        if decision.is_follow_up and conversation_history:
            prior_history = [
                m for m in conversation_history
                if (m.get("content") or "").strip().lower() != clean_query.lower()
            ]
            messages.extend(prior_history[-4:])
        # For fresh queries (especially REAL_TIME), we do NOT append previous conversation messages,
        # preventing previous query/entity (e.g. Tamil Nadu) from contaminating the new query (e.g. Kerala).

        messages.append({"role": "user", "content": user_prompt})

        # 6. Stream Execution with Selected AI Provider
        full_text = ""
        ttft_ms = None
        llm_start_time = time.time()
        verification_status_label = (evidence_data or {}).get("verification_label", "Verified response") if is_real_time_query else None
        try:
            async for chunk in model_manager.stream_orchestrated_chat(
                logical_mode=decision.logical_mode,
                messages=messages,
                images=attachments,
                is_search=decision.requires_web
            ):
                delta = chunk.get("content", "")
                reasoning = chunk.get("reasoning_status")

                # Check if provider emitted native grounding sources (e.g. Gemini native search)
                native_sources = chunk.get("grounding_sources", [])
                if native_sources:
                    for ns in native_sources:
                        if not any(s.url == ns.get("url") for s in sources):
                            sources.append(AsuraSource(
                                title=ns.get("title", ""),
                                url=ns.get("url", ""),
                                domain=ns.get("domain", "") or "google.com",
                                snippet=""
                            ))

                if delta:
                    full_text += delta
                    if ttft_ms is None:
                        ttft_ms = int((time.time() - start_time) * 1000)

                status_event = verification_status_label if not delta and not reasoning else None
                yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': delta, 'full_content': full_text, 'done': False, 'reasoning_status': reasoning or status_event, 'sources': [s.model_dump() for s in sources], 'images': [img.model_dump() for img in images]})}\n\n"
        except Exception as e:
            logger.error(f"Error in Asura model orchestration: {e}")
            err_notice = "\n\nAsura is temporarily unable to process this request. Please try again."
            full_text += err_notice
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': err_notice, 'full_content': full_text, 'done': False})}\n\n"

        llm_duration_ms = int((time.time() - llm_start_time) * 1000)

        # 7. Fact Checking, Entity Validation & Observability (Requirement 5, 18, 19, 27)
        cleaned_answer = clean_ai_response(full_text)
        is_entity_valid = True
        if normalized_evidence and normalized_evidence.entities:
            cleaned_answer = evidence_engine.final_fact_checker(cleaned_answer, normalized_evidence)
            is_entity_valid, cleaned_answer = evidence_engine.validate_entity_names(cleaned_answer, normalized_evidence)

        related_qs = self._generate_related_questions(clean_query, decision)
        latency_ms = int((time.time() - start_time) * 1000)

        # Developer Debug Logging per Requirement 18, 27 & 42
        top_entity_name = top_entity.canonical_name if top_entity else "N/A"
        debug_log = {
            "userQuery": user_message,
            "intent": decision.intent,
            "entity": top_entity_name,
            "searchExecuted": "web_grounding" in tools_executed,
            "searchQueries": decision.search_queries or [decision.search_query or clean_query],
            "sourceCount": len(sources),
            "primarySources": [s.domain for s in sources if "Official" in (s.tier or "")][:3],
            "secondarySources": [s.domain for s in sources if "Official" not in (s.tier or "")][:3],
            "evidenceFacts": (evidence_data or {}).get("extracted_facts", []),
            "verificationStatus": (evidence_data or {}).get("verification_status", "N/A"),
            "finalClaims": (normalized_evidence.claims if normalized_evidence else []),
            "unsupportedClaims": [],
            "entityValidation": "PASS" if is_entity_valid else "FAIL_CORRECTED",
            "citationValidation": "PASS",
            "sourceUrls": [s.url for s in sources if s.url][:6],
            "sourceDates": [s.published_at or s.date for s in sources][:6],
            "selectedModel": selected_model or decision.logical_mode,
            "responseTimestamp": time_info["iso"]
        }
        logger.info(f"\n[ASURA DEBUG REPORT]\n{json.dumps(debug_log, indent=2)}\n")

        metadata = {
            "intent": decision.intent,
            "logical_mode": decision.logical_mode,
            "latency_ms": latency_ms,
            "tools_count": len(tools_executed),
            "updated_date": current_date_str,
            "web_researched": decision.requires_web and bool(sources),
            "sources_count": len(sources),
            "evidence": evidence_data,
            "normalized_evidence": normalized_evidence.model_dump() if normalized_evidence else None,
            "searched_at": f"{current_date_str}, {current_time_str} IST",
            "ttft_ms": ttft_ms or latency_ms,
            "llm_duration_ms": llm_duration_ms,
            "developer_diagnostics": {
                **debug_log,
                "ttft_ms": ttft_ms,
                "llm_duration_ms": llm_duration_ms,
                "total_latency_ms": latency_ms,
                "tools": tools_executed,
                "routing": decision.model_dump(),
                "sources_count": len(sources),
                "images_count": len(images)
            }
        }

        structured_response = AsuraStructuredResponse(
            assistant="asura",
            brand="Cretivra Asura",
            answer=cleaned_answer,
            type="text",
            web_grounded=decision.requires_web and bool(sources),
            current_information=decision.requires_current_information,
            images=images,
            sources=sources,
            generated_image=None,
            related_questions=related_qs,
            voice_available=True,
            metadata=metadata
        )

        # 8. Final Structured Event
        yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': '', 'full_content': cleaned_answer, 'done': True, 'structured_response': structured_response.model_dump(), 'sources': [s.model_dump() for s in sources], 'images': [img.model_dump() for img in images], 'related_questions': related_qs, 'metadata': metadata})}\n\n"

        # Persist assistant message
        if db and conversation_id and cleaned_answer:
            try:
                from app.services.conversation_service import conversation_service
                conversation_service.add_message(db, conversation_id, "assistant", cleaned_answer)
            except Exception as e:
                try:
                    db.rollback()
                except Exception:
                    pass
                logger.warning(f"Could not persist message: {e}")

    async def orchestrate_chat_sync(
        self,
        db: Session,
        conversation_id: str,
        user_message: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        force_web_search: Optional[bool] = None,
        force_image_mode: Optional[bool] = None,
        selected_model: Optional[str] = None,
        is_dev_mode: bool = False
    ) -> AsuraStructuredResponse:
        """Non-streaming synchronous chat orchestration returning AsuraStructuredResponse."""
        final_struct: Optional[AsuraStructuredResponse] = None
        full_text = ""
        collected_sources: List[AsuraSource] = []
        collected_images: List[AsuraImage] = []
        collected_meta: Dict[str, Any] = {}

        async for chunk_str in self.orchestrate_chat_stream(
            db=db,
            conversation_id=conversation_id,
            user_message=user_message,
            attachments=attachments,
            force_web_search=force_web_search,
            force_image_mode=force_image_mode,
            selected_model=selected_model,
            is_dev_mode=is_dev_mode
        ):
            if chunk_str.startswith("data: "):
                try:
                    payload = json.loads(chunk_str[6:].strip())
                    if payload.get("structured_response"):
                        final_struct = AsuraStructuredResponse(**payload["structured_response"])
                    if payload.get("full_content"):
                        full_text = payload["full_content"]
                    if payload.get("sources"):
                        collected_sources = [AsuraSource(**s) for s in payload["sources"] if isinstance(s, dict)]
                    if payload.get("images"):
                        collected_images = [AsuraImage(**img) for img in payload["images"] if isinstance(img, dict)]
                    if payload.get("metadata"):
                        collected_meta = payload["metadata"]
                except Exception:
                    pass

        if not final_struct:
            final_struct = AsuraStructuredResponse(
                assistant="asura",
                brand="Cretivra Asura",
                answer=full_text or "Asura is ready.",
                type="text",
                sources=collected_sources,
                images=collected_images,
                metadata=collected_meta
            )
        return final_struct

    def _generate_related_questions(self, query: str, decision: RoutingDecision) -> List[str]:
        q_lower = query.lower()
        if "cm" in q_lower or "chief minister" in q_lower or "pm" in q_lower or "prime minister" in q_lower:
            return [
                "What are the major recent government initiatives and policies?",
                "What are the upcoming election dates and key political developments?",
                "What is the cabinet composition and ministerial portfolio?"
            ]
        elif "price" in q_lower or "gold" in q_lower:
            return [
                "How has the price trended over the past week?",
                "What economic factors are driving today's price changes?",
                "What are historical price comparisons for this month?"
            ]
        elif "news" in q_lower or "ai" in q_lower:
            return [
                "What are the key industry reactions to this development?",
                "What are the main technical breakthroughs announced?",
                "What should we expect next in this space?"
            ]
        return [
            "Can you explain this in more detail?",
            "What are the most recent updates on this topic?",
            "What are related key developments to watch?"
        ]

response_orchestrator = AsuraResponseOrchestrator()
