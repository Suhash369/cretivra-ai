import React from 'react';
import {
  Search,
  Globe2,
  FileCode2,
  PieChart,
  Presentation,
  Users,
  Code2,
  Sparkles,
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
  onOpenImageStudio?: () => void;
  selectedModel: string;
  availableModels: CretivraModel[];
  onSelectModel: (id: string) => void;
  onOpenModelSelector?: () => void;
}

const SUGGESTIONS = [
  {
    label: 'Research a market',
    icon: Globe2,
    prompt: 'Research the AI market trends in 2026 and synthesize a structured analysis.',
  },
  {
    label: 'Build a website',
    icon: FileCode2,
    prompt: 'Build a modern responsive landing page for an AI robotics company.',
  },
  {
    label: 'Analyze a document',
    icon: PieChart,
    prompt: 'Analyze the attached data and extract key statistical insights and takeaways.',
  },
  {
    label: 'Create a presentation',
    icon: Presentation,
    prompt: 'Create a 10-slide executive presentation on autonomous AI agents architecture.',
  },
  {
    label: 'Find customers',
    icon: Users,
    prompt: 'Find potential B2B customers and enterprise ICP targets for cloud AI solutions.',
  },
  {
    label: 'Write code',
    icon: Code2,
    prompt: 'Write a high-performance Python FastAPI service with asyncio and connection pooling.',
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
  onOpenImageStudio,
  selectedModel,
  availableModels,
  onSelectModel,
  onOpenModelSelector,
}: HomeWorkspaceProps) {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-full px-4 py-8 overflow-y-auto z-10">
      {/* Subtle Ambient Gradient Orbs (Part 49) */}
      <div
        className="asura-ambient-orb w-[460px] h-[460px] bg-[#06B6D4] top-[-100px] left-[20%]"
        aria-hidden="true"
      />
      <div
        className="asura-ambient-orb w-[520px] h-[520px] bg-[#8B5CF6] bottom-[-120px] right-[18%]"
        aria-hidden="true"
      />

      {/* Centered Command Center Container */}
      <div className="w-full max-w-[860px] flex flex-col items-center text-center">
        {/* 1. Logo (Stagger 1: 0ms) */}
        <div
          className="mb-4 flex items-center justify-center w-12 h-12 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] shadow-sm animate-enter"
          style={{ animationDelay: '0ms' }}
        >
          <CretivraMark size={26} />
        </div>

        {/* 2. Hero Typography (Stagger 2: 80ms) */}
        <div
          className="mb-2 space-y-1 animate-enter"
          style={{ animationDelay: '80ms' }}
        >
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#E7EAF4] tracking-tight">
            ASURA
          </h1>
          <p className="text-xl sm:text-2xl font-manus-serif italic text-[#8891A8] font-normal">
            Think beyond.
          </p>
        </div>

        {/* 3. Primary Prompt Lead (Stagger 3: 160ms) */}
        <div
          className="mb-6 animate-enter"
          style={{ animationDelay: '160ms' }}
        >
          <p className="text-sm sm:text-[15px] text-[#8891A8] font-medium">
            What do you want Asura to accomplish?
          </p>
        </div>

        {/* 4. Large Floating Composer (Stagger 4: 240ms) */}
        <div
          className="w-full mb-6 animate-enter"
          style={{ animationDelay: '240ms' }}
        >
          <GoalComposer
            input={input}
            onInputChange={onInputChange}
            onSubmit={() => onSubmit()}
            isGenerating={isGenerating}
            onStop={onStop}
            placeholder="Tell Asura what you want done..."
            attachments={attachments}
            onUploadFile={onUploadFile}
            onRemoveAttachment={onRemoveAttachment}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={onToggleWebSearch}
            deepThinkEnabled={deepThinkEnabled}
            onToggleDeepThink={onToggleDeepThink}
            onOpenImageStudio={onOpenImageStudio}
            selectedModel={selectedModel}
            availableModels={availableModels}
            onSelectModel={onSelectModel}
            onOpenModelSelector={onOpenModelSelector}
          />
        </div>

        {/* 5. Lightweight Suggestion Pills (Stagger 5: 320ms) */}
        <div
          className="w-full flex flex-wrap items-center justify-center gap-2 animate-enter"
          style={{ animationDelay: '320ms' }}
        >
          {SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  onInputChange(item.prompt);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151C2E]/70 border border-[#232D45] text-xs text-[#8891A8] hover:text-[#E7EAF4] hover:border-[#06B6D4]/50 hover:bg-[#151C2E] transition-all asura-btn-interactive group shadow-xs"
                title={item.prompt}
              >
                <Icon size={12} className="text-[#8891A8] group-hover:text-[#06B6D4] transition-colors" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
