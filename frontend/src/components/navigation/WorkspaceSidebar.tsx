import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckSquare,
  FolderGit2,
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
  Image as ImageIcon,
  Headphones,
  FolderPlus,
  MoreHorizontal,
  Lightbulb,
  Clock,
  RotateCw,
  AlertCircle,
  Bell,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import { listProjectsApi } from '../../services/playgroundApi';
import type { Conversation } from '../../types';

export type WorkspaceView =
  | 'home'
  | 'tasks'
  | 'projects'
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
  // Modal & studio openers
  onOpenImageStudio?: () => void;
  onOpenVoiceMode?: () => void;
  onOpenSuggestions?: () => void;
  onReplayAnimation?: () => void;
  onOpenUpgrade?: () => void;
  pendingApprovalCount?: number;
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
  onOpenImageStudio,
  onOpenVoiceMode,
  onOpenSuggestions,
  onReplayAnimation,
  onOpenUpgrade,
  pendingApprovalCount = 0,
}: WorkspaceSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [sidebarProjects, setSidebarProjects] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch quick projects list
  useEffect(() => {
    listProjectsApi()
      .then((data) => {
        if (Array.isArray(data)) {
          setSidebarProjects(data.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { id: 'home' as WorkspaceView, label: 'Home', icon: Compass },
    { id: 'tasks' as WorkspaceView, label: 'Tasks', icon: CheckSquare },
    { id: 'projects' as WorkspaceView, label: 'Projects', icon: FolderGit2 },
    { id: 'knowledge' as WorkspaceView, label: 'Knowledge', icon: BookOpen },
    { id: 'artifacts' as WorkspaceView, label: 'Artifacts', icon: Files },
  ];

  // Group conversations into Pinned and Recent
  const pinnedConversations = conversations.filter((c) => isPinned(c.id));
  const recentConversations = conversations.filter((c) => !isPinned(c.id)).slice(0, 20);

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
      className={`relative flex flex-col h-full bg-[var(--sidebar-bg)] border-r border-[var(--border)] text-[var(--foreground)] transition-all duration-250 ease-out select-none z-30 ${
        isCollapsed ? 'w-[68px]' : 'w-[270px]'
      }`}
      aria-label="Workspace navigation"
    >
      {/* 1. Top Row: Brand on left, Search & Collapse on right (Section B) */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-[var(--border)] shrink-0">
        <button
          onClick={() => onSelectView('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none rounded-lg p-1 group cursor-pointer"
          title="Asura AI Home"
        >
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-500 transition-colors shrink-0">
            <CretivraMark size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex items-baseline gap-1.5 overflow-hidden animate-fade">
              <span className="text-[13px] font-bold text-[var(--foreground)] tracking-tight">
                ASURA
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] tracking-wider">
                CRETIVRA
              </span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-1">
          {!isCollapsed && (
            <button
              onClick={onOpenSearch}
              className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Search sessions (Ctrl+K)"
              aria-label="Search sessions"
            >
              <Search size={16} />
            </button>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      {/* 2. Primary Action: New Task (Section B: most prominent) */}
      <div className="p-2.5 shrink-0">
        <button
          onClick={onNewTask}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer ${
            isCollapsed ? 'px-0 py-2' : ''
          }`}
          title="Start a new task or conversation"
        >
          <Plus size={15} strokeWidth={2.5} className="shrink-0" />
          {!isCollapsed && <span className="animate-fade">New Task</span>}
        </button>
      </div>

      {/* 3. Navigation List (row height ~40px, rounded-lg hover, active row subtle filled) */}
      <nav className="px-2 space-y-0.5 shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 h-[38px] rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-2xs font-semibold border border-[var(--border)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={16} className={isActive ? 'text-cyan-600 dark:text-cyan-400 shrink-0' : 'text-[var(--muted-foreground)] shrink-0'} />
              {!isCollapsed && (
                <span className="truncate text-[13px] animate-fade">{item.label}</span>
              )}
            </button>
          );
        })}

        {/* Image Studio Modal Trigger */}
        {onOpenImageStudio && (
          <button
            onClick={onOpenImageStudio}
            className={`w-full flex items-center gap-3 px-2.5 py-2 h-[38px] rounded-xl text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? 'Image Studio' : undefined}
          >
            <ImageIcon size={16} className="text-[var(--muted-foreground)] shrink-0" />
            {!isCollapsed && (
              <span className="truncate text-[13px] animate-fade">Image Studio</span>
            )}
          </button>
        )}

        {/* Voice / Talk to Asura Trigger */}
        {onOpenVoiceMode && (
          <button
            onClick={onOpenVoiceMode}
            className={`w-full flex items-center gap-3 px-2.5 py-2 h-[38px] rounded-xl text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? 'Voice / Talk to Asura' : undefined}
          >
            <Headphones size={16} className="text-cyan-500 shrink-0" />
            {!isCollapsed && (
              <span className="truncate text-[13px] animate-fade">Voice / Talk to Asura</span>
            )}
          </button>
        )}

        {/* More Menu (Expands Settings, Suggestions, Cinematic Awakening) */}
        {!isCollapsed && (
          <div>
            <button
              onClick={() => setMoreExpanded(!moreExpanded)}
              className="w-full flex items-center justify-between px-2.5 py-2 h-[38px] rounded-xl text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <MoreHorizontal size={16} className="text-[var(--muted-foreground)] shrink-0" />
                <span className="text-[13px]">More</span>
              </span>
              <ChevronRight
                size={13}
                className={`text-[var(--muted-foreground)] transition-transform duration-200 ${
                  moreExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>

            {moreExpanded && (
              <div className="pl-6 pr-1 py-1 space-y-1 animate-fade">
                <button
                  onClick={onOpenSettings}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] text-left cursor-pointer"
                >
                  <Settings2 size={14} />
                  <span>Settings</span>
                </button>
                {onOpenSuggestions && (
                  <button
                    onClick={onOpenSuggestions}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] text-left cursor-pointer"
                  >
                    <Lightbulb size={14} />
                    <span>Suggestions & Feedback</span>
                  </button>
                )}
                {onReplayAnimation && (
                  <button
                    onClick={onReplayAnimation}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-cyan-500 hover:bg-[var(--surface-hover)] text-left cursor-pointer"
                  >
                    <Sparkles size={14} className="text-cyan-500" />
                    <span>Replay Awakening Intro</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Divider */}
      <div className="my-2 mx-3 border-t border-[var(--border)] shrink-0" />

      {/* 4. Scrollable Middle Area: Projects & Tasks / Recent Sessions (Section B) */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-[var(--border)]">
        {!isCollapsed ? (
          <>
            {/* Section: Projects (Section B) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[11px] font-semibold text-[var(--muted-foreground)] tracking-wider uppercase">
                  Projects
                </span>
                <button
                  onClick={() => onSelectView('projects')}
                  className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  title="New project"
                >
                  <FolderPlus size={13} />
                </button>
              </div>

              {sidebarProjects.length > 0 ? (
                sidebarProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectView('projects')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] text-left truncate transition-colors cursor-pointer"
                    title={p.name}
                  >
                    <Folder size={13} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))
              ) : (
                <button
                  onClick={() => onSelectView('projects')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] text-left transition-colors cursor-pointer"
                >
                  <FolderPlus size={13} className="shrink-0" />
                  <span>Create first project</span>
                </button>
              )}
            </div>

            {/* Section: Tasks / Recent Sessions (Section B) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pt-2">
                <span className="text-[11px] font-semibold text-[var(--muted-foreground)] tracking-wider uppercase">
                  Tasks
                </span>
                {pendingApprovalCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                    {pendingApprovalCount}
                  </span>
                )}
              </div>

              {/* Pinned Items */}
              {pinnedConversations.length > 0 && (
                <div className="space-y-0.5">
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

              {/* Recent Tasks / Conversations */}
              {recentConversations.length === 0 && pinnedConversations.length === 0 ? (
                <div className="px-2 py-3 text-[11px] text-[var(--muted-foreground)]/60 text-center">
                  No recent tasks.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentConversations.map((c) => (
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
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Search sessions (Ctrl+K)"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => onSelectView('chat')}
              className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Recent Conversations"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom of Sidebar: Promo Card + User Row (Section B) */}
      <div className="p-2.5 border-t border-[var(--border)] bg-[var(--sidebar-bg)] shrink-0 space-y-2">
        {/* Dismissible Promo / What's New card */}
        {!isCollapsed && !promoDismissed && (
          <div className="relative p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs text-xs animate-fade">
            <button
              onClick={() => setPromoDismissed(true)}
              className="absolute top-2 right-2 p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              title="Dismiss"
            >
              <X size={12} />
            </button>
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
              <Sparkles size={12} />
              <span>Explore Asura 2.0</span>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] leading-tight mb-2">
              Autonomous DAG agents & Stitch UI synthesis.
            </p>
            <button
              onClick={onOpenUpgrade || onOpenSettings}
              className="text-[11px] font-semibold text-[var(--foreground)] hover:text-cyan-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>See what&apos;s new</span>
              <ArrowRightIcon />
            </button>
          </div>
        )}

        {/* User Row: circular avatar with initial, username, Settings & Notifications icons */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2.5 rounded-xl hover:bg-[var(--surface-hover)] p-1 text-xs text-[var(--foreground)] transition-colors cursor-pointer min-w-0 ${
              isCollapsed ? 'justify-center w-full p-0' : 'flex-1'
            }`}
            title={user?.email ? user.email : 'Sign in / Guest'}
          >
            <div className="w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 text-xs font-bold shadow-2xs">
              {user?.email ? user.email.charAt(0).toUpperCase() : <User size={13} />}
            </div>
            {!isCollapsed && (
              <span className="truncate text-left font-medium max-w-[120px]">
                {user?.full_name || user?.email?.split('@')[0] || 'Local Guest'}
              </span>
            )}
          </button>

          {!isCollapsed && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <Settings2 size={15} />
              </button>
              {onOpenSuggestions && (
                <button
                  onClick={onOpenSuggestions}
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  title="Feedback & Suggestions"
                  aria-label="Feedback"
                >
                  <Bell size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
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
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
        isActive
          ? 'bg-[var(--surface)] text-[var(--foreground)] font-medium shadow-2xs border border-[var(--border)]'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      {/* Leading icon / Status icon (Section B) */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isPinned ? (
          <Pin size={12} className="text-cyan-500 shrink-0" />
        ) : (
          <Check size={12} className="text-[var(--muted-foreground)]/60 shrink-0 group-hover:text-cyan-500" />
        )}

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename(e);
              if (e.key === 'Escape') onCancelRename(e);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full bg-[var(--surface-secondary)] text-[var(--foreground)] px-1.5 py-0.5 rounded text-xs focus:outline-none border border-cyan-500"
          />
        ) : (
          <span className="truncate text-left text-[12.5px] leading-snug">
            {conversation.title || 'New Task'}
          </span>
        )}
      </div>

      {/* Action Buttons on hover */}
      {isEditing ? (
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={onSaveRename}
            className="p-1 rounded text-emerald-500 hover:bg-[var(--surface-hover)] cursor-pointer"
            title="Save"
          >
            <Check size={12} />
          </button>
          <button
            onClick={onCancelRename}
            className="p-1 rounded text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] cursor-pointer"
            title="Cancel"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 ml-1 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-cyan-500 hover:bg-[var(--surface-hover)] cursor-pointer"
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-cyan-500 hover:bg-[var(--surface-hover)] cursor-pointer"
            title="Share"
          >
            <Share2 size={11} />
          </button>
          <button
            onClick={onStartRename}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-cyan-500 hover:bg-[var(--surface-hover)] cursor-pointer"
            title="Rename"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-[var(--surface-hover)] cursor-pointer"
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
