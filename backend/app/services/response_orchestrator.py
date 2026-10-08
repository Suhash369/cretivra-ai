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

        # Force web search for REAL_TIME and CURRENT_AFFAIRS queries per Requirement 2
        is_real_time_query = decision.detected_intent in [QueryIntent.REAL_TIME, QueryIntent.CURRENT_AFFAIRS] or decision.requires_current_information
        if is_real_time_query:
            decision.requires_web = True

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
        if decision.requires_web:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is researching the web in real-time...', 'reasoning_status': 'Asura is researching the web in real-time...', 'done': False})}\n\n"
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
                    web_search_failed = res.get("search_failed", False) or len(raw_results) == 0
                    
                    for r in raw_results:
                        sources.append(AsuraSource(
                            title=r.get("title", ""),
                            url=r.get("url", ""),
                            domain=r.get("source", "") or "web",
                            snippet=r.get("snippet", "")
                        ))
                elif kind == "image" and isinstance(res, list):
                    images = [AsuraImage(**img) for img in res if isinstance(img, dict)]

        # Yield images immediately for UI responsiveness
        if images:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': '', 'full_content': '', 'done': False, 'images': [img.model_dump() for img in images], 'sources': [s.model_dump() for s in sources]})}\n\n"

        # 4. Failure Handling per Requirement 19
        if is_real_time_query and web_search_failed:
            failure_msg = "I couldn't retrieve fresh web information right now, so I can't reliably verify the current status. Please try again in a moment."
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': failure_msg, 'full_content': failure_msg, 'done': True, 'sources': [], 'images': []})}\n\n"
            if db and conversation_id:
                try:
                    from app.services.conversation_service import conversation_service
                    conversation_service.add_message(db, conversation_id, "assistant", failure_msg)
                except Exception:
                    pass
            return

        # 5. Answer Generation Contract per Requirement 13
        # Construct normalized search results representation
        normalized_results_block = web_context_text
        if not normalized_results_block and sources:
            normalized_results_block = "\n".join([
                f"[{idx+1}] [{s.title}]({s.url}): {s.snippet}"
                for idx, s in enumerate(sources)
            ])

        if is_real_time_query:
            system_instruction = (
                f"You are Asura, the AI assistant developed by Cretivra.\n\n"
                f"You are answering a time-sensitive question.\n\n"
                f"Current date:\n{current_date_str}\n\n"
                f"Timezone:\nAsia/Kolkata\n\n"
                f"The web research below is the primary factual source.\n\n"
                f"You MUST:\n"
                f"1. Use the retrieved web information.\n"
                f"2. Prefer the newest reliable sources.\n"
                f"3. Check publication/update dates.\n"
                f"4. Resolve conflicting information.\n"
                f"5. Never present outdated model knowledge as current fact.\n"
                f"6. If the sources cannot verify the current answer, explicitly say so.\n"
                f"7. Never invent current information.\n"
                f"8. Include source citations.\n"
                f"9. State the relevant date when answering current-status questions.\n\n"
                f"USER QUERY:\n{clean_query}\n\n"
                f"WEB SOURCES:\n{normalized_results_block}\n\n"
                f"Now answer the user directly and authoritatively."
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

        # Requirement 9 & 10: Strict Context Isolation
        # Only inherit prior conversation history if it is explicitly an anaphoric follow-up
        if decision.is_follow_up and conversation_history:
            messages.extend(conversation_history[-4:])
        # For fresh queries (especially REAL_TIME), we do NOT append previous conversation messages,
        # preventing previous query/entity (e.g. Tamil Nadu) from contaminating the new query (e.g. Kerala).

        messages.append({"role": "user", "content": user_prompt})

        # 6. Stream Execution with Selected AI Provider
        full_text = ""
        ttft_ms = None
        llm_start_time = time.time()
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

                status_event = "Asura is formulating verified response..." if not delta and not reasoning else None
                yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': delta, 'full_content': full_text, 'done': False, 'reasoning_status': reasoning or status_event, 'sources': [s.model_dump() for s in sources], 'images': [img.model_dump() for img in images]})}\n\n"
        except Exception as e:
            logger.error(f"Error in Asura model orchestration: {e}")
            err_notice = "\n\nAsura is temporarily unable to process this request. Please try again."
            full_text += err_notice
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': err_notice, 'full_content': full_text, 'done': False})}\n\n"

        llm_duration_ms = int((time.time() - llm_start_time) * 1000)

        # 7. Follow-up Questions & Observability
        related_qs = self._generate_related_questions(clean_query, decision)
        latency_ms = int((time.time() - start_time) * 1000)

        # Developer Debug Logging per Requirement 20
        debug_log = {
            "userQuery": clean_query,
            "detectedIntent": decision.intent,
            "webRequired": decision.requires_web,
            "webExecuted": "web_grounding" in tools_executed,
            "searchQueries": decision.search_queries or [decision.search_query or clean_query],
            "searchProvider": "web_search_service",
            "resultCount": len(sources),
            "sourceUrls": [s.url for s in sources if s.url][:6],
            "sourceDates": [s.domain for s in sources][:6],
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

        cleaned_answer = clean_ai_response(full_text)
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
