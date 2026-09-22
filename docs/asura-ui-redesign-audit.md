# ASURA AI — ARCHITECTURAL & UI/UX AUDIT REPORT
**Platform:** ASURA AI by CRETIVRA  
**Tagline:** *"Your AI. Your data. Your control. Think beyond."*  
**Document Target:** `/docs/asura-ui-redesign-audit.md`  
**Execution Mode:** Pre-Implementation Architectural Assessment (Phase 0)  
**Date:** September 2026  

---

## Executive Summary
This audit provides a comprehensive, deep-dive evaluation of the existing production codebase of **Asura AI by Cretivra**. Asura AI is a hybrid-first, autonomous AI platform supporting conversational intelligence, autonomous DAG task execution, human-in-the-loop approvals, live artifact rendering, diffusion visual generation, Stitch UI synthesis, and multi-format document compilation. 

The goal of this audit is to baseline all 32 functional and architectural dimensions of the platform before executing the **ASURA AI** workspace transformation—transitioning the user experience from a "chatbot with a sidebar" into an "Autonomous AI Operating Workspace" inspired by Manus product principles while preserving 100% of the backend engines, database schemas, and API contracts.

---

## 1. Current Frontend Architecture
- **Dual Runtime Support:**
  - **Vite 8 SPA:** Rooted at `frontend/src/main.tsx`, mounting `<App />` directly for ultra-fast local client-side development (`npm run dev:vite` / `npm run build:vite`).
  - **Next.js 16 (App Router):** Rooted at `frontend/src/app/layout.tsx` with dynamic client entry points (`frontend/src/app/studio/StudioClient.tsx`, `frontend/src/app/chat/ChatClient.tsx`, `frontend/src/app/playground/PlaygroundClient.tsx`).
- **Core Orchestrator:** `frontend/src/App.tsx` (approx. 2,246 lines) currently acts as the central view controller managing modal state, conversation active context, SSE stream processing, attachment buffers, and view switching between `'chat'` and `'playground'`.
- **Modularity:**
  - `src/components/chat/`: Message renderer, composer, citations, intelligence cards.
  - `src/components/sidebar/`: Conversation history, search modal, session grouping.
  - `src/components/model-selector/`: Cretivra Neural Engine model picker.
  - `src/components/image-studio/`: Multi-model diffusion image studio.
  - `src/playground/`: Autonomous task workspace (`TaskWorkspace.tsx`, `TaskGraph.tsx`, `PlanPanel.tsx`, `ApprovalCard.tsx`, `ArtifactPanel.tsx`, `PreviewPanel.tsx`, `UIBuildingCanvas.tsx`).
  - `src/services/`: HTTP and SSE client layers (`api.ts`, `playgroundApi.ts`, `streaming.ts`, `theme.ts`, `supabase.ts`).

---

## 2. Current Backend Architecture
- **Framework:** FastAPI (Python 3.11+) asynchronous microservice rooted at `backend/app/main.py`.
- **Layered Structure:**
  - **Core:** Configuration (`config.py`), logging (`logging.py`), security (`security.py`).
  - **Database:** SQLAlchemy 2.0 ORM (`database.py`, `models.py`) supporting SQLite (`cretivra.db`) and PostgreSQL / Supabase connection pooling.
  - **Providers Layer:** Multi-provider LLM abstraction (`cloud_provider.py`) routing between Groq, Google Gemini, OpenRouter, DeepSeek, and local Ollama instances with automated fallback.
  - **Agent Runtime:** Hierarchical DAG orchestrator (`backend/app/agents/runtime/`) featuring `agent_runtime.py`, `planner.py`, `task_manager.py`, `execution_engine.py`, `approval_manager.py`, `verification_engine.py`, and `replanner.py`.
  - **Tools Registry:** `CretivraToolRegistry` (`backend/app/tools/registry.py`) providing 11 sandboxed tools.
  - **Services:** `chat_service.py`, `web_search_service.py`, `pdf_service.py`, `presentation_service.py`, `image_service.py`, `stitch_engine.py`, `project_service.py`, `artifact_service.py`.

---

## 3. All Routes (Frontend & Backend)

### Frontend Routes (Next.js App Router)
- `/`: Landing and primary AI studio entrance.
- `/studio`: Dynamic Asura AI studio workspace.
- `/chat`: Direct chat studio URL.
- `/playground`: Direct autonomous agent playground URL (with `?run=`, `?prompt=`, `?mode=` support).
- `/ai-agents`: Enterprise AI agents landing and showcase.
- `/automation`: Intelligent workflow automation information.
- `/generative-ai`: Generative media and creative AI capabilities.
- `/blog`: Articles and technology insights.
- `/share/[id]`: Public read-only conversation view.
- `/test-bench`: Internal diagnostic test harness.

