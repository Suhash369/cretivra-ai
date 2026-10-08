import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
  Download,
  Code,
  Eye,
  Sparkles,
  Layers,
  Copy,
  Check,
  Send,
  Loader2,
  Cpu,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  synthesizeUiApi,
  fetchUiVariantsApi,
  refineUiApi,
  resolveArtifactDownloadUrl,
  type Artifact,
} from '../services/playgroundApi';

interface UIBuildingCanvasProps {
  artifact?: Artifact | null;
  htmlContent?: string | null;
  isBuilding?: boolean;
  activePhase?: number;
  promptText?: string;
  onUpdateHtml?: (newHtml: string) => void;
}

type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

const BUILDING_PHASES = [
  { step: 1, title: 'Visual Ontology & Layout Planning', desc: 'Deconstructing user prompt into semantic component hierarchy' },
  { step: 2, title: 'Drafting Blueprint Wireframes', desc: 'Positioning responsive grids, headers, and container constraints' },
  { step: 3, title: 'Synthesizing Design Tokens & Tailwind CSS', desc: 'Applying color palettes, modern typography, and glassmorphism' },
  { step: 4, title: 'Compiling Reactive State & Interactions', desc: 'Wiring theme toggles, live search filters, and modals' },
  { step: 5, title: 'Finalizing High-Fidelity Interactive Preview', desc: 'Validating DOM layout and mounting live deliverable canvas' },
];

const CODE_STREAM_SNIPPETS = [
  '<header className="sticky top-0 z-40 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">',
  'const [filter, setFilter] = useState<Category>("all");',
  '@layer utilities { .glass { backdrop-filter: blur(16px); } }',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in">',
  'document.documentElement.classList.toggle("dark", isDarkTheme);',
  'export function KanbanCard({ title, value, stage }: DealProps) {',
  '<button className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-medium">',
  'window.dispatchEvent(new CustomEvent("ui:component:mount", { detail }));',
];

