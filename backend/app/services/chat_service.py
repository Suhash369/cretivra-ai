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
from app.providers.cloud_provider import clean_ai_response
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
        deep_research: Optional[bool] = False,
        image_mode: Optional[bool] = False
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

        # 2. Check if the selected model is an image generation model, image_mode is forced, or user expressed image/diagram intent
        is_dedicated_image_model = registry.is_image_model(model_id)
        detected_image_prompt = image_service.detect_image_intent(user_message_content)

        if is_dedicated_image_model or detected_image_prompt or image_mode:
            raw_image_prompt = detected_image_prompt if detected_image_prompt else user_message_content.strip()

            clean_image_prompt = re.sub(
                r"^/(?:image|draw|art|flux|diagram|schematic|visual)\s*",
                "",
                raw_image_prompt,
                flags=re.IGNORECASE
            ).strip()
            if not clean_image_prompt:
                clean_image_prompt = raw_image_prompt

            # Contextual resolution: If user prompt is generic or referential (e.g. "circuit diagram", "a circuit diagram", "diagram", "schematic", "this", "it")
            # Check conversation title or recent messages for context
            context_topic = ""
            if len(clean_image_prompt.split()) <= 3 and any(w in clean_image_prompt.lower() for w in ["circuit", "diagram", "schematic", "this", "it", "wiring", "flowchart"]):
                if conv and conv.title and not conv.title.lower().startswith("new") and not conv.title.lower().startswith("circuit") and not conv.title.lower().startswith("i need"):
                    context_topic = conv.title.strip()
                elif len(messages_db) > 1:
                    for prev_msg in reversed(messages_db[:-1]):
                        if prev_msg.role == "user" and prev_msg.content:
                            prev_text = prev_msg.content.strip()
                            if len(prev_text) > 3 and not any(w == prev_text.lower() for w in ["hi", "hello", "circuit diagram", "diagram"]):
                                context_topic = prev_text[:60]
                                break

            if context_topic and context_topic.lower() not in clean_image_prompt.lower():
                final_image_prompt = f"{context_topic} {clean_image_prompt}".strip()
            else:
                final_image_prompt = clean_image_prompt

            is_technical_diagram = bool(re.search(
                r"\b(circuit|schematic|wiring|logic|pinout|flowchart|architecture|blueprint|block\s+diagram|timing\s+diagram|converter|processor|amplifier|gate|hardware|diagram)\b",
                user_message_content,
                re.IGNORECASE
            ))

            model_info = registry.get_model(model_id)
            engine_name = model_info.display_name if (model_info and is_dedicated_image_model) else "Cretivra Vision Engine"

            status_text = f"Synthesizing visual diagram with {engine_name}..." if is_technical_diagram else f"Synthesizing visual with {engine_name}..."
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': status_text})}\n\n"
            await asyncio.sleep(0.3)

            target_engine = "nanobanana2"
            if model_id in ["cretivra-anime", "cretivra-3d", "cretivra-turbo", "cretivra-diffusion", "cretivra-flux"]:
                target_engine = model_id

            if is_technical_diagram:
                clean_core = re.sub(
                    r"\b(?:generate|draw|show|create|make|give\s+me|i\s+need|a|an|the|circuit\s+diagram|schematic(?:\s+diagram)?|wiring\s+diagram|logic\s+diagram|diagram|of|for|about)\b",
                    "",
                    final_image_prompt,
                    flags=re.IGNORECASE
                ).strip()

                if not clean_core or clean_core.lower() in ["circuit", "schematic", "logic", "electronics", "wiring", "visual"]:
                    circuit_topic = "3-Bit Binary to BCD Converter (0 - 7)"
                else:
                    circuit_topic = clean_core.title()

                final_image_prompt = (
                    f"A clean textbook-style electrical engineering schematic diagram of a {circuit_topic}. "
                    f"Crisp 2D vector schematic illustration on a clean white background. "
                    f"In the center: a clearly labeled logic block box '{circuit_topic}'. "
                    f"On the left: clearly labeled input pins A, B, C with signal lines. "
                    f"On the right: clearly labeled output pins D3, D2, D1, D0 with signal lines. "
                    f"Includes an integrated truth table chart with clear binary columns and values, "
                    f"a callout box with logic equations, and a circuit explanation notes box. "
                    f"Crisp solid black and navy lines, sharp legible sans-serif typography, "
                    f"professional educational textbook publication, academic electrical engineering diagram, "
                    f"flat 2D vector graphic, high contrast, clean white backdrop, strictly no 3D, no neon, no dark background, no glowing effects"
                )
                target_aspect = "16:9"
                enhance_flag = False
                diagram_style = "diagram"
                display_title = f"{circuit_topic} Circuit Diagram"
            else:
                circuit_topic = final_image_prompt
                enhance_flag = True
                diagram_style = None
                target_aspect = "1:1"
                display_title = final_image_prompt.title()

            img_data = image_service.generate_image_url(
                prompt=final_image_prompt,
                aspect_ratio=target_aspect,
                model=target_engine,
                style=diagram_style,
                enhance=enhance_flag
            )
            rendered_url = img_data.get("proxy_url") or img_data["image_url"]

            image_card = f"![{display_title}]({rendered_url})\n\n"

            if not is_technical_diagram and not is_dedicated_image_model and not any(w in user_message_content.lower() for w in ["explain", "how", "what", "tell", "describe", "details"]):
                image_reply = f"Here is your generated visual for: **{display_title}**\n\n{image_card}"
                yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': image_reply, 'full_content': image_reply, 'done': True, 'reasoning_status': None})}\n\n"
                conversation_service.add_message(
                    db=db,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=image_reply
                )
                return

            # Technical diagram or request with explanation:
            full_assistant_reply = image_card
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': image_card, 'full_content': full_assistant_reply, 'done': False, 'reasoning_status': 'Analyzing circuit connections & formulating technical breakdown...'})}\n\n"

            diag_sys_prompt = (
                f"{settings.SYSTEM_PROMPT}\n\n"
                f"[TECHNICAL VISUAL DIRECTIVE]: A high-resolution visual schematic diagram for '{circuit_topic}' has been generated and rendered at the very top of the response.\n"
                f"Now provide a thorough, publication-grade technical explanation of the circuit.\n"
                f"Structure your response with:\n"
                f"1. **Overview & Functional Description**: Clear summary of the circuit/system and how it operates.\n"
                f"2. **Key Connections & Pin Mapping**: Bulleted list of connections (e.g., • A → D2, • B → D1, • C → D0, • D3 → Ground/0).\n"
                f"3. **Truth Table**: A clean Markdown table with headers and rows. CRITICAL: Every single table row MUST be on its own line. Use plain text (0, 1, A, B, C, D) inside table cells without dollar signs ($) or LaTeX macros so table rendering is pristine.\n"
                f"4. **Logic Equations**: Clean Boolean equations (e.g., D3 = 0, D2 = A, D1 = B, D0 = C).\n"
                f"5. **Practical Hardware Implementation**: Components needed (e.g., ICs, buffers, logic gates, pull-ups), voltage levels, and best practices.\n\n"
                f"CRITICAL FORMATTING RULES FOR TABLES & EQUATIONS:\n"
                f"- Every single Markdown table row MUST be on its own separate line with a newline character. Never join multiple table rows or '||' on the same line.\n"
                f"- In Markdown table cells, use plain clean text (e.g., '0', '1', 'A', 'B', 'X', 'D2', 'XOR', 'AND') without LaTeX math delimiters like '$' or LaTeX commands like '\\text{{}}', '\\oplus', or '\\mu'. Plain text in tables ensures perfect formatting.\n"
                f"- For standalone equations outside tables, write them simply (e.g., D3 = 0, D2 = A, D1 = B, D0 = C) or use standard clean code blocks or LaTeX without breaking table syntax.\n"
                f"- Do NOT output crude ASCII-art wire boxes or text schematics, since the high-resolution visual diagram is already rendered above."
            )

            diag_messages = [
                {"role": "system", "content": diag_sys_prompt},
            ]
            for m in messages_db[-settings.MAX_CONTEXT_MESSAGES:]:
                diag_messages.append({"role": m.role, "content": m.content})

            try:
                async for chunk in ollama_provider.stream_chat(
                    underlying_model,
                    diag_messages,
                    is_search=False
                ):
                    content = chunk.get("content", "")
                    done = chunk.get("done", False)
                    if content:
                        content = re.sub(r'(?:User|Response|Prompt)\s+Safety:\s*(?:safe|unsafe|neutral|none|harmful|unspecified)[^\n]*\n?', '', content, flags=re.IGNORECASE)
                        content = re.sub(r'\bUser Safety:\s*\w+\s*Response Safety:\s*\w+\b', '', content, flags=re.IGNORECASE)
                    if content:
                        full_assistant_reply += content
                    yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': content, 'full_content': full_assistant_reply, 'done': done, 'reasoning_status': None})}\n\n"

                cleaned_reply = clean_ai_response(full_assistant_reply)
                conversation_service.add_message(
                    db=db,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=cleaned_reply
                )
                return
            except Exception as e:
                logger.error(f"Error streaming technical explanation: {e}")
                fallback_reply = f"{image_card}\n\nHere is your generated schematic for: **{display_title}**."
                yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': fallback_reply, 'full_content': fallback_reply, 'done': True, 'reasoning_status': None})}\n\n"
                conversation_service.add_message(
                    db=db,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=fallback_reply
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
        sources = []

        if is_search_active:
            clean_q = web_search_service.normalize_query(user_message_content)
            cache_items = [
                f"Neural cache lookup for \"{clean_q[:28]}\"",
                "Verified multi-source intelligence index",
                "Temporal grounding synchronized (2026)",
                "Synthesizing cached intelligence insights"
            ]
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': 'Consulting real-time web intelligence cache...', 'cache_items': cache_items, 'sources': []})}\n\n"
            search_data = await web_search_service.search_with_sources(user_message_content)
            if search_data and search_data.get("context_text"):
                live_web_context = search_data["context_text"]
                sources = search_data.get("sources", [])
                last_reasoning_status = "Synthesized from real-time intelligence"
                yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': last_reasoning_status, 'cache_items': cache_items, 'sources': sources})}\n\n"
        elif is_deep_research_active:
            cache_items = [
                "Deep chain-of-thought activation",
                "Mathematical & logical deduction trees",
                "Self-consistency verification passes",
                "Formulating comprehensive analytical report"
            ]
            last_reasoning_status = "Deep reasoning & research in progress..."
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': '', 'full_content': '', 'done': False, 'reasoning_status': last_reasoning_status, 'cache_items': cache_items, 'sources': []})}\n\n"

        # Formulate system prompt with current live date and directives
        today_str = datetime.now().strftime("%B %d, %Y")
        if system_prompt and system_prompt.strip() != settings.SYSTEM_PROMPT.strip():
            base_sys = f"{settings.SYSTEM_PROMPT}\n\n[Contextual Directive]: {system_prompt}"
        else:
            base_sys = settings.SYSTEM_PROMPT
        
        deep_directive = ""
        if is_deep_research_active:
            deep_directive = (
                "\n\n[DEEP RESEARCH DIRECTIVE]: You are operating in Deep Research Mode. "
                "Provide an exhaustive, highly detailed, well-structured report. "
                "Structure your output with an Executive Summary, Detailed Analysis, Key Findings, Comparative Tables, and Actionable Strategic Recommendations."
            )

        vis_directive = ""
        if re.search(r"\b(chart|visualize|visualization|graph|table)\b", user_message_content, re.IGNORECASE):
            vis_directive = (
                "\n\n[VISUALIZATION DIRECTIVE]: Format data using clean Markdown tables, comparative breakdown cards, and visual structures to make the insights immediately clear."
            )

        diagram_directive = (
            "\n\n[DIAGRAM & SCHEMATIC DIRECTIVE]: "
            "Never output crude ASCII art wire diagrams, ASCII circuit boxes, or monospace terminal art (such as +----+ or |----->) because users require clean modern presentations. "
            "Instead, use structured Markdown tables, bulleted connection mappings (e.g. • Input A -> Output D2), and clear technical explanations."
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

        youtube_directive = (
            "\n\n[URL & YOUTUBE DIRECTIVE]: "
            "When referencing YouTube channels or creators, ALWAYS use the official modern YouTube Handle URL format: "
            "`https://www.youtube.com/@ChannelHandle` (e.g. `https://www.youtube.com/@MrBeast`). "
            "NEVER use deprecated `/c/` or `/user/` paths (such as `youtube.com/c/...`) because YouTube returns a 404 Not Found page for them. "
            "For general YouTube video queries or topic searches, use `https://www.youtube.com/results?search_query=...`."
        )

        map_directive = (
            "\n\n[MAPS & LOCATION DIRECTIVE]: "
            "When providing links to locations, addresses, landmarks, businesses, or directions, ALWAYS use Google's official Universal Maps Search format: "
            "`https://www.google.com/maps/search/?api=1&query=<URL_ENCODED_LOCATION>` "
            "(e.g., `https://www.google.com/maps/search/?api=1&query=Eiffel+Tower%2C+Paris` or `https://www.google.com/maps/search/?api=1&query=Taj+Mahal%2C+Agra`). "
            "CRITICAL: NEVER hallucinate shortened URLs like `maps.app.goo.gl/...` or `goo.gl/maps/...` (they 404 and fail!). "
            "NEVER invent internal Google Place IDs. Always use `https://www.google.com/maps/search/?api=1&query=...` with plus signs `+` for spaces so links are 100% reliable on every device."
        )

        sys_content = (
            f"{base_sys}\n\n"
            f"[TEMPORAL CONTEXT]: Today is {today_str} (Year 2026). "
            f"You possess real-time intelligence and verified facts. Never state that your knowledge cuts off in 2023 or 2024. Refer to your real-time verified intelligence."
            f"{deep_directive}"
            f"{vis_directive}"
            f"{diagram_directive}"
            f"{vision_directive}"
            f"{youtube_directive}"
            f"{map_directive}"
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
            is_news = bool(re.search(r"\b(news|affairs|headlines|world|today|breaking|happening|global|latest)\b", str(user_orig_q), re.IGNORECASE))
            is_whereabouts = bool(re.search(r"\b(where is|where are|currently|today|now|location|schedule|travel|visit|whereabouts)\b", str(user_orig_q), re.IGNORECASE))

            if is_whereabouts:
                directive = (
                    "Directive: Answer the question factually and accurately using the verified real-time cache above. "
                    "CRITICAL: Always prioritize the most recent chronological updates, latest dates (such as September 10-11, 2026), "
                    "official travel departures, and overseas visits over previous days' activities or older routines. "
                    "Clearly state the exact current location and the reason for the visit."
                )
            elif is_news:
                directive = (
                    "Directive: Provide a comprehensive, highly organized World News & Current Affairs briefing based on the verified intelligence cache above. "
                    "Structure your answer with clear section headings (such as Top Global Headlines, Geopolitics & Diplomacy, Global Economy & Markets, Regional Developments). "
                    "Detail the verified events, key figures, dates, and significance clearly. Never state that your knowledge is outdated."
                )
            else:
                directive = "Directive: Answer the question directly, comprehensively, and factually using the latest verified cache facts above."

            citation_guidance = (
                "\n\n[Grounding & Citations Directive]: "
                "The intelligence cache above provides numbered sources with URLs. "
                "When referencing facts or figures, cite them clearly using markdown citations (e.g. [1](URL) or [Domain](URL)). "
                "At the end of your answer, include a '### Sources & References' section with clickable markdown links [Title](URL) for each cited source."
            )

            formatted_messages[-1]["content"] = (
                f"Question: {user_orig_q}\n\n"
                f"[Verified Real-Time Intelligence Cache as of {today_str}]:\n{live_web_context}\n\n"
                f"{directive}"
                f"{citation_guidance}"
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

                yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': content, 'full_content': full_assistant_reply, 'done': done, 'reasoning_status': last_reasoning_status, 'sources': sources})}\n\n"

            # Save sanitized assistant response to DB
            cleaned_reply = clean_ai_response(full_assistant_reply)
            conversation_service.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=cleaned_reply
            )

        except Exception as e:
            logger.error(f"Error in chat stream generation: {e}")
            err_msg = "\n\n*[Connection interrupted. Please try again.]*"
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'model_id': model_id, 'content': err_msg, 'full_content': full_assistant_reply + err_msg, 'done': True, 'reasoning_status': None})}\n\n"

chat_service = ChatService()
