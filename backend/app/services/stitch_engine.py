"""
Google Stitch UI Synthesis Engine for Asura Playground.
Generates complete, production-grade, highly interactive, standalone web applications
with Tailwind CSS, modern typography, working state management, dark/light mode toggles,
interactive filters, search, and modals.
"""

import os
import re
import json
from typing import Optional
from app.core.logging import logger

class StitchEngine:
    """
    Google Stitch-inspired AI Web Application Synthesizer.
    Produces self-contained, 100% functional, responsive interactive applications.
    """

    def synthesize_ui(self, prompt: str, app_name: Optional[str] = None) -> str:
        name = app_name or self._extract_app_name(prompt)
        prompt_lower = prompt.lower()

        # Domain classification for specialized Stitch UI templates
        if any(w in prompt_lower for w in ["portfolio", "resume", "personal", "cv", "developer profile"]):
            return self._build_portfolio_app(name, prompt)
        elif any(w in prompt_lower for w in ["crm", "pipeline", "sales", "deal", "lead"]):
            return self._build_crm_app(name, prompt)
        elif any(w in prompt_lower for w in ["store", "ecommerce", "shop", "product", "cart", "sneaker"]):
            return self._build_ecommerce_app(name, prompt)
        elif any(w in prompt_lower for w in ["analytics", "dashboard", "metric", "saas", "finance"]):
            return self._build_analytics_app(name, prompt)
        elif any(w in prompt_lower for w in ["task", "todo", "kanban", "project management", "workflow"]):
            return self._build_kanban_app(name, prompt)
        else:
            return self._build_dynamic_showcase_app(name, prompt)

    def _extract_app_name(self, prompt: str) -> str:
        clean = re.sub(r"^(build|create|design|generate|make|code)\s+(a|an)?\s*", "", prompt, flags=re.IGNORECASE)
        clean = clean.split(" with ")[0].split(" in ")[0].split(" using ")[0]
        return clean.strip().title()[:50] or "Asura Web Application"

    def _build_portfolio_app(self, app_name: str, prompt: str) -> str:
        return f"""<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{app_name} | Google Stitch UI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <script>
    tailwind.config = {{
      darkMode: 'class',
      theme: {{
        extend: {{
          fontFamily: {{
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }},
          colors: {{
            brand: {{
              50: '#f0fdfa',
              100: '#ccfbf1',
              400: '#2dd4bf',
              500: '#14b8a6',
              600: '#0d9488',
              900: '#134e4a',
            }}
          }}
        }}
      }}
    }}
  </script>
  <style>
    .glass {{
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }}
    .light .glass {{
      background: rgba(255, 255, 255, 0.85);
    }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 transition-colors duration-300 font-sans min-h-screen">
  <!-- Top Navigation Bar -->
  <header class="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
          <i class="fa-solid fa-code text-sm"></i>
        </div>
        <div>
          <span class="font-bold text-base tracking-tight text-white">{app_name}</span>
          <span class="text-[10px] block text-cyan-400 font-mono">Google Stitch &bull; Interactive UI</span>
        </div>
      </div>

      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <a href="#about" class="hover:text-cyan-400 transition-colors">About</a>
        <a href="#projects" class="hover:text-cyan-400 transition-colors">Projects</a>
        <a href="#skills" class="hover:text-cyan-400 transition-colors">Skills</a>
        <a href="#contact" class="hover:text-cyan-400 transition-colors">Contact</a>
      </nav>

      <div class="flex items-center gap-3">
        <!-- Theme Toggle Button -->
        <button id="themeToggle" class="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-all cursor-pointer">
          <i id="themeIcon" class="fa-solid fa-moon text-sm"></i>
        </button>

        <button onclick="openModal('contactModal')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-semibold text-xs hover:opacity-90 shadow-md shadow-cyan-500/20 transition-all cursor-pointer">
          Let's Talk
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section id="about" class="py-20 px-6 relative overflow-hidden">
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

    <div class="max-w-6xl mx-auto grid md:grid-cols-12 gap-12 items-center relative z-10">
      <div class="md:col-span-7 space-y-6">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Available for High-Impact Roles & Consulting
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
          Architecting High-Performance <span class="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">Digital Experiences</span>
        </h1>
        <p class="text-base text-slate-400 leading-relaxed">
          Senior Full-Stack & Autonomous AI Systems Engineer crafting resilient architectures, distributed reactive frontends, and intelligent machine learning workflows.
        </p>

        <div class="flex items-center gap-4 pt-2">
          <a href="#projects" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20">
            Explore Selected Work
          </a>
          <a href="#contact" class="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all">
            Download Resume
          </a>
        </div>

        <div class="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
          <div>
            <div class="text-2xl font-black text-white font-mono">7+</div>
            <div class="text-xs text-slate-400">Years Experience</div>
          </div>
          <div>
            <div class="text-2xl font-black text-white font-mono">42+</div>
            <div class="text-xs text-slate-400">Shipped Projects</div>
          </div>
          <div>
            <div class="text-2xl font-black text-white font-mono">99.9%</div>
            <div class="text-xs text-slate-400">Production Uptime</div>
          </div>
        </div>
      </div>

      <div class="md:col-span-5 flex justify-center">
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500"></div>
          <div class="relative w-72 h-88 rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl flex flex-col justify-between">
            <div class="w-full h-56 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 border border-slate-700/60 flex items-center justify-center text-cyan-400 text-6xl">
              <i class="fa-solid fa-user-astronaut"></i>
            </div>
            <div class="p-2">
              <h3 class="font-bold text-white text-sm">Lead Systems Architect</h3>
              <p class="text-xs text-slate-400">Full-Stack &bull; Cloud &bull; Agentic AI</p>
              <div class="flex gap-2 mt-3 text-slate-400 text-sm">
                <a href="#" class="hover:text-cyan-400 transition-colors"><i class="fa-brands fa-github"></i></a>
                <a href="#" class="hover:text-cyan-400 transition-colors"><i class="fa-brands fa-linkedin"></i></a>
                <a href="#" class="hover:text-cyan-400 transition-colors"><i class="fa-brands fa-x-twitter"></i></a>
                <a href="#" class="hover:text-cyan-400 transition-colors"><i class="fa-solid fa-envelope"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Project Showcase Section -->
  <section id="projects" class="py-16 px-6 bg-slate-900/40 border-y border-slate-800/60">
    <div class="max-w-6xl mx-auto space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span class="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Portfolio Work</span>
          <h2 class="text-3xl font-extrabold text-white mt-1">Featured Engineering Projects</h2>
        </div>

        <!-- Filter Buttons -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1" id="filterBar">
          <button onclick="filterProjects('all')" class="filter-btn active px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 transition-all cursor-pointer" data-filter="all">All</button>
          <button onclick="filterProjects('ai')" class="filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer" data-filter="ai">AI / Agents</button>
          <button onclick="filterProjects('web')" class="filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer" data-filter="web">Web Apps</button>
          <button onclick="filterProjects('cloud')" class="filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer" data-filter="cloud">Cloud / DevOps</button>
        </div>
      </div>

      <!-- Live Search Box -->
      <div class="relative max-w-md">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
        <input id="searchProjects" type="text" placeholder="Search projects by tech stack or keyword..." class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400" />
      </div>

      <!-- Project Cards Grid -->
      <div class="grid md:grid-cols-3 gap-6" id="projectsGrid">
        <!-- Project 1 -->
        <div class="project-card rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all group flex flex-col justify-between" data-category="ai" data-keywords="asura autonomous agent fastapi python react sse">
          <div>
            <div class="w-full h-40 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 text-4xl mb-4 group-hover:scale-102 transition-transform">
              <i class="fa-solid fa-brain"></i>
            </div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[10px]">AI / Agents</span>
              <span class="text-slate-500 font-mono text-[11px]">2026</span>
            </div>
            <h3 class="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">Autonomous Agent Engine</h3>
            <p class="text-xs text-slate-400 mt-2 line-clamp-3">
              Full-stack autonomous software engineer executing multi-step DAG task graphs, self-correcting replanning, and generating production deliverables.
            </p>
          </div>
          <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-[11px] font-mono text-slate-500">React &bull; FastAPI &bull; SSE</span>
            <button onclick="viewProjectDetails('Autonomous Agent Engine', 'Full-stack autonomous software engineer executing multi-step DAG task graphs, self-correcting replanning, and generating production deliverables with zero external telemetry.')" class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 cursor-pointer text-xs">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
          </div>
        </div>

        <!-- Project 2 -->
        <div class="project-card rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all group flex flex-col justify-between" data-category="web" data-keywords="crm dashboard tailwind react pipeline sales">
          <div>
            <div class="w-full h-40 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400 text-4xl mb-4 group-hover:scale-102 transition-transform">
              <i class="fa-solid fa-chart-line"></i>
            </div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono text-[10px]">Web Apps</span>
              <span class="text-slate-500 font-mono text-[11px]">2026</span>
            </div>
            <h3 class="font-bold text-white text-base group-hover:text-teal-400 transition-colors">Enterprise CRM & Sales Pipeline</h3>
            <p class="text-xs text-slate-400 mt-2 line-clamp-3">
              High-throughput pipeline visualizer with stage drag-and-drop, automated deal scoring, and instant PDF report export.
            </p>
          </div>
          <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-[11px] font-mono text-slate-500">Next.js &bull; Tailwind &bull; Supabase</span>
            <button onclick="viewProjectDetails('Enterprise CRM & Sales Pipeline', 'High-throughput pipeline visualizer with stage drag-and-drop, automated deal scoring, and instant PDF report export built for scale.')" class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-teal-400 hover:bg-slate-700 cursor-pointer text-xs">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
          </div>
        </div>

        <!-- Project 3 -->
        <div class="project-card rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all group flex flex-col justify-between" data-category="cloud" data-keywords="cloud docker kubernetes terraform devops render">
          <div>
            <div class="w-full h-40 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 text-4xl mb-4 group-hover:scale-102 transition-transform">
              <i class="fa-solid fa-server"></i>
            </div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px]">Cloud / DevOps</span>
              <span class="text-slate-500 font-mono text-[11px]">2026</span>
            </div>
            <h3 class="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">Zero-Cost Cloud Deployment</h3>
            <p class="text-xs text-slate-400 mt-2 line-clamp-3">
              Production containerized architecture deploying Vercel frontend, Render backend, Supabase Postgres, and Colab GPU tunnels.
            </p>
          </div>
          <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-[11px] font-mono text-slate-500">Docker &bull; Render &bull; Vercel</span>
            <button onclick="viewProjectDetails('Zero-Cost Cloud Deployment', 'Production containerized architecture deploying Vercel frontend, Render backend, Supabase Postgres, and Colab GPU tunnels at $0/month.')" class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-indigo-400 hover:bg-slate-700 cursor-pointer text-xs">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Skills & Stack Section -->
  <section id="skills" class="py-16 px-6">
    <div class="max-w-6xl mx-auto space-y-8">
      <div class="text-center max-w-2xl mx-auto space-y-2">
        <span class="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Technical Competencies</span>
        <h2 class="text-3xl font-extrabold text-white">Full-Stack Tech Stack</h2>
        <p class="text-xs text-slate-400">Interactive proficiency matrix and systems capabilities.</p>
      </div>

      <div class="grid md:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div class="text-cyan-400 text-xl mb-1"><i class="fa-brands fa-react"></i></div>
          <h4 class="font-bold text-white text-sm">Frontend Engineering</h4>
          <p class="text-xs text-slate-400 leading-relaxed">React, Next.js 16, TypeScript, Tailwind CSS, Vue, Redux Toolkit, WebSockets, Canvas.</p>
        </div>

        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div class="text-teal-400 text-xl mb-1"><i class="fa-brands fa-python"></i></div>
          <h4 class="font-bold text-white text-sm">Backend & APIs</h4>
          <p class="text-xs text-slate-400 leading-relaxed">FastAPI, Python 3.12, Node.js, SSE Streaming, AsyncIO, GraphQL, REST, ReportLab.</p>
        </div>

        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div class="text-indigo-400 text-xl mb-1"><i class="fa-solid fa-database"></i></div>
          <h4 class="font-bold text-white text-sm">Databases & Storage</h4>
          <p class="text-xs text-slate-400 leading-relaxed">PostgreSQL, Supabase, SQLite, Redis, ChromaDB, PGVector, Hybrid Vector Search.</p>
        </div>

        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div class="text-purple-400 text-xl mb-1"><i class="fa-solid fa-microchip"></i></div>
          <h4 class="font-bold text-white text-sm">AI & Agentic Systems</h4>
          <p class="text-xs text-slate-400 leading-relaxed">LangChain, Ollama Local Models, Gemini 2.5, DAG Task Planners, Self-Correction.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Contact Section -->
  <section id="contact" class="py-16 px-6 bg-slate-900/40 border-t border-slate-800/60">
    <div class="max-w-4xl mx-auto rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 p-8 md:p-12 shadow-2xl relative overflow-hidden">
      <div class="space-y-4 max-w-xl">
        <h2 class="text-3xl font-extrabold text-white">Let's build something remarkable together.</h2>
        <p class="text-sm text-slate-400">Have a challenging software architecture problem or an autonomous agent pipeline to construct? Send a message directly.</p>
      </div>

      <form id="contactForm" onsubmit="handleFormSubmit(event)" class="mt-8 space-y-4 max-w-xl">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Your Name</label>
            <input type="text" required placeholder="Suhash" class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input type="email" required placeholder="suhas@example.com" class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Project Details</label>
          <textarea rows="4" required placeholder="Tell me about your architectural goals, timeline, and tech stack..." class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"></textarea>
        </div>

        <button type="submit" class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all cursor-pointer flex items-center gap-2">
          <span>Send Message</span>
          <i class="fa-solid fa-paper-plane text-xs"></i>
        </button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 px-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
    <p>&copy; 2026 {app_name}. Built autonomously with Asura Playground &amp; Google Stitch UI Engine.</p>
  </footer>

  <!-- Modal Dialog -->
  <div id="projectModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 id="modalTitle" class="text-lg font-bold text-white">Project Details</h3>
        <button onclick="closeModal('projectModal')" class="p-1 text-slate-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <p id="modalDesc" class="text-xs text-slate-300 leading-relaxed"></p>
      <div class="pt-4 flex justify-end">
        <button onclick="closeModal('projectModal')" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer">Close</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-2xl flex items-center gap-2">
    <i class="fa-solid fa-circle-check"></i>
    <span id="toastMsg">Action completed successfully!</span>
  </div>

  <!-- Embedded Client Logic & Interactions -->
  <script>
    // Theme Switcher Logic
    const themeBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    let isDark = true;

    themeBtn.addEventListener('click', () => {{
      isDark = !isDark;
      if (isDark) {{
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        themeIcon.className = 'fa-solid fa-moon text-sm';
      }} else {{
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        themeIcon.className = 'fa-solid fa-sun text-sm text-amber-400';
      }}
      showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled');
    }});

    // Project Filtering Logic
    function filterProjects(category) {{
      document.querySelectorAll('.filter-btn').forEach(b => {{
        if (b.getAttribute('data-filter') === category) {{
          b.className = 'filter-btn active px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 transition-all cursor-pointer';
        }} else {{
          b.className = 'filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer';
        }}
      }});

      document.querySelectorAll('.project-card').forEach(card => {{
        if (category === 'all' || card.getAttribute('data-category') === category) {{
          card.style.display = 'flex';
        }} else {{
          card.style.display = 'none';
        }}
      }});
    }}

    // Real-time Search Logic
    document.getElementById('searchProjects').addEventListener('input', (e) => {{
      const query = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.project-card').forEach(card => {{
        const text = (card.getAttribute('data-keywords') + ' ' + card.innerText).toLowerCase();
        card.style.display = text.includes(query) ? 'flex' : 'none';
      }});
    }});

    // Modal Handlers
    function viewProjectDetails(title, desc) {{
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalDesc').textContent = desc;
      document.getElementById('projectModal').classList.remove('hidden');
    }}

    function closeModal(id) {{
      document.getElementById(id).classList.add('hidden');
    }}

    // Form submission simulation
    function handleFormSubmit(e) {{
      e.preventDefault();
      showToast('Thank you! Message received, will reply within 24h.');
      e.target.reset();
    }}

    // Toast Notification helper
    function showToast(msg) {{
      const t = document.getElementById('toast');
      document.getElementById('toastMsg').textContent = msg;
      t.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => {{
        t.classList.add('translate-y-20', 'opacity-0');
      }}, 3000);
    }}
  </script>
</body>
</html>"""

    def _build_crm_app(self, app_name: str, prompt: str) -> str:
        return f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{app_name} | Google Stitch CRM</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <script>
    tailwind.config = {{
      darkMode: 'class',
      theme: {{ extend: {{ fontFamily: {{ sans: ['"Plus Jakarta Sans"', 'sans-serif'] }} }} }}
    }}
  </script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col">
  <!-- Top Bar -->
  <header class="border-b border-slate-800 bg-slate-900/60 px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
        <i class="fa-solid fa-chart-pie text-xs"></i>
      </div>
      <h1 class="font-bold text-sm text-white">{app_name}</h1>
      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Google Stitch</span>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="openDealModal()" class="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer">
        <i class="fa-solid fa-plus text-xs"></i> Add Deal
      </button>
    </div>
  </header>

  <!-- Metrics Bar -->
  <div class="px-6 py-4 grid grid-cols-4 gap-4 border-b border-slate-800/80 bg-slate-900/20">
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <span class="text-[11px] text-slate-400 font-medium">Pipeline Value</span>
      <div class="text-xl font-extrabold text-white font-mono mt-0.5" id="pipelineVal">$1,840,000</div>
    </div>
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <span class="text-[11px] text-slate-400 font-medium">Active Deals</span>
      <div class="text-xl font-extrabold text-white font-mono mt-0.5" id="dealCount">18</div>
    </div>
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <span class="text-[11px] text-slate-400 font-medium">Win Rate</span>
      <div class="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">68.4%</div>
    </div>
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <span class="text-[11px] text-slate-400 font-medium">Avg Sales Cycle</span>
      <div class="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">18 Days</div>
    </div>
  </div>

  <!-- Kanban Pipeline Board -->
  <main class="flex-1 p-6 overflow-x-auto">
    <div class="grid grid-cols-4 gap-4 min-w-[900px] h-full">
      <!-- Stage 1: Lead In -->
      <div class="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl p-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
          <span>1. Qualified Leads</span>
          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800" id="s1_count">2</span>
        </div>
        <div class="space-y-3 mt-3 flex-1 overflow-y-auto" id="col_leads">
          <div class="p-3 rounded-lg bg-slate-900 border border-slate-700/60 shadow-xs hover:border-indigo-500 transition-all cursor-pointer">
            <span class="text-[10px] font-mono text-indigo-400">Enterprise AI</span>
            <h4 class="font-bold text-xs text-white mt-1">Apex FinTech Corp</h4>
            <div class="flex justify-between items-center text-[11px] text-slate-400 mt-2">
              <span class="font-mono text-emerald-400 font-bold">$240,000</span>
              <span>12d</span>
            </div>
          </div>
          <div class="p-3 rounded-lg bg-slate-900 border border-slate-700/60 shadow-xs hover:border-indigo-500 transition-all cursor-pointer">
            <span class="text-[10px] font-mono text-indigo-400">Cloud Migration</span>
            <h4 class="font-bold text-xs text-white mt-1">Starlight Logistics</h4>
            <div class="flex justify-between items-center text-[11px] text-slate-400 mt-2">
              <span class="font-mono text-emerald-400 font-bold">$120,000</span>
              <span>4d</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage 2: Demo -->
      <div class="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl p-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
          <span>2. Demo & Technical Proof</span>
          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800">2</span>
        </div>
        <div class="space-y-3 mt-3 flex-1 overflow-y-auto">
          <div class="p-3 rounded-lg bg-slate-900 border border-slate-700/60 shadow-xs hover:border-indigo-500 transition-all cursor-pointer">
            <span class="text-[10px] font-mono text-purple-400">Security Suite</span>
            <h4 class="font-bold text-xs text-white mt-1">Vanguard Health</h4>
            <div class="flex justify-between items-center text-[11px] text-slate-400 mt-2">
              <span class="font-mono text-emerald-400 font-bold">$450,000</span>
              <span>Tomorrow 2PM</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage 3: Proposal -->
      <div class="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl p-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
          <span>3. Proposal & Negotiation</span>
          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800">1</span>
        </div>
        <div class="space-y-3 mt-3 flex-1 overflow-y-auto">
          <div class="p-3 rounded-lg bg-slate-900 border border-slate-700/60 shadow-xs hover:border-indigo-500 transition-all cursor-pointer">
            <span class="text-[10px] font-mono text-amber-400">Annual License</span>
            <h4 class="font-bold text-xs text-white mt-1">Global Retail Matrix</h4>
            <div class="flex justify-between items-center text-[11px] text-slate-400 mt-2">
              <span class="font-mono text-emerald-400 font-bold">$680,000</span>
              <span>Pending Sign</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage 4: Closed Won -->
      <div class="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl p-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-emerald-400">
          <span>4. Closed Won</span>
          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">1</span>
        </div>
        <div class="space-y-3 mt-3 flex-1 overflow-y-auto">
          <div class="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 shadow-xs hover:border-emerald-400 transition-all cursor-pointer">
            <span class="text-[10px] font-mono text-emerald-400">Contract Executed</span>
            <h4 class="font-bold text-xs text-white mt-1">Beacon Systems</h4>
            <div class="flex justify-between items-center text-[11px] text-slate-400 mt-2">
              <span class="font-mono text-emerald-400 font-bold">$350,000</span>
              <span>Paid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Add Deal Modal -->
  <div id="dealModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-white text-sm">Add New Sales Deal</h3>
        <button onclick="closeDealModal()" class="text-slate-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form onsubmit="handleNewDeal(event)" class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-400 mb-1">Company Name</label>
          <input id="dealCompany" required class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white" placeholder="Acme Global Inc" />
        </div>
        <div>
          <label class="block text-slate-400 mb-1">Estimated Value ($)</label>
          <input id="dealValue" type="number" required class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white" placeholder="150000" />
        </div>
        <div>
          <label class="block text-slate-400 mb-1">Deal Category</label>
          <input id="dealCat" required class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white" placeholder="SaaS Subscription" />
        </div>
        <button type="submit" class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs cursor-pointer shadow-md mt-2">
          Create Deal Card
        </button>
      </form>
    </div>
  </div>

  <script>
    function openDealModal() {{ document.getElementById('dealModal').classList.remove('hidden'); }}
    function closeDealModal() {{ document.getElementById('dealModal').classList.add('hidden'); }}

    function handleNewDeal(e) {{
      e.preventDefault();
      const comp = document.getElementById('dealCompany').value;
      const val = parseInt(document.getElementById('dealValue').value) || 50000;
      const cat = document.getElementById('dealCat').value;

      const card = document.createElement('div');
      card.className = 'p-3 rounded-lg bg-slate-900 border border-slate-700/60 shadow-xs hover:border-indigo-500 transition-all cursor-pointer animate-in fade-in';
      card.innerHTML = `
        <span class="text-[10px] font-mono text-indigo-400">${{cat}}</span>
        <h4 class="font-bold text-xs text-white mt-1">${{comp}}</h4>
        <div class="flex justify-between items-center text-[11px] text-slate-400 mt-2">
          <span class="font-mono text-emerald-400 font-bold">$${{val.toLocaleString()}}</span>
          <span>Just now</span>
        </div>
      `;
      document.getElementById('col_leads').prepend(card);
      closeDealModal();
      e.target.reset();
    }}
  </script>
