import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export interface TemplateItem {
  tag: 'WEBSITE' | 'SLIDES' | 'PDF' | 'GAME' | 'RESEARCH' | 'CODE' | 'IMAGE';
  title: string;
  caption: string;
  prompt: string;
  accent: string;
  gradient: string;
  svgIcon: React.ReactNode;
}

const TEMPLATES_DATA: TemplateItem[] = [
  // 3 Website Templates
  {
    tag: 'WEBSITE',
    title: 'SaaS Analytics Dashboard',
    caption: 'Interactive real-time metrics & chart canvas with Stitch UI',
    prompt: 'Build a modern responsive SaaS analytics dashboard with interactive revenue charts, user metrics, and dark mode.',
    accent: '#06b6d4',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeWidth="1.2" />
        <rect x="4" y="4" width="40" height="4" rx="1.5" fill="#06b6d4" fillOpacity="0.5" />
        <rect x="4" y="11" width="18" height="17" rx="2" fill="#06b6d4" fillOpacity="0.25" />
        <rect x="25" y="11" width="19" height="8" rx="2" fill="#06b6d4" fillOpacity="0.2" />
        <rect x="25" y="21" width="19" height="7" rx="2" fill="#06b6d4" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    tag: 'WEBSITE',
    title: 'E-Commerce Storefront',
    caption: 'Modern luxury shopping experience with bag checkout',
    prompt: 'Build a minimalist luxury fashion e-commerce storefront with product filters, hero carousel, and cart drawer.',
    accent: '#06b6d4',
    gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeWidth="1.2" />
        <circle cx="14" cy="18" r="6" fill="#06b6d4" fillOpacity="0.4" />
        <circle cx="34" cy="18" r="6" fill="#06b6d4" fillOpacity="0.4" />
        <line x1="4" y1="8" x2="44" y2="8" stroke="#06b6d4" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    tag: 'WEBSITE',
    title: 'Developer Portfolio',
    caption: 'Dark mode engineering portfolio with project showcases',
    prompt: 'Build a high-end dark mode portfolio website for a senior AI engineer featuring interactive project case studies.',
    accent: '#06b6d4',
    gradient: 'from-sky-500/20 via-cyan-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeWidth="1.2" />
        <rect x="6" y="8" width="12" height="16" rx="2" fill="#06b6d4" fillOpacity="0.5" />
        <line x1="22" y1="12" x2="42" y2="12" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="18" x2="38" y2="18" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="22" y1="24" x2="34" y2="24" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },

  // 3 Slides Templates
  {
    tag: 'SLIDES',
    title: 'Executive Pitch Deck',
    caption: '10-slide startup pitch deck with TAM and unit economics',
    prompt: 'Create a 10-slide executive pitch deck presentation for an AI platform including TAM, business model, and milestones.',
    accent: '#f59e0b',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.2" />
        <rect x="6" y="6" width="20" height="3" rx="1" fill="#f59e0b" fillOpacity="0.7" />
        <rect x="6" y="20" width="6" height="8" rx="1" fill="#f59e0b" fillOpacity="0.4" />
        <rect x="15" y="16" width="6" height="12" rx="1" fill="#f59e0b" fillOpacity="0.6" />
        <rect x="24" y="12" width="6" height="16" rx="1" fill="#f59e0b" fillOpacity="0.8" />
        <rect x="33" y="8" width="6" height="20" rx="1" fill="#f59e0b" />
      </svg>
    ),
  },
  {
    tag: 'SLIDES',
    title: 'Product Roadmap 2026',
    caption: 'Strategic engineering milestones and quarterly deliverables',
    prompt: 'Generate an 8-slide product roadmap presentation detailing engineering milestones and autonomous capabilities.',
    accent: '#f59e0b',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.2" />
        <line x1="6" y1="16" x2="42" y2="16" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="12" cy="16" r="3.5" fill="#f59e0b" />
        <circle cx="24" cy="16" r="3.5" fill="#f59e0b" />
        <circle cx="36" cy="16" r="3.5" fill="#f59e0b" />
      </svg>
    ),
  },
  {
    tag: 'SLIDES',
    title: 'Series A Investment Deck',
    caption: 'Financial projections, customer cohort retention, and growth',
    prompt: 'Create a 12-slide Series A venture investment presentation with ARR growth, cohort retention, and unit economics.',
    accent: '#f59e0b',
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.2" />
        <path d="M8 24 L20 16 L30 20 L40 8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40" cy="8" r="2.5" fill="#f59e0b" />
      </svg>
    ),
  },

  // 3 PDF Templates
  {
    tag: 'PDF',
    title: 'Enterprise Security Audit',
    caption: 'SOC2 & ISO27001 compliance risk analysis report',
    prompt: 'Generate a comprehensive technical PDF security report detailing SOC2 Type II compliance controls and audit findings.',
    accent: '#f43f5e',
    gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#f43f5e" fillOpacity="0.15" stroke="#f43f5e" strokeWidth="1.2" />
        <rect x="8" y="6" width="10" height="6" rx="1.5" fill="#f43f5e" />
        <line x1="22" y1="9" x2="40" y2="9" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="16" x2="40" y2="16" stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="8" y1="21" x2="36" y2="21" stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="8" y1="26" x2="32" y2="26" stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    tag: 'PDF',
    title: 'Technical Whitepaper',
    caption: 'Deep-dive architectural paper on autonomous agent DAGs',
    prompt: 'Generate a formal technical PDF whitepaper on autonomous agent DAG execution pipelines and state checkpointing.',
    accent: '#f43f5e',
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#f43f5e" fillOpacity="0.15" stroke="#f43f5e" strokeWidth="1.2" />
        <circle cx="24" cy="14" r="7" stroke="#f43f5e" strokeWidth="1.5" fill="#f43f5e" fillOpacity="0.2" />
        <line x1="10" y1="26" x2="38" y2="26" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tag: 'PDF',
    title: 'Financial Health Statement',
    caption: 'Comprehensive cash flow & revenue breakdown analysis',
    prompt: 'Compile a structured financial statement report analyzing revenue growth, EBITDA margin, and working capital.',
    accent: '#f43f5e',
    gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#f43f5e" fillOpacity="0.15" stroke="#f43f5e" strokeWidth="1.2" />
        <rect x="6" y="6" width="36" height="20" rx="2" fill="#f43f5e" fillOpacity="0.2" />
        <line x1="6" y1="12" x2="42" y2="12" stroke="#f43f5e" strokeWidth="1" />
        <line x1="24" y1="6" x2="24" y2="26" stroke="#f43f5e" strokeWidth="1" />
      </svg>
    ),
  },

  // 3 Game Templates
  {
    tag: 'GAME',
    title: 'Retro Space Shooter',
    caption: 'Arcade laser combat with particle explosions & boss fights',
    prompt: 'Build a playable retro arcade space shooter browser game in HTML5 canvas with particle effects and boss waves.',
    accent: '#8b5cf6',
    gradient: 'from-violet-500/20 via-fuchsia-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#8b5cf6" fillOpacity="0.15" stroke="#8b5cf6" strokeWidth="1.2" />
        <path d="M24 6 L28 16 L20 16 Z" fill="#8b5cf6" />
        <circle cx="12" cy="10" r="1.5" fill="#f43f5e" />
        <circle cx="36" cy="12" r="1.5" fill="#f43f5e" />
        <circle cx="24" cy="24" r="2" fill="#06b6d4" />
      </svg>
    ),
  },
  {
    tag: 'GAME',
    title: 'Cyberpunk 2D Platformer',
    caption: 'Gravity jumps, wall climbing, and neon obstacles',
    prompt: 'Build a playable 2D cyberpunk platformer browser game with responsive keyboard controls, obstacles, and gems.',
    accent: '#8b5cf6',
    gradient: 'from-fuchsia-500/20 via-violet-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#8b5cf6" fillOpacity="0.15" stroke="#8b5cf6" strokeWidth="1.2" />
        <rect x="6" y="24" width="20" height="4" rx="1" fill="#8b5cf6" />
        <rect x="28" y="18" width="14" height="4" rx="1" fill="#8b5cf6" />
        <rect x="12" y="16" width="6" height="7" rx="1" fill="#f43f5e" />
      </svg>
    ),
  },
  {
    tag: 'GAME',
    title: 'Zen Color Puzzle',
    caption: 'Relaxing grid match mechanics with satisfying physics',
    prompt: 'Build an interactive color tile puzzle game in HTML5 canvas with smooth transition effects and score combos.',
    accent: '#8b5cf6',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#8b5cf6" fillOpacity="0.15" stroke="#8b5cf6" strokeWidth="1.2" />
        <circle cx="16" cy="12" r="4" fill="#f43f5e" />
        <circle cx="32" cy="12" r="4" fill="#06b6d4" />
        <circle cx="16" cy="22" r="4" fill="#f59e0b" />
        <circle cx="32" cy="22" r="4" fill="#10b981" />
      </svg>
    ),
  },

  // 4 Additional Modalities
  {
    tag: 'RESEARCH',
    title: 'Autonomous AI Market 2026',
    caption: 'Global enterprise market sizing, CAGR, and competitive matrix',
    prompt: 'Research global enterprise autonomous AI agent market size in 2026, including CAGR and competitive landscapes.',
    accent: '#3b82f6',
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="1.2" />
        <circle cx="24" cy="16" r="10" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="24" cy="16" r="4" fill="#3b82f6" />
      </svg>
    ),
  },
  {
    tag: 'RESEARCH',
    title: 'Analyze a Document',
    caption: 'Extract legal risks, obligations, and key terms from files',
    prompt: 'Analyze this contract agreement and summarize key indemnity risks, termination notice periods, and obligations.',
    accent: '#10b981',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.2" />
        <path d="M16 16 L22 22 L32 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    tag: 'RESEARCH',
    title: 'Find Customers & ICP',
    caption: 'B2B enterprise lead qualification and target segment scoring',
    prompt: 'Identify top B2B enterprise customer segments and ICP criteria for deploying autonomous agent automation.',
    accent: '#06b6d4',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#06b6d4" fillOpacity="0.15" stroke="#06b6d4" strokeWidth="1.2" />
        <circle cx="18" cy="14" r="4" fill="#06b6d4" />
        <circle cx="30" cy="14" r="4" fill="#06b6d4" />
        <path d="M12 24 C12 20 24 20 24 24" stroke="#06b6d4" strokeWidth="1.5" />
        <path d="M24 24 C24 20 36 20 36 24" stroke="#06b6d4" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    tag: 'CODE',
    title: 'Write High-Performance Code',
    caption: 'FastAPI async microservice with connection pool and workers',
    prompt: 'Write a high-performance Python FastAPI microservice with connection pooling, structured logging, and redis queues.',
    accent: '#10b981',
    gradient: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
    svgIcon: (
      <svg viewBox="0 0 48 32" fill="none" className="w-12 h-8">
        <rect width="48" height="32" rx="4" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.2" />
        <path d="M16 12 L11 16 L16 20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 12 L37 16 L32 20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="26" y1="10" x2="22" y2="22" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
  },
];

