# CRETIVRA ASURA — Complete UI Architecture & Backend Work Specification

> **Version:** 2.0.0  
> **Platform:** Cretivra Asura AI  
> **Classification:** Master Technical Documentation & Architecture Reference  
> **Last Updated:** October 2026  

---

## 1. Executive System Overview

**Asura AI by Cretivra** is a unified, real-time multimodal artificial intelligence platform and autonomous agent operating system. Engineered with a hybrid-first philosophy, Asura AI operates seamlessly out-of-the-box with **zero external API costs** through intelligent local synthesis engines and free-tier providers, while offering deep enterprise integrations with Google Stitch MCP, Groq, Gemini, OpenRouter, and Razorpay.

The platform provides:
1. **Conversational Intelligence**: Sub-second conversational inference with real-time web grounding, entity extraction, source verification hierarchies, and clean markdown presentation.
2. **Autonomous Agent DAG Runtime**: Dynamic multi-step task planning, topological dependency resolution, tool sandboxing, automated verification, and human-in-the-loop (HITL) approval workflows.
3. **Stitch UI Synthesis & Building Canvas**: End-to-end web application generation from natural language prompts, featuring multi-phase building simulations, theme variant exploration, live device sandboxes, and code export.
4. **Multimodal Media Studio**: Visual diffusion generation (Flux.1 / SDXL / 3D Octane), neural voice synthesis (STT/TTS), automated presentation decks (`.pptx`), and PDF document compilation.
5. **Project & Knowledge Workspace**: Sandboxed workspaces with persistent project memory, file versioning, document chunking, and contextual RAG retrieval.

---

## 2. High-Level System Architecture Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                      FRONTEND (Next.js 14 / React / Tailwind)                     |
|                                                                                                   |
|  +--------------------+  +----------------------+  +---------------------+  +-------------------+  |
|  |   Home Workspace   |  |    Chat Workspace    |  |   Agent Workspace   |  | UIBuildingCanvas  |  |
|  | (Goal Composer)    |  |  (SSE Stream Cards)  |  |  (DAG Task Graph)   |  | (Stitch Engine)   |  |
|  +--------------------+  +----------------------+  +---------------------+  +-------------------+  |
|             |                       |                         |                       |           |
|             +-----------------------+-------------------------+-----------------------+           |
|                                                 | (REST / SSE Stream)                             |
+-------------------------------------------------|-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                        BACKEND (FastAPI / Python 3.11+)                           |
|                                                                                                   |
|  [AsuraRateLimitMiddleware] -> [Authentication & Security Layer] -> [API Router Dispatcher]       |
|                                                                                                   |
|  +---------------------------+  +--------------------------------+  +--------------------------+  |
|  |     Core Router Engine    |  |    Response Orchestrator       |  |  Agent Runtime & Planner |  |
|  | - 20+ Intent Classifiers  |  | - Context Isolation Protocol   |  | - DAG Task Generation    |  |
|  | - Entity Detector         |  | - Web Search Verification Hier.|  | - Sandboxed Tool Engine  |  |
|  | - Temporal Grounding      |  | - SSE Event Formatter          |  | - HITL Approval Manager  |  |
|  +---------------------------+  +--------------------------------+  +--------------------------+  |
|                |                               |                                  |               |
|                v                               v                                  v               |
|  +---------------------------+  +--------------------------------+  +--------------------------+  |
|  | Specialized AI Services   |  |    Media & Synthesis Engines   |  | Data & Storage Layer     |  |
|  | - web_search_service.py   |  | - stitch_engine.py (MCP+Local) |  | - PostgreSQL / SQLite    |  |
|  | - evidence_engine.py      |  | - image_service.py (Flux/SDXL) |  | - SQLAlchemy 2.0 ORM     |  |
|  | - visual_intelligence.py  |  | - presentation_service (.pptx) |  | - Uploads / Artifacts    |  |
|  | - voice_service.py (STT)  |  | - pdf_service.py (ReportLab)   |  | - Sandbox Filesystem     |  |
|  +---------------------------+  +--------------------------------+  +--------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Frontend Architecture & User Interface (UI) Details

