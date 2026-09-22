import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Brain, Code, Check, Image as ImageIcon, Palette, Wand2 } from 'lucide-react';
import type { CretivraModel } from '../../types';

interface ModelSelectorProps {
  models: CretivraModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0] || {
    id: 'cretivra-1',
    display_name: 'Cretivra 1',
    description: 'General AI Assistant',
    category: 'Balanced',
    capabilities: ['chat'],
    is_available: true,
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isImageModel = (m: CretivraModel) => {
    return m.category === 'Image Studio' || m.capabilities?.includes('image') || m.provider === 'pollinations';
  };

  const getCategoryIcon = (category: string, isImage = false) => {
    if (isImage || category?.toLowerCase().includes('image')) {
      return <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
    switch (category?.toLowerCase()) {
      case 'reasoning':
        return <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'fast':
        return <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'code & fast':
      case 'code':
        return <Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'creative':
        return <Wand2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  const languageModels = models.filter((m) => !isImageModel(m));
  const imageModels = models.filter((m) => isImageModel(m));

  const isCurrentImg = isImageModel(selectedModel);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 cursor-pointer ${
          isCurrentImg
            ? 'bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
            : 'bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--foreground)]'
        }`}
      >
        {getCategoryIcon(selectedModel.category, isCurrentImg)}
        <span className="font-semibold text-xs sm:text-sm">{selectedModel.display_name}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold ${
            isCurrentImg
              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
              : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
          }`}
        >
          {selectedModel.category || 'AI'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-[var(--modal-background)] border border-[var(--border)] shadow-2xl z-50 overflow-hidden backdrop-blur-2xl animate-modal-content-enter">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-secondary)]/60 flex items-center justify-between">
            <p className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider">
              Cretivra Model Registry
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Available</span>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-3">
            {/* Language & Reasoning Models Section */}
            {languageModels.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                  <Brain className="w-3 h-3" />
                  <span>Language & Reasoning Models</span>
                </div>
                <div className="space-y-1 mt-1">
                  {languageModels.map((model) => {
                    const isAvailable = model.is_available !== false;
                    const isSelected = model.id === selectedModelId;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          if (isAvailable) {
                            onSelectModel(model.id);
                            setIsOpen(false);
                          }
                        }}
                        className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/15 border border-cyan-500/40 text-[var(--foreground)]'
                            : 'hover:bg-[var(--surface-secondary)] text-[var(--foreground)] border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">{getCategoryIcon(model.category, false)}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-[var(--foreground)]">{model.display_name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] text-[var(--muted-foreground)] font-mono border border-[var(--border)]">
                                {model.category || 'Balanced'}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-medium">
                                <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className={isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                  {isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{model.description}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mt-1 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Image Generation Studio Section */}
            {imageModels.length > 0 && (
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  <ImageIcon className="w-3 h-3" />
                  <span>🎨 AI Image Generation Studio</span>
                </div>
                <div className="space-y-1 mt-1">
                  {imageModels.map((model) => {
                    const isSelected = model.id === selectedModelId;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/15 border border-purple-500/40 text-[var(--foreground)]'
                            : 'hover:bg-[var(--surface-secondary)] text-[var(--foreground)] border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">{getCategoryIcon(model.category, true)}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-[var(--foreground)]">{model.display_name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-mono">
                                Visual AI
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Available</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{model.description}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-1 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
