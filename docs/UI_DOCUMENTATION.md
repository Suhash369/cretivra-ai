# ASURA AI by CRETIVRA — Complete UI Documentation

> **Platform**: ASURA AI by Cretivra (Cretivra Neural Engine)  
> **Version**: 1.0.0 Production  
> **Frontend Stack**: Next.js 16 (Turbopack) & Vite 8, React 19, TypeScript, Tailwind CSS v4, KaTeX, Lucide React  
> **Target Audiences**: Frontend Engineers, UX/UI Designers, QA Engineers, Product Managers  

---

## 1. Executive Overview & Design Philosophy

ASURA AI is an enterprise-grade, privacy-first artificial intelligence platform. The user interface blends the speed of high-throughput conversational interfaces (similar to ChatGPT and Claude) with the deep control of autonomous agent playgrounds and generative design studios.

### Design Principles
1. **Visual Depth & Glassmorphism**: Ambient backdrop gradients, translucent panels (`cv-glass`), subtle borders (`--border`), and atmospheric orb lighting (`cv-orb`).
2. **Dual Identity (Dark & Light First-Class Themes)**:
   * **Dark Mode**: Cybernetic, high-contrast palette engineered for prolonged engineering sessions with minimal eye strain.
   * **Light Mode**: Pristine publication-grade canvas with crisp typography and tailored slate borders.
3. **Zero-Latency Perceived Responsiveness**: Optimistic client updates, streaming Server-Sent Events (SSE), instant token rendering, and non-blocking background workers.
4. **Information Density with Structural Elegance**: Clean mathematical equations, interactive data tables with TSV export, language-tagged code blocks with copy utilities, and collapsible telemetry cards.

---

## 2. Design System & Styling Tokens

The design system is managed via CSS custom properties in `frontend/src/index.css` and enhanced by Tailwind CSS v4.

### 2.1 Color Palette & CSS Variables

| Token | Dark Mode Value | Light Mode Value | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--bg-base` | `#060911` | `#f8fafc` | Viewport backdrop |
| `--bg-panel` | `#0d121f` | `#ffffff` | Sidebar, modals, toolbars |
| `--bg-card` | `#151c2e` | `#f1f5f9` | Message cards, code containers, badges |
| `--border` | `#232d45` | `#e2e8f0` | Dividers, panel borders, modal outlines |
| `--cyan` | `#06b6d4` | `#0284c7` | Brand primary, active states, streaming accents |
| `--blue` | `#3b82f6` | `#2563eb` | Secondary buttons, informational highlights |
| `--violet` | `#8b5cf6` | `#7c3aed` | Reasoning pills, agent workflows, deep research |
| `--purple` | `#a855f7` | `#9333ea` | Generative canvas & creative modules |
| `--green` | `#10b981` | `#059669` | Success notifications, approval confirmations |
| `--amber` | `#f59e0b` | `#d97706` | Warnings, human-in-the-loop approval gates |
| `--rose` | `#f43f5e` | `#e11d48` | Destructive actions, error states, cancellations |
| `--text` | `#e7eaf4` | `#0f172a` | Primary body and heading copy |
| `--text-dim`| `#8891a8` | `#64748b` | Subtitles, timestamps, placeholders |

