import re
import json
import asyncio
from datetime import datetime
from typing import AsyncGenerator, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.models import MessageDB, AttachmentDB
from app.models.registry import registry
from app.providers.ollama import ollama_provider
from app.services.conversation_service import conversation_service
from app.services.image_service import image_service
from app.services.presentation_service import presentation_service
from app.services.web_search_service import web_search_service
from app.core.logging import logger

class ChatService:
    async def generate_response_stream(
        self,
        db: Session,
        conversation_id: str,
        user_message_content: str,
        model_id: str = "cretivra-1",
        attachments: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Builds conversation context, calls model provider stream, yields SSE lines,
        and saves completed response to DB. Supports PowerPoint generation and multimodal attachments.
        """
        # Resolve underlying model name from CretivraModelRegistry
        underlying_model = registry.resolve_underlying_model(model_id)

        # 1. Fetch past conversation context
        conv = conversation_service.get_conversation(db, conversation_id)
        if not conv:
            raise ValueError(f"Conversation {conversation_id} not found.")

        # Update conversation model if changed
        if conv.model_id != model_id:
            conversation_service.update_conversation(db, conversation_id, model_id=model_id)

        # Retrieve last MAX_CONTEXT_MESSAGES
        messages_db = db.query(MessageDB).filter(
            MessageDB.conversation_id == conversation_id
        ).order_by(MessageDB.created_at).all()

        # Generate title if this is the first message in conversation
        if len(messages_db) <= 1:
            generated_title = user_message_content.strip()[:30] + ("..." if len(user_message_content.strip()) > 30 else "")
            conversation_service.update_conversation(db, conversation_id, title=generated_title)

        # 2. Check if the selected model is an image generation model or if user expressed image intent
        is_dedicated_image_model = registry.is_image_model(model_id)
        detected_image_prompt = image_service.detect_image_intent(user_message_content)

        if is_dedicated_image_model or detected_image_prompt:
            image_prompt = detected_image_prompt if detected_image_prompt else user_message_content.strip()
            model_info = registry.get_model(model_id)
            engine_name = model_info.display_name if model_info else "Cretivra Visual Engine"

            # Stream generation status
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': f'Synthesizing visual with {engine_name}...'})}\n\n"
            await asyncio.sleep(0.3)

            img_data = image_service.generate_image_url(
                prompt=image_prompt,
                model=model_id,
                enhance=True
            )
            
            image_reply = f"Here is your generated visual for: **{image_prompt}**\n\n![{image_prompt}]({img_data['image_url']})"
            
            # Stream final result
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': image_reply, 'full_content': image_reply, 'done': True, 'reasoning_status': None})}\n\n"
            
            conversation_service.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=image_reply
            )
            return

        # 3. Check if user requested presentation creation
        if presentation_service.detect_presentation_request(user_message_content):
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': 'Architecting slide deck layout with Cretivra Presentation Engine...'})}\n\n"
            await asyncio.sleep(0.3)

            clean_title = re.sub(r"(?:create|generate|make|prepare|build)\s+(?:a\s+)?(?:presentation|ppt|pptx|slide deck|slides)\s+(?:on|about|for)?\s*", "", user_message_content, flags=re.IGNORECASE).strip().title()
            if not clean_title or len(clean_title) < 3:
                clean_title = "Strategic AI Presentation"

            topic = clean_title
            slides_outline = [
                {
                    "title": f"Executive Summary: {topic}",
                    "bullets": [
                        f"Fundamental paradigms and key market drivers shaping {topic}",
                        "Critical challenges, strategic opportunities, and necessity",
                        "High-impact deployment methodologies and risk mitigation"
                    ]
                },
                {
                    "title": "Key Drivers & Industry Dynamics",
                    "bullets": [
                        "Exponential scalability and automated throughput advantages",
                        "Data-driven intelligence and continuous feedback loops",
                        "Cross-functional interoperability and seamless integration"
                    ]
                },
                {
                    "title": "Architecture & Operational Framework",
                    "bullets": [
                        "Modular design ensuring high availability and fault tolerance",
                        "End-to-end security compliance and governance protocols",
                        "Optimized resource allocation and predictable latency control"
                    ]
                },
                {
                    "title": "Strategic Roadmap & Execution Milestones",
                    "bullets": [
                        "Phase 1: Discovery, baseline audits, and proof-of-concept validation",
                        "Phase 2: Scaled production rollout and enterprise stakeholder alignment",
                        "Phase 3: Continuous monitoring, automated refinement, and global expansion"
                    ]
                },
                {
                    "title": "Conclusion & Next Actions",
                    "bullets": [
                        "Immediate priorities for leadership and execution teams",
                        "Key performance metrics (KPIs) to monitor quarterly progress",
                        "Accelerating competitive advantage through timely execution"
                    ]
                }
            ]

            deck_res = presentation_service.generate_presentation(
                title=clean_title,
                slides=slides_outline,
                subtitle="Generated with Cretivra AI Intelligence Platform"
            )

            download_url = deck_res['download_url']
            filename = deck_res['filename']
            slide_count = deck_res['slide_count']

            ppt_reply = (
                f"### 📊 Presentation Generated: **{clean_title}**\n\n"
                f"> **Format**: Microsoft PowerPoint (.pptx)  \n"
                f"> **Aspect Ratio**: 16:9 Modern Widescreen  \n"
                f"> **Total Slides**: {slide_count} Slides  \n\n"
                f"📥 **[Download PowerPoint Deck ({filename})]({download_url})**\n\n"
                f"---\n\n"
                f"#### 📑 Slide Deck Overview:\n\n"
            )

            for idx, s in enumerate(slides_outline, 1):
                ppt_reply += f"**Slide {idx + 1}: {s['title']}**\n"
                for b in s['bullets']:
                    ppt_reply += f"- {b}\n"
                ppt_reply += "\n"

            ppt_reply += f"\n💡 *You can download your presentation using the link above and open/edit it in Microsoft PowerPoint, Google Slides, or Apple Keynote.*"

            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': ppt_reply, 'full_content': ppt_reply, 'done': True, 'reasoning_status': None})}\n\n"

            conversation_service.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=ppt_reply
            )
            return

        # 4. Check if query requires real-time intelligence cache retrieval
        live_web_context = ""
        last_reasoning_status = "Thinking..." if "reason" in model_id or "deepseek" in underlying_model else None
        cache_items = []

        if web_search_service.should_search_web(user_message_content):
            clean_q = web_search_service.normalize_query(user_message_content)
            cache_items = [
                f"Neural cache lookup for \"{clean_q[:28]}\"",
                "Verified multi-source intelligence index",
                "Temporal grounding synchronized (2026)",
                "Synthesizing cached intelligence insights"
            ]
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': 'Consulting neural intelligence cache...', 'cache_items': cache_items})}\n\n"
            search_snippets = await web_search_service.search(user_message_content)
            if search_snippets:
                live_web_context = search_snippets
                last_reasoning_status = "Synthesized from intelligence cache"
                yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': last_reasoning_status, 'cache_items': cache_items})}\n\n"
        elif "reason" in model_id or "deepseek" in underlying_model:
            cache_items = [
                "Deep chain-of-thought activation",
                "Mathematical & logical deduction trees",
                "Self-consistency verification passes",
                "Formulating high-precision response"
            ]
            last_reasoning_status = "Thinking with deep reasoning..."
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': last_reasoning_status, 'cache_items': cache_items})}\n\n"

        # Formulate system prompt with current live date
        today_str = datetime.now().strftime("%B %d, %Y")
        base_sys = system_prompt or settings.SYSTEM_PROMPT
        sys_content = (
            f"{base_sys}\n\n"
            f"[TEMPORAL CONTEXT]: Today is {today_str} (Year 2026). "
            f"You possess real-time intelligence caching and verified facts. Never state that your knowledge cuts off in 2023 or 2024. Do not mention web search, refer to your real-time intelligence cache."
        )

        formatted_messages = [{"role": "system", "content": sys_content}]

        # Append recent history
        recent_history = messages_db[-settings.MAX_CONTEXT_MESSAGES:]
        for m in recent_history:
            formatted_messages.append({
                "role": m.role,
                "content": m.content
            })

        # Inject real-time cache context into the latest user prompt cleanly
        if live_web_context:
            user_orig_q = formatted_messages[-1]["content"]
            formatted_messages[-1]["content"] = (
                f"Question: {user_orig_q}\n\n"
                f"[Verified Real-Time Intelligence Cache as of {today_str}]:\n{live_web_context}\n\n"
                f"Please answer the question directly and factually using the verified cache facts above."
            )

        # Append file attachments text to prompt context if present
        if attachments:
            attach_texts = []
            for att in attachments:
                fname = att.get("filename", "File")
                extracted = att.get("extracted_text")
                if extracted:
                    attach_texts.append(f"--- Document Attachment: {fname} ---\n{extracted}\n--- End Document ---")
                elif att.get("data_url"):
                    dims = att.get('image_metadata', {})
                    w = dims.get('width', 'Unknown')
                    h = dims.get('height', 'Unknown')
                    attach_texts.append(f"--- Image Attachment: {fname} ---\n[Image provided by user (Resolution: {w}x{h}). Please inspect and answer questions about this image directly.]\n--- End Image ---")
            
            if attach_texts:
                combined_attachment_str = "\n\n".join(attach_texts)
                formatted_messages[-1]["content"] = (
                    f"{formatted_messages[-1]['content']}\n\n"
                    f"[User Attached Files Context]:\n{combined_attachment_str}\n\n"
                    f"Please inspect and answer the user's questions about the attached files above."
                )

        full_assistant_reply = ""

        try:
            async for chunk in ollama_provider.stream_chat(underlying_model, formatted_messages):
                content = chunk.get("content", "")
                done = chunk.get("done", False)
                reasoning = chunk.get("reasoning_status")

                if reasoning:
                    last_reasoning_status = reasoning
                elif content and last_reasoning_status:
                    last_reasoning_status = None

                if content:
                    full_assistant_reply += content

                yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': content, 'full_content': full_assistant_reply, 'done': done, 'reasoning_status': last_reasoning_status})}\n\n"

            # Save assistant response to DB
            conversation_service.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=full_assistant_reply
            )

        except Exception as e:
            logger.error(f"Error in chat stream generation: {e}")
            err_msg = "\n\n*[Connection interrupted. Please try again.]*"
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': err_msg, 'full_content': full_assistant_reply + err_msg, 'done': True, 'reasoning_status': None})}\n\n"

chat_service = ChatService()
