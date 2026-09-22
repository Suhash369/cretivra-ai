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
} from 'lucide-react';
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
  selectedModel,
  availableModels,
  onSelectModel,
  onOpenModelSelector,
}: GoalComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

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
  const modelName = currentModelObj?.display_name || 'Cretivra 1.1';

  return (
    <div
      className={`relative w-full max-w-[840px] mx-auto rounded-2xl bg-[#0D121F] border transition-all duration-200 shadow-xl ${
        isFocused
          ? 'border-[#06B6D4]/50 shadow-[0_0_24px_rgba(6,182,212,0.08)]'
          : 'border-[#232D45] hover:border-[#232D45]/90'
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151C2E] border border-[#232D45] text-xs text-[#E7EAF4] animate-scale"
            >
              <FileText size={13} className="text-[#06B6D4]" />
              <span className="truncate max-w-[180px] font-medium">{att.filename}</span>
              <span className="text-[10px] text-[#8891A8]">
                {(att.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => onRemoveAttachment(att.id)}
                className="p-0.5 rounded text-[#8891A8] hover:text-[#F43F5E]"
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
          className="w-full bg-transparent text-[#E7EAF4] placeholder-[#8891A8]/70 text-[15px] leading-relaxed resize-none focus:outline-none"
        />
      </div>

      {/* 3. Toolbar Controls */}
      <div className="flex items-center justify-between px-3.5 pb-3 pt-1">
        {/* Left: Tools & Attachments */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Attach file */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors asura-btn-interactive"
            title="Attach documents or data (PDF, DOCX, CSV)"
          >
            <Paperclip size={16} />
          </button>

          {/* Web Search Toggle */}
          <button
            type="button"
            onClick={onToggleWebSearch}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all asura-btn-interactive ${
              webSearchEnabled
                ? 'bg-[#06B6D4]/15 border-[#06B6D4]/40 text-[#06B6D4]'
                : 'bg-[#151C2E]/60 border-transparent text-[#8891A8] hover:text-[#E7EAF4] hover:border-[#232D45]'
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
                ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#8B5CF6]'
                : 'bg-[#151C2E]/60 border-transparent text-[#8891A8] hover:text-[#E7EAF4] hover:border-[#232D45]'
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-transparent bg-[#151C2E]/60 text-[#8891A8] hover:text-[#E7EAF4] hover:border-[#232D45] transition-all asura-btn-interactive"
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#E7EAF4] text-xs font-medium hover:border-[#06B6D4]/40 transition-colors asura-btn-interactive"
              title="Select Cretivra model"
            >
              <span className="truncate max-w-[110px]">{modelName}</span>
              <ChevronDown size={11} className="text-[#8891A8]" />
            </button>
          )}

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="w-8 h-8 rounded-xl bg-[#F43F5E] text-white flex items-center justify-center hover:bg-[#F43F5E]/90 transition-all asura-btn-interactive shadow-md"
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
                  ? 'bg-[#06B6D4] text-[#060911] hover:bg-[#06B6D4]/90 cursor-pointer'
                  : 'bg-[#151C2E] text-[#8891A8]/50 border border-[#232D45] cursor-not-allowed'
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
