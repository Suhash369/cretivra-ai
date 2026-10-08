import React, { useRef } from 'react';
import {
  FileCode2,
  Presentation,
  UploadCloud,
  ChevronRight,
  ArrowRight,
  Layers,
  Sparkles,
  Gamepad2,
  Code2,
  Globe2,
  Users,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import { GoalComposer } from '../composer/GoalComposer';
import type { Attachment, CretivraModel } from '../../types';

interface HomeWorkspaceProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (promptOverride?: string) => void;
  isGenerating: boolean;
  onStop: () => void;
  attachments: Attachment[];
  onUploadFile: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  deepThinkEnabled: boolean;
  onToggleDeepThink: () => void;
  imageModeEnabled?: boolean;
  onToggleImageMode?: () => void;
  onOpenImageStudio?: () => void;
  selectedModel: string;
  availableModels: CretivraModel[];
  onSelectModel: (id: string) => void;
  onOpenModelSelector?: () => void;
  // Creative modalities triggers
  onOpenSketch?: () => void;
  onOpenLibrary?: () => void;
  onOpenSlides?: () => void;
  onOpenWebsite?: () => void;
  onOpenGame?: () => void;
  onOpenVoiceMode?: () => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
}

const TEMPLATE_EXAMPLES = [
  {
    tag: 'Website',
    title: 'SaaS Analytics Dashboard',
    caption: 'Synthesize a responsive web app with Stitch UI',
    prompt: 'Build a modern responsive SaaS analytics dashboard with revenue metrics and charts using Stitch UI.',
    icon: FileCode2,
    bgGradient: 'from-cyan-500/10 to-teal-500/5',
  },
  {
    tag: 'Slides',
    title: 'Executive Pitch Deck',
    caption: '10-slide executive presentation with python-pptx',
    prompt: 'Create a 10-slide executive presentation on autonomous AI agents architecture and roadmap.',
    icon: Presentation,
    bgGradient: 'from-amber-500/10 to-orange-500/5',
  },
  {
    tag: 'Research',
    title: 'Market Intelligence 2026',
    caption: 'Analyze frontier AI & cloud trends in 2026',
    prompt: 'Research global enterprise AI market trends in 2026 and synthesize a structured analysis.',
    icon: Globe2,
    bgGradient: 'from-blue-500/10 to-indigo-500/5',
  },
  {
    tag: 'Code',
    title: 'FastAPI Microservice',
    caption: 'High-performance Python service with asyncio',
    prompt: 'Write a high-performance Python FastAPI service with asyncio, connection pooling, and error handling.',
    icon: Code2,
    bgGradient: 'from-emerald-500/10 to-teal-500/5',
  },
  {
    tag: 'Game',
    title: 'Retro Arcade Game',
    caption: 'Interactive playable HTML5 canvas game',
    prompt: 'Create a playable HTML5 canvas retro space arcade shooter game with scoring and particle effects.',
    icon: Gamepad2,
    bgGradient: 'from-violet-500/10 to-fuchsia-500/5',
  },
  {
    tag: 'Image',
    title: 'Futuristic Architectural Art',
    caption: 'Photorealistic visual concept with FLUX.1 Art',
    prompt: 'A photorealistic architectural view of a sustainable futuristic research hub in neon dusk, 8k resolution.',
    icon: ImageIcon,
    bgGradient: 'from-rose-500/10 to-pink-500/5',
  },
  {
    tag: 'Research',
    title: 'B2B Customer Acquisition',
    caption: 'Identify enterprise customer ICP targets',
    prompt: 'Find potential B2B customer segments and enterprise ICP targets for autonomous AI platforms.',
    icon: Users,
    bgGradient: 'from-sky-500/10 to-cyan-500/5',
  },
];

