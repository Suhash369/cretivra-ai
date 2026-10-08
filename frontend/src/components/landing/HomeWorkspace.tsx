import React, { useState, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import { GoalComposer } from '../composer/GoalComposer';
import { BentoGrid } from './bento/BentoGrid';
import { TemplatesCarousel } from './bento/TemplatesCarousel';
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
  const [composerPulsing, setComposerPulsing] = useState(false);
  const [showPrefillToast, setShowPrefillToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerComposerPulse = () => {
    setComposerPulsing(true);
    setTimeout(() => setComposerPulsing(false), 600);
  };

  const triggerPrefillToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setShowPrefillToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowPrefillToast(false);
    }, 2200);
  };

  const handleSelectPromptQuickly = (promptText: string) => {
    triggerComposerPulse();
    triggerPrefillToast();

    // Fast-type transition (~300ms) with zero auto-scrolling
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
    }

    const totalLen = promptText.length;
    const chunk = Math.max(2, Math.floor(totalLen / 10));
    let progress = 0;

    typeIntervalRef.current = setInterval(() => {
      progress += chunk;
      if (progress >= totalLen) {
        onInputChange(promptText);
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      } else {
        onInputChange(promptText.slice(0, progress));
      }
    }, 30);
  };

  return (
    <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden text-[var(--foreground)]">
      {/* 1. SCROLL AREA (absolute inset-0, overflow-y-auto, centered, max-w ~1100px, px-6) */}
      <div className="absolute inset-0 overflow-y-auto px-4 sm:px-6">
        <div className="w-full max-w-[1100px] mx-auto pt-6 pb-[200px] flex flex-col items-center">
          {/* Compact header at the very top: small logo, 28-32px heading, muted Think beyond */}
          <div className="flex flex-col items-center text-center mb-5 animate-fade select-none shrink-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2.5 shadow-2xs">
              <CretivraMark size={18} />
            </div>
            <h1 className="text-2xl sm:text-[30px] font-semibold text-[var(--foreground)] tracking-tight leading-tight">
              What do you want Asura to accomplish?
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 font-medium">
              Think beyond.
            </p>
          </div>

          {/* BENTO GRID directly below header (mt ~20px) */}
          <BentoGrid
            onSelectPrompt={handleSelectPromptQuickly}
            onUploadFile={onUploadFile}
            onOpenWebsite={onOpenWebsite}
            onOpenSlides={onOpenSlides}
            onOpenGame={onOpenGame}
            onOpenImageStudio={onOpenImageStudio}
            triggerComposerPulse={triggerComposerPulse}
          />

          {/* TEMPLATES & EXAMPLES carousel below the grid */}
          <TemplatesCarousel
            onSelectPrompt={handleSelectPromptQuickly}
            triggerComposerPulse={triggerComposerPulse}
          />
        </div>
      </div>

      {/* Soft fade gradient behind composer (h-24, page background to transparent, pointer-events-none) */}
      <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none z-10 bg-gradient-to-t from-[var(--background)] to-transparent" />

      {/* 2. FLOATING GLASS COMPOSER (absolute bottom-4, centered, max-w ~1100px, z-20, inside main area) */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center px-3 sm:px-6 pointer-events-none">
        <div className="w-full max-w-[1100px] pointer-events-auto relative">
          {/* Prefill Toast above composer */}
          {showPrefillToast && (
            <div
              role="status"
              aria-live="polite"
              className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-toast-slide"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-secondary)]/95 backdrop-blur-md border border-cyan-500/40 text-xs text-[var(--foreground)] font-medium shadow-md">
                <span>Prompt added below</span>
                <ArrowDown size={12} className="text-cyan-500 animate-bounce motion-reduce:animate-none" />
              </div>
            </div>
          )}

          {/* Composer with Pulse Ring */}
          <div
            className={`w-full rounded-3xl transition-all duration-300 ${
              composerPulsing ? 'animate-composer-pulse ring-2 ring-cyan-500/60' : ''
            }`}
          >
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
        </div>
      </div>
    </div>
  );
}
