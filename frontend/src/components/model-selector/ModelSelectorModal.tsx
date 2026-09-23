import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Check,
  Brain,
  Zap,
  Code2,
  Sparkles,
  Palette,
  Layers,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Eye,
  Globe,
  Radio,
} from 'lucide-react';
import type { CretivraModel } from '../../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: CretivraModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelectModel,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const isImageModel = (m: CretivraModel) => {
    return (
      m.category === 'Image Studio' ||
      m.capabilities?.includes('image') ||
      m.provider === 'pollinations' ||
      m.provider === 'vision_studio'
    );
  };

  // Grouping categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ['all', ...Array.from(set)];
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchesSearch =
        !search.trim() ||
        m.display_name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase()) ||
        m.capabilities?.some((c) => c.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        activeCategory === 'all' ||
        m.category?.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCat && m.enabled !== false;
    });
  }, [models, search, activeCategory]);

  if (!isOpen) return null;

  const getModelTierBadge = (m: CretivraModel) => {
    const cat = (m.category || '').toLowerCase();
    const id = (m.id || '').toLowerCase();
    if (
      m.category === 'Image Studio' ||
      m.capabilities?.includes('image') ||
      id.includes('vision') ||
      id.includes('flux') ||
      id.includes('diffusion') ||
      id.includes('turbo') ||
      id.includes('anime') ||
      id.includes('3d')
    ) {
      return { label: 'Vision Studio', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    }
    if (cat.includes('reason') || id.includes('reason') || id.includes('deepseek') || id.includes('r1')) {
      return { label: 'Reasoning Engine', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
    }
    if (cat.includes('code') || id.includes('code') || id.includes('coder') || id.includes('qwen')) {
      return { label: 'Code Engine', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    }
    if (cat.includes('fast') || id.includes('fast') || id.includes('1.2') || id.includes('instant')) {
      return { label: 'Ultra Fast', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    if (cat.includes('advanced') || id.includes('1.1') || id.includes('omni') || id.includes('pro')) {
      return { label: 'Frontier Core', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    }
    return { label: 'Neural Core', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' };
  };

  const getCategoryIcon = (category: string, isImg: boolean) => {
    if (isImg) return <Palette className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
    const cat = (category || '').toLowerCase();
    if (cat.includes('reason')) return <Brain className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
    if (cat.includes('fast')) return <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    if (cat.includes('code')) return <Code2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    if (cat.includes('vision')) return <Eye className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
    return <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
  };

  const formatContextLength = (len: number) => {
    if (!len) return '8K tokens';
    if (len >= 1000000) return `${(len / 1000000).toFixed(1)}M context`;
    if (len >= 1000) return `${Math.round(len / 1000)}K context`;
    return `${len} context`;
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
                Asura Neural Engine Models
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Select an AI model architecture for inference and autonomous execution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-[var(--border)] space-y-3 bg-[var(--surface)]">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by model name or capability (e.g. reasoning, code, vision)..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-semibold'
                    : 'bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {cat === 'all' ? 'All Models' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Model Card Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-[var(--border)]">
          {filteredModels.length === 0 ? (
            <div className="py-12 text-center text-[var(--muted-foreground)] space-y-2">
              <AlertCircle size={28} className="mx-auto text-[var(--muted-foreground)] opacity-60" />
              <p className="text-sm font-medium">No models match your search.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredModels.map((m) => {
              const isSelected = m.id === selectedModelId;
              const isImg = isImageModel(m);
              const tierBadge = getModelTierBadge(m);
              const isAvailable = m.is_available !== false;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (isAvailable) {
                      onSelectModel(m.id);
                      onClose();
                    }
                  }}
                  className={`relative p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/30'
                      : isAvailable
                      ? 'bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border-[var(--border)] hover:border-cyan-500/40'
                      : 'bg-[var(--surface)]/40 border-[var(--border)] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] shrink-0">
                      {getCategoryIcon(m.category, isImg)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[var(--foreground)] tracking-tight">
                          {m.display_name}
                        </span>
                        {m.version && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)] font-mono">
                            v{m.version}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full border font-medium ${tierBadge.color}`}
                        >
                          {tierBadge.label}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 leading-relaxed">
                        {m.description}
                      </p>

                      {/* Capabilities and Context Spec */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                        <span className="text-[var(--muted-foreground)] font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)]">
                          {formatContextLength(m.context_length)}
                        </span>

                        {m.capabilities?.slice(0, 3).map((cap) => (
                          <span
                            key={cap}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--muted-foreground)] uppercase tracking-wider font-mono"
                          >
                            {cap}
                          </span>
                        ))}

                        {/* Availability Pill */}
                        <span className="flex items-center gap-1 text-[10px] font-medium ml-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          <span className={isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                            {isAvailable ? 'Ready' : 'Model unavailable'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selection Checkmark */}
                  <div className="shrink-0 pt-1">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-xs">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-[var(--border)] group-hover:border-cyan-500/50 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>Active: {models.find((m) => m.id === selectedModelId)?.display_name || selectedModelId}</span>
          <span className="font-mono text-[11px]">{models.length} Registered Architectures</span>
        </div>
      </div>
    </div>
  );
};