export function HomeWorkspace({
  input,
  onInputChange,
  onSubmit,
  isGenerating,
  onStop,
  attachments,
  onUploadFile,
  onRemoveAttachment,
  webSearchEnabled,
  onToggleWebSearch,
  deepThinkEnabled,
  onToggleDeepThink,
  imageModeEnabled,
  onToggleImageMode,
  onOpenImageStudio,
  selectedModel,
  availableModels,
  onSelectModel,
  onOpenModelSelector,
  onOpenSketch,
  onOpenLibrary,
  onOpenSlides,
  onOpenWebsite,
  onOpenGame,
  onOpenVoiceMode,
  selectedProjectId,
  onSelectProject,
}: HomeWorkspaceProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  const handleScrollCarousel = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleSelectExample = (prompt: string) => {
    onInputChange(prompt);
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        onUploadFile(files[i]);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start min-h-full px-4 sm:px-6 py-10 sm:py-16 overflow-y-auto text-[var(--foreground)]">
      {/* Hidden file input for "Start from a local file" card */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        multiple
        onChange={handleLocalFileUpload}
        className="hidden"
      />

      <div className="w-full max-w-[900px] flex flex-col items-center">
        {/* 1. Vertically Centered Greeting Block (Section D) */}
        <div className="flex flex-col items-center text-center mb-7 animate-fade">
          {/* Logo Mark */}
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 shadow-2xs">
            <CretivraMark size={24} />
          </div>

          {/* Large Friendly Heading (clean sans, no serif tagline per Section D) */}
          <h1 className="text-2xl sm:text-[34px] font-semibold text-[var(--foreground)] tracking-tight leading-tight">
            What do you want Asura to accomplish?
          </h1>

          {/* Small muted sub-line */}
          <p className="text-sm text-[var(--muted-foreground)] mt-1.5 font-medium">
            Think beyond.
          </p>
        </div>

        {/* 2. Composer (Section E, centered ~900px max width) */}
        <div className="w-full mb-8">
          <GoalComposer
            input={input}
            onInputChange={onInputChange}
            onSubmit={() => onSubmit()}
            isGenerating={isGenerating}
            onStop={onStop}
            placeholder="Assign a task or type / for more"
            attachments={attachments}
            onUploadFile={onUploadFile}
            onRemoveAttachment={onRemoveAttachment}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={onToggleWebSearch}
            deepThinkEnabled={deepThinkEnabled}
            onToggleDeepThink={onToggleDeepThink}
            imageModeEnabled={imageModeEnabled}
            onToggleImageMode={onToggleImageMode}
            onOpenImageStudio={onOpenImageStudio}
            selectedModel={selectedModel}
            availableModels={availableModels}
            onSelectModel={onSelectModel}
            onOpenModelSelector={onOpenModelSelector}
            onOpenSketch={onOpenSketch}
            onOpenLibrary={onOpenLibrary}
            onOpenSlides={onOpenSlides}
            onOpenWebsite={onOpenWebsite}
            onOpenGame={onOpenGame}
            onOpenVoiceMode={onOpenVoiceMode}
            selectedProjectId={selectedProjectId}
            onSelectProject={onSelectProject}
          />
        </div>

        {/* 3. Row of 3 Large Category Cards in a Grid (Section D) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
          {/* Card 1: "Build" -> "Websites, apps, and games" */}
          <button
            type="button"
            onClick={() => {
              if (onOpenWebsite) onOpenWebsite();
              else onInputChange('Build a responsive web application with interactive UI');
            }}
            className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-200 text-left shadow-2xs group cursor-pointer hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                <span>Build</span>
                <ChevronRight size={13} className="text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Websites, apps, and games
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <FileCode2 size={18} />
            </div>
          </button>

          {/* Card 2: "Create" -> "Slides, images, and documents" */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSlides) onOpenSlides();
              else onInputChange('Create an executive slide deck presentation');
            }}
            className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-200 text-left shadow-2xs group cursor-pointer hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                <span>Create</span>
                <ChevronRight size={13} className="text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Slides, images, and documents
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Presentation size={18} />
            </div>
          </button>

          {/* Card 3: "Start from a local file" -> "Open files for analysis" */}
          <button
            type="button"
            onClick={() => hiddenFileInputRef.current?.click()}
            className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-200 text-left shadow-2xs group cursor-pointer hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                <span>Start from a local file</span>
                <ChevronRight size={13} className="text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Open files for analysis
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <UploadCloud size={18} />
            </div>
          </button>
        </div>

        {/* 4. Horizontally Scrollable "Templates / Examples" Carousel (Section D) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Templates & Examples
            </span>
            <button
              type="button"
              onClick={handleScrollCarousel}
              className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Scroll carousel"
              aria-label="Next templates"
            >
              <ArrowRight size={15} />
            </button>
          </div>

          <div
            ref={carouselRef}
            className="flex items-center gap-3.5 overflow-x-auto pb-4 scrollbar-none scroll-smooth snap-x"
          >
            {TEMPLATE_EXAMPLES.map((ex, idx) => {
              const Icon = ex.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectExample(ex.prompt)}
                  className="w-64 sm:w-72 shrink-0 p-4 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-1 snap-start group flex flex-col justify-between h-36"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--surface-secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
                      {ex.tag}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)] group-hover:text-cyan-500 flex items-center justify-center transition-colors">
                      <Icon size={14} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[var(--foreground)] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {ex.title}
                    </h3>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-2 leading-relaxed">
                      {ex.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