### 3.1 Design System & Aesthetic Foundation
* **Theme & Colors**: Deep obsidian dark mode (`#070a12`, `#0b0f19`, `#121826`) coupled with a crisp light theme, glassmorphic blurs (`backdrop-blur-md`), and border illumination (`border-cyan-500/20`, `border-violet-500/20`).
* **Micro-Animations**:
  * `animate-stitch-laser`: Continuous 2.8s laser sweep scanning across synthesizing wireframes.
  * `laser-sweep` & `cv-blueprint-grid`: Futuristic CAD-like wireframe layout animations.
  * `radar-pulse`: Circular pulsing indicators for active background reasoning.
  * `animate-materialize`: Smooth opacity and scale transition for synthesized elements.
* **Responsive Layout**: Fluid breakpoints supporting Desktop (100% wide), Tablet (`768px`), and Mobile (`375px`) frames.

### 3.2 Workspace Navigation & State Machine
The core layout is governed by [`WorkspaceSidebar.tsx`](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/navigation/WorkspaceSidebar.tsx) and [`App.tsx`](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/App.tsx), maintaining an active `WorkspaceView`:

1. **`home` ([HomeWorkspace.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/landing/HomeWorkspace.tsx))**:
   * Brand header with animated `CretivraMark` logo.
   * Cinematic introduction trigger with sound toggle.
   * Interactive goal composer for launching ad-hoc queries, autonomous tasks, or deep workflows.
   * Quick-action cards: Website Generator, Slide Generator, Game Creator, and Image Studio.
2. **`chat` ([App.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/App.tsx))**:
   * Multi-turn chat message timeline with live typing effect.
   * Attachment chips with file upload previews (images, documents, code).
   * Feature toggles: Web Search Grounding, Deep Think (Chain-of-Thought), Image Mode, and Visual Reasoning.
3. **`agent_workspace` ([AgentWorkspace.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/agent/AgentWorkspace.tsx))**:
   * Direct view for tracking multi-step autonomous agent runs.
   * Split view: DAG task timeline on the left, live execution logs/artifacts/sandboxes on the right.
   * Interactive HITL approval cards for modifying or granting elevated permissions.
4. **`tasks` ([TasksWorkspace.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/tasks/TasksWorkspace.tsx))**:
   * Full tabular history of background agent runs.
   * Filters by status (`RUNNING`, `COMPLETED`, `WAITING_FOR_APPROVAL`, `FAILED`).
   * Metrics on execution time, token burn, and generated artifact count.
5. **`projects` ([ProjectsWorkspace.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/projects/ProjectsWorkspace.tsx))**:
   * Project workspace management where tasks, files, and memories are scoped.
   * In-browser filesystem tree viewer and file editor.
6. **`knowledge` ([KnowledgeWorkspace.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/knowledge/KnowledgeWorkspace.tsx))**:
   * Document RAG hub: upload PDFs, markdown files, and web links.
   * Chunking inspector and knowledge embedding status.
7. **`artifacts` ([ArtifactsWorkspace.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/artifacts/ArtifactsWorkspace.tsx))**:
   * Consolidated gallery of all deliverables: downloadable PDFs, PPTX decks, generated HTML websites, CSV tables, and images.

---

### 3.3 The Stitch UI Building Canvas ([UIBuildingCanvas.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/playground/UIBuildingCanvas.tsx))
The dedicated UI creation engine features:
* **Multi-Phase Synthesis Simulation**:
  1. *Phase 1: Visual Ontology & Layout Planning* — Deconstructs user prompt into a semantic component hierarchy.
  2. *Phase 2: Drafting Blueprint Wireframes* — Positions responsive grids, headers, and container constraints.
  3. *Phase 3: Synthesizing Design Tokens & Tailwind CSS* — Injects custom palettes, typography, and glassmorphism.
  4. *Phase 4: Compiling Reactive State & Interactions* — Wires dark/light mode switches, filters, search bars, and modals.
  5. *Phase 5: Finalizing Interactive Sandbox* — Mounts the functional application into a live iframe.
