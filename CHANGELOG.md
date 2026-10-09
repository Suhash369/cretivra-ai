# CHANGELOG - Cretivra Asura

## [Unreleased] - 2026-10-09: Conversational Follow-Up Context Resolution & Asura Registry Enhancements

### Added
- **Asura Query Rewriter Service (`services/query_rewriter.py`)**:
  - Implemented `rewrite_query(history_last_6_turns, user_msg, conversation_state)`.
  - Resolves pronouns and ellipses into self-contained search queries (`"where he is born"` -> `"Where was Virat Kohli born?"`).
  - Strict classification of topic switches (`topic_switch=True`, `is_followup=False`).
  - In-memory 60s TTL cache keyed by `hash(history_tail + message)`.
  - Heuristic fallback mechanism prepending active entities for short pronoun/WH-queries when providers are unavailable.
- **Logical Provider Roles in `DEFAULT_ASURA_REGISTRY` (`core/config.py`, `core/model_manager.py`)**:
  - `"Asura Rewriter"`: Groq (`openai/gpt-oss-20b`) -> Gemini (`gemini-flash-lite-latest`) -> OpenRouter (`liquid/lfm-2.5-2.6b:free`) [JSON mode, max_tokens=200, 3s timeout].
  - `"Asura Summarizer"`: Groq -> Gemini -> OpenRouter [rolling summary ~120 words].
  - `"Asura Suggest"`: Groq -> Gemini -> OpenRouter [3 related questions, JSON array, 2s timeout].
- **Conversation State Persistence (`database/models.py`, `database/migrations/add_conversation_state.py`, `services/conversation_service.py`)**:
  - Added `active_entities` (JSON/JSONB), `topic_summary` (TEXT), and `summary_upto_message_id` (VARCHAR) to `conversations` table.
  - Dual SQLite & PostgreSQL automated migration executed on startup.
  - Background asynchronous task summarizes dropped history turns on `"Asura Summarizer"` and updates active entities.
- **Contextual Related Questions on "Asura Suggest" (`services/response_orchestrator.py`)**:
  - Dynamically synthesizes 3 contextual follow-up questions from `standalone_query` and the initial 500 characters of the assistant's answer. Emits empty array if providers fail rather than generic fallback templates.
- **Startup Model Registry Auditor (`core/registry_auditor.py`)**:
  - Asynchronously probes all unique provider/model pairs across `DEFAULT_ASURA_REGISTRY` with 1-token diagnostic calls on startup.
- **Automated Test Suite (`tests/test_conversation_followup.py`)**:
  - 11 comprehensive automated tests covering 5-turn Kohli follow-up sequence, Tamil Nadu CM sequence, fragments/typos, topic switch isolation without entity leakage, rewriter fallback chains, missing API keys, 40-turn token budget trimming, LaTeX formula integrity, and live smoke tests for Groq, Gemini, and OpenRouter.

### Changed
- **`services/response_orchestrator.py`**:
  - Context isolation applies strictly only when `topic_switch=True` (preserving the last 2 turns even then). For regular follow-ups, full history within budget is passed.
  - Intent routing, entity extraction, web search, and image search execute on `standalone_query`, while original user text is sent to the answering model.
  - Strict prompt ordering: `system (persona, Asia/Kolkata date, rules, STRICT_FACT_MODE) -> system (conversation summary) -> system (active entities) -> history window -> system (web evidence) -> user`.
  - Updated `STRICT_FACT_MODE` specifying facts established earlier in the conversation count as supplied context.
  - History budget enforced at max 12 turns or ~6000 tokens, trimming oldest turns into background summarizer.
  - Stream persistence: user message saved before stream starts, assistant message persisted at completion or on abort (`[aborted]`).
  - First SSE event immediately returns `conversation_id`.
- **`providers/groq.py`, `providers/gemini.py`, `providers/openrouter.py`**:
  - Added non-streaming `chat()` methods supporting `json_mode`, model resolution, error categorization (401/403, 429, timeout), and cooldown tracking.
- **`core/http_client.py`**:
  - Added event loop tracking to `get_shared_client()` to safely handle event loop changes across async pytest runs without `RuntimeError: Event loop is closed`.