### Backend HTTP Routes
- `GET /health` & `GET /api/health`: Health check probes.
- `GET /docs`, `GET /redoc`, `GET /openapi.json`: OpenAPI documentation.
- `GET /`: Root status JSON or static SPA distribution mount.

---

## 4. All API Endpoints

| Category | Method | Path | Description |
|---|---|---|---|
| **Health** | GET | `/api/health` | Multi-subsystem health status (Inference, DB, Search, Storage) |
| **Auth** | POST | `/api/auth/register` | Register user with email, password, and name |
| **Auth** | POST | `/api/auth/login` | Authenticate user, return JWT access token |
| **Auth** | GET | `/api/auth/me` | Fetch authenticated user profile |
| **Models** | GET | `/api/models` | List Cretivra Neural Engine registered models |
| **Models** | PATCH | `/api/models/{model_id}` | Update model configuration and runtime mappings |
| **Conversations** | GET | `/api/conversations` | List user conversations (supports `?q=` search) |
| **Conversations** | POST | `/api/conversations` | Create a new conversation |
| **Conversations** | GET | `/api/conversations/{id}` | Get conversation with ordered messages and attachments |
| **Conversations** | PATCH | `/api/conversations/{id}` | Rename or update conversation model |
| **Conversations** | DELETE | `/api/conversations/{id}` | Delete conversation and associated messages |
| **Conversations** | POST | `/api/conversations/bulk-delete` | Bulk delete conversations |
| **Conversations** | GET | `/api/conversations/share/{id}` | Public share endpoint for conversation snapshot |
| **Messages** | DELETE | `/api/messages/{id}` | Delete single message |
| **Chat** | POST | `/api/chat/stream` | Primary SSE chat streaming endpoint |
| **Chat** | POST | `/api/chat/message` | Synchronous non-streamed chat completion |
| **Files** | POST | `/api/files/upload` | Multipart file upload (PDF, DOCX, CSV, images) |
| **Files** | POST | `/api/files/export-pdf` | ReportLab publication-grade PDF generation |
| **Files** | POST | `/api/files/generate-presentation` | PPTX presentation compilation |
| **Files** | GET | `/api/files/download/{filename}` | Download uploaded or generated file |
| **Images** | POST | `/api/images/generate` | Generate image via FLUX.1, SDXL, or Turbo engines |
| **Images** | POST | `/api/images/describe` | Vision multimodal image understanding |
| **Images** | GET | `/api/images/models` | List diffusion models, aspect ratios, and styles |
| **Images** | POST | `/api/images/enhance-prompt` | LLM-driven prompt expansion |
| **Images** | GET | `/api/images/proxy` | Media proxy for CORS and direct download |
| **Playground** | POST | `/api/playground/execute` | Create agent run from goal prompt |
| **Playground** | GET | `/api/playground/stream/{run_id}` | SSE stream for live agent execution DAG |
| **Playground** | POST | `/api/playground/stream` | Single-shot run creation + SSE execution stream |
| **Playground** | POST | `/api/playground/ui/synthesize` | Stitch AI design agent UI HTML generation |
| **Playground** | POST | `/api/playground/ui/variants` | Generate responsive Stitch theme variants |
| **Playground** | POST | `/api/playground/ui/refine` | Iterative HTML/CSS refinement |
| **Agents** | POST | `/api/agents/runs` | Initialize and start agent run |
| **Agents** | GET | `/api/agents/runs` | List user agent runs (optional `?project_id=`) |
| **Agents** | GET | `/api/agents/runs/{run_id}` | Full agent run details, tasks, artifacts, approvals |
| **Agents** | POST | `/api/agents/runs/{run_id}/cancel` | Cancel active agent run |
| **Agents** | POST | `/api/agents/runs/{run_id}/approve` | Approve pending high-risk tool action |
| **Agents** | POST | `/api/agents/runs/{run_id}/deny` | Deny pending high-risk tool action |
| **Agents** | GET | `/api/agents/tasks/{task_id}/logs` | Step logs and observations for a specific task |
| **Tools** | GET | `/api/tools` | Enumerate registered tools and JSON schemas |
| **Tools** | POST | `/api/tools/{tool_name}/execute` | Direct tool invocation in isolated sandbox |
| **Projects** | POST | `/api/projects` | Create workspace project |
| **Projects** | GET | `/api/projects` | List user projects |
| **Projects** | GET | `/api/projects/{id}` | Get project files, sandbox metadata, memories |
| **Projects** | POST | `/api/projects/{id}/files` | Write file into project sandbox |
| **Artifacts** | GET | `/api/artifacts` | List artifacts (`?project_id=`, `?run_id=`) |
| **Artifacts** | GET | `/api/artifacts/{id}` | Get artifact metadata |
| **Artifacts** | GET | `/api/artifacts/{id}/content` | Get raw artifact content (HTML, text, code) |
| **Artifacts** | GET | `/api/artifacts/download/{filename}` | Download generated artifact asset |
| **Settings** | GET | `/api/settings` | Retrieve system settings and provider health |
| **Settings** | PATCH | `/api/settings` | Update system preferences and provider keys |
| **Settings** | POST | `/api/settings/clear-conversations` | Clear all user conversation histories |
| **Suggestions**| POST | `/api/suggestions` | Submit feedback, bug report, or feature request |
| **Payments** | POST | `/api/payments/razorpay/create-order`| Create subscription order |
| **Payments** | POST | `/api/payments/razorpay/verify` | Verify payment signature and activate pass |

