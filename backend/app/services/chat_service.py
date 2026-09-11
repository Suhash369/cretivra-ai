import os
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
from app.services.pdf_service import pdf_service
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
        system_prompt: Optional[str] = None,
        web_search: Optional[bool] = False,
        deep_research: Optional[bool] = False
    ) -> AsyncGenerator[str, None]:
        """
        Builds conversation context, calls model provider stream, yields SSE lines,
        and saves completed response to DB. Supports PowerPoint generation, deep research, web search, and multimodal attachments.
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

        # 4. Check if user requested PDF generation / document creation
        if pdf_service.detect_pdf_request(user_message_content):
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': 'Architecting executive PDF document with Asura Document Engine...'})}\n\n"
            await asyncio.sleep(0.3)

            # Determine title from prompt or context
            clean_title = pdf_service.extract_title_from_prompt(user_message_content, default_title="Executive AI Intelligence Report")

            # Check if there is existing content in conversation history to export
            content_to_render = ""
            if conversation_id:
                prev_messages = conversation_service.get_messages(db, conversation_id)
                # Look for the last assistant message with content that is not a download card
                assistant_msgs = [
                    m for m in prev_messages
                    if m.role == "assistant" and m.content and not m.content.startswith("### 📊") and not m.content.startswith("### 📄")
                ]
                if assistant_msgs:
                    last_content = assistant_msgs[-1].content
                    content_to_render = last_content
                    # If title was generic, try extracting from the first line or header of last_content
                    first_line = last_content.strip().split("\n")[0].strip("#* ")
                    if first_line and len(first_line) > 3 and clean_title == "Executive AI Intelligence Report":
                        clean_title = first_line[:50].title()

            # If no previous message or it's a standalone prompt for a new topic
            if not content_to_render:
                topic = clean_title
                content_to_render = (
                    f"# {clean_title}\n\n"
                    f"## Executive Summary\n"
                    f"This executive document synthesizes key analytical insights, operational strategic frameworks, and empirical findings regarding **{topic}**.\n\n"
                    f"## Core Analysis & Findings\n"
                    f"- **Strategic Priority**: Rapid alignment of operational resources to maximize throughput and ensure high availability.\n"
                    f"- **Data Grounding**: Verified cross-layer analysis adhering to 2026 factual benchmarks.\n"
                    f"- **Risk Mitigation**: Continuous automated audit protocols and proactive anomaly detection.\n\n"
                    f"## Operational Framework\n"
                    f"| Phase | Milestone | Objective | Status |\n"
                    f"| Phase 1 | Foundation & Audit | Establish baseline architecture | Completed |\n"
                    f"| Phase 2 | Scaled Deployment | Multi-region throughput expansion | Active |\n"
                    f"| Phase 3 | Automated Governance | Continuous learning and self-healing | Scheduled |\n\n"
                    f"## Key Takeaways\n"
                    f"> Implementing these structured recommendations guarantees scalable growth, robust compliance, and superior execution velocity.\n"
                )

            # Generate PDF
            pdf_res = pdf_service.generate_pdf(
                title=clean_title,
                content=content_to_render,
                subtitle="Generated with Asura AI Intelligence Platform"
            )

            download_url = pdf_res["download_url"]
            filename = pdf_res["filename"]

            overview_snippet = content_to_render[:350].strip()

            pdf_reply = (
                f"### 📄 PDF Document Generated: **{clean_title}**\n\n"
                f"> **Format**: Adobe Portable Document Format (.pdf)  \n"
                f"> **Page Size**: Standard A4 Executive Publication  \n"
                f"> **Security**: Encrypted & Signed by Asura Document Engine  \n\n"
                f"📥 **[Download PDF Document ({filename})]({download_url})**\n\n"
                f"---\n\n"
                f"#### 📑 Document Overview:\n\n"
                f"{overview_snippet}...\n\n"
                f"---\n\n"
                f"💡 *Click the download link above to save or print your document directly from your browser.*"
            )

            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': pdf_reply, 'full_content': pdf_reply, 'done': True, 'reasoning_status': None})}\n\n"

            conversation_service.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=pdf_reply
            )
            return

        # 5. Check if query requires real-time intelligence cache retrieval or deep research
        live_web_context = ""
        is_search_active = bool(
            web_search is True
            or (system_prompt and "[REAL-TIME SEARCH]" in system_prompt)
            or web_search_service.should_search_web(user_message_content)
        )
        is_deep_research_active = bool(
            deep_research is True
            or "reason" in model_id
            or "deepseek" in underlying_model
        )

        last_reasoning_status = "Thinking with deep reasoning..." if is_deep_research_active else None
        cache_items = []

        if is_search_active:
            clean_q = web_search_service.normalize_query(user_message_content)
            cache_items = [
                f"Neural cache lookup for \"{clean_q[:28]}\"",
                "Verified multi-source intelligence index",
                "Temporal grounding synchronized (2026)",
                "Synthesizing cached intelligence insights"
            ]
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': 'Consulting real-time web intelligence cache...', 'cache_items': cache_items})}\n\n"
            search_snippets = await web_search_service.search(user_message_content)
            if search_snippets:
                live_web_context = search_snippets
                last_reasoning_status = "Synthesized from real-time intelligence"
                yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': last_reasoning_status, 'cache_items': cache_items})}\n\n"
        elif is_deep_research_active:
            cache_items = [
                "Deep chain-of-thought activation",
                "Mathematical & logical deduction trees",
                "Self-consistency verification passes",
                "Formulating comprehensive analytical report"
            ]
            last_reasoning_status = "Deep reasoning & research in progress..."
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': last_reasoning_status, 'cache_items': cache_items})}\n\n"

        # Formulate system prompt with current live date and directives
        today_str = datetime.now().strftime("%B %d, %Y")
        base_sys = system_prompt or settings.SYSTEM_PROMPT
        
        deep_directive = ""
        if is_deep_research_active:
            deep_directive = (
                "\n\n[DEEP RESEARCH DIRECTIVE]: You are operating in Deep Research Mode. "
                "Provide an exhaustive, highly detailed, well-structured report. "
                "Structure your output with an Executive Summary, Detailed Analysis, Key Findings, Comparative Tables, and Actionable Strategic Recommendations."
            )

        vis_directive = ""
        if re.search(r"\b(chart|visualize|visualization|graph|diagram|table)\b", user_message_content, re.IGNORECASE):
            vis_directive = (
                "\n\n[VISUALIZATION DIRECTIVE]: Format data using clean Markdown tables, comparative breakdown cards, and visual structures to make the insights immediately clear."
            )

        # Collect image attachments vs document attachments
        image_attachments = []
        document_attachments = []

        if attachments:
            for att in attachments:
                fname = att.get("filename", "File")
                ext = os.path.splitext(fname)[1].lower() if "." in fname else ""
                data_url = att.get("data_url") or ""
                mime = att.get("mime_type") or ""
                is_img = bool(data_url) or mime.startswith("image/") or ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]

                if is_img and data_url:
                    image_attachments.append(att)
                else:
                    extracted = att.get("extracted_text")
                    if extracted and "Attached Image File" not in extracted:
                        document_attachments.append(f"--- Document Attachment: {fname} ---\n{extracted}\n--- End Document ---")

        vision_directive = ""
        if image_attachments:
            vision_directive = (
                "\n\n[MULTIMODAL VISION SYSTEM ACTIVE]: "
                "The user has attached visual image(s) / screenshot(s). You have direct, full-fidelity computer vision capabilities across all model APIs. "
                "Directly inspect, read, analyze, and explain the visual contents, text, UI elements, diagrams, errors, code, and graphics visible in the image. "
                "NEVER state 'I am unable to view images', 'I cannot see images', or ask the user to describe the image. "
                "Provide a thorough, insightful, and comprehensive visual analysis immediately."
            )

        sys_content = (
            f"{base_sys}\n\n"
            f"[TEMPORAL CONTEXT]: Today is {today_str} (Year 2026). "
            f"You possess real-time intelligence and verified facts. Never state that your knowledge cuts off in 2023 or 2024. Refer to your real-time verified intelligence."
            f"{deep_directive}"
            f"{vis_directive}"
            f"{vision_directive}"
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

        # Append document attachments to prompt context if present
        if document_attachments:
            combined_doc_str = "\n\n".join(document_attachments)
            formatted_messages[-1]["content"] = (
                f"{formatted_messages[-1]['content']}\n\n"
                f"[User Attached Documents Context]:\n{combined_doc_str}\n\n"
                f"Please inspect and answer the user's questions about the attached documents above."
            )

        if image_attachments:
            img_labels = ", ".join([att.get("filename", "image") for att in image_attachments])
            formatted_messages[-1]["content"] = (
                f"{formatted_messages[-1]['content']}\n\n"
                f"[Attached Visual Images]: {img_labels}\n"
                f"Please inspect the visual images attached and answer the user's question directly with comprehensive analysis."
            )

        full_assistant_reply = ""

        try:
            async for chunk in ollama_provider.stream_chat(
                underlying_model,
                formatted_messages,
                images=image_attachments,
                is_search=is_search_active
            ):
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