export function UIBuildingCanvas({
  artifact,
  htmlContent: initialHtml,
  isBuilding = false,
  activePhase: controlledPhase,
  promptText = 'Interactive Application',
  onUpdateHtml,
}: UIBuildingCanvasProps) {
  const [device, setDevice] = useState<DeviceViewport>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [currentHtml, setCurrentHtml] = useState<string | null>(initialHtml || null);
  const [iframeKey, setIframeKey] = useState(0);

  // Animation states
  const [animPhase, setAnimPhase] = useState(1);
  const [streamIndex, setStreamIndex] = useState(0);
  const [tokenCounter, setTokenCounter] = useState(240);
  const [showMaterializeEffect, setShowMaterializeEffect] = useState(false);

  // Refinement input
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Variants (Modern Cyan, Cyber Violet, Minimalist Emerald)
  const [variants, setVariants] = useState<Array<{ id: string; name: string; theme: string; description: string; html: string }>>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // Sync initial HTML
  useEffect(() => {
    if (initialHtml) {
      setCurrentHtml(initialHtml);
    }
  }, [initialHtml]);

  // Handle building animation progression
  useEffect(() => {
    if (isBuilding || isRefining) {
      setAnimPhase(controlledPhase || 1);
      setShowMaterializeEffect(false);

      const phaseTimer = setInterval(() => {
        setAnimPhase((prev) => (prev < 5 ? prev + 1 : 5));
      }, 1800);

      const streamTimer = setInterval(() => {
        setStreamIndex((prev) => (prev + 1) % CODE_STREAM_SNIPPETS.length);
        setTokenCounter((prev) => prev + Math.floor(Math.random() * 85) + 40);
      }, 700);

      return () => {
        clearInterval(phaseTimer);
        clearInterval(streamTimer);
      };
    } else if (currentHtml) {
      // Trigger smooth materialization morph
      setShowMaterializeEffect(true);
      const timer = setTimeout(() => setShowMaterializeEffect(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isBuilding, isRefining, controlledPhase, Boolean(currentHtml)]);

  // Fullscreen escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Copy code handler
  const handleCopyCode = async () => {
    if (!currentHtml) return;
    try {
      await navigator.clipboard.writeText(currentHtml);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download standalone HTML package
  const handleDownload = () => {
    if (!currentHtml) return;
    const blob = new Blob([currentHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(artifact?.name || 'app-prototype').replace(/\.[^/.]+$/, '')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open in new browser tab
  const handleOpenNewTab = () => {
    if (!currentHtml) return;
    const blob = new Blob([currentHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Trigger iterative refinement
  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inst = refinePrompt.trim();
    if (!inst || isRefining) return;

    setIsRefining(true);
    try {
      const res = await refineUiApi(promptText, inst, currentHtml || undefined);
      if (res.html) {
        setCurrentHtml(res.html);
        if (onUpdateHtml) onUpdateHtml(res.html);
        setIframeKey((k) => k + 1);
        setRefinePrompt('');
      }
    } catch (err: any) {
      alert(`Refinement failed: ${err.message || err}`);
    } finally {
      setIsRefining(false);
    }
  };

  // Fetch or generate design variants
  const handleLoadVariants = async () => {
    if (isLoadingVariants) return;
    setIsLoadingVariants(true);
    try {
      const res = await fetchUiVariantsApi(promptText);
      if (res.variants && res.variants.length > 0) {
        setVariants(res.variants);
        setSelectedVariantId(res.variants[0].id);
      } else {
        // Fallback default 3 theme variants: Modern Cyan, Cyber Violet, Minimalist Emerald
        const defaultVariants = [
          {
            id: 'modern-cyan',
            name: 'Modern Cyan',
            theme: 'cyan',
            description: 'Sleek dark mode with electric cyan accents',
            html: currentHtml || '',
          },
          {
            id: 'cyber-violet',
            name: 'Cyber Violet',
            theme: 'violet',
            description: 'Neon synthwave styling with ultraviolet highlights',
            html: (currentHtml || '').replace(/#06b6d4|cyan/g, '#8b5cf6'),
          },
          {
            id: 'minimalist-emerald',
            name: 'Minimalist Emerald',
            theme: 'emerald',
            description: 'Clean monochrome canvas with emerald green accents',
            html: (currentHtml || '').replace(/#06b6d4|cyan/g, '#10b981'),
          },
        ];
        setVariants(defaultVariants);
        setSelectedVariantId(defaultVariants[0].id);
      }
    } catch (err) {
      console.error('Failed to load variants:', err);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // Apply a selected variant
  const handleSelectVariant = (v: { id: string; html: string }) => {
    setSelectedVariantId(v.id);
    setCurrentHtml(v.html);
    if (onUpdateHtml) onUpdateHtml(v.html);
    setIframeKey((k) => k + 1);
  };

  const isGenerating = isBuilding || isRefining || (!currentHtml && Boolean(promptText));
  const activePhaseInfo = BUILDING_PHASES[animPhase - 1] || BUILDING_PHASES[0];

  return (
    <div
      className={`flex flex-col h-full w-full bg-[var(--surface)] text-[var(--foreground)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm transition-all relative ${
        isFullscreen ? 'fixed inset-3 z-50 rounded-2xl shadow-2xl bg-[var(--background)]' : ''
      }`}
    >
      {/* Canvas Top Command Bar */}
      <div className="h-13 px-4 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Device Frame Switcher (Desktop / Tablet 768 / Mobile 375) */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl p-0.5">
            <button
              onClick={() => setDevice('desktop')}
              title="Desktop View (Fluid / 1280px)"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                device === 'desktop'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDevice('tablet')}
              title="Tablet View (768px)"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                device === 'tablet'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet 768</span>
            </button>
            <button
              onClick={() => setDevice('mobile')}
              title="Mobile View (375px)"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                device === 'mobile'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile 375</span>
            </button>
          </div>

          {/* Zoom Controls (50% - 150%) */}
          <div className="hidden lg:flex items-center bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl px-1.5 py-0.5 text-[11px] font-mono text-[var(--muted-foreground)] gap-1">
            {[50, 75, 100, 125, 150].map((zoom) => (
              <button
                key={zoom}
                onClick={() => setZoomLevel(zoom)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  zoomLevel === zoom
                    ? 'text-[#06b6d4] font-bold bg-[var(--surface)] shadow-xs'
                    : 'hover:text-[var(--foreground)]'
                }`}
              >
                {zoom}%
              </button>
            ))}
          </div>
        </div>

        {/* Center: Live Preview vs Code Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl p-0.5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          {/* Theme Variants (Modern Cyan, Cyber Violet, Minimalist Emerald) */}
          {variants.length > 0 ? (
            <div className="hidden md:flex items-center gap-1 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl p-0.5 text-xs">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVariant(v)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    selectedVariantId === v.id
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-xs'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={handleLoadVariants}
              disabled={isLoadingVariants || isGenerating}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-all cursor-pointer disabled:opacity-40"
              title="Generate Modern Cyan, Cyber Violet, and Minimalist Emerald variants"
            >
              {isLoadingVariants ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3 text-[#06b6d4]" />}
              <span>Theme Variants</span>
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {activeTab === 'code' && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
              title="Copy code to clipboard"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {currentHtml && (
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              title="Reload preview"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {currentHtml && (
            <button
              onClick={handleDownload}
              title="Download HTML package"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {currentHtml && (
            <button
              onClick={handleOpenNewTab}
              title="Open prototype in full browser tab"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen Canvas'}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-rose-500" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div className="flex-1 overflow-auto relative flex items-center justify-center p-3 md:p-6 bg-[var(--background)] cv-blueprint-grid select-none">
        {/* Device Frame Viewport Container */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
          className={`transition-all duration-300 relative flex flex-col shadow-2xl ${
            device === 'desktop'
              ? 'w-full h-full max-w-6xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden'
              : device === 'tablet'
              ? 'w-[768px] h-[85vh] rounded-3xl border-8 border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl'
              : 'w-[375px] h-[82vh] rounded-[48px] border-[10px] border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl ring-1 ring-neutral-700/50'
          }`}
        >
          {/* Desktop Browser Bar Header */}
          {device === 'desktop' && (
            <div className="h-8 bg-[var(--surface-secondary)] border-b border-[var(--border)] px-3 flex items-center gap-2 shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex-1 max-w-sm mx-auto h-5 rounded-md bg-[var(--surface)] border border-[var(--border)] px-2 flex items-center justify-between text-[10px] text-[var(--muted-foreground)] font-mono">
                <span className="truncate flex items-center gap-1">
                  <span className="text-emerald-500 font-bold">https://</span>
                  <span>app.prototype.cretivra.internal</span>
                </span>
                <span className="text-[9px] text-[#06b6d4] font-bold">100% SECURE</span>
              </div>
            </div>
          )}

          {/* Mobile Dynamic Island Notch */}
          {device === 'mobile' && (
            <div className="h-7 bg-neutral-950 flex items-center justify-center shrink-0 relative z-30">
              <div className="w-24 h-4 rounded-full bg-black border border-neutral-800 flex items-center justify-between px-2">
                <span className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-800" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
              </div>
            </div>
          )}

          {/* Active Canvas Content */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-white flex flex-col">
            {/* 1. Exact Stitch AI Building Animation Screen */}
            {isGenerating ? (
              <div className="absolute inset-0 z-30 flex flex-col bg-[#080d1a] overflow-hidden">
                {/* Horizontal Photonic Laser Scanning Beam */}
                <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4,0_0_40px_#8b5cf6] animate-stitch-laser z-40 pointer-events-none opacity-90" />

                {/* Laser Trailing Aura Sweep */}
                <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent animate-stitch-laser z-30 pointer-events-none" />

                {/* Blueprint Skeleton Wireframe Components Assembly */}
                <div className="flex-1 p-6 md:p-8 space-y-6 overflow-hidden select-none opacity-85">
                  {/* Phase 1: Header Skeleton */}
                  <div className="h-14 rounded-xl border border-dashed border-cyan-500/40 bg-slate-900/40 px-4 flex items-center justify-between cv-wireframe-box">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 animate-pulse">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="w-28 h-4 rounded cv-skeleton-shimmer" />
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="w-14 h-3 rounded cv-skeleton-shimmer" />
                      <div className="w-14 h-3 rounded cv-skeleton-shimmer" />
                      <div className="w-14 h-3 rounded cv-skeleton-shimmer" />
                    </div>
                    <div className="w-20 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 animate-pulse" />
                  </div>

                  {/* Phase 2: Hero Section Skeleton */}
                  <div className="py-6 px-4 rounded-2xl border border-dashed border-cyan-500/30 bg-slate-900/30 space-y-4 cv-wireframe-box">
                    <div className="w-36 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30" />
                    <div className="w-3/4 h-8 rounded-lg cv-skeleton-shimmer" />
                    <div className="w-1/2 h-4 rounded cv-skeleton-shimmer" />
                    <div className="flex gap-3 pt-2">
                      <div className="w-32 h-9 rounded-xl bg-gradient-to-r from-cyan-500/40 to-teal-400/40 border border-cyan-400/50 shadow-md shadow-cyan-500/20 animate-pulse" />
                      <div className="w-28 h-9 rounded-xl border border-slate-700 bg-slate-800/40" />
                    </div>
                  </div>

                  {/* Phase 3: Metrics & Grid Cards Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((cardId) => (
                      <div
                        key={cardId}
                        className="p-4 rounded-xl border border-dashed border-cyan-500/30 bg-slate-900/40 space-y-3 cv-wireframe-box"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-16 h-3 rounded cv-skeleton-shimmer" />
                          <div className="w-6 h-6 rounded-md bg-cyan-500/20" />
                        </div>
                        <div className="w-24 h-6 rounded-md cv-skeleton-shimmer" />
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="w-2/3 h-full bg-cyan-400/50 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Phase 4: Form & Controls Wireframe */}
                  <div className="h-28 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-4 space-y-3">
                    <div className="w-48 h-4 rounded cv-skeleton-shimmer" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-8 rounded-lg border border-slate-800 bg-slate-950/60" />
                      <div className="h-8 rounded-lg border border-slate-800 bg-slate-950/60" />
                    </div>
                  </div>
                </div>

                {/* Floating Bottom Live AST Code Stream */}
                <div className="absolute bottom-16 left-6 right-6 flex items-end justify-between gap-4 pointer-events-none z-40">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md shadow-2xl max-w-md font-mono text-xs">
                    <div className="flex items-center gap-2 mb-1 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>AST Code Synthesis Stream</span>
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono truncate">
                      {CODE_STREAM_SNIPPETS[streamIndex]}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Compiled tokens: {tokenCounter.toLocaleString()}</span>
                      <span className="text-emerald-400">Reactive Engine Active</span>
                    </div>
                  </div>
                </div>

                {/* Floating Central Phase HUD Indicator */}
                <div className="absolute top-8 inset-x-0 mx-auto max-w-md px-4 z-40 pointer-events-none">
                  <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 backdrop-blur-xl shadow-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                          {activePhaseInfo.step}
                        </div>
                        <span className="text-xs font-bold text-white tracking-tight">
                          {activePhaseInfo.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                        Phase {activePhaseInfo.step} of 5
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-tight">
                      {activePhaseInfo.desc}
                    </p>

                    {/* Animated Iridescent Gradient Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                      <div
                        style={{ width: `${(animPhase / 5) * 100}%` }}
                        className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 transition-all duration-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* 2. Live Application Iframe or Raw Code Tab */}
            {activeTab === 'preview' && currentHtml ? (
              <div className={`w-full h-full relative ${showMaterializeEffect ? 'animate-materialize' : ''}`}>
                <iframe
                  key={iframeKey}
                  title="Interactive Application Preview"
                  srcDoc={currentHtml}
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            ) : activeTab === 'code' && currentHtml ? (
              <div className="w-full h-full overflow-auto p-4 font-mono text-xs text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-950 selection:bg-cyan-500/30">
                <pre>{currentHtml}</pre>
              </div>
            ) : !isGenerating && !currentHtml ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--muted-foreground)] gap-3 bg-[var(--surface)]">
                <Cpu className="w-12 h-12 stroke-[1] text-[#06b6d4]/60 animate-pulse" />
                <div>
                  <h4 className="font-semibold text-sm text-[var(--foreground)]">No Application Synthesized Yet</h4>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-xs mt-1">
                    Enter a prompt below to launch autonomous UI synthesis with live responsive preview.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Interactive Prompt Refinement Bar at Bottom of Canvas */}
      <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shrink-0 z-20">
        <form onSubmit={handleRefineSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative flex items-center">
            <Sparkles className="w-4 h-4 text-[#06b6d4] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="Describe UI refinements (e.g. 'Add dark sidebar with analytics', 'Change theme to Modern Cyan')..."
              disabled={isRefining || isBuilding}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-xs focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4]/30 transition-all disabled:opacity-40"
            />
          </div>

          <button
            type="submit"
            disabled={!refinePrompt.trim() || isRefining || isBuilding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 font-semibold text-xs transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Refining...</span>
              </>
            ) : (
              <>
                <span>Refine UI</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
