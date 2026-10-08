import React, { useState, useRef } from 'react';
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
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerComposerPulse = () => {
    setComposerPulsing(true);
    setTimeout(() => setComposerPulsing(false), 600);
  };

  const handleSelectPromptQuickly = (promptText: string) => {
    triggerComposerPulse();

    // Fast-type transition (~200ms)
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
    }

    const totalLen = promptText.length;
    const chunk = Math.max(2, Math.floor(totalLen / 7));
    let progress = 0;

    typeIntervalRef.current = setInterval(() => {
      progress += chunk;
      if (progress >= totalLen) {
        onInputChange(promptText);
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      } else {
        onInputChange(promptText.slice(0, progress));
      }
    }, 25);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start min-h-full px-4 sm:px-6 py-8 sm:py-14 overflow-y-auto text-[var(--foreground)]">
      <div className="w-full max-w-[1100px] flex flex-col items-center">
        {/* 1. Vertically Centered Greeting Block (Section D) */}
        <div className="flex flex-col items-center text-center mb-7 animate-fade select-none">
          {/* Logo Mark */}
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 shadow-2xs">
            <CretivraMark size={24} />
          </div>

          {/* Large Friendly Heading (clean sans) */}
          <h1 className="text-2xl sm:text-[34px] font-semibold text-[var(--foreground)] tracking-tight leading-tight">
            What do you want Asura to accomplish?
          </h1>

          {/* Small muted sub-line */}
          <p className="text-sm text-[var(--muted-foreground)] mt-1.5 font-medium">
            Think beyond.
          </p>
        </div>

        {/* 2. Composer (Section E, matching max-width ~1100px) */}
        <div
          className={`w-full mb-8 rounded-3xl transition-all duration-300 ${
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

        {/* 3. Unique Animated 4-Card Bento Grid (Replaces old category cards) */}
        <BentoGrid
          onSelectPrompt={handleSelectPromptQuickly}
          onUploadFile={onUploadFile}
          onOpenWebsite={onOpenWebsite}
          onOpenSlides={onOpenSlides}
          onOpenGame={onOpenGame}
          onOpenImageStudio={onOpenImageStudio}
          triggerComposerPulse={triggerComposerPulse}
        />

        {/* 4. Enhanced Templates & Examples Carousel */}
        <TemplatesCarousel
          onSelectPrompt={handleSelectPromptQuickly}
          triggerComposerPulse={triggerComposerPulse}
        />
      </div>
    </div>
  );
}
