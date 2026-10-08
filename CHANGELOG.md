# CHANGELOG - Cretivra Asura Bento Grid Redesign

## [Unreleased] - 2026-10-09

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
  - Container width standardized to `max-w-[1100px]` matching the composer.
  - Integrated `BentoGrid` and `TemplatesCarousel` cleanly with existing flows (`onOpenWebsite`, `onOpenSlides`, `onOpenGame`, `onOpenImageStudio`, attachment handling, voice, payments, and view switching).
