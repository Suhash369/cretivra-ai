import json
import asyncio
from typing import AsyncGenerator, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.models import MessageDB, AttachmentDB
from app.models.registry import registry
from app.providers.ollama import ollama_provider
from app.services.conversation_service import conversation_service
from app.services.image_service import image_service
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
        and saves completed response to DB.
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
        if len(messages_db) <= 1 and (conv.title == "New Conversation" or not conv.title):
            new_title = conversation_service.generate_chat_title(user_message_content)
            conversation_service.update_conversation(db, conversation_id, title=new_title)

        # Check if the selected model is an image generation model or if user expressed image intent
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

        # Check if query requires real-time web search
        live_web_context = ""
        last_reasoning_status = "Thinking..." if "reason" in model_id or "deepseek" in underlying_model else None

        if web_search_service.should_search_web(user_message_content):
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': 'Searching the live web for current information...'})}\n\n"
            search_snippets = await web_search_service.search(user_message_content)
            if search_snippets:
                live_web_context = f"\n\n[Live Real-Time Web Search Context]:\n{search_snippets}\n\nUse the live real-time information above to provide an accurate, up-to-date answer."
                last_reasoning_status = "Processing live web results..."

        # Formulate system prompt
        sys_content = system_prompt or settings.SYSTEM_PROMPT

        formatted_messages = [{"role": "system", "content": sys_content}]

        # Append recent history
        recent_history = messages_db[-settings.MAX_CONTEXT_MESSAGES:]
        for m in recent_history:
            formatted_messages.append({
                "role": m.role,
                "content": m.content
            })

        # Inject real-time web search context into the latest user prompt if available
        if live_web_context:
            formatted_messages[-1]["content"] = f"{formatted_messages[-1]['content']}{live_web_context}"

        # Append file attachments text to prompt context if present
        if attachments:
            attach_texts = []
            for att in attachments:
                if att.get("extracted_text"):
                    attach_texts.append(f"--- File Attachment ({att.get('filename')}) ---\n{att.get('extracted_text')}\n--- End File ---")
            if attach_texts:
                combined_attachment_str = "\n\n".join(attach_texts)
                formatted_messages[-1]["content"] = f"{formatted_messages[-1]['content']}\n\n[Attached Context]:\n{combined_attachment_str}"

        full_assistant_reply = ""

        try:
            async for chunk in ollama_provider.stream_chat(underlying_model, formatted_messages):
                content = chunk.get("content", "")
                done = chunk.get("done", False)
                reasoning = chunk.get("reasoning_status")

                if reasoning:
                    last_reasoning_status = reasoning

                if content:
                    full_assistant_reply += content

                event_data = {
                    "conversation_id": conversation_id,
                    "model_id": model_id,
                    "content": content,
                    "full_content": full_assistant_reply,
                    "done": done,
                    "reasoning_status": last_reasoning_status
                }

                yield f"data: {json.dumps(event_data)}\n\n"
                await asyncio.sleep(0.001)

        except asyncio.CancelledError:
            logger.info("Stream cancelled by client.")
            event_data = {
                "conversation_id": conversation_id,
                "model_id": model_id,
                "content": "",
                "full_content": full_assistant_reply,
                "done": True,
                "cancelled": True
            }
            yield f"data: {json.dumps(event_data)}\n\n"

        finally:
            # Save completed or partial response to DB
            if full_assistant_reply.strip():
                conversation_service.add_message(
                    db=db,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_assistant_reply,
                    reasoning_status=last_reasoning_status
                )

chat_service = ChatService()