## [Previous] - 2026-10-09: Bento Grid Redesign

### Added
- **Interactive Bento Grid Layout (`frontend/src/components/landing/bento/BentoGrid.tsx`)**:
  - Replaced the previous 3 flat category cards with a responsive 4-card Bento Grid matching the Manus layout:
    - **Card 1: BUILD** (cols 1-5, row 1 on desktop) - Cyan/teal theme with animated wireframe browser drawing itself via SVG stroke-dashoffset and an animated laser sweep beam. Quick chips: Website, Web app, Dashboard / CRM, E-commerce, Portfolio.
    - **Card 2: CREATE** (cols 1-5, row 2 on desktop) - Warm amber theme with 3 overlapping paper sheets (Slide with growing bar chart, PDF report with tag badge, Document text sheet) that spring fan-out on hover. Quick chips: Slides (.pptx), PDF report, Document, Image.
    - **Card 3: BUILD A GAME** (cols 6-9, rows 1-2 on desktop) - Cyber violet/neon fuchsia theme with retro pixel grid, floating pixel coins, twinkling stars, 8-bit hero sprite that bobs up and down, and a live score counter ticking up during hover. Quick chips: Arcade, Puzzle, Platformer, Board game.
    - **Card 4: START FROM A LOCAL FILE** (cols 10-12, rows 1-2 on desktop) - Soft emerald theme with dashed-border drag-and-drop zone and 3D folder whose lid lifts open on hover/drag.
- **Dynamic Glow System (`frontend/src/components/landing/bento/GlowSurface.tsx`)**:
  - Cursor-tracking radial spotlight (300px radius, accent color at 22% opacity) updating via CSS variables `--mx` and `--my`.
  - Continuous rotating conic-gradient animated border (`@property --border-angle`, 6s-8s loop).
  - Hover shadow glow: `0 12px 40px -12px accent/45%`.
  - Staggered idle corner breathing glow pulse (4s cycle, staggered delays so cards breathe asynchronously).
  - Tactile press feedback (`scale(0.985)`), hover lift (`translateY(-4px)` and `scale(1.01)`).
- **Templates & Examples Carousel (`frontend/src/components/landing/bento/TemplatesCarousel.tsx`)**:
  - Horizontally scrollable carousel with CSS scroll-snap, edge gradient masks, and smooth arrow controls.
  - 16 custom SVG/CSS vector thumbnails across categories:
    - 3 Website templates (SaaS Landing, Creator Portfolio, Analytics Dashboard).
    - 3 Slide deck templates (Investor Pitch Deck, Quarterly Business Review, Product Launch Keynote).
    - 3 PDF templates (Financial Audit Report, Enterprise Whitepaper, User Research Findings).
    - 3 Game templates (Retro Cyber Arcade 8-bit, Isometric Logic Maze, Roguelike Dungeon Crawler).
    - 1 Market Research template (Global AI Agents TAM & Competitors).
    - 1 Document Analysis template (Contract & SLA Risk Extraction).
    - 1 Find Customers template (High-Intent B2B Lead Generator).
    - 1 High-Performance Code template (Distributed Async Job Orchestrator).
  - Quick-action prefill with fast typewriter simulation and composer pulse animation.
- **Design Tokens & Motion Overrides (`frontend/src/index.css`)**:
  - CSS custom properties for accent tokens, breathing animations, pixel twinkle, laser sweep, and wireframe dashoffset.
  - Full `@media (prefers-reduced-motion: reduce)` support disabling rotating border, breathing, and complex transforms while retaining smooth accessible fades.

### Changed
- **`frontend/src/components/landing/HomeWorkspace.tsx`**:
  - Restructured Home screen with top bento grid and floating frosted-glass composer with fade gradient and prefill toast; strictly aligned 12-column grid and unified Chat view composer.
  - Container width standardized to `max-w-[1100px]` matching the composer.
  - Integrated `BentoGrid` and `TemplatesCarousel` cleanly with existing flows (`onOpenWebsite`, `onOpenSlides`, `onOpenGame`, `onOpenImageStudio`, attachment handling, voice, payments, and view switching).