* **Device Viewport Switcher**: Toggle instantaneously between Desktop (100%), Tablet (768px), and Mobile (375px) frames with zoom controls (50% to 150%).
* **Theme Variant Explorer**: 1-click preview and swap between:
  * *Modern Cyan (Default)*: High-contrast dark obsidian with teal/cyan accents.
  * *Cyber Violet (Futuristic)*: Neon violet/fuchsia glowing borders.
  * *Minimalist Emerald (Clean)*: Clean typography with subtle emerald highlights.
* **Conversational Refinement Bar**: Refine generated screens on the fly (e.g., *"Add customer reviews and dark mode toggle"*).
* **Code Exporter**: Switch seamlessly between **Preview** and **Code** view, copy raw HTML, or download complete single-file packages.

---

### 3.4 Chat Stream Components & Modals
* **[MarkdownRenderer.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/chat/MarkdownRenderer.tsx)**: Custom syntax highlighter with copy buttons, formatted tables, LaTeX math rendering, and clean bullet conversion.
* **[IntelligenceCacheCard.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/chat/IntelligenceCacheCard.tsx)**: Displays reasoning duration, underlying provider latency, and query classification intent.
* **[SourceLinksCard.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/chat/SourceLinksCard.tsx)**: Renders verified web citations with favicons, domain labels, and source confidence scores.
* **[ImageGallery.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/chat/ImageGallery.tsx)**: Dynamic masonry gallery displaying high-resolution web search images or diffusion-generated images.
* **[ImageStudioModal.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/image-studio/ImageStudioModal.tsx)**: Visual diffusion studio with model selectors (*Cretivra FLUX.1 Art*, *Cretivra SDXL Studio*, *3D Octane*), aspect ratio toggles (1:1, 16:9, 9:16, 4:3, 21:9), negative prompts, and seed controls.
* **[CretivraVoiceModal.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/voice/CretivraVoiceModal.tsx)**: Fullscreen voice conversation studio with live wave visualizer, Web Audio API streaming, and neural voice synthesis.
* **[ModelSelectorModal.tsx](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/frontend/src/components/model-selector/ModelSelectorModal.tsx)**: White-labeled model switcher:
  * *Cretivra 1 (Balanced)* — Fast daily reasoning.
  * *Cretivra 1.1 (Advanced)* — Deep problem-solving.
  * *Cretivra 1.2 (Fast)* — Low-latency streaming.
  * *Cretivra Coder Pro* — High-accuracy code generation.
  * *Cretivra Reason* — Step-by-step mathematical reasoning.
  * *Cretivra Omni 4* — Multimodal vision and document comprehension.

---

## 4. Backend Architecture & Engine Work

### 4.1 FastAPI Application Core ([main.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/main.py))
* **Asynchronous Lifespan Management**:
  * Asynchronously boots the relational database in an isolated thread so port binding and `/health` respond immediately without startup blockage.
  * Asynchronously pre-warms upstream provider connections (Groq, Gemini, OpenRouter).
  * Automatically provisions the artifact and uploads directory structures.
* **Middleware Stack**:
  * `CORSMiddleware`: Permits flexible development and secure multi-domain production requests.
  * `AsuraRateLimitMiddleware`: Enforces sliding-window rate limits to prevent denial-of-service abuse while permitting burst interactive chats.

---