---

## 5. Authentication Flow
- **Mechanism:** JWT (JSON Web Tokens) with HS256 signature algorithm.
- **Storage:** Persisted client-side in `localStorage` under key `cretivra_auth_token` and user profile in `cretivra_user`.
- **Guest / Local Mode:** If no token is provided, `get_current_or_guest_user` automatically associates sessions with `guest@asura.local` without throwing blocking errors, ensuring seamless local-first operation.
- **Headers:** Attached via `getAuthHeaders()` (`Authorization: Bearer <token>`).
- **Session Expiry & Refresh:** 401 status triggers `auth:unauthorized` custom event, opening `<AuthModal />` cleanly without crashing the UI.

---

## 6. SSE Streaming Flow
- **Chat Studio SSE (`/api/chat/stream`):**
  - Consumed by `readSSEStream()` in `frontend/src/services/streaming.ts`.
  - Stream payloads emit `data: { content, done, reasoning_status, sources, cache_items }`.
  - Incremental chunk rendering avoids full React state re-renders.
  - AbortController terminates connection immediately on Stop click.
- **Playground Agent SSE (`/api/playground/stream/{run_id}`):**
  - Event payloads:
    1. `agent.run.started`: Run metadata and intent classification.
    2. `agent.plan.created`: Full DAG task list.
    3. `agent.task.started`: Specific task begins execution.
    4. `agent.tool.started`: Tool execution begins with input arguments.
    5. `agent.tool.completed`: Tool output and execution timing.
    6. `agent.task.completed` / `agent.task.failed`: Task status resolution.
    7. `agent.approval.required`: Execution halts for user human-in-the-loop review.
    8. `agent.artifacts.updated`: Live broadcast of generated artifacts.
    9. `agent.run.completed`: Final summary and execution duration.

---

## 7. Database Architecture
The database schema (`backend/app/database/models.py`) contains 18 relational models:
1. `UserDB`: User identities, auth hashes, subscription status.
2. `ConversationDB`: Chat threads linked to models and users.
3. `MessageDB`: Chat turns with roles, content, reasoning status, and timestamps.
4. `AttachmentDB`: Uploaded files with MIME types, sizes, and file paths.
5. `ModelSettingDB`: Dynamic model registry and fallback configurations.
6. `SystemSettingDB`: Key-value configuration store.
7. `PaymentDB`: Razorpay/UPI transaction records.
8. `SuggestionDB`: User feedback and ratings.
9. `ProjectDB`: Sandboxed workspaces with root paths.
10. `ProjectFileDB`: Virtual file tree within project sandboxes.
11. `ProjectMemoryDB`: Key-value contextual memories for agents.
12. `AgentDB` & `AgentSkillDB`: Reusable agent definitions and capabilities.
13. `AgentRunDB`: Top-level agent goal execution instances.
14. `AgentTaskDB`: DAG task nodes with order, dependencies, and statuses.
15. `AgentStepDB`: Step-by-step reasoning, tool calls, and observations.
16. `ToolRegistryDB` & `ToolPermissionDB`: Security profiles and auto-approve flags.
17. `ToolExecutionDB`: Audit logs for every tool invocation.
18. `ArtifactDB`: Output documents, presentations, source code, and websites.
19. `ApprovalDB`: Human-in-the-loop pending approval gates.
20. `AuditLogDB`: Security and telemetry event tracking.

