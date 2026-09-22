import React, { useRef, useEffect, useState } from 'react';
import {
  Paperclip,
  Globe,
  Brain,
  Image as ImageIcon,
  ArrowUp,
  Square,
  X,
  FileText,
  ChevronDown,
  Sparkles,
  Plus,
} from 'lucide-react';
import { ActionMenu } from '../chat/ActionMenu';
import type { Attachment, CretivraModel } from '../../types';

interface GoalComposerProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  isGenerating?: boolean;
  onStop?: () => void;
  placeholder?: string;
  // Attachments
  attachments: Attachment[];
  onUploadFile: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  // Modes & Toggles
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  deepThinkEnabled: boolean;
  onToggleDeepThink: () => void;
  onOpenImageStudio?: () => void;
  // Creative Modals
  onOpenSketch?: () => void;
  onOpenLibrary?: () => void;
  onOpenSlides?: () => void;
  onOpenWebsite?: () => void;
  onOpenGame?: () => void;
  // Models
  selectedModel: string;
  availableModels: CretivraModel[];
  onSelectModel: (id: string) => void;
  onOpenModelSelector?: () => void;
}

export function GoalComposer({
  input,
  onInputChange,
  onSubmit,
  isGenerating = false,
  onStop,
  placeholder = 'What do you want Asura to accomplish?',
  attachments,
  onUploadFile,
  onRemoveAttachment,
  webSearchEnabled,
  onToggleWebSearch,
  deepThinkEnabled,
  onToggleDeepThink,
  onOpenImageStudio,
  onOpenSketch,
  onOpenLibrary,
  onOpenSlides,
  onOpenWebsite,
  onOpenGame,
  selectedModel,
  availableModels,
  onSelectModel,
  onOpenModelSelector,
}: GoalComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const newHeight = Math.min(Math.max(el.scrollHeight, 56), 240);
      el.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && (input.trim() || attachments.length > 0)) {
        onSubmit();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        onUploadFile(files[i]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentModelObj = availableModels.find((m) => m.id === selectedModel);
  const modelName = currentModelObj?.display_name || 'Cretivra 1';

  return (
    <div
      className={`relative w-full max-w-[840px] mx-auto rounded-2xl bg-[var(--surface)] border transition-all duration-200 shadow-xl ${
        isFocused
          ? 'border-cyan-500/60 shadow-[0_0_24px_rgba(6,182,212,0.12)]'
          : 'border-[var(--border)] hover:border-cyan-500/30'
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. Attachment Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pb-0">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] animate-scale"
            >
              <FileText size={13} className="text-cyan-500" />
              <span className="truncate max-w-[180px] font-medium">{att.filename}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {(att.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                className="p-0.5 rounded text-[var(--muted-foreground)] hover:text-rose-500 transition-colors"
                title="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. Textarea */}
      <div className="px-4 pt-3.5 pb-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-[15px] leading-relaxed resize-none focus:outline-none"
        />
      </div>

      {/* 3. Toolbar Controls */}
      <div className="flex items-center justify-between px-3.5 pb-3 pt-1">
        {/* Left: Tools, ActionMenu (+) & Attachments */}
        <div className="flex items-center gap-1.5 flex-wrap relative">
          {/* Action Menu Trigger (+) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionMenuOpen((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-colors asura-btn-interactive ${
                actionMenuOpen
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-500'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-cyan-500/40'
              }`}
              title="Add tools & creative actions (Presentation, Sketch, Web, Files)"
            >
              <Plus size={16} />
            </button>

            {/* Action Menu Dropdown */}
            <ActionMenu
              isOpen={actionMenuOpen}
              onClose={() => setActionMenuOpen(false)}
              onUploadFile={() => {
                fileInputRef.current?.click();
                setActionMenuOpen(false);
              }}
              onOpenLibrary={() => {
                if (onOpenLibrary) onOpenLibrary();
                setActionMenuOpen(false);
              }}
              onOpenImageStudio={() => {
                if (onOpenImageStudio) onOpenImageStudio();
                setActionMenuOpen(false);
              }}
              onToggleWebSearch={onToggleWebSearch}
              webSearchActive={webSearchEnabled}
              onToggleDeepThink={onToggleDeepThink}
              deepThinkActive={deepThinkEnabled}
              onCreatePresentation={() => {
                if (onOpenSlides) {
                  onOpenSlides();
                } else {
                  onInputChange('Create a 10-slide executive presentation on ');
                  textareaRef.current?.focus();
                }
                setActionMenuOpen(false);
              }}
              onCreatePdf={() => {
                onInputChange('Generate a publication-grade PDF intelligence report on ');
                textareaRef.current?.focus();
                setActionMenuOpen(false);
              }}
              onOpenSketch={() => {
                if (onOpenSketch) onOpenSketch();
                setActionMenuOpen(false);
              }}
              onVisualizeData={() => {
                onInputChange('Create an interactive chart and structured data visualization for ');
                textareaRef.current?.focus();
                setActionMenuOpen(false);
              }}
              onOpenGitHub={() => {
                onInputChange('Analyze GitHub repository architecture and summarize recent codebase changes.');
                textareaRef.current?.focus();
                setActionMenuOpen(false);
              }}
              onOpenPlayground={() => {
                if (onOpenWebsite) {
                  onOpenWebsite();
                } else {
                  onInputChange('Build a modern responsive web app for ');
                  textareaRef.current?.focus();
                }
                setActionMenuOpen(false);
              }}
            />
          </div>

          {/* Attach file */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors asura-btn-interactive"
            title="Attach documents or data (PDF, DOCX, CSV, Images)"
          >
            <Paperclip size={16} />
          </button>

          {/* Web Search Toggle */}
          <button
            type="button"
            onClick={onToggleWebSearch}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all asura-btn-interactive ${
              webSearchEnabled
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400'
                : 'bg-[var(--surface-secondary)] border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
            }`}
            title={webSearchEnabled ? 'Web search enabled' : 'Toggle live Web search'}
          >
            <Globe size={13} />
            <span>Web</span>
          </button>

          {/* Reasoning / Deep Research Toggle */}
          <button
            type="button"
            onClick={onToggleDeepThink}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all asura-btn-interactive ${
              deepThinkEnabled
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400'
                : 'bg-[var(--surface-secondary)] border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
            }`}
            title={deepThinkEnabled ? 'Deep reasoning active' : 'Toggle deep reasoning'}
          >
            <Brain size={13} />
            <span>Reason</span>
          </button>

          {/* Image Studio shortcut */}
          {onOpenImageStudio && (
            <button
              type="button"
              onClick={onOpenImageStudio}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-transparent bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)] transition-all asura-btn-interactive"
              title="Open Image Studio"
            >
              <ImageIcon size={13} />
              <span>Image</span>
            </button>
          )}
        </div>

        {/* Right: Model badge + Send / Stop button */}
        <div className="flex items-center gap-2">
          {/* Model Selector Trigger */}
          {onOpenModelSelector && (
            <button
              type="button"
              onClick={onOpenModelSelector}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium hover:border-cyan-500/50 transition-colors asura-btn-interactive"
              title="Switch Neural Engine Model"
            >
              <span className="truncate max-w-[110px]">{modelName}</span>
              <ChevronDown size={11} className="text-[var(--muted-foreground)]" />
            </button>
          )}

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 transition-all asura-btn-interactive shadow-md"
              title="Stop execution"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!input.trim() && attachments.length === 0}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all asura-btn-interactive shadow-md ${
                input.trim() || attachments.length > 0
                  ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] opacity-40 border border-[var(--border)] cursor-not-allowed'
              }`}
              title="Execute goal"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
