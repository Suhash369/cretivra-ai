import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  Headphones,
  Mic,
  MicOff,
  Eye,
  SlidersHorizontal,
  Cloud,
  Box,
  FolderGit2,
  Presentation,
  FileCode2,
  Gamepad2,
  Code2,
  Search,
  Check,
  Folder,
} from 'lucide-react';
import { ActionMenu } from '../chat/ActionMenu';
import { listProjectsApi } from '../../services/playgroundApi';
import { transcribeAudioApi } from '../../services/api';
import type { Attachment, CretivraModel } from '../../types';

interface GoalComposerProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  isGenerating?: boolean;
  onStop?: () => void;
  placeholder?: string;
  // Visual Mode
  visualMode?: 'auto' | 'visual' | 'normal';
  onToggleVisualMode?: (mode: 'auto' | 'visual' | 'normal') => void;
  // Attachments
  attachments: Attachment[];
  onUploadFile: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  // Modes & Toggles
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  deepThinkEnabled: boolean;
  onToggleDeepThink: () => void;
  imageModeEnabled?: boolean;
  onToggleImageMode?: () => void;
  onOpenImageStudio?: () => void;
  // Creative Modals
  onOpenSketch?: () => void;
  onOpenLibrary?: () => void;
  onOpenSlides?: () => void;
  onOpenWebsite?: () => void;
  onOpenGame?: () => void;
  onOpenVoiceMode?: () => void;
  // Models
  selectedModel: string;
  availableModels: CretivraModel[];
  onSelectModel: (id: string) => void;
  onOpenModelSelector?: () => void;
  // Compact Chat Variant
  compact?: boolean;
  // Project scoping
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
}

