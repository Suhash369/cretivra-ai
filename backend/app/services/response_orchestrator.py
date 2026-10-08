import json
import time
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.core.router import asura_router, RoutingDecision
from app.core.model_manager import model_manager
from app.services.web_grounding import web_grounding_service, WebGroundingResult
from app.providers.image_search import image_search_provider
from app.providers.image_generation import image_generation_provider
from app.schemas.asura_response import AsuraStructuredResponse, AsuraImage, AsuraSource, AsuraGeneratedImage
from app.providers.cloud_provider import clean_ai_response
from app.database.models import MessageDB

class AsuraResponseOrchestrator:
    """
    Central response orchestration engine for CRETIVRA ASURA.
    Coordinates router, entity analysis, concurrent tool execution, context construction,
    streaming generation, citations, images, and structured contract generation.
    Strictly uses ONLY Gemini, Groq, and OpenRouter backend providers.
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
        query = user_message.strip()

        # 0. Fetch recent conversation context for follow-up resolution
        conversation_history = []
        if db and conversation_id:
            try:
                db_msgs = db.query(MessageDB).filter(
                    MessageDB.conversation_id == conversation_id
                ).order_by(MessageDB.created_at.asc()).all()
                conversation_history = [
                    {"role": m.role, "content": m.content}
                    for m in db_msgs[-settings.MAX_CONTEXT_MESSAGES:]
                ]
            except Exception as e:
                logger.debug(f"Could not load conversation history: {e}")

        # 1. Routing & Intent Analysis
        yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is thinking...', 'reasoning_status': 'Asura is thinking...', 'done': False})}\n\n"
        decision: RoutingDecision = await asura_router.route_async(
            query=query,
            attachments=attachments,
            force_web_search=force_web_search,
            force_image_mode=force_image_mode,
            selected_model=selected_model,
            conversation_history=conversation_history
        )

        tools_executed = []
        sources: List[AsuraSource] = []
        images: List[AsuraImage] = []
        web_context = ""
        generated_image_obj = None

        # 2. Direct Image Generation Path (e.g. "Generate a futuristic office")
        if decision.requires_image_generation:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is creating your image...', 'reasoning_status': 'Asura is creating your image...', 'done': False})}\n\n"
            tools_executed.append("image_generation")
            try:
                gen_res = await image_generation_provider.generate(
                    prompt=decision.image_generation_prompt or query
                )
            except Exception as e:
                logger.error(f"Image generation error: {e}")
                gen_res = {"success": False, "error": str(e)}

            if gen_res.get("success"):
                generated_image_obj = AsuraGeneratedImage(
                    url=gen_res["url"],
                    thumbnail=gen_res.get("thumbnail"),
                    prompt=decision.image_generation_prompt or query,
                    attribution="Asura generated this image"
                )
                img_markdown = f"![{decision.image_generation_prompt or 'Generated visual'}]({gen_res['url']})\n\n"
                answer_text = f"Here is your visual creation for **{decision.image_generation_prompt or query}**:\n\n{img_markdown}"
            else:
                answer_text = "Asura couldn't generate the image right now."

            related_qs = [
                f"Create a variation of this {decision.image_generation_prompt or 'image'}",
                "Can you generate this in a cinematic 3D style?",
                "Create a minimalist version"
            ]

            latency_ms = int((time.time() - start_time) * 1000)
            meta = {
                "intent": decision.intent,
                "logical_mode": decision.logical_mode,
                "latency_ms": latency_ms
            }
            if is_dev_mode:
                meta["developer_diagnostics"] = {
                    "provider": "image_generation",
                    "tools": tools_executed,
                    "routing": decision.model_dump()
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

        # 3. Concurrent Tool Execution (Web Grounding + Real Image Search)
        tasks = []
        if decision.requires_web:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is checking current information...', 'reasoning_status': 'Asura is checking current information...', 'done': False})}\n\n"
            tools_executed.append("web_grounding")
            tasks.append(("web", web_grounding_service.ground_query(decision.search_query or query)))

        if decision.requires_images:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is finding relevant images...', 'reasoning_status': 'Asura is finding relevant images...', 'done': False})}\n\n"
            tools_executed.append("image_search")
            tasks.append(("image", image_search_provider.search(decision.image_search_query or query, max_results=4)))

        if decision.requires_vision:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'status': 'Asura is analyzing your image...', 'reasoning_status': 'Asura is analyzing your image...', 'done': False})}\n\n"
            tools_executed.append("vision")

        # Execute selected tools in parallel
        if tasks:
            task_results = await asyncio.gather(*(t[1] for t in tasks), return_exceptions=True)
            for (kind, _), res in zip(tasks, task_results):
                if isinstance(res, Exception):
                    logger.warning(f"Tool {kind} exception: {res}")
                    continue
                if kind == "web" and isinstance(res, WebGroundingResult):
                    if res.success:
                        web_context = res.context_text
                        sources = [AsuraSource(title=s.title, url=s.url, domain=s.domain, snippet=s.snippet) for s in res.sources]
                    elif decision.requires_current_information:
                        web_context = "[Asura Notice]: Live web grounding could not verify current facts for this query."
                elif kind == "image" and isinstance(res, list):
                    images = [AsuraImage(**img) for img in res if isinstance(img, dict)]
                    logger.info(f"[ASURA] image_results={len(images)} response_images={len(images)}")

        # Yield images immediately so UI renders them without waiting for LLM completion
        if images:
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': '', 'full_content': '', 'done': False, 'images': [img.model_dump() for img in images], 'sources': [s.model_dump() for s in sources]})}\n\n"

        # 4. Context Formulation
        today_str = datetime.now().strftime("%B %d, %Y")
        base_system = (
            f"{settings.SYSTEM_PROMPT}\n\n"
            f"[TEMPORAL REALITY]: Today is {today_str} (Year 2026).\n"
        )
        if decision.requires_vision:
            base_system += "\n[VISION ACTIVE]: Inspect and analyze attached visual images in detail.\n"

        prompt_content = query
        if web_context and "Live web grounding could not" not in web_context:
            prompt_content = (
                f"Question: {query}\n\n"
                f"[Verified Encyclopedic & Intelligence Grounding]:\n{web_context}\n\n"
                f"Directive: Deliver an authoritative, beautifully structured, and completely accurate answer. "
                f"Cite facts faithfully without fabricating any dates, statistics, awards, or URLs."
            )
        elif decision.requires_current_information and not web_context:
            prompt_content = (
                f"Question: {query}\n\n"
                f"Directive: Answer only verified facts. If the latest live details are uncertain or cannot be verified, "
                f"state transparently: 'I can't verify that information with the available information.'"
            )

        messages = [
            {"role": "system", "content": base_system}
        ]
        # Include conversation history for context continuity
        if conversation_history:
            messages.extend(conversation_history[-8:])
        messages.append({"role": "user", "content": prompt_content})

        # 5. Model Streaming Execution
        full_text = ""
        try:
            async for chunk in model_manager.stream_orchestrated_chat(
                logical_mode=decision.logical_mode,
                messages=messages,
                images=attachments,
                is_search=decision.requires_web
            ):
                delta = chunk.get("content", "")
                reasoning = chunk.get("reasoning_status")
                if delta:
                    full_text += delta

                status_event = "Asura is preparing your response..." if not delta and not reasoning else None
                yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': delta, 'full_content': full_text, 'done': False, 'reasoning_status': reasoning or status_event, 'sources': [s.model_dump() for s in sources], 'images': [img.model_dump() for img in images]})}\n\n"
        except Exception as e:
            logger.error(f"Error in Asura model orchestration: {e}")
            err_notice = "\n\nAsura is temporarily unable to process this request. Please try again."
            full_text += err_notice
            yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': err_notice, 'full_content': full_text, 'done': False})}\n\n"

        # 6. Generate Contextual Follow-Up Questions
        related_qs = self._generate_related_questions(query, decision)

        latency_ms = int((time.time() - start_time) * 1000)
        metadata = {
            "intent": decision.intent,
            "entity": decision.entity,
            "logical_mode": decision.logical_mode,
            "latency_ms": latency_ms,
            "tools_count": len(tools_executed)
        }
        if is_dev_mode:
            metadata["developer_diagnostics"] = {
                "tools": tools_executed,
                "routing": decision.model_dump(),
                "sources_count": len(sources),
                "images_count": len(images)
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

        # 7. Final structured response event
        yield f"data: {json.dumps({'assistant': 'asura', 'conversation_id': conversation_id, 'content': '', 'full_content': cleaned_answer, 'done': True, 'structured_response': structured_response.model_dump(), 'sources': [s.model_dump() for s in sources], 'images': [img.model_dump() for img in images], 'related_questions': related_qs})}\n\n"

        # Persist assistant response to DB
        from app.services.conversation_service import conversation_service
        if db and conversation_id and cleaned_answer:
            try:
                conversation_service.add_message(db, conversation_id, "assistant", cleaned_answer)
            except Exception as e:
                logger.warning(f"Could not persist message to conversation {conversation_id}: {e}")

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
                    elif payload.get("full_content"):
                        full_text = payload["full_content"]
                except Exception:
                    pass

        if not final_struct:
            final_struct = AsuraStructuredResponse(
                assistant="asura",
                brand="Cretivra Asura",
                answer=full_text or "Asura is ready.",
                type="text"
            )
        return final_struct

    def _generate_related_questions(self, query: str, decision: RoutingDecision) -> List[str]:
        entity = decision.entity or ""
        intent = decision.intent

        if entity:
            if decision.entity_type in ["ATHLETE"]:
                return [
                    f"What are {entity}'s major career achievements?",
                    f"What is {entity}'s current team and role?",
                    f"What are {entity}'s latest records?"
                ]
            elif decision.entity_type in ["ACTOR"]:
                return [
                    f"What are {entity}'s recent movies and projects?",
                    f"What major awards has {entity} won?",
                    f"What is {entity}'s public work?"
                ]
            elif decision.entity_type in ["POLITICIAN"]:
                return [
                    f"What are {entity}'s key policies and initiatives?",
                    f"What is {entity}'s political career history?",
                    f"What are current developments regarding {entity}?"
                ]
            elif decision.entity_type in ["PLACE", "LANDMARK"]:
                return [
                    f"What is the best time to visit {entity}?",
                    f"What are the main attractions in {entity}?",
                    f"What is the history of {entity}?"
                ]
            elif decision.entity_type in ["PRODUCT"]:
                return [
                    f"What are the key technical specifications of {entity}?",
                    f"How does {entity} compare with its main competitors?",
                    f"What is the current pricing and availability of {entity}?"
                ]

        if intent in ["CODE", "TECHNICAL"]:
            return [
                "How can I optimize this code for production performance?",
                "What are common edge cases and best practices?",
                "Can you provide unit tests for this implementation?"
            ]

        return [
            "Can you explain this in more detail?",
            "What are the most important practical applications?",
            "Can you give me a step-by-step example?"
        ]

response_orchestrator = AsuraResponseOrchestrator()