### 2.2 Typography Stack
* **Primary Sans**: System dynamic stack (`-apple-system, "Inter", "Segoe UI", Roboto, sans-serif`) with font-smoothing.
* **Code & Monospace**: `font-mono` (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`) for code blocks, token counters, and terminal execution.
* **Manus Editorial Serif**: `.font-manus-serif` (`'Newsreader', 'Playfair Display', Georgia, serif`) used in editorial landing cards and executive presentation titles.
* **Mathematical Notation**: Full KaTeX styling (`katex/dist/katex.min.css`) supporting LaTeX inline (`$ ... $`) and display (`$$ ... $$`) math blocks.

### 2.3 Core Utility Classes
* `.cv-glass`: Translucent surface (`backdrop-blur-md`, subtle border, ambient shadow).
* `.cv-orb`: Radial atmospheric gradient glow providing background depth.
* `.custom-scrollbar`: High-contrast, low-profile scroll track that remains invisible until hover.
* `.chat-markdown`: Typographic scale configured for conversational readability (`leading-[1.78]`, `text-[15.5px] sm:text-[16px]`).

---

## 3. Application Routing & Page Directory (`src/app`)

ASURA AI operates as a hybrid Next.js 16 App Router application and Vite SPA, offering standalone search-engine-optimized landing pages and rich client-side workspaces.

```
frontend/src/app/
├── layout.tsx             # Root layout, metadata, viewport, font injection
├── page.tsx               # Home entry point mounting StudioClient
├── studio/
│   └── StudioClient.tsx   # Standalone full-screen Asura AI Studio workspace
├── chat/
│   └── page.tsx           # Dedicated direct chat route
├── playground/
│   └── page.tsx           # Standalone Autonomous Agent & Stitch UI playground
├── ai-agents/
│   └── page.tsx           # Enterprise AI Agents showcase & marketing
├── automation/
│   └── page.tsx           # Business process automation solutions
├── generative-ai/
│   └── page.tsx           # Enterprise RAG & Generative AI solutions
├── blog/
│   └── page.tsx           # Engineering publications & strategy articles
├── share/[id]/
│   └── page.tsx           # Read-only public shared conversation viewer
├── test-bench/
│   └── page.tsx           # AI model benchmark & latency testing bench
├── sitemap.ts             # Automated XML sitemap generation
└── robots.ts              # Search indexing rules
```

---

## 4. Primary Workspaces

ASURA AI is structured into two main operational workspaces: **Chat Studio** and the **Autonomous Agent Playground**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GLOBAL APP HEADER                             │
│  [Logo] [Model Selector] [Search] [Reason] | [Chat/Playground] [User]  │
├──────────────────┬─────────────────────────────────────────────────────┤
│                  │                                                     │
│     SIDEBAR      │                 CENTRAL WORKSPACE                   │
│                  │                                                     │
│  [+ New Chat]    │  • Mode: CHAT STUDIO                                │
│                  │    - Hero Landing or Streaming Message Thread       │
│  • Pinned        │    - Intelligence Cache Telemetry Card              │
│  • Today         │    - Markdown, Code Blocks, Math, Tables            │
│  • Yesterday     │    - Floating Multimodal Composer                   │
│  • Past 7 Days   │                                                     │
│                  │  • Mode: AUTONOMOUS PLAYGROUND                      │
│  ─────────────── │    - Split-Pane: Task Graph & Step DAG              │
│  [Settings]      │    - Human Approval Gates                           │
│  [Health Modal]  │    - Interactive Stitch UI Canvas                   │
│  [Feedback]      │    - Live Code & Sandbox Preview                    │
│                  │                                                     │
└──────────────────┴─────────────────────────────────────────────────────┘
```

---

### Workspace 1: Chat Studio (`App.tsx` & `src/components/chat/`)

#### 1. Header Bar
* **Branding**: Cretivra icon with animated hover glow and version pill badge (`2026`).
* **Model Selector Dropdown** (`ModelSelector.tsx`):
  * Dynamic dropdown grouping models by tier: Frontier Models (`cretivra-1`, `cretivra-omni`), Reasoning (`cretivra-reason`), Coding (`cretivra-coder`), and Vision.
  * Displays model capabilities, context window length (e.g., `128k`), and latency status.
* **Toggle Controls**:
  * **Web Search (`forceSearch`)**: Triggers real-time web intelligence cache lookups.
  * **Deep Research (`forceReason`)**: Forces multi-step logical chain-of-thought activation.
* **App Mode Switcher**: Toggles between `Chat` and `Playground` workspaces.
* **Action Tools**: Image Studio trigger, Onboarding Tour button, Theme switcher (Dark / Light / System), and Auth profile dropdown.

#### 2. Collapsible Sidebar (`Sidebar.tsx`)
* **New Chat**: Prominent keyboard-accessible button (`Cmd/Ctrl + K` or `/`).
* **Search Modal Trigger** (`SearchModal.tsx`): Instant full-text fuzzy search across all message contents and conversation titles.
* **Date-Segmented Tree**:
  * **Pinned**: Important conversations pinned to the top.
  * **Today**, **Yesterday**, **Previous 7 Days**, **Older**: Chronologically grouped conversations.
* **Context Actions on Hover**: Inline quick actions for **Rename**, **Pin/Unpin**, **Share**, and **Delete**.
* **Footer Controls**: Settings, System Health telemetry, Feedback/Suggestion box, and storage indicator.

#### 3. Conversation Canvas & Message Stream
* **Landing Screen** (`LandingScreen.tsx` / `AsuraManusLanding.tsx`):
  * Displayed when a conversation has no messages.
  * Features the hallmark *"Think Beyond."* editorial layout.
  * Quick-start capability tiles: **Generate Slide Deck**, **Build Web App**, **Create Interactive Game**, and **Freehand Sketch**.
* **Message Thread** (`ChatMessage.tsx`):
  * **User Message Card**: Translucent card with user avatar, message copy, and inline file attachment chips. Includes inline **Edit & Resubmit** button.
  * **Assistant Message Card**: Distinct tinted card with Asura emblem.
  * **Intelligence Cache Telemetry** (`IntelligenceCacheCard.tsx`): Collapsible card detailing live retrieval stages (`✦ Querying neural intelligence cache...`, verified sources, execution latency).
  * **Verified Sources Badge Card** (`SourceLinksCard.tsx`): Badges displaying verified source domains with clickable citations.
  * **Markdown Renderer** (`MarkdownRenderer.tsx`):
    * **Interactive Code Blocks**: Syntax highlighted with language tag, wrap toggle, and one-click copy with animated feedback.
    * **Data Tables**: Striped, responsive table with TSV clipboard copy (ready for Excel/Sheets).
    * **LaTeX Math**: Formatted inline and display formulas via KaTeX.
    * **Download Badges**: Styled executive download cards for generated `.pdf`, `.pptx`, and `.docx` files.
  * **Action Toolbar**: Copy response, Regenerate answer, Thumbs up / down feedback.

#### 4. Chat Composer (`ChatComposer.tsx`)
* Auto-expanding textarea (`min-h-[52px]` to `max-h-[200px]`).
* Multimodal attachment tray supporting PDF, DOCX, TXT, CSV, and PNG/JPEG/WEBP images.
* Drag-and-drop overlay (`DragAndDropOverlay.tsx`) with animated dropzone.
* Quick-action buttons for Web Search, Deep Research, and Image Generation.
* Real-time Send button that transforms into an animated **Stop Generation** button during active streaming.

---

### Workspace 2: Autonomous Agent Playground (`src/playground/`)

Designed for multi-step agentic execution, task decomposition, and code generation.

```
┌────────────────────────────────────────────────────────────────────────┐
│ PLAYGROUND WORKSPACE: Split Pane View                                  │
├──────────────────────────────────┬─────────────────────────────────────┤
│ LEFT PANE: Task Planning & DAG   │ RIGHT PANE: Sandbox & Deliverables  │
│                                  │                                     │
│ • Task Graph (TaskGraph.tsx)     │ • Interactive Canvas                │
│   - Step 1: Research [COMPLETED] │   (UIBuildingCanvas.tsx)            │
│   - Step 2: Synthesis [ACTIVE]   │   - Real-time Stitch building view  │
│   - Step 3: Verify [PENDING]     │   - Variant selector (Modern/Dark)  │
│                                  │   - Viewport toggles (Mobile/Desk)  │
│ • Step Breakdown (PlanPanel.tsx) │                                     │
│ • Human-in-the-loop Approvals    │ • Live Preview (PreviewPanel.tsx)   │
│   (ApprovalCard.tsx)             │ • File Artifacts (ArtifactPanel.tsx)│
│                                  │                                     │
└──────────────────────────────────┴─────────────────────────────────────┘
```

#### Key Modules
1. **Playground Home** (`PlaygroundHome.tsx`): Prompt input, recent execution runs, execution templates (Full-Stack App, Financial Model, Competitive Analysis).
2. **Task Workspace** (`TaskWorkspace.tsx`): Main orchestrator connecting SSE run stream to the execution graph.
3. **Task Graph** (`TaskGraph.tsx`): Visual representation of task nodes, dependency lines, and status badges (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`).
4. **Approval Card** (`ApprovalCard.tsx`): Safety gate pausing autonomous execution for user approval on sensitive operations (file writes, API calls).
5. **Artifact Panel** (`ArtifactPanel.tsx`): File explorer displaying code deliverables, download links, and copy-all utilities.
6. **Live Preview Panel** (`PreviewPanel.tsx`): In-browser sandboxed iframe executing generated HTML/CSS/JS in real time.
7. **UI Building Canvas** (`UIBuildingCanvas.tsx`): Powered by the Stitch UI engine. Features realistic code synthesis progress, variant switching, responsive device frames, and export tools.

---

## 5. Modal & Dialog Ecosystem

All modals share smooth scale/opacity mount transitions, backdrop blur, Escape key dismissibility, and focus trapping.

| Modal Component | File Location | Trigger Point | Core Functionality |
| :--- | :--- | :--- | :--- |
| **AuthModal** | `components/auth/AuthModal.tsx` | Header "Sign In", Session Expired | Tabbed Login/Signup, form validation, password show/hide, guest continue |
| **SettingsModal** | `components/settings/SettingsModal.tsx` | Sidebar footer gear icon | Model overrides, Temperature slider, Context message depth, Custom System Prompt, Theme switcher |
| **HealthModal** | `components/settings/HealthModal.tsx` | Sidebar footer pulse status | Real-time health metrics for Backend, Database, Ollama, registered AI models, uptime |
| **ShareModal** | `components/settings/ShareModal.tsx` | Conversation options "Share" | Generates public read-only link, one-click copy, Twitter/LinkedIn direct share |
| **SearchModal** | `components/sidebar/SearchModal.tsx` | Sidebar search icon / `Ctrl+F` | Full-text indexed conversation search with highlighted matching text snippets |
| **ImageStudioModal** | `components/image-studio/ImageStudioModal.tsx` | Header Palette icon | Prompt enhancer, Aspect ratio pills (1:1, 16:9, 9:16), Style presets, Turnstile watermark removal preview |
| **SuggestionBox** | `components/feedback/SuggestionBox.tsx` | Sidebar "Feedback" | Feedback categorization (Feature, Bug, Model Quality), rating stars, message submission |
| **OnboardingTourModal** | `components/onboarding/OnboardingTourModal.tsx` | Header Help / First visit | 5-step guided interactive walkthrough explaining model selection, search, playground, and shortcuts |
| **LibraryModal** | `components/chat/LibraryModal.tsx` | Header "Library" / Attachments | Consolidated session library displaying all uploaded files, generated images, and document downloads |
| **SlideGeneratorModal** | `components/landing/SlideGeneratorModal.tsx` | Landing page Quick Action | Presentation outline builder, slide count selector, PowerPoint (.pptx) download |
| **WebsiteGeneratorModal** | `components/landing/WebsiteGeneratorModal.tsx` | Landing page Quick Action | Single-page website prompt generator, preview launcher, code export |
| **GameCreatorModal** | `components/landing/GameCreatorModal.tsx` | Landing page Quick Action | 2D arcade / puzzle game builder, mechanics configurator, playable canvas preview |
| **SketchModal** | `components/chat/SketchModal.tsx` | Composer Pencil icon | Freehand HTML5 drawing canvas with pen, eraser, color palette, and direct attach-to-chat |

---

## 6. Interactive State Machines & UX Flows

### 6.1 Chat Generation Lifecycle

```
[ IDLE ] ──(User Submits Prompt)──► [ SENDING ]
                                         │
                                         ▼
                                  [ GENERATING ]
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
            ▼                            ▼                            ▼
  [ Real-Time Search ]          [ Deep Reasoning ]             [ Direct Stream ]
  Emit cache lookup telemetry   Emit thinking stage pills      Emit tokens
            │                            │                            │
            └────────────────────────────┼────────────────────────────┘
                                         │
                                         ▼
                                  [ STREAMING ] ◄── Token Chunks (SSE)
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
          [ COMPLETED ]                                    [ CANCELLED ]
  Store to MessageDB via clean_ai_response()        AbortController triggered
  Render action toolbar & download badges           Preserve partial output
```

### 6.2 Auto-Scroll & Scroll-Anchoring Algorithm
To deliver a smooth streaming experience without disrupting manual user reading:
1. **Continuous Follow**: During generation, the viewport smoothly pins to the stream boundary (`scrollRef.current.scrollTop = scrollRef.current.scrollHeight`).
2. **Scroll-Up Detection**: If the user scrolls upward (`wheel` delta < 0 and distance from bottom > 200px), auto-scroll temporarily disengages to allow undisturbed reading.
3. **Jump-to-Bottom Pill**: When user is scrolled up during streaming, a floating **"Jump to latest"** button appears.
4. **Auto-Re-engage**: If the user scrolls back within 80px of the bottom, auto-follow automatically re-engages.

### 6.3 Message Editing & Regeneration
* Clicking **Edit** on a previous user message transforms the text into an in-place editor.
* Submitting the edit updates the user message and truncates all subsequent conversation turns from that point forward.
* A new assistant response streams in, ensuring conversation state remains consistent and free of hallucinations.

---

## 7. Accessibility & Responsive Design

### 7.1 Breakpoints

| Breakpoint | Width Range | Layout Adjustments |
| :--- | :--- | :--- |
| **Mobile (`<640px`)** | `320px – 639px` | Sidebar collapses to drawer overlay; composer sticks above mobile keyboard; tables enable horizontal swipe; action menus adapt to tap targets. |
| **Tablet (`640px – 1024px`)** | `640px – 1023px` | Sidebar is toggled via hamburger menu; composer expands to 90% width; split-pane playground switches to tabbed toggle. |
| **Desktop (`>1024px`)** | `1024px – 1440px` | Standard three-column layout (Sidebar 260px, Main Workspace 1fr, Playground Inspector 400px). |
| **Ultrawide (`>1440px`)** | `1440px+` | Content container max-widths capped at `max-w-5xl` / `max-w-6xl` to maintain comfortable typographic line lengths. |

### 7.2 Accessibility (a11y) Features
* **Semantic Elements**: Full use of `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>`.
* **Keyboard Navigation**:
  * `Cmd/Ctrl + K` or `/` focus chat input or open New Chat.
  * `Esc` closes any active modal dialog.
  * `Enter` submits chat (with `Shift + Enter` for newlines).
* **Visual Contrast**: Meets WCAG 2.1 AA contrast requirements across both dark and light modes.
* **Reduced Motion**: Respects `prefers-reduced-motion: reduce`, disabling ambient orb animations and pulse transitions.

---

## 8. Developer Extension Guide

### Adding a New Model to the Selector
1. Register the model in `backend/app/models/registry.py`.
2. The model will automatically appear in `frontend/src/components/model-selector/ModelSelector.tsx` with its icon, provider badge, and context window.

### Adding a Custom Modal
1. Create `frontend/src/components/your-category/YourModal.tsx`.
2. Use the standard modal backdrop pattern:
   ```tsx
   if (!isOpen) return null;
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
       <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-panel)] border border-[var(--border)] p-6 shadow-2xl">
         {/* Modal content */}
       </div>
     </div>
   );
   ```
3. Mount the modal in `frontend/src/App.tsx`.