interface TemplatesCarouselProps {
  onSelectPrompt: (prompt: string) => void;
  triggerComposerPulse?: () => void;
}

export function TemplatesCarousel({ onSelectPrompt, triggerComposerPulse }: TemplatesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleClickItem = (prompt: string) => {
    onSelectPrompt(prompt);
    if (triggerComposerPulse) triggerComposerPulse();
  };

  return (
    <div className="w-full max-w-[1100px] animate-bento-entrance-carousel">
      {/* Header Row with Title and Left/Right Navigation Arrows */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-500" />
          <span className="text-xs font-semibold text-[var(--foreground)] tracking-tight">
            Templates & Examples
          </span>
          <span className="text-[11px] text-[var(--muted-foreground)] hidden sm:inline">
            • Click any card to load prompt
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous templates"
            className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next templates"
            className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Strip with Scroll-Snap & Edge Fade Masks */}
      <div className="relative w-full">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-3.5 overflow-x-auto pb-4 scrollbar-none scroll-smooth snap-x carousel-mask-edges px-1"
        >
          {TEMPLATES_DATA.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleClickItem(item.prompt)}
              className="w-72 sm:w-80 shrink-0 p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-1 snap-start group flex flex-col justify-between h-40 select-none relative overflow-hidden active:scale-[0.985]"
              style={{
                ['--template-accent' as any]: item.accent,
              }}
            >
              {/* Subtle Ambient Hover Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(220px circle at 80% 20%, ${item.accent}18, transparent 75%)`,
                }}
              />

              {/* Top Row: Tag Chip & SVG Thumbnail */}
              <div className="flex items-start justify-between relative z-10">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider font-mono border"
                  style={{
                    backgroundColor: `${item.accent}12`,
                    color: item.accent,
                    borderColor: `${item.accent}30`,
                  }}
                >
                  {item.tag}
                </span>

                <div className="p-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] transition-transform duration-300 group-hover:scale-105">
                  {item.svgIcon}
                </div>
              </div>

              {/* Bottom Content: Title & Caption */}
              <div className="relative z-10">
                <h3 className="text-xs font-semibold text-[var(--foreground)] group-hover:text-[var(--template-accent)] transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-2 leading-relaxed">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