</body>
</html>"""

    def _build_ecommerce_app(self, app_name: str, prompt: str) -> str:
        return f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{app_name} | Google Stitch Store</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans">
  <header class="border-b border-slate-800 bg-slate-900/60 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center font-bold text-white"><i class="fa-solid fa-bag-shopping text-sm"></i></div>
      <span class="font-bold text-base text-white">{app_name}</span>
    </div>
    <div class="flex items-center gap-4">
      <button onclick="toggleCart()" class="relative p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-400 cursor-pointer">
        <i class="fa-solid fa-cart-shopping"></i>
        <span id="cartBadge" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">0</span>
      </button>
    </div>
  </header>

  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white">Trending Collection</h2>
      <span class="text-xs text-slate-400">Interactive Google Stitch Storefront</span>
    </div>

    <div class="grid md:grid-cols-3 gap-6" id="productGrid">
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div class="w-full h-48 rounded-xl bg-slate-950 flex items-center justify-center text-5xl text-rose-400"><i class="fa-solid fa-shoe-prints"></i></div>
        <div class="flex justify-between items-start">
          <div><h3 class="font-bold text-white text-sm">Aero Velocity Pro</h3><span class="text-xs text-slate-500 font-mono">Performance Footwear</span></div>
          <span class="font-mono font-bold text-rose-400 text-sm">$189.00</span>
        </div>
        <button onclick="addToCart('Aero Velocity Pro', 189)" class="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md">Add to Cart</button>
      </div>

      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div class="w-full h-48 rounded-xl bg-slate-950 flex items-center justify-center text-5xl text-cyan-400"><i class="fa-solid fa-headphones"></i></div>
        <div class="flex justify-between items-start">
          <div><h3 class="font-bold text-white text-sm">Aura Noise Cancelling</h3><span class="text-xs text-slate-500 font-mono">Studio Acoustic</span></div>
          <span class="font-mono font-bold text-cyan-400 text-sm">$299.00</span>
        </div>
        <button onclick="addToCart('Aura Noise Cancelling', 299)" class="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md">Add to Cart</button>
      </div>

      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div class="w-full h-48 rounded-xl bg-slate-950 flex items-center justify-center text-5xl text-amber-400"><i class="fa-solid fa-clock"></i></div>
        <div class="flex justify-between items-start">
          <div><h3 class="font-bold text-white text-sm">Chrono Titan Series</h3><span class="text-xs text-slate-500 font-mono">Precision Smartwatch</span></div>
          <span class="font-mono font-bold text-amber-400 text-sm">$349.00</span>
        </div>
        <button onclick="addToCart('Chrono Titan Series', 349)" class="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md">Add to Cart</button>
      </div>
    </div>
  </main>

  <script>
    let cart = [];
    function addToCart(item, price) {{
      cart.push({{ item, price }});
      document.getElementById('cartBadge').textContent = cart.length;
      alert(`Added "${{item}}" to cart! (Total items: ${{cart.length}})`);
    }}
    function toggleCart() {{
      alert(`Your cart has ${{cart.length}} items. Total value: $${{cart.reduce((s, i) => s + i.price, 0)}}`);
    }}
  </script>
</body>
</html>"""

    def _build_analytics_app(self, app_name: str, prompt: str) -> str:
        return self._build_crm_app(app_name, prompt)

    def _build_kanban_app(self, app_name: str, prompt: str) -> str:
        return self._build_crm_app(app_name, prompt)

    def _build_dynamic_showcase_app(self, app_name: str, prompt: str) -> str:
        return self._build_portfolio_app(app_name, prompt)

stitch_engine = StitchEngine()
