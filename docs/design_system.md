# CRETIVRA AI — Frontend Architecture & Design System

This document outlines the frontend tech stack, component hierarchy, color palette, and visual effect animations used in **CRETIVRA AI**.

---

## 🛠 1. Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown & Math**: `react-markdown`, `remark-gfm`, `rehype-highlight`, `katex`
- **Utility Libraries**: `clsx`, `tailwind-merge`

---

## 🧱 2. Frontend Component Hierarchy

```
frontend/src/
├── App.tsx                     # Main layout & state orchestrator
├── main.tsx                    # React root entry point
├── index.css                   # Global Tailwind imports & CSS animations
├── components/
│   ├── common/
│   │   └── CretivraLogo.tsx    # Vector SVG infinity network logo component
│   ├── chat/
│   │   ├── LandingScreen.tsx   # ChatGPT/Gemini style hero greeting & 2x2 cards
│   │   ├── ChatMessage.tsx     # Markdown, code syntax highlighter, copy/edit/regen
│   │   ├── ChatComposer.tsx    # Multiline expanding input, file chips, stop button
│   │   └── DragAndDropOverlay.tsx # Drag and drop file upload overlay
│   ├── sidebar/
│   │   ├── Sidebar.tsx         # Collapsible history sidebar grouped by date
│   │   └── SearchModal.tsx     # Local conversation search modal (⌘K)
│   ├── model-selector/
│   │   └── ModelSelector.tsx   # Cretivra Model Registry selector pill
│   └── settings/
│       ├── HealthModal.tsx     # Live system health check dashboard
│       ├── SettingsModal.tsx   # Temperature, model, theme, clear data controls
│       └── ShareModal.tsx      # Conversation share snapshot modal
├── hooks/
│   ├── useChat.ts              # Chat stream, editing, regeneration, attachments
│   └── useConversations.ts     # Conversation list, CRUD, date grouping, search
├── services/
│   ├── api.ts                  # REST API client helpers
│   └── streaming.ts            # SSE streaming reader with AbortController
└── types/
    └── index.ts                # TypeScript interfaces & data models
```

---

## 🎨 3. Color Palette & System Tokens

### **Background Surfaces (Dark Obsidian Theme)**
| Role | Hex Code | RGB | Usage |
| :--- | :--- | :--- | :--- |
| **Base Background** | `#060911` | `rgb(6, 9, 17)` | Main workspace canvas background |
| **Sidebar & Modals** | `#0d121f` | `rgb(13, 18, 31)` | Left sidebar panel & modal windows |
| **Elevated Cards** | `#151c2e` | `rgb(21, 28, 46)` | Prompt cards & message containers |
| **Borders & Lines** | `#232d45` | `rgb(35, 45, 69)` | Dividers, card outlines, input borders |

### **Brand Accents & Multi-Color Gradients**
| Role | Hex Code | Usage |
| :--- | :--- | :--- |
| **Electric Cyan** | `#06b6d4` | Primary brand accent, glowing node highlights, active buttons |
| **Cyber Blue** | `#3b82f6` | Midpoint gradient fill, link text, code icons |
| **Vibrant Violet** | `#8b5cf6` | Deep reasoning badge, purple ambient glow |
| **Royal Purple** | `#a855f7` | Creative studio badges, category tags |

### **Status & Functional Indicators**
| Role | Hex Code | Usage |
| :--- | :--- | :--- |
| **Emerald Green** | `#10b981` | `Connected` status dot, success state, Python/Code badges |
| **Amber Gold** | `#f59e0b` | Warning/Offline status dot, fast model category tag |
| **Rose Red** | `#f43f5e` | Error banner, stream stop generation button |

---

## ✨ 4. Visual Effects & Animations

1. **Animated Logo Pulse (`animate-logo-pulse`)**:
   - Pulses drop-shadow glow between Electric Cyan and Vibrant Violet.

2. **Gradient Text Animation (`gradient-text-animated`)**:
   - Linear gradient text shift across `#38bdf8`, `#818cf8`, `#c084fc`.

3. **Ambient Glow Mesh (`animate-ambient-glow`)**:
   - Soft background radial orb translation and scale pulse.

4. **Glassmorphism Panel (`glass-panel`)**:
   - `backdrop-filter: blur(16px)` over semi-transparent obsidian surfaces.

5. **Gradient Border Glow (`gradient-border-glow`)**:
   - 1px border gradient mask highlighting interactive cards.
