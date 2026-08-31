import React, { useState } from 'react';
import { Plus, Search, MessageSquare, MoreVertical, Edit2, Trash2, Share2, Settings, Activity, X } from 'lucide-react';
import type { GroupedConversations, Conversation, HealthStatus } from '../../types';
import { CretivraLogo } from '../common/CretivraLogo';

interface SidebarProps {
  grouped: GroupedConversations;
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onOpenHealth: () => void;
  onShareConversation: (id: string) => void;
  healthStatus?: HealthStatus | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  grouped,
  activeId,
  onSelectConversation,
  onNewChat,
  onOpenSearch,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenHealth,
  onShareConversation,
  healthStatus,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</h3>
        <div className="space-y-0.5">
          {items.map((c) => {
            const isActive = c.id === activeId;
            const isMenuOpen = menuOpenId === c.id;
            const isEditing = editingId === c.id;

            return (
              <div key={c.id} className="relative group">
                {isEditing ? (
                  <div className="px-3 py-1.5 flex items-center gap-2 bg-gray-800 rounded-lg">
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(c.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleSaveRename(c.id)}
                      className="w-full bg-transparent text-xs text-white focus:outline-none"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      onSelectConversation(c.id);
                      onCloseMobile();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-white font-medium border border-indigo-500/30'
                        : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <span className="truncate">{c.title}</span>
                    </div>

                    {/* Action menu trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : c.id);
                      }}
                      className={`p-1 rounded-md text-gray-500 hover:text-white transition-opacity ${
                        isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Context dropdown menu */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-8 z-50 w-36 rounded-xl bg-gray-900 border border-gray-800 shadow-xl py-1 text-xs"
                      >
                        <button
                          onClick={() => handleStartRename(c)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={() => {
                            onShareConversation(c.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                        <button
                          onClick={() => {
                            onDeleteConversation(c.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isHealthy = healthStatus?.status === 'healthy';

  return (
    <>
      {/* Mobile Drawer Overlay Background */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Main Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-64 bg-gray-950 border-r border-gray-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white tracking-wider text-base">
              <CretivraLogo size={28} animated={true} />
              <span className="gradient-text-animated font-extrabold text-lg">CRETIVRA</span>
            </div>
            {/* Mobile close button */}
            <button onClick={onCloseMobile} className="lg:hidden p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search chats...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400 font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
          {renderGroup('Today', grouped.today)}
          {renderGroup('Yesterday', grouped.yesterday)}
          {renderGroup('Previous 7 Days', grouped.previous_7_days)}
          {renderGroup('Older', grouped.older)}
        </div>

        {/* Footer Settings & Health */}
        <div className="p-3 border-t border-gray-800/80 bg-gray-950 space-y-1">
          {/* Health Status Pill */}
          <button
            onClick={onOpenHealth}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-900/60 hover:bg-gray-900 border border-gray-800/80 text-xs text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>System Health</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] text-gray-400">{isHealthy ? 'Connected' : 'Status'}</span>
            </div>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
