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
      className={`relative flex flex-col h-full bg-[var(--sidebar-bg)] border-r border-[var(--border)] text-[var(--foreground)] transition-all duration-300 ease-out select-none z-30 ${
        isCollapsed ? 'w-[64px]' : 'w-[240px]'
      }`}
      style={{
        transitionProperty: 'width',
        transitionDuration: 'var(--motion-normal)',
      }}
      aria-label="Workspace navigation"
    >
      {/* 1. Header / Brand */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-[var(--border)] overflow-hidden">
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
              <span className="text-[14px] font-semibold text-[var(--foreground)] tracking-wider leading-none">
                ASURA
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest mt-0.5">
                Cretivra
              </span>
            </div>
          )}
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors focus:outline-none"
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
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium hover:border-[#06B6D4]/60 hover:text-[#06B6D4] hover:bg-[#06B6D4]/5 asura-btn-interactive shadow-sm focus:outline-none ${
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
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/60 border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={16} className={isActive ? 'text-[#06B6D4]' : 'text-[var(--muted-foreground)]'} />
              {!isCollapsed && (
                <span className="truncate text-[13px] animate-fade">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-2 mx-3 border-t border-[var(--border)]" />

      {/* 4. Conversations List (Collapses cleanly when collapsed) */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-[var(--border)]">
        {!isCollapsed ? (
          <>
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-[var(--muted-foreground)] bg-[var(--surface-secondary)]/40 border border-[var(--border)] hover:border-[#06B6D4]/40 hover:text-[var(--foreground)] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Search size={12} />
                <span>Search sessions</span>
              </span>
              <kbd className="text-[9px] px-1 py-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded text-[var(--muted-foreground)]">
                Ctrl K
              </kbd>
            </button>

            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-2">
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
              <div className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-2">
                Recent
              </div>
              {recentConversations.length === 0 ? (
                <div className="px-2 py-3 text-[11px] text-[var(--muted-foreground)]/60 text-center">
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
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
              title="Search sessions (Ctrl+K)"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => onSelectView('chat')}
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
              title="Recent Conversations"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom Section: Profile & Settings */}
      <div className="p-2 border-t border-[var(--border)] bg-[var(--sidebar-bg)] space-y-1">
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings"
        >
          <Settings2 size={15} />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={onOpenAuth}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title={user?.email ? user.email : 'Sign in / Guest'}
        >
          <div className="w-5 h-5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[#06B6D4] shrink-0 text-[10px] font-bold">
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
      <div className="px-2 py-1 flex items-center gap-1 bg-[var(--surface-secondary)] border border-[#06B6D4]/40 rounded-lg">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename(e);
            if (e.key === 'Escape') onCancelRename(e);
          }}
          autoFocus
          className="w-full bg-transparent text-xs text-[var(--foreground)] focus:outline-none"
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
          ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] font-medium border border-[var(--border)]'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/50 border border-transparent'
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
          className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
          title={isPinned ? 'Unpin' : 'Pin'}
        >
          {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
        </button>
        <button
          onClick={onStartRename}
          className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
          title="Rename"
        >
          <Edit2 size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
          title="Share"
        >
          <Share2 size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-[var(--muted-foreground)] hover:text-[#F43F5E] hover:bg-[var(--surface-secondary)]"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