export function GoalComposer({
  input,
  onInputChange,
  onSubmit,
  isGenerating = false,
  onStop,
  placeholder = 'Assign a task or type / for more',
  compact = false,
  visualMode = 'auto',
  onToggleVisualMode,
  attachments,
  onUploadFile,
  onRemoveAttachment,
  webSearchEnabled,
  onToggleWebSearch,
  deepThinkEnabled,
  onToggleDeepThink,
  imageModeEnabled = false,
  onToggleImageMode,
  onOpenImageStudio,
  onOpenSketch,
  onOpenLibrary,
  onOpenSlides,
  onOpenWebsite,
  onOpenGame,
  onOpenVoiceMode,
  selectedModel,
  availableModels,
  onSelectModel,
  onOpenModelSelector,
  selectedProjectId,
  onSelectProject,
}: GoalComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [environmentMode, setEnvironmentMode] = useState<'Cloud' | 'Sandbox'>('Cloud');
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea (min 56px in compact, auto-grows to 200px then scrolls)
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const minH = compact ? 56 : 48;
      const maxH = 200;
      const newHeight = Math.min(Math.max(el.scrollHeight, minH), maxH);
      el.style.height = `${newHeight}px`;
      el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
    }
  }, [input, compact]);

  // Fetch projects for project picker
  useEffect(() => {
    listProjectsApi()
      .then((data) => {
        if (Array.isArray(data)) setProjectsList(data);
      })
      .catch(() => {});
  }, []);

  // Handle "/" slash commands
  const handleInputChange = (val: string) => {
    onInputChange(val);
    if (val.endsWith('/')) {
      setSlashMenuOpen(true);
    } else if (!val.includes('/')) {
      setSlashMenuOpen(false);
    }
  };

  const handleSelectSlashCommand = (cmd: { action: () => void }) => {
    setSlashMenuOpen(false);
    // Remove the trailing "/" from input
    if (input.endsWith('/')) {
      onInputChange(input.slice(0, -1));
    }
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMenuOpen && e.key === 'Escape') {
      setSlashMenuOpen(false);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && (input.trim() || attachments.length > 0)) {
        setSlashMenuOpen(false);
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

  // Mic dictation via STT
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const res = await transcribeAudioApi(blob);
          if (res.text) {
            onInputChange(input ? `${input} ${res.text}` : res.text);
          }
        } catch (err) {
          console.error('Transcription error:', err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const currentModelObj = availableModels.find((m) => m.id === selectedModel);
  const modelName = currentModelObj?.display_name || 'Cretivra 1.2';

  const selectedProjectName = projectsList.find((p) => p.id === selectedProjectId)?.name || 'Choose project';

  // Slash commands menu list (Section E)
  const slashCommands = [
    { label: 'Web search', icon: Globe, action: onToggleWebSearch, desc: 'Live web grounding & sources' },
    { label: 'Deep Think', icon: Brain, action: onToggleDeepThink, desc: 'Step-by-step reasoning' },
    { label: 'Image mode', icon: ImageIcon, action: onToggleImageMode || onOpenImageStudio || (() => {}), desc: 'Diffusion visual generation' },
    { label: 'Visual reasoning', icon: Eye, action: () => onToggleVisualMode && onToggleVisualMode(visualMode === 'visual' ? 'auto' : 'visual'), desc: 'Analyze screenshots & files' },
    { label: 'Website', icon: FileCode2, action: onOpenWebsite || (() => onInputChange('Build a responsive web application ')), desc: 'Stitch UI Synthesis' },
    { label: 'Slides', icon: Presentation, action: onOpenSlides || (() => onInputChange('Create an executive presentation ')), desc: 'PowerPoint slide deck' },
    { label: 'Game', icon: Gamepad2, action: onOpenGame || (() => onInputChange('Create a playable HTML5 canvas game ')), desc: 'Interactive canvas game' },
    { label: 'Research', icon: Search, action: () => onInputChange('Research in depth '), desc: 'Synthesize verified research report' },
    { label: 'Code', icon: Code2, action: () => onInputChange('Write a clean production service in Python '), desc: 'Write & test clean code' },
  ];

  return (
    <div
      className={`floating-glass-composer relative w-full ${compact ? 'max-w-[820px]' : 'max-w-[1100px]'} mx-auto select-text ${
        isFocused ? 'is-focused' : ''
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

      {/* Top Strip Inside Card: Environment Chip & Project Picker Chip (Section E: hidden in compact chat variant) */}
      {!compact && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-[var(--border)]/40 text-xs">
          {/* Environment chip ("Cloud" or "Sandbox") */}
          <button
            type="button"
            onClick={() => setEnvironmentMode((prev) => (prev === 'Cloud' ? 'Sandbox' : 'Cloud'))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-[11px] font-medium"
            title="Toggle execution environment"
          >
            {environmentMode === 'Cloud' ? <Cloud size={11} className="text-cyan-500" /> : <Box size={11} className="text-violet-500" />}
            <span>{environmentMode}</span>
          </button>

          {/* Project Picker chip ("Choose project") */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProjectPickerOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-[11px] font-medium"
              title="Scope task to a project sandbox"
            >
              <FolderGit2 size={11} className="text-cyan-500" />
              <span className="truncate max-w-[140px]">{selectedProjectName}</span>
              <ChevronDown size={10} className="text-[var(--muted-foreground)]" />
            </button>

            {projectPickerOpen && (
              <div className="absolute top-8 left-0 z-50 w-56 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-1.5 text-xs animate-scale">
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-[var(--muted-foreground)]">
                  Select Project Scope
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectProject) onSelectProject(null);
                    setProjectPickerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    !selectedProjectId ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--foreground)]'
                  }`}
                >
                  <span>No project (Global)</span>
                  {!selectedProjectId && <Check size={12} />}
                </button>
                {projectsList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (onSelectProject) onSelectProject(p.id);
                      setProjectPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer truncate ${
                      selectedProjectId === p.id ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--foreground)]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {selectedProjectId === p.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachment Chips (Section E: above textarea) */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-2.5 pb-0">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] animate-scale"
            >
              <FileText size={13} className="text-cyan-500" />
              <span className="truncate max-w-[180px] font-medium">{att.filename}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {(att.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                className="p-0.5 rounded text-[var(--muted-foreground)] hover:text-rose-500 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea Area (Near-solid layer at 0.96 so text behind is never legible) */}
      <div className={`px-4 pt-3 pb-2 relative composer-input-layer rounded-2xl ${compact ? 'min-h-[56px] flex flex-col justify-center' : ''}`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={1}
          className={`w-full bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-[14.5px] sm:text-[15px] leading-relaxed resize-none focus:outline-none ${
            compact ? 'min-h-[56px]' : 'min-h-[48px]'
          }`}
        />

        {/* "/" Command Menu Popup (Section E) */}
        {slashMenuOpen && (
          <div className="absolute left-4 bottom-12 z-50 w-72 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-1.5 animate-scale text-xs">
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Commands & Modalities
            </div>
            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {slashCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.label}
                    type="button"
                    onClick={() => handleSelectSlashCommand(cmd)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer group"
                  >
                    <Icon size={14} className="text-cyan-500 group-hover:scale-110 transition-transform shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs leading-none">{cmd.label}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] truncate mt-0.5">{cmd.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar Controls (Section E) */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        {/* Bottom-left: "+" button, tools/connectors icon button, active chips (Section E) */}
        <div className="flex items-center gap-1.5 flex-wrap relative">
          {/* "+" Button with Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionMenuOpen((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                actionMenuOpen
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-600 dark:text-cyan-400'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-cyan-500/40'
              }`}
              title="Add file, slides, sketch, or creative action"
              aria-label="Add action"
            >
              <Plus size={16} />
            </button>

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
            />
          </div>

          {/* Tools / Connectors icon button (Section E) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolsMenuOpen((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                toolsMenuOpen
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-600 dark:text-cyan-400'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
              title="Tool toggles (Web, Reason, Image, Vision)"
              aria-label="Tool toggles"
            >
              <SlidersHorizontal size={15} />
            </button>

            {toolsMenuOpen && (
              <div className="absolute left-0 bottom-10 z-50 w-52 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-1.5 text-xs animate-scale">
                <div className="px-2 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Engine Tools
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onToggleWebSearch();
                    setToolsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    webSearchEnabled ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--foreground)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe size={13} />
                    <span>Web Search Grounding</span>
                  </span>
                  {webSearchEnabled && <Check size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleDeepThink();
                    setToolsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    deepThinkEnabled ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--foreground)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Brain size={13} />
                    <span>Deep Think / Reason</span>
                  </span>
                  {deepThinkEnabled && <Check size={12} />}
                </button>
                {onToggleImageMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleImageMode();
                      setToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      imageModeEnabled ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--foreground)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ImageIcon size={13} />
                      <span>Image Mode (Diffusion)</span>
                    </span>
                    {imageModeEnabled && <Check size={12} />}
                  </button>
                )}
                {onToggleVisualMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleVisualMode(visualMode === 'visual' ? 'auto' : 'visual');
                      setToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      visualMode === 'visual' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold' : 'hover:bg-[var(--surface-hover)] text-[var(--foreground)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Eye size={13} />
                      <span>Visual Reasoning</span>
                    </span>
                    {visualMode === 'visual' && <Check size={12} />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick attach paperclip */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="Attach file (PDF, DOCX, CSV, Images)"
            aria-label="Attach file"
          >
            <Paperclip size={15} />
          </button>

          {/* Removable Active Tool Chips (Section E) */}
          {webSearchEnabled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <Globe size={11} />
              <span>Web</span>
              <button
                type="button"
                onClick={onToggleWebSearch}
                className="hover:text-cyan-800 dark:hover:text-cyan-200 cursor-pointer"
                title="Disable web search"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {deepThinkEnabled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <Brain size={11} />
              <span>Reason</span>
              <button
                type="button"
                onClick={onToggleDeepThink}
                className="hover:text-purple-800 dark:hover:text-purple-200 cursor-pointer"
                title="Disable reasoning"
              >
                <X size={10} />
              </button>
            </span>
          )}

          {imageModeEnabled && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              <ImageIcon size={11} />
              <span>Image</span>
              <button
                type="button"
                onClick={onToggleImageMode}
                className="hover:text-violet-800 dark:hover:text-violet-200 cursor-pointer"
                title="Disable image mode"
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>

        {/* Bottom-right: Model selector, Voice icon, Mic STT button, Circular Send button (Section E) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Compact Model Selector */}
          {onOpenModelSelector && (
            <button
              type="button"
              onClick={onOpenModelSelector}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] text-[11px] font-medium hover:border-cyan-500/50 transition-colors cursor-pointer"
              title="Switch model"
            >
              <span className="truncate max-w-[95px]">{modelName}</span>
              <ChevronDown size={11} className="text-[var(--muted-foreground)]" />
            </button>
          )}

          {/* Voice Studio icon (opens CretivraVoiceModal) */}
          {onOpenVoiceMode && (
            <button
              type="button"
              onClick={onOpenVoiceMode}
              className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-cyan-500/50 hover:text-cyan-500 text-[var(--muted-foreground)] flex items-center justify-center transition-all cursor-pointer"
              title="Talk to Asura (Voice Mode)"
              aria-label="Talk to Asura"
            >
              <Headphones size={14} />
            </button>
          )}

          {/* Microphone STT Dictation button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                : isTranscribing
                ? 'bg-cyan-500/20 text-cyan-500 border-cyan-500/40 animate-spin'
                : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-cyan-500/40'
            }`}
            title={isRecording ? 'Stop recording dictation' : 'Speech to text dictation'}
            aria-label={isRecording ? 'Stop dictation' : 'Start dictation'}
          >
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          {/* Circular Send / Stop button (Section E) */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 transition-all shadow-md cursor-pointer"
              title="Stop execution"
              aria-label="Stop execution"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!input.trim() && attachments.length === 0}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                input.trim() || attachments.length > 0
                  ? 'bg-neutral-900 text-white dark:bg-cyan-500 dark:text-neutral-950 hover:opacity-90 cursor-pointer'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] opacity-40 border border-[var(--border)] cursor-not-allowed'
              }`}
              title="Execute task"
              aria-label="Send prompt"
            >
              <ArrowUp size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
