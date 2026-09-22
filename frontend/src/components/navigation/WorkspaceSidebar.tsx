import React, { useState } from 'react';
import {
  Compass,
  CheckSquare,
  FolderGit2,
  Cpu,
  BookOpen,
  Files,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Pin,
  PinOff,
  Share2,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  MessageSquare,
  User,
  Sparkles,
} from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import type { Conversation } from '../../types';

export type WorkspaceView =
  | 'home'
  | 'tasks'
  | 'projects'
  | 'playground'
  | 'knowledge'
  | 'artifacts'
  | 'chat'
  | 'agent_workspace';

interface WorkspaceSidebarProps {
  currentView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewTask: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onPinConversation: (id: string) => void;
  isPinned: (id: string) => boolean;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onShareConversation: (id: string) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  user: any;
  onOpenAuth: () => void;
}

export function WorkspaceSidebar({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  onNewTask,
  conversations,
  activeConversationId,
  onSelectConversation,
  onPinConversation,
  isPinned,
  onRenameConversation,
  onDeleteConversation,
  onShareConversation,
  onOpenSettings,
  onOpenSearch,
  user,
  onOpenAuth,
}: WorkspaceSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'playground', label: 'Playground', icon: Cpu },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'artifacts', label: 'Artifacts', icon: Files },
  ] as const;

  // Group conversations into Pinned and Recent
  const pinnedConversations = conversations.filter((c) => isPinned(c.id));
  const recentConversations = conversations.filter((c) => !isPinned(c.id)).slice(0, 15);

  const handleStartRename = (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title || 'New Conversation');
  };

  const handleSaveRename = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#0D121F] border-r border-[#232D45] transition-all duration-300 ease-out select-none z-30 ${
        isCollapsed ? 'w-[64px]' : 'w-[240px]'
      }`}
      style={{
        transitionProperty: 'width',
        transitionDuration: 'var(--motion-normal)',
      }}
      aria-label="Workspace navigation"
    >
      {/* 1. Header / Brand */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-[#232D45]/60 overflow-hidden">
        <button
          onClick={() => onSelectView('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#06B6D4] rounded-lg p-1 group"
          title="Asura AI"
        >
          <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] group-hover:border-[#06B6D4] transition-colors shrink-0">
            <CretivraMark size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden animate-fade">
              <span className="text-[14px] font-semibold text-[#E7EAF4] tracking-wider leading-none">
                ASURA
              </span>
              <span className="text-[10px] text-[#8891A8] uppercase tracking-widest mt-0.5">
                Cretivra
              </span>
            </div>
          )}
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors focus:outline-none"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* 2. Action: + New Task */}
      <div className="p-2.5">
        <button
          onClick={onNewTask}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#E7EAF4] text-xs font-medium hover:border-[#06B6D4]/60 hover:text-[#06B6D4] hover:bg-[#06B6D4]/5 asura-btn-interactive shadow-sm focus:outline-none ${
            isCollapsed ? 'px-0 py-2' : ''
          }`}
          title="Start a new task or conversation"
        >
          <Plus size={15} className="text-[#06B6D4] shrink-0" />
          {!isCollapsed && <span className="animate-fade">New Task</span>}
        </button>
      </div>

      {/* 3. Primary Navigation */}
      <nav className="px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 font-semibold'
                  : 'text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E]/60 border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={16} className={isActive ? 'text-[#06B6D4]' : 'text-[#8891A8]'} />
              {!isCollapsed && (
                <span className="truncate text-[13px] animate-fade">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-2 mx-3 border-t border-[#232D45]/60" />

      {/* 4. Conversations List (Collapses cleanly when collapsed) */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-[#232D45]">
        {!isCollapsed ? (
          <>
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-[#8891A8] bg-[#060911]/40 border border-[#232D45]/40 hover:border-[#232D45] hover:text-[#E7EAF4] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Search size={12} />
                <span>Search sessions</span>
              </span>
              <kbd className="text-[9px] px-1 py-0.5 bg-[#151C2E] border border-[#232D45] rounded text-[#8891A8]">
                Ctrl K
              </kbd>
            </button>

            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-[#8891A8] uppercase tracking-wider px-2">
                  Pinned
                </div>
                {pinnedConversations.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={activeConversationId === c.id}
                    isPinned={true}
                    isEditing={editingId === c.id}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => onSelectConversation(c.id)}
                    onPin={() => onPinConversation(c.id)}
                    onStartRename={(e) => handleStartRename(e, c)}
                    onSaveRename={(e) => handleSaveRename(e, c.id)}
                    onCancelRename={handleCancelRename}
                    onDelete={() => onDeleteConversation(c.id)}
                    onShare={() => onShareConversation(c.id)}
                  />
                ))}
              </div>
            )}

            {/* Recent Section */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-[#8891A8] uppercase tracking-wider px-2">
                Recent
              </div>
              {recentConversations.length === 0 ? (
                <div className="px-2 py-3 text-[11px] text-[#8891A8]/60 text-center">
                  No conversations yet.
                </div>
              ) : (
                recentConversations.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={activeConversationId === c.id}
                    isPinned={false}
                    isEditing={editingId === c.id}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => onSelectConversation(c.id)}
                    onPin={() => onPinConversation(c.id)}
                    onStartRename={(e) => handleStartRename(e, c)}
                    onSaveRename={(e) => handleSaveRename(e, c.id)}
                    onCancelRename={handleCancelRename}
                    onDelete={() => onDeleteConversation(c.id)}
                    onShare={() => onShareConversation(c.id)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-lg text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors"
              title="Search sessions (Ctrl+K)"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => onSelectView('chat')}
              className="p-2 rounded-lg text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors"
              title="Recent Conversations"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom Section: Profile & Settings */}
      <div className="p-2 border-t border-[#232D45]/60 bg-[#0A0E18] space-y-1">
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings"
        >
          <Settings2 size={15} />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={onOpenAuth}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title={user?.email ? user.email : 'Sign in / Guest'}
        >
          <div className="w-5 h-5 rounded-full bg-[#151C2E] border border-[#232D45] flex items-center justify-center text-[#06B6D4] shrink-0 text-[10px] font-bold">
            {user?.email ? user.email.charAt(0).toUpperCase() : <User size={11} />}
          </div>
          {!isCollapsed && (
            <span className="truncate text-left max-w-[140px]">
              {user?.full_name || user?.email || 'Local Guest'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isPinned: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelect: () => void;
  onPin: () => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onCancelRename: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onDelete: () => void;
  onShare: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  isPinned,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onPin,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
  onShare,
}: ConversationItemProps) {
  if (isEditing) {
    return (
      <div className="px-2 py-1 flex items-center gap-1 bg-[#151C2E] border border-[#06B6D4]/40 rounded-lg">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename(e);
            if (e.key === 'Escape') onCancelRename(e);
          }}
          autoFocus
          className="w-full bg-transparent text-xs text-[#E7EAF4] focus:outline-none"
        />
        <button
          onClick={onSaveRename}
          className="p-1 text-[#10B981] hover:text-[#10B981]/80"
          title="Save"
        >
          <Check size={12} />
        </button>
        <button
          onClick={onCancelRename}
          className="p-1 text-[#F43F5E] hover:text-[#F43F5E]/80"
          title="Cancel"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#151C2E] text-[#E7EAF4] font-medium border border-[#232D45]'
          : 'text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E]/50 border border-transparent'
      }`}
    >
      <span className="truncate pr-2 max-w-[150px]">{conversation.title || 'New Conversation'}</span>

      {/* Action buttons on hover */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="p-1 rounded text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#060911]/60"
          title={isPinned ? 'Unpin' : 'Pin'}
        >
          {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
        </button>
        <button
          onClick={onStartRename}
          className="p-1 rounded text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#060911]/60"
          title="Rename"
        >
          <Edit2 size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="p-1 rounded text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#060911]/60"
          title="Share"
        >
          <Share2 size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-[#8891A8] hover:text-[#F43F5E] hover:bg-[#060911]/60"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