---

## 8. State Management
- **Chat State:** `useChat` custom hook (`frontend/src/hooks/useChat.ts`) manages active message list, generation states, streaming buffers, model selection, attachments, and scroll lock.
- **Conversation History:** `useConversations` custom hook (`frontend/src/hooks/useConversations.ts`) manages cached conversation list, grouping (Today, Yesterday, 7 Days, Older), pinned status, and search filters.
- **Playground State:** `TaskWorkspace.tsx` manages run details, DAG task tree, live tool activity logs, selected artifact preview, and approval modals.
- **Theme State:** `theme.ts` manages dark/light mode with `data-theme` attribute and `localStorage` persistence.

---

## 9. Existing Components
- **Chat:** `ChatMessage`, `ChatComposer`, `MarkdownRenderer`, `SourceLinksCard`, `IntelligenceCacheCard`, `GeneratedImageCard`, `ActionMenu`, `LibraryModal`, `SketchModal`.
- **Sidebar:** `Sidebar`, `SearchModal`.
- **Playground:** `PlaygroundHome`, `TaskWorkspace`, `TaskGraph`, `PlanPanel`, `ApprovalCard`, `ArtifactPanel`, `PreviewPanel`, `UIBuildingCanvas`.
- **Studio Modals:** `ImageStudioModal`, `SettingsModal`, `HealthModal`, `ShareModal`, `AuthModal`, `OnboardingTourModal`, `ConfirmModal`, `SuggestionBox`.
- **Common:** `CretivraLogo`, `OpenStudioButton`, `SiteLayoutWrapper`.

---

## 10. Existing CSS & Design System
- **File:** `frontend/src/index.css` (1,055 lines).
- **Core Dark Mode Tokens:**
  - `--bg-base`: `#060911`
  - `--bg-panel`: `#0D121F`
  - `--bg-card`: `#151C2E`
  - `--border`: `#232D45`
  - Accents: `--cyan` (`#06B6D4`), `--blue` (`#3B82F6`), `--violet` (`#8B5CF6`), `--purple` (`#A855F7`), `--green` (`#10B981`), `--amber` (`#F59E0B`), `--rose` (`#F43F5E`).
  - Text: `--text` (`#E7EAF4`), `--text-dim` (`#8891A8`).
- **Typography:** Inter / system sans for UI, `ui-monospace` for code, and Google Fonts `Newsreader` / `Playfair Display` for editorial moments (`.font-manus-serif`).
- **Tailwind CSS v4:** Configured via `@import "tailwindcss";` and `@tailwindcss/postcss`.

---

## 11. Existing Animations
- Custom CSS keyframes in `index.css`:
  - `cv-pulse-glow`, `cv-spin`, `cv-fade-in`, `cv-slide-up`, `cv-float`, `cv-shimmer`.
  - Ambient gradient orbs (`.cv-orb`) with subtle movement.
  - Streaming cursor blinking (`opacity 1 -> 0.3 -> 1`).

---

## 12. Existing Theme System
- `src/services/theme.ts` toggles `data-theme="dark"` / `data-theme="light"` on document root and syncs CSS custom variables.
- Default is dark mode (`#060911`), highly optimized with low visual noise.

---

## 13. Existing Chat Studio
- Fast conversational interface with markdown rendering, syntax highlighting (`rehype-highlight`), math typesetting (`rehype-katex`), citation badges, message regeneration, message branching/editing, and export to PDF.

---

## 14. Existing Playground
- Accessible via `/playground` or mode switcher.
- Supports goal submission, template selection (Full-Stack App, Deep Research, Market Analysis, Code Refactor), DAG visualization, and step execution.

---

## 15. Existing Task Graph
- Visual DAG component (`TaskGraph.tsx`) depicting task nodes, connection lines, status rings, and tool metadata.

---

## 16. Existing Plan Panel
- Left-hand rail (`PlanPanel.tsx`) showing execution steps, active spinner, green checkmarks, and retry counts.

---

## 17. Existing Approval Card
- Interactive gate (`ApprovalCard.tsx`) displaying tool name, payload, and risk level with `Approve`, `Deny`, and payload editing options.

---

## 18. Existing Artifact Panel
- Deliverable inspector (`ArtifactPanel.tsx`) grouping files by type (PDF, PPTX, Website, Code, Data) with direct download and preview triggers.

---

## 19. Existing Preview Panel
- Responsive sandbox iframe (`PreviewPanel.tsx`) rendering generated HTML/CSS with device toggles (Desktop 100%, Tablet 768px, Mobile 375px).

