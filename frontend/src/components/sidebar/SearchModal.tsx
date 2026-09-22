import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  MessageSquare,
  Calendar,
  CheckSquare,
  FolderGit2,
  Files,
  Cpu,
  Settings2,
  Sparkles,
  Plus,
  Palette,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Conversation } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onSearchQuery: (query: string) => void;
  conversations: Conversation[];
  onNavigateView?: (view: string) => void;
  onNewTask?: () => void;
  onOpenSettings?: () => void;
  onOpenImageStudio?: () => void;
}

export const SearchModal: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
  onSearchQuery,
  conversations,
  onNavigateView,
  onNewTask,
  onOpenSettings,
  onOpenImageStudio,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    onSearchQuery(query);
  }, [query, onSearchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'new_task',
      label: 'New Task',
      icon: Plus,
      color: 'text-[#06B6D4]',
      action: () => {
        onClose();
        if (onNewTask) onNewTask();
      },
    },
    {
      id: 'playground',
      label: 'Open Playground',
      icon: Cpu,
      color: 'text-[#8B5CF6]',
      action: () => {
        onClose();
        if (onNavigateView) onNavigateView('playground');
      },
    },
    {
      id: 'image_studio',
      label: 'Generate Image (Image Studio)',
      icon: Palette,
      color: 'text-[#EC4899]',
      action: () => {
        onClose();
        if (onOpenImageStudio) onOpenImageStudio();
      },
    },
    {
      id: 'tasks',
      label: 'View Running Tasks',
      icon: CheckSquare,
      color: 'text-[#10B981]',
      action: () => {
        onClose();
        if (onNavigateView) onNavigateView('tasks');
      },
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings2,
      color: 'text-[#8891A8]',
      action: () => {
        onClose();
        if (onOpenSettings) onOpenSettings();
      },
    },
  ];

  const filteredActions = quickActions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-xl bg-[#0D121F] border border-[#232D45] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-scale">
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#232D45] bg-[#151C2E]/60">
          <Search className="w-4 h-4 text-[#8891A8] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Asura commands, tasks, or conversations..."
            className="w-full bg-transparent text-[#E7EAF4] placeholder-[#8891A8] text-xs sm:text-sm focus:outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 bg-[#060911] border border-[#232D45] rounded text-[#8891A8]">
            ESC
          </kbd>
          <button onClick={onClose} className="p-1 rounded-lg text-[#8891A8] hover:text-[#E7EAF4]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Command & History List */}
        <div className="overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-[#232D45]">
          {/* Actions Section */}
          {filteredActions.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[#8891A8] uppercase tracking-wider px-2 mb-1.5">
                Actions
              </div>
              <div className="space-y-1">
                {filteredActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={act.action}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#151C2E] transition-colors flex items-center justify-between group asura-btn-interactive"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={act.color} />
                        <span className="text-xs font-medium text-[#E7EAF4] group-hover:text-[#06B6D4] transition-colors">
                          {act.label}
                        </span>
                      </div>
                      <ArrowRight size={12} className="text-[#8891A8] group-hover:text-[#06B6D4] transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversations Section */}
          <div>
            <div className="text-[10px] font-semibold text-[#8891A8] uppercase tracking-wider px-2 mb-1.5">
              Conversations
            </div>
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-[#8891A8] text-xs">
                No matching conversations found.
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectConversation(c.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#151C2E] transition-colors flex items-center justify-between group asura-btn-interactive"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#06B6D4] group-hover:border-[#06B6D4]/40 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#E7EAF4] group-hover:text-[#06B6D4] truncate">
                          {c.title || 'New Conversation'}
                        </div>
                        <span className="text-[10px] text-[#8891A8] font-mono uppercase">
                          {c.model_id}
                        </span>
                      </div>
                    </div>
                    {c.updated_at && (
                      <div className="flex items-center gap-1 text-[10px] text-[#8891A8] shrink-0 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
