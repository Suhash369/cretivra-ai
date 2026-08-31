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

  const isImageModel = (m: CretivraModel) => {
    return m.category === 'Image Studio' || m.capabilities?.includes('image') || m.provider === 'pollinations';
  };

  const getCategoryIcon = (category: string, isImage = false) => {
    if (isImage || category?.toLowerCase().includes('image')) {
      return <Palette className="w-4 h-4 text-purple-400" />;
    }
    switch (category?.toLowerCase()) {
      case 'reasoning':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'fast':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'code & fast':
      case 'code':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'creative':
        return <Wand2 className="w-4 h-4 text-pink-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 ${
          isCurrentImg
            ? 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/40 text-purple-200'
            : 'bg-gray-900/80 hover:bg-gray-800 border-gray-700/80 text-gray-200'
        }`}
      >
        {getCategoryIcon(selectedModel.category, isCurrentImg)}
        <span className="font-semibold">{selectedModel.display_name}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
            isCurrentImg
              ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
              : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
          }`}
        >
          {selectedModel.category || 'AI'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-gray-950/95 border border-gray-800 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95">
          <div className="p-3 border-b border-gray-800/80 bg-gray-900/80 flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Cretivra Model Registry
            </p>
            <span className="text-[10px] text-gray-500 font-mono">100% Free & Local</span>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-3">
            {/* Language & Reasoning Models Section */}
            {languageModels.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-cyan-400">
                  <Brain className="w-3 h-3" />
                  <span>Language & Reasoning Models</span>
                </div>
                <div className="space-y-1 mt-1">
                  {languageModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all ${
                        model.id === selectedModelId
                          ? 'bg-cyan-950/50 border border-cyan-500/50 text-white'
                          : 'hover:bg-gray-900/80 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getCategoryIcon(model.category, false)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs">{model.display_name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800/90 text-gray-400 font-mono">
                              {model.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{model.description}</p>
                        </div>
                      </div>
                      {model.id === selectedModelId && <Check className="w-4 h-4 text-cyan-400 mt-1 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Generation Studio Section */}
            {imageModels.length > 0 && (
              <div className="pt-2 border-t border-gray-800/80">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-purple-400">
                  <ImageIcon className="w-3 h-3" />
                  <span>🎨 AI Image Generation Studio</span>
                </div>
                <div className="space-y-1 mt-1">
                  {imageModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all ${
                        model.id === selectedModelId
                          ? 'bg-purple-950/50 border border-purple-500/50 text-white'
                          : 'hover:bg-purple-950/20 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getCategoryIcon(model.category, true)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-purple-200">{model.display_name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800/60 text-purple-300 font-mono">
                              Visual AI
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{model.description}</p>
                        </div>
                      </div>
                      {model.id === selectedModelId && <Check className="w-4 h-4 text-purple-400 mt-1 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