### 4.2 Core Query Intent Router ([router.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/core/router.py))
Every user query passes through [`asura_router.route_async()`](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/core/router.py#L350), which executes a zero-latency heuristic and regex analysis:
* **Intent Categorization**: Classifies queries into 20+ specialized domains:
  `REAL_TIME`, `CURRENT_AFFAIRS`, `SPORTS`, `POLITICS`, `FINANCE`, `TECHNOLOGY`, `CODING`, `IMAGE`, `WEATHER`, `DOCUMENT`, `GENERAL_KNOWLEDGE`.
* **Entity Extraction ([entity.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/core/entity.py))**: Extracts key named entities (e.g., *"Virat Kohli"*, *"Tesla Q3 earnings"*, *"Nvidia H100"*) to target downstream search engines accurately.
* **Temporal Grounding ([time_utils.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/core/time_utils.py))**: Injects real-time date anchors (current day, month, year in `Asia/Kolkata`) into router evaluations to prevent obsolete answers.
* **Follow-up & Anaphora Detection**: Identifies pronouns (*"who is his wife?"*, *"when did they launch?"*) and resolves them to conversation history entities while isolating context from unrelated previous topics.

---

### 4.3 Response Orchestrator ([response_orchestrator.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/services/response_orchestrator.py))
The master brain coordinating user chat sessions:
1. **Context Isolation**: For fresh user queries, previous message history is strictly isolated to prevent prompt pollution and hallucination bleed.
2. **Real-Time Web Search & Grounding**: When `requires_web` is true:
   * Dispatches parallel queries across Google Search, Tavily, and Wikipedia.
   * Hands off raw search results to [`evidence_engine.py`](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/services/evidence_engine.py) to rank, de-duplicate, and filter reliable news/facts.
3. **Image Grounding Pipeline**: If the query pertains to public figures, sports, products, or current events, queries [`image_search.py`](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/providers/image_search.py) to extract genuine high-res imagery, completely separate from diffusion image generation.
4. **Sanitization Protocol ([cloud_provider.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/providers/cloud_provider.py#L32))**:
   * Converts raw HTML tags (`<ul>`, `<li>`, `<div>`) into markdown syntax.
   * Strips third-party vendor watermarks to guarantee a white-labeled Cretivra Asura experience.
5. **SSE Stream Emission**: Emits structured JSON events over an SSE channel:
   * `event: thought` — Chain-of-thought analysis step.
   * `event: sources` — List of verified citation URLs.
   * `event: images` — Real-time or generated images.
   * `event: delta` — Markdown text chunks for live typing.
   * `event: done` — Final latency and token statistics.

---

### 4.4 Stitch Engine & UI Synthesizer ([stitch_engine.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/services/stitch_engine.py))
Autonomous web application generator operating with a dual-layer strategy:
* **Layer 1 (Official Stitch MCP Protocol)**:
  * When `STITCH_API_KEY` is present in the environment, formats and transmits requests to `https://stitch.googleapis.com/mcp` using `generate_screen_from_text`.
* **Layer 2 (Zero-Cost Local Synthesis Engine)**:
  * If no API key is provided or remote calls time out, automatically falls back to an extensive local generator.
  * Synthesizes single-file HTML applications containing complete Tailwind CSS styling, Google Fonts, Lucide SVG icons, responsive flex/grid layouts, dynamic JavaScript state management, search/filter algorithms, and working modals.
  * Specialized domain synthesizers for:
    * **Portfolios**: Hero banners, project filters, interactive contact modals.
    * **CRMs**: Deal pipelines, draggable Kanban columns, revenue metrics, new deal modals.
    * **E-Commerce**: Product grids, category filters, live cart drawer, checkout modal.
    * **Analytics Dashboards**: KPI cards, interactive SVG charts, data tables.
    * **Task Management**: Kanban boards with task creation and stage toggling.

---

### 4.5 Autonomous Agent DAG Runtime ([agent_runtime.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/agents/runtime/agent_runtime.py))
An execution engine capable of long-running, multi-step problem solving:
1. **DAG Task Planner ([planner.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/agents/runtime/planner.py))**:
   * Deconstructs a broad user objective into an ordered Directed Acyclic Graph (DAG) of subtasks (`AgentTaskDB`).
   * Assigns task types: `planning`, `research`, `coding`, `testing`, `verification`.
2. **Task Scheduler ([task_manager.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/agents/runtime/task_manager.py))**:
   * Evaluates topological dependencies; triggers child tasks only when prerequisite tasks achieve `COMPLETED` status.
3. **Sandboxed Execution Engine ([execution_engine.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/agents/runtime/execution_engine.py))**:
   * Executes tools safely in the project sandbox directory.
   * Core tools: `file_writer`, `file_reader`, `web_search`, `code_executor`, `stitch_ui_synthesizer`, `pdf_compiler`, `slide_deck_compiler`.
4. **Human-in-the-Loop Approval Manager ([approval_manager.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/agents/runtime/approval_manager.py))**:
   * Identifies `HIGH` or `CRITICAL` risk operations (e.g., destructive file overrides, terminal execution).
   * Transitions task status to `WAITING_FOR_APPROVAL` and blocks execution until the user approves or modifies the payload via the frontend UI.
5. **Automated Verification Engine ([verification_engine.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/agents/runtime/verification_engine.py))**:
   * Validates tool output against expected criteria (e.g., verifying `index.html` was generated and contains valid HTML structure).
6. **Self-Healing Replanner ([replanner.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/agents/runtime/replanner.py))**:
   * If a task fails or errors, generates corrective remedial steps rather than failing the entire run.

---

### 4.6 Media & Document Compilation Services
* **PDF Service ([pdf_service.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/services/pdf_service.py))**: Uses `reportlab` to compile structured data into styled, downloadable PDF executive briefings and research reports.
* **Presentation Service ([presentation_service.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/services/presentation_service.py))**: Uses `python-pptx` to compile slide decks with titles, bullet points, statistics callouts, and dark/light themes.
* **Visual Intelligence ([visual_intelligence_service.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/services/visual_intelligence_service.py))**: Understands user-uploaded images, documents, and screenshots using vision models.
* **Voice Pipeline ([voice_service.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/services/voice_service.py))**: Real-time speech recognition and text-to-speech synthesis with low latency.

---

## 5. Complete Database Schema (SQLAlchemy Models)

Defined in [`backend/app/database/models.py`](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/database/models.py):

| Table Name | Model Class | Key Fields & Purpose |
|---|---|---|
| `users` | `UserDB` | `id`, `email`, `username`, `password_hash`, `is_subscribed`, `subscription_expires_at`, `plan_name`. Core authentication entity. |
| `conversations` | `ConversationDB` | `id`, `title`, `model_id`, `user_id`, timestamps. Represents a chat thread. |
| `messages` | `MessageDB` | `id`, `conversation_id`, `role`, `content`, `reasoning_status`. Chat turn records. |
| `attachments` | `AttachmentDB` | `id`, `conversation_id`, `message_id`, `filename`, `path`, `size`, `mime_type`. User-uploaded files. |
| `projects` | `ProjectDB` | `id`, `user_id`, `name`, `description`, `root_path`. Workspace sandbox root. |
| `project_files` | `ProjectFileDB` | `id`, `project_id`, `path`, `content`, `size`, `mime_type`. Virtual file records inside sandboxes. |
| `project_memory` | `ProjectMemoryDB` | `id`, `project_id`, `key`, `content`, `category`. Scoped contextual memories across agent runs. |
| `knowledge_sources`| `KnowledgeSourceDB` | `id`, `project_id`, `title`, `source_type`, `content`, `chunks_count`. Grounding documents. |
| `agent_runs` | `AgentRunDB` | `id`, `user_id`, `project_id`, `prompt`, `intent`, `status`, `duration`, `tokens`, `result`. DAG executions. |
| `agent_tasks` | `AgentTaskDB` | `id`, `run_id`, `parent_task_id`, `task_order`, `task_type`, `status`, `tool_name`, `input_data`, `output_data`. Individual DAG subtasks. |
| `agent_steps` | `AgentStepDB` | `id`, `task_id`, `step_number`, `step_type`, `content`. Granular reasoning & execution log steps. |
| `tool_registry` | `ToolRegistryDB` | `name`, `description`, `risk_level`, `requires_approval`, `timeout_seconds`. Catalog of usable agent tools. |
| `tool_executions`| `ToolExecutionDB` | `id`, `run_id`, `tool_name`, `input_payload`, `output_payload`, `duration_ms`, `status`. Execution audit records. |
| `approvals` | `ApprovalDB` | `id`, `run_id`, `task_id`, `tool_name`, `action_type`, `payload`, `risk_level`, `status`. HITL approval requests. |
| `artifacts` | `ArtifactDB` | `id`, `project_id`, `run_id`, `type`, `name`, `path`, `download_url`, `metadata_json`. Generated files (HTML, PDF, PPTX). |
| `payments` | `PaymentDB` | `id`, `user_id`, `amount`, `currency`, `gateway`, `payment_id`, `status`. Razorpay and pass records. |
| `suggestions` | `SuggestionDB` | `id`, `user_id`, `comment`, `rating`, `category`. User feedback submissions. |
| `system_settings` | `SystemSettingDB`| `key`, `value`. Dynamic server-side configuration pairs. |

---

## 6. Comprehensive API Endpoint Catalog

All routes are mounted under `/api` in [`main.py`](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/main.py#L76-L93):

### 6.1 Chat & Conversational API
* `POST /api/chat`: Primary Server-Sent Events (SSE) chat endpoint. Streams reasoning, tokens, images, and sources.
* `GET /api/conversations`: Returns user conversation history with pin state and message previews.
* `POST /api/conversations`: Initializes a new conversation thread.
* `GET /api/conversations/{id}`: Fetches complete message history and attachments for a thread.
* `PUT /api/conversations/{id}`: Updates thread title or settings.
* `DELETE /api/conversations/{id}`: Deletes conversation and associated records.
* `POST /api/chat/export-pdf`: Compiles active conversation into a formatted PDF document.

### 6.2 Stitch Engine & UI Playground API ([playground.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/app/api/playground.py))
* `POST /api/playground/ui/synthesize`: Synthesizes a full single-file web app from a prompt using Stitch SDK or local engine.
* `POST /api/playground/ui/variants`: Generates 3 styled design variants (*Modern Cyan*, *Cyber Violet*, *Minimalist Emerald*).
* `POST /api/playground/ui/refine`: Modifies existing application HTML via natural language instruction.
* `POST /api/playground/run`: Starts an autonomous background agent run from a prompt.
* `GET /api/playground/run/{id}`: Fetches run details, task graph DAG, and artifact deliverables.
* `GET /api/playground/run/{id}/stream`: SSE stream broadcasting real-time agent execution events.

### 6.3 Autonomous Agents & Projects API
* `GET /api/projects`: Lists user projects with sandbox metadata.
* `POST /api/projects`: Creates a new sandboxed project space.
* `GET /api/projects/{id}/files`: Lists sandbox files.
* `POST /api/projects/{id}/files`: Uploads or creates a sandbox file.
* `GET /api/agents/tasks/{task_id}`: Retrieves task status and step logs.
* `POST /api/agents/approvals/{approval_id}/respond`: Grants or denies HITL permissions.
* `GET /api/artifacts/{id}/download`: Streams downloadable artifact files (HTML, ZIP, PDF, PPTX).

### 6.4 Media & Studio API
* `POST /api/images/generate`: Generates visual artwork using diffusion models.
* `POST /api/voice/transcribe`: Converts uploaded audio to text (STT).
* `POST /api/voice/synthesize`: Synthesizes audio speech from text (TTS).
* `POST /api/vision/analyze`: Multimodal visual document and screenshot analysis.
* `GET /api/models`: Returns list of available AI models with capability tags and latency badges.

### 6.5 Authentication & System Settings API
* `POST /api/auth/register`: Creates new user account.
* `POST /api/auth/login`: Authenticates user and issues JWT Bearer token.
* `GET /api/auth/me`: Fetches current user profile and subscription status.
* `POST /api/payments/create-order`: Initiates payment order.
* `POST /api/payments/verify`: Validates gateway payment signature and activates pass.
* `GET /api/health`: System health check status.

---

## 7. Verification & Testing Framework

Asura AI features an automated test harness ensuring system integrity:
1. **Raw HTML Sanitization**: Verified in [test_all_master_requirements.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/test_all_master_requirements.py#L22-L36), guaranteeing raw `<ul>` and `<li>` tags never leak into user answers.
2. **Entity & Image Grounding**: Verifies query routing for real entities and ensures genuine image attachments are retrieved.
3. **Stitch UI Synthesis Quality**: Verified in [test_ui_synthesis.py](file:///c:/Users/suhas/OneDrive/Desktop/cretivra%20ai/backend/tests/test_ui_synthesis.py):
   * Validates `<!DOCTYPE html>` structure in all outputs.
   * Asserts complete absence of external vendor watermarks (*"Google Stitch"*).
   * Validates variant generation and real-time HTML editing capabilities.
4. **Context Isolation**: Verifies subsequent independent queries do not retain old query context.