---

## 20. Existing Stitch Integration
- `UIBuildingCanvas.tsx` & `backend/app/services/stitch_engine.py`:
  - Component hierarchy generation.
  - Style token synthesis.
  - Device viewport switching.
  - Variant exploration (Modern Dark, Minimalist, Corporate, Neon Cyber).
  - Code export (HTML/CSS, React JSX, ZIP package).

---

## 21. Existing Image Studio
- `ImageStudioModal.tsx`:
  - Models: Cretivra FLUX.1 Art, Cretivra SDXL Studio, Cretivra Turbo Visuals, Anime Studio, 3D Octane.
  - Aspect Ratios: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9.
  - Multi-style prompts, reference images, negative prompts, seed control, and gallery storage.

---

## 22. Existing Model Selector
- `ModelSelector.tsx`:
  - Branded names: Cretivra 1 (Balanced), Cretivra 1.1 (Advanced), Cretivra 1.2 (Fast), Cretivra Coder Pro, Cretivra Reason, Cretivra Omni 4.
  - Displays context length, latency badge, and capability tags without exposing backend provider keys.

---

## 23. Existing Web Search
- Multi-provider search service (`web_search_service.py`):
  - Tavily, Brave Search, DuckDuckGo HTML crawler fallback.
  - Returns structured citations with title, URL, and snippet.
  - Renders interactive source pills in `SourceLinksCard.tsx`.

---

## 24. Existing Deep Research
- Query decomposition into sub-queries, iterative source retrieval, relevance ranking, evidence grounding, and multi-page synthesized report compilation.

---

## 25. Existing File Upload
- `files.py` & `ChatComposer.tsx`:
  - PDF, DOCX, CSV, TXT, MD, PNG, JPG, WEBP.
  - Extracts text, passes page counts, attaches chips to prompt context.

---

## 26. Existing PDF & PPTX Generation
- **PDF:** ReportLab vector compiler (`pdf_service.py`) generating formatted covers, headers, footers, typography hierarchy, and data tables.
- **PPTX:** `python-pptx` compiler (`presentation_service.py`) generating 16:9 modern slide decks with title slides, bullet layouts, and colored highlight cards.

---

## 27. Existing Health Monitoring
- `health.py` & `HealthModal.tsx`:
  - Live probe of Inference provider, database connection, web search engine, and upload directory permissions.
  - Visual status pill: Operational, Degraded, Offline.

---

## 28. Existing Authentication & Security
- Password hashing with PBKDF2/SHA-256 (`security.py`).
- JWT token expiration checks.
- Path traversal prevention (`validate_path_safety`).
- Sandboxed file execution in project directory.

---

## 29. Existing Responsive Implementation
- Media queries and Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- Collapsible mobile sidebar overlay.
- Dynamic viewport sizing for preview panels.

---

## 30. Existing Environment Variables
- `DATABASE_URL`: Postgres/Supabase or SQLite connection string.
- `GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`.
- `TAVILY_API_KEY`, `BRAVE_API_KEY`, `SERPER_API_KEY`.
- `OLLAMA_BASE_URL`: Local model daemon.
- `DEFAULT_MODEL`, `MAX_CONTEXT_MESSAGES`, `TEMPERATURE`, `MAX_OUTPUT_TOKENS`.
- `UPLOAD_DIR`: Target filesystem storage.

---

## 31. Existing Dependencies
- **Backend:** FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, HTTPX, ReportLab, python-pptx, python-docx, PyPDF, Pillow, pytest.
- **Frontend:** React 19, Next.js 16, Vite 8, Tailwind CSS v4, Lucide React, KaTeX, React-Markdown, Rehype-Highlight.

---

## 32. Potential Breaking Changes & Safeguards
- **Zero Backend Destruction:** Existing API contracts, routes, and schemas will NOT be modified.
- **Backwards Compatibility:** Chat Studio URLs (`/chat`, `?c=`) and Playground URLs (`/playground`, `?run=`) will remain fully functional.
- **Unified Workspace Evolution:** The new goal-oriented navigation and fluid transitions will sit on top of the existing API services without rewriting underlying logic.
- **Verification Gate:** `pytest` (51 backend tests) and both Vite & Next.js production builds must succeed at each phase.

---

## Conclusion
The existing architecture is robust, fully equipped with backend models, tools, and real streaming APIs. The primary transformation needed is in the **visual hierarchy, layout continuity, and workspace orchestration**, transforming Asura AI into a calm, task-centric, autonomous operating environment.
