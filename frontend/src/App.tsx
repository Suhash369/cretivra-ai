'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Paperclip,
  Settings2,
  Plus,
  ChevronDown,
  Square,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Brain,
  Code2,
  Sparkles,
  X,
  ArrowUp,
  ArrowDown,
  FileText,
  FileDown,
  Presentation,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Palette,
  Scale,
  Trash2,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Volume2,
  VolumeX,
  Edit2,
  Edit3,
  Pin,
  PinOff,
  Globe,
  Menu,
  Lock,
} from 'lucide-react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { exportPdf } from './services/api';
import { initTheme, applyTheme, type ThemeMode } from './services/theme';
import { SearchModal } from './components/sidebar/SearchModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ShareModal } from './components/settings/ShareModal';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingTourModal } from './components/onboarding/OnboardingTourModal';
import { ImageStudioModal } from './components/image-studio/ImageStudioModal';
import { SuggestionBox } from './components/feedback/SuggestionBox';
import { IntelligenceCacheCard } from './components/chat/IntelligenceCacheCard';
import { MarkdownRenderer } from './components/chat/MarkdownRenderer';
import { CretivraMark } from './components/common/CretivraLogo';
import { ConfirmModal } from './components/common/ConfirmModal';
import { ActionMenu } from './components/chat/ActionMenu';
import { SketchModal } from './components/chat/SketchModal';
import { LibraryModal } from './components/chat/LibraryModal';
import type { Conversation, CretivraModel, SystemSettings, Attachment } from './types';

const SUGGESTIONS = [
  {
    title: 'Generate an AI Image',
    sub: 'FLUX.1 cyberpunk art, photorealistic portraits, or 3D CGI',
    icon: Palette,
    prompt: 'Generate an image of a futuristic cyberpunk city with neon reflections and glowing flying cars, ultra-detailed 8k',
  },
  {
    title: 'Explain a concept',
    sub: 'Break down quantum entanglement or transformer attention simply',
    icon: Sparkles,
    prompt: 'Explain how transformer self-attention works with query, key, and value vectors.',
  },
  {
    title: 'Write something',
    sub: 'Draft a launch announcement or strategic proposal',
    icon: Search,
    prompt: 'Draft a clean product launch email announcement for Asura AI by Cretivra platform.',
  },
  {
    title: 'Debug code',
    sub: 'Find race conditions or optimize Python algorithms',
    icon: Code2,
    prompt: 'Write a clean Python function to generate odd numbers up to N with list comprehension and generators.',
  },
  {
    title: 'Plan a project',
    sub: 'Outline a multi-week technical architecture roadmap',
    icon: Brain,
    prompt: 'Outline a 4-week sprint roadmap for building a scalable local LLM inference platform.',
  },
];

export function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('cretivra_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const {
    grouped,
    conversations,
    setSearchQuery,
    createNew,
    refresh: refreshConversations,
    addOrUpdateConversation,
    renameConversation,
    deleteConversation,
    bulkDeleteConversations,
    togglePin,
    isPinned,
  } = useConversations(user);

  const {
    activeConversationId,
    messages,
    selectedModel,
    setSelectedModel,
    availableModels,
    isGenerating,
    attachments,
    error: chatError,
    loadConversation,
    clearActiveChat,
    sendMessage,
    editMessage,
    regenerateMessage,
    stopGeneration,
    handleFileUpload,
    removeAttachment,
    attachExisting,
    deleteSingleMessage,
  } = useChat({
    onConversationCreated: (newConv) => {
      addOrUpdateConversation(newConv);
    },
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [imageStudioOpen, setImageStudioOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    subtext?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // In-place rename state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // In-place edit user prompt state
  const [editingUserMsgId, setEditingUserMsgId] = useState<string | null>(null);
  const [editUserText, setEditUserText] = useState('');

  // Feature toggles for Tough Composer
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [sketchModalOpen, setSketchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  // Scroll to bottom state
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Gather all attachments from current state and conversation messages for Library
  const allSessionAttachments = useMemo(() => {
    const map = new Map<string, Attachment>();
    attachments.forEach((a) => map.set(a.id, a));
    messages.forEach((m) => {
      m.attachments?.forEach((a) => map.set(a.id, a));
    });
    return Array.from(map.values());
  }, [attachments, messages]);

  // Feedback & TTS
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'good' | 'bad'>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // User greeting name
  const userDisplayName = useMemo(() => {
    if (!user) return null;
    const name = user.full_name?.trim() || user.name?.trim() || (user.email ? user.email.split('@')[0] : '');
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Friend';
  }, [user]);

  // Active conversation title for ChatGPT-style breadcrumb indicator
  const activeChatTitle = useMemo(() => {
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (activeConv?.title) return activeConv.title;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg?.content) return firstUserMsg.content.slice(0, 45);
    return 'New Chat';
  }, [conversations, activeConversationId, messages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);
  const isUserInteractingRef = useRef<boolean>(false);
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize theme on mount
  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, []);

  // Check if first-time visitor to display onboarding tour
  useEffect(() => {
    try {
      const hasCompletedTour = localStorage.getItem('asura_onboarding_completed');
      if (!hasCompletedTour) {
        setOnboardingOpen(true);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Robust scroll to bottom that actively moves both inner scrollable container and outer window screen
  const scrollToBottom = useCallback((smooth = true) => {
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);

    if (scrollRef.current) {
      if (smooth) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });

    if (typeof window !== 'undefined' && window.scrollY > 0) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Continuous auto-scroll to follow new tokens as they stream in
  useEffect(() => {
    if (!isUserScrolledUpRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      requestAnimationFrame(() => {
        if (scrollRef.current && !isUserScrolledUpRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isGenerating]);

  // When a new generation starts, smoothly anchor viewport to the generating stream
  useEffect(() => {
    if (isGenerating) {
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
      scrollToBottom(true);
      const t1 = setTimeout(() => scrollToBottom(false), 80);
      const t2 = setTimeout(() => scrollToBottom(false), 240);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isGenerating, scrollToBottom]);

  // User input listeners to distinguish intentional user scroll from programmatic auto-follow
  const handleUserWheel = (e: React.WheelEvent) => {
    isUserInteractingRef.current = true;
    if (userInteractionTimeoutRef.current) clearTimeout(userInteractionTimeoutRef.current);
    userInteractionTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 450);

    if (e.deltaY < -4) {
      // User wheeled up
      isUserScrolledUpRef.current = true;
      setShowScrollBottom(true);
    } else if (e.deltaY > 4 && scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 60) {
        isUserScrolledUpRef.current = false;
        setShowScrollBottom(false);
      }
    }
  };

  const handleUserTouchMove = () => {
    isUserInteractingRef.current = true;
    if (userInteractionTimeoutRef.current) clearTimeout(userInteractionTimeoutRef.current);
    userInteractionTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 450);
  };

  // Scroll listener for "Scroll to bottom" button & position tracking
  const handleChatScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Re-engage auto-follow when close to the bottom
    if (distanceFromBottom <= 50) {
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
      return;
    }

    // Mark user scrolled up only when actively interacting or scrolled up while idle
    if (distanceFromBottom > 80 && isUserInteractingRef.current) {
      isUserScrolledUpRef.current = true;
      setShowScrollBottom(true);
    } else if (distanceFromBottom > 120 && !isGenerating) {
      setShowScrollBottom(true);
    }
  };

  // Click outside to dismiss model selector dropdown
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    if (modelOpen) {
      document.addEventListener('mousedown', handleGlobalClick);
    }
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [modelOpen]);

  // Global Keyboard Shortcuts (⌘K search, Esc to close modals)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setModelOpen(false);
        setEditingConvId(null);
        setEditingUserMsgId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSend = (textToSend?: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const content = (textToSend ?? input).trim();
    if ((content || attachments.length > 0) && !isGenerating) {
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
      sendMessage(content, selectedModel, webSearchEnabled, deepThinkEnabled);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      // Actively move window screen down to follow user's new query and streaming response
      scrollToBottom(false);
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
      setTimeout(() => scrollToBottom(true), 80);
      setTimeout(() => scrollToBottom(false), 240);
    }
  };

  const handleNewChat = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    clearActiveChat();
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
    const newConv = await createNew(selectedModel);
    loadConversation(newConv.id);
  };

  const handleDeleteActiveChat = () => {
    if (!activeConversationId) return;
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    const title = activeConv?.title || 'this chat';
    setConfirmDialog({
      isOpen: true,
      title: 'Delete chat?',
      description: (
        <span>
          This will delete <strong className="font-semibold text-slate-900 dark:text-white">{title}</strong>.
        </span>
      ),
      subtext: 'This action is permanent and cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await deleteConversation(activeConversationId);
        clearActiveChat();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteSingleConv = (e: React.MouseEvent, id: string, title?: string) => {
    e.stopPropagation();
    const convTitle = title || conversations.find((c) => c.id === id)?.title || 'this chat';
    setConfirmDialog({
      isOpen: true,
      title: 'Delete chat?',
      description: (
        <span>
          This will delete <strong className="font-semibold text-slate-900 dark:text-white">{convTitle}</strong>.
        </span>
      ),
      subtext: 'This action is permanent and cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await deleteConversation(id);
        if (activeConversationId === id) {
          clearActiveChat();
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setRenameInput(conv.title);
  };

  const handleSaveRename = async (id: string) => {
    if (renameInput.trim()) {
      await renameConversation(id, renameInput.trim());
    }
    setEditingConvId(null);
  };

  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    togglePin(id);
  };

  const handleToggleSelectChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedChatIds.size === conversations.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(conversations.map((c) => c.id)));
    }
  };

  const handleExecuteBulkDelete = () => {
    if (selectedChatIds.size === 0) return;
    const count = selectedChatIds.size;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete selected chats?',
      description: (
        <span>
          This will delete <strong className="font-semibold text-slate-900 dark:text-white">{count} selected {count === 1 ? 'chat' : 'chats'}</strong>.
        </span>
      ),
      subtext: 'All messages inside these chats will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await bulkDeleteConversations(Array.from(selectedChatIds));
        if (activeConversationId && selectedChatIds.has(activeConversationId)) {
          clearActiveChat();
        }
        setSelectedChatIds(new Set());
        setSelectMode(false);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteMessage = (msgId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete message?',
      description: 'This will delete this message and its corresponding response from your chat history.',
      subtext: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await deleteSingleMessage(msgId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSignOut = () => {
    if (!user) return;
    const displayName = user.full_name || user.email;
    setConfirmDialog({
      isOpen: true,
      title: 'Log out of Asura AI?',
      description: (
        <span>
          You are currently signed in as <strong className="font-semibold text-slate-900 dark:text-white">{displayName}</strong>.
        </span>
      ),
      subtext: 'You will need to sign in again to access models, web search, reasoning, and your private conversations.',
      confirmLabel: 'Log out',
      variant: 'danger',
      onConfirm: () => {
        localStorage.removeItem('cretivra_auth_token');
        localStorage.removeItem('cretivra_user');
        setUser(null);
        clearActiveChat();
        refreshConversations();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleStartEditUser = (msgId: string, currentContent: string) => {
    setEditingUserMsgId(msgId);
    setEditUserText(currentContent);
  };

  const handleSaveEditUser = (msgId: string) => {
    if (editUserText.trim()) {
      editMessage(msgId, editUserText.trim());
      setEditingUserMsgId(null);
    }
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyAssistantMessage = (msgId: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const isImageModel = (m: CretivraModel) => {
    return m.category === 'Image Studio' || m.capabilities?.includes('image') || m.provider === 'pollinations';
  };

  const currentModelObj = availableModels.find((m) => m.id === selectedModel) || availableModels[0] || {
    id: 'cretivra-1',
    display_name: 'Cretivra 1',
    description: 'Balanced performance',
    category: 'Balanced',
    capabilities: ['chat'],
  };

  const isCurrentImg = isImageModel(currentModelObj as CretivraModel);
  const languageModels = availableModels.filter((m) => !isImageModel(m));
  const imageModels = availableModels.filter((m) => isImageModel(m));

  const isLanding = messages.length === 0;

  return (
    <div className="flex h-screen w-screen bg-[var(--bg-base)] text-[var(--text)] overflow-hidden font-sans relative">
      {/* Background Ambient Glowing Orbs */}
      <div className="cv-ambient">
        <div className="cv-orb cv-orb-1" />
        <div className="cv-orb cv-orb-2" />
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar */}
      <div
        className={`cv-sidebar ${sidebarOpen ? '' : 'closed'} z-40 fixed md:static top-0 bottom-0 left-0 transition-all duration-300 flex flex-col justify-between border-r border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#0d121f]`}
      >
        <div>
          <div className="cv-sb-head flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white">
            <CretivraMark size={22} />
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Asura AI by Cretivra</span>
            <div className="flex-1" />
            <button
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(false)}
              title="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          <div className="px-3 pt-3">
            <button
              className="cv-sb-new-btn w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white dark:bg-cyan-950/40 hover:bg-slate-100 dark:hover:bg-cyan-900/50 text-slate-900 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/40 font-semibold text-xs shadow-xs transition-all cursor-pointer"
              onClick={handleNewChat}
            >
              <Plus size={15} className="text-slate-800 dark:text-cyan-400" />
              <span>New chat</span>
            </button>
          </div>

          {/* Search & Select Mode Toggle Bar */}
          <div className="flex items-center gap-1.5 px-3 py-1 mt-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 text-xs text-slate-700 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shadow-2xs"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={13} className="text-slate-500 dark:text-gray-400" />
              <span className="font-medium">Search chats</span>
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700">⌘K</span>
            </div>
            <button
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                selectMode
                  ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/50 border-blue-300 dark:border-cyan-500/40'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-gray-900/60 border-slate-200 dark:border-gray-800'
              }`}
              title={selectMode ? 'Done selecting' : 'Select multiple chats to delete'}
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedChatIds(new Set());
              }}
            >
              <CheckSquare size={14} />
            </button>
          </div>

          {/* Bulk Selection Action Bar */}
          {selectMode && (
            <div className="mx-3 mt-2 p-2 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between text-xs animate-in fade-in">
              <button
                onClick={handleSelectAll}
                className="text-[11px] text-gray-400 hover:text-white cursor-pointer"
              >
                {selectedChatIds.size === conversations.length && conversations.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-mono">
                  {selectedChatIds.size} sel
                </span>
                <button
                  disabled={selectedChatIds.size === 0}
                  onClick={handleExecuteBulkDelete}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={11} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Conversation List Scroll Area */}
          <div className="cv-sb-scroll flex flex-col mt-2 max-h-[calc(100vh-220px)] overflow-y-auto px-1">
            {!user ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 my-auto space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">No saved history</p>
                <p className="text-[11px] leading-relaxed">Sign in to save, pin, and sync your conversations.</p>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Lock size={12} />
                  <span>Sign In</span>
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 my-auto">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]: [string, Conversation[]]) => {
                if (!items || items.length === 0) return null;
                const isPinnedGroup = group === 'pinned';
                const label = isPinnedGroup ? '📌 Pinned' : group.replace(/_/g, ' ');

                return (
                  <div key={group} className="mb-2">
                    <div className="cv-sb-group-label uppercase tracking-wider text-[10px] font-bold text-slate-500 dark:text-gray-400 px-3 py-1">
                      {label}
                    </div>
                    {items.map((conv) => {
                      const isSelected = selectedChatIds.has(conv.id);
                      const isActive = conv.id === activeConversationId;
                      const isRenaming = editingConvId === conv.id;
                      const pinned = isPinned(conv.id);

                      return (
                        <div
                          key={conv.id}
                          className={`cv-sb-item group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                            isActive
                              ? 'active bg-sky-100 dark:bg-cyan-950/40 text-sky-900 dark:text-cyan-300 border border-sky-300 dark:border-cyan-500/30 font-semibold shadow-2xs'
                              : 'text-slate-800 dark:text-gray-200 hover:bg-slate-200/70 dark:hover:bg-gray-800/60 font-medium'
                          } ${isSelected ? 'bg-sky-200/60 dark:bg-cyan-950/50 border border-sky-400 dark:border-cyan-500/40' : ''}`}
                          onClick={() => {
                            if (selectMode) {
                              handleToggleSelectChat({ stopPropagation: () => {} } as any, conv.id);
                            } else if (!isRenaming) {
                              loadConversation(conv.id);
                              if (window.innerWidth < 768) setSidebarOpen(false);
                            }
                          }}
                        >
                          {isRenaming ? (
                            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                type="text"
                                value={renameInput}
                                onChange={(e) => setRenameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(conv.id);
                                  if (e.key === 'Escape') setEditingConvId(null);
                                }}
                                className="flex-1 bg-white dark:bg-gray-950 border border-blue-500 dark:border-cyan-500/60 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveRename(conv.id)}
                                className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 cursor-pointer"
                                title="Save title"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingConvId(null)}
                                className="p-1 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                                {selectMode ? (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleToggleSelectChat(e as any, conv.id)}
                                    className="rounded border-slate-300 dark:border-gray-700 text-blue-600 dark:text-cyan-500 focus:ring-0 cursor-pointer"
                                  />
                                ) : pinned ? (
                                  <Pin size={11} className="text-blue-600 dark:text-cyan-400 shrink-0" />
                                ) : null}
                                <span className="truncate font-medium text-slate-800 dark:text-gray-200">{conv.title}</span>
                              </div>

                              {!selectMode && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                                  {/* Pin toggle */}
                                  <button
                                    onClick={(e) => handleTogglePin(e, conv.id)}
                                    className={`p-1 hover:text-blue-600 dark:hover:text-cyan-300 cursor-pointer ${pinned ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400 dark:text-gray-400'}`}
                                    title={pinned ? 'Unpin chat' : 'Pin chat'}
                                  >
                                    {pinned ? <PinOff size={11} /> : <Pin size={11} />}
                                  </button>
                                  {/* Rename button */}
                                  <button
                                    onClick={(e) => handleStartRename(e, conv)}
                                    className="p-1 text-slate-400 hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300 cursor-pointer"
                                    title="Rename chat"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => handleDeleteSingleConv(e, conv.id, conv.title)}
                                    className="p-1 text-slate-400 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 cursor-pointer"
                                    title="Delete chat"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-gray-800/80 bg-slate-50 dark:bg-[var(--bg-panel)]">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-950 dark:text-gray-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-gray-900 cursor-pointer transition-colors font-medium"
            title="Open Settings"
          >
            <Settings2 size={15} className="text-slate-600 dark:text-gray-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="cv-main flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative bg-[var(--bg-base)]">
        {/* Top Header */}
        <div className="cv-header shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-[var(--bg-panel)] shadow-xs">
          {!sidebarOpen && (
            <button className="cv-icon-btn cursor-pointer" onClick={() => setSidebarOpen(true)} title="Expand sidebar">
              <PanelLeftOpen size={16} />
            </button>
          )}

          <div className="cv-brand flex items-center gap-2">
            {!sidebarOpen && <CretivraMark size={20} />}
            <span className="cv-gradient-text font-bold text-sm tracking-wide">Asura AI by Cretivra</span>
          </div>

          {/* Model Selector Dropdown Pill */}
          <div style={{ position: 'relative' }} ref={modelDropdownRef}>
            <div
              className={`cv-model-pill cursor-pointer ${isCurrentImg ? 'cv-model-pill-image' : ''}`}
              onClick={() => setModelOpen((o) => !o)}
            >
              {isCurrentImg ? (
                <Palette size={13} className="cv-model-icon-img shrink-0 text-purple-400" />
              ) : (
                <Brain size={13} className="cv-model-icon-brain shrink-0 text-cyan-400" />
              )}
              <span>{currentModelObj.display_name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isCurrentImg ? 'cv-badge-purple' : 'cv-badge-cyan'}`}>
                {currentModelObj.category}
              </span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${modelOpen ? 'rotate-180' : ''}`} style={{ opacity: 0.6 }} />
            </div>

            {modelOpen && (
              <div className="cv-glass cv-model-menu w-80 max-h-96 overflow-y-auto absolute left-0 top-10 z-50 rounded-2xl p-2 shadow-2xl border border-gray-800 bg-gray-950/95 backdrop-blur-xl animate-in fade-in zoom-in-95">
                {/* Language Models */}
                {languageModels.length > 0 && (
                  <div className="p-1">
                    <div className="cv-model-menu-section-header cv-section-cyan text-xs font-semibold text-cyan-400 px-2 py-1 mb-1">
                      💬 Language & Reasoning
                    </div>
                    {languageModels.map((m) => (
                      <div
                        key={m.id}
                        className={`cv-model-opt p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${m.id === selectedModel ? 'cv-model-opt-active-cyan bg-cyan-950/50 border border-cyan-500/40 text-white' : 'hover:bg-gray-900 text-gray-300'}`}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModelOpen(false);
                        }}
                      >
                        <div className="cv-model-opt-icon cv-model-icon-box-cyan text-cyan-400">
                          <Brain size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="cv-model-opt-name flex items-center gap-1.5">
                            <span className="font-semibold text-xs">{m.display_name}</span>
                            <span className="cv-model-badge-sub text-[9px] font-mono px-1 py-0.2 rounded bg-gray-800 text-gray-400">
                              {m.category}
                            </span>
                          </div>
                          <div className="cv-model-opt-tag text-[11px] text-gray-500 truncate">{m.description}</div>
                        </div>
                        {m.id === selectedModel && <Check size={13} className="text-cyan-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Generation Models */}
                {imageModels.length > 0 && (
                  <div className="p-1 border-t border-gray-800/80 mt-1 pt-1">
                    <div className="cv-model-menu-section-header cv-section-purple flex items-center gap-1 text-xs font-semibold text-purple-400 px-2 py-1 mb-1">
                      <Palette size={12} />
                      <span>🎨 AI Image Generation Studio</span>
                    </div>
                    {imageModels.map((m) => (
                      <div
                        key={m.id}
                        className={`cv-model-opt p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${m.id === selectedModel ? 'cv-model-opt-active-purple bg-purple-950/50 border border-purple-500/40 text-white' : 'hover:bg-gray-900 text-gray-300'}`}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModelOpen(false);
                        }}
                      >
                        <div className="cv-model-opt-icon cv-model-icon-box-purple text-purple-400">
                          <Palette size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="cv-model-opt-name flex items-center gap-1.5">
                            <span className="cv-model-name-purple font-semibold text-xs text-purple-200">{m.display_name}</span>
                            <span className="cv-badge-purple text-[9px] px-1 py-0.2 rounded font-mono bg-purple-950 text-purple-300 border border-purple-800/60">
                              FLUX/SDXL
                            </span>
                          </div>
                          <div className="cv-model-opt-tag text-[11px] text-gray-500 truncate">{m.description}</div>
                        </div>
                        {m.id === selectedModel && <Check size={13} className="text-purple-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Chat Breadcrumb & Status (ChatGPT-style location indicator) */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-2">
            {!isLanding && (
              <div className="flex items-center gap-2 max-w-[180px] sm:max-w-[280px] md:max-w-md truncate">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={activeChatTitle}>
                  {activeChatTitle}
                </span>
                {isGenerating ? (
                  <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
                    Generating...
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 hidden md:inline font-mono">
                    ({messages.length} msgs)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dedicated Image Studio Button */}
          <button
            onClick={() => setImageStudioOpen(true)}
            className="cv-header-btn-studio cursor-pointer"
            title="Open Cretivra Image Generation Studio"
          >
            <Palette size={13} className="shrink-0 text-purple-400" />
            <span className="hidden sm:inline">Image Studio</span>
          </button>

          {/* Test Bench / Arena Button */}
          <a
            href="/test-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="cv-header-btn-bench cursor-pointer"
            title="Open Model Test Bench & Performance Arena"
          >
            <Scale size={13} className="shrink-0 text-cyan-400" />
            <span className="hidden sm:inline">Test Bench</span>
          </a>

          {/* AI Guide / Interactive Tour Button */}
          <button
            onClick={() => setOnboardingOpen(true)}
            className="cv-header-btn-bench cursor-pointer flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400 transition-all shadow-sm"
            title="Interactive Onboarding Guide & Features Tour"
          >
            <Sparkles size={13} className="shrink-0 text-violet-400 animate-pulse" />
            <span className="hidden sm:inline">AI Guide</span>
          </button>

          {/* Action buttons when conversation is active */}
          {activeConversationId && (
            <>
              <button className="cv-icon-btn cursor-pointer" title="Share conversation" onClick={() => setShareId(activeConversationId)}>
                <Share2 size={15} />
              </button>
              <button
                className="cv-icon-btn hover:text-rose-400 cursor-pointer"
                title="Delete this chat history"
                onClick={handleDeleteActiveChat}
              >
                <Trash2 size={15} />
              </button>
            </>
          )}

          {/* Sign In / Account Pill */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="cv-user-pill cursor-pointer"
              title="Click to sign out"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                {user.full_name ? user.full_name[0] : user.email[0]}
              </div>
              <span className="cv-user-pill-name max-w-[100px] truncate">{user.full_name || user.email.split('@')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-white font-medium text-xs rounded-full shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button className="cv-icon-btn cursor-pointer" title="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={15} />
          </button>
        </div>

        {/* Global Error Banner */}
        {chatError && (
          <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{chatError}</span>
            </div>
            <button
              onClick={() => {
                const lastUser = [...messages].reverse().find((msg) => msg.role === 'user');
                if (lastUser) sendMessage(lastUser.content);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-white font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Scrollable Center Canvas (Landing or Chat) */}
        <div
          className="flex-1 min-h-0 overflow-y-auto relative flex flex-col"
          ref={scrollRef}
          onScroll={handleChatScroll}
          onWheel={handleUserWheel}
          onTouchMove={handleUserTouchMove}
        >
          {isLanding ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center max-w-3xl mx-auto w-full my-auto">
              <div className="mb-4">
                <CretivraMark size={52} />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">
                {userDisplayName ? `What can I help with today, ${userDisplayName}?` : 'What can I help with today?'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-md">
                Frontier intelligence engineered for reasoning, deep search, and creative multimodal generation.
              </p>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full text-left">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    className="p-4 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 hover:border-cyan-500/60 dark:hover:border-cyan-500/40 hover:bg-slate-50 dark:hover:bg-gray-800/60 transition-all cursor-pointer shadow-sm hover:shadow-md group"
                    onClick={() => {
                      if (!user) {
                        setAuthOpen(true);
                        return;
                      }
                      if (s.title === 'Generate an AI Image') {
                        setSelectedModel('cretivra-flux');
                      }
                      handleSend(s.prompt);
                    }}
                  >
                    <s.icon size={18} className={s.title === 'Generate an AI Image' ? 'text-purple-500 mb-2' : 'text-cyan-600 dark:text-cyan-400 mb-2'} />
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {s.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto p-4 space-y-6 pb-24 flex-1">
              {messages.map((m, i) => (
                <div className="cv-msg-row" key={m.id || i}>
                  {m.role === 'user' ? (
                    <div className="cv-msg-user group relative flex flex-col items-end">
                      {/* User attachments */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 justify-end">
                          {m.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 text-xs text-slate-800 dark:text-gray-200"
                            >
                              <FileText size={12} className="text-cyan-600 dark:text-cyan-400" />
                              <span className="truncate max-w-[120px]">{att.filename}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* In-place edit user prompt */}
                      {editingUserMsgId === m.id ? (
                        <div className="w-full max-w-xl bg-white dark:bg-gray-900 border border-cyan-500/50 rounded-2xl p-3 shadow-xl space-y-2.5">
                          <textarea
                            autoFocus
                            rows={3}
                            value={editUserText}
                            onChange={(e) => setEditUserText(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setEditingUserMsgId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-medium cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditUser(m.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium cursor-pointer shadow transition-colors"
                            >
                              Save &amp; Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          {/* User action buttons on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 pt-1">
                            <button
                              onClick={() => handleStartEditUser(m.id, m.content)}
                              className="p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 cursor-pointer rounded"
                              title="Edit message"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer rounded"
                              title="Delete message and its response"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="bg-slate-900 text-white dark:bg-gradient-to-r dark:from-cyan-950/70 dark:to-indigo-950/70 border border-slate-700 dark:border-cyan-500/30 rounded-2xl px-4 py-2.5 text-sm max-w-xl leading-relaxed shadow-sm">
                            {m.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="cv-msg-assistant group relative space-y-2">
                      {/* Assistant Header */}
                      <div className="flex items-center justify-between text-xs select-none">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center text-white shadow-sm">
                            <Sparkles size={11} />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13px]">Asura AI</span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-cyan-800 dark:text-cyan-300 border border-slate-300 dark:border-slate-700/60 font-mono font-medium">
                            {currentModelObj?.display_name || 'Frontier Intelligence'}
                          </span>
                        </div>
                      </div>

                      {/* Intelligence Cache / Reasoning Indicator */}
                      <IntelligenceCacheCard
                        reasoningStatus={m.reasoning_status}
                        isGenerating={isGenerating && i === messages.length - 1}
                        cacheItems={m.cache_items}
                        userQuery={i > 0 && messages[i - 1]?.role === 'user' ? messages[i - 1].content : undefined}
                      />

                      {/* Markdown Content */}
                      {m.content ? (
                        <div className="relative text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                          <MarkdownRenderer content={m.content} />
                          {isGenerating && i === messages.length - 1 && (
                            <span
                              className="inline-block w-2.5 h-4 bg-cyan-500 dark:bg-cyan-400 ml-1 rounded-[2px] animate-pulse align-text-bottom shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                              title="Streaming tokens..."
                            />
                          )}
                        </div>
                      ) : isGenerating && i === messages.length - 1 ? (
                        <div className="flex items-center gap-2.5 text-xs text-cyan-600 dark:text-cyan-400 py-2.5 px-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 animate-pulse w-fit">
                          <Sparkles size={14} className="animate-spin text-cyan-500" />
                          <span className="font-medium">{m.reasoning_status || 'Thinking & formulating response...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle size={13} />
                          <span>No response received.</span>
                          <button
                            onClick={() => regenerateMessage(m.id)}
                            className="underline font-semibold hover:text-amber-500 ml-1 cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Assistant Action Toolbar (ChatGPT / Claude / Gemini style) */}
                      {m.content && (
                        <div className="flex items-center gap-1.5 pt-2 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 select-none">
                          {/* Copy response */}
                          <button
                            onClick={() => handleCopyAssistantMessage(m.id || String(i), m.content)}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                              copiedMsgId === (m.id || String(i)) ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-slate-800' : ''
                            }`}
                            title="Copy response to clipboard"
                          >
                            {copiedMsgId === (m.id || String(i)) ? <Check size={13} /> : <Copy size={13} />}
                            {copiedMsgId === (m.id || String(i)) && <span className="text-[11px] font-medium">Copied!</span>}
                          </button>

                          {/* Thumbs Up */}
                          <button
                            onClick={() =>
                              setMessageFeedback((prev) => ({
                                ...prev,
                                [m.id || String(i)]: prev[m.id || String(i)] === 'good' ? (undefined as any) : 'good',
                              }))
                            }
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                              messageFeedback[m.id || String(i)] === 'good'
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/40'
                                : 'hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                            title="Good response"
                          >
                            <ThumbsUp size={13} />
                          </button>

                          {/* Thumbs Down */}
                          <button
                            onClick={() =>
                              setMessageFeedback((prev) => ({
                                ...prev,
                                [m.id || String(i)]: prev[m.id || String(i)] === 'bad' ? (undefined as any) : 'bad',
                              }))
                            }
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                              messageFeedback[m.id || String(i)] === 'bad'
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/40'
                                : 'hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                            title="Bad response"
                          >
                            <ThumbsDown size={13} />
                          </button>

                          {/* In-place Regenerate */}
                          <button
                            disabled={isGenerating}
                            onClick={() => {
                              isUserScrolledUpRef.current = false;
                              setShowScrollBottom(false);
                              regenerateMessage(m.id);
                              scrollToBottom(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                            title="Regenerate response"
                          >
                            <RotateCw size={13} />
                          </button>

                          {/* Read Aloud (TTS) */}
                          <button
                            onClick={() => handleSpeakMessage(m.id || String(i), m.content)}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                              speakingMsgId === (m.id || String(i))
                                ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 animate-pulse border border-cyan-300 dark:border-cyan-500/30'
                                : 'hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                            title={speakingMsgId === (m.id || String(i)) ? 'Stop speaking' : 'Read response aloud'}
                          >
                            {speakingMsgId === (m.id || String(i)) ? <VolumeX size={13} /> : <Volume2 size={13} />}
                          </button>

                          {/* Export Message as PDF */}
                          <button
                            onClick={async () => {
                              try {
                                const title = activeChatTitle || 'Asura AI Intelligence Report';
                                const res = await exportPdf(title, m.content);
                                if (res.download_url) {
                                  const link = document.createElement('a');
                                  link.href = res.download_url;
                                  link.download = res.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              } catch (err) {
                                console.error('Failed to export PDF:', err);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                            title="Export this response as a PDF document"
                          >
                            <FileDown size={13} />
                            <span className="text-[11px] hidden sm:inline">PDF</span>
                          </button>

                          <div className="flex-1" />

                          {/* Delete assistant message */}
                          <button
                            onClick={() => handleDeleteMessage(m.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                            title="Delete message from history"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {/* Bottom anchor for smooth auto-scroll following streaming tokens */}
              <div ref={messagesEndRef} className="h-6 w-full shrink-0" />
            </div>
          )}

          {/* Floating Scroll to Bottom Button (ChatGPT-style with live generation indicator) */}
          {showScrollBottom && (
            <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 dark:bg-gray-900/95 text-slate-800 dark:text-white border border-slate-300 dark:border-cyan-500/40 shadow-2xl backdrop-blur-md cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 group"
                title="Jump to latest response"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:translate-y-0.5 transition-transform">
                  <ArrowDown size={13} className="stroke-[2.5]" />
                </div>
                <span className="text-xs font-semibold">
                  {isGenerating ? 'Generating below...' : 'Scroll to bottom'}
                </span>
                {isGenerating && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Anchored Composer Area (Always visible, shrink-0) */}
        <div className="shrink-0 w-full max-w-3xl mx-auto px-4 pb-4 pt-1 bg-transparent">
          {!user ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Sign in to use Asura AI models</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sign in to access models, web search, reasoning, and save your private chat history.</p>
                </div>
              </div>
              <button
                onClick={() => setAuthOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
              >
                Sign In to Start
              </button>
            </div>
          ) : (
            <div className={`relative rounded-2xl bg-white dark:bg-gray-900 border-2 border-slate-300 dark:border-gray-800 p-3 shadow-lg focus-within:border-cyan-500 dark:focus-within:border-cyan-500/60 transition-all ${isCurrentImg ? 'border-purple-400 dark:border-purple-500/40 focus-within:border-purple-500' : ''}`}>
              {/* ChatGPT-style live response status banner */}
              {isGenerating && (
                <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300 backdrop-blur-sm animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                    </span>
                    <span className="font-medium text-xs">
                      {deepThinkEnabled ? 'Asura DeepThink reasoning in progress...' : webSearchEnabled ? 'Searching real-time cache and formulating answer...' : 'Asura AI is responding...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-[11px] border border-rose-500/30 cursor-pointer transition-colors"
                  >
                    <Square size={10} fill="currentColor" />
                    <span>Stop</span>
                  </button>
                </div>
              )}
              {/* Attachment preview chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2 mb-2 border-b border-slate-200 dark:border-gray-800">
                  {attachments.map((att) => {
                    const isImg = att.mime_type.startsWith('image/');
                    const isPpt = att.filename.toLowerCase().endsWith('.pptx') || att.filename.toLowerCase().endsWith('.ppt');
                    return (
                      <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 text-xs text-slate-800 dark:text-gray-200">
                        {isImg && att.data_url ? (
                          <img src={att.data_url} alt="" className="w-4 h-4 rounded object-cover" />
                        ) : isImg ? (
                          <ImageIcon size={12} className="text-purple-500 dark:text-purple-400" />
                        ) : isPpt ? (
                          <Presentation size={12} className="text-orange-500 dark:text-orange-400" />
                        ) : (
                          <FileText size={12} className="text-cyan-600 dark:text-cyan-400" />
                        )}
                        <span className="truncate max-w-[120px]">{att.filename}</span>
                        <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => removeAttachment(att.id)} />
                      </div>
                    );
                  })}
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isCurrentImg
                    ? `Prompt visual with ${currentModelObj.display_name}...`
                    : webSearchEnabled
                    ? 'Ask anything with live web intelligence...'
                    : deepThinkEnabled
                    ? 'Message with deep reasoning activated...'
                    : 'Message Asura AI by Cretivra...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none resize-none max-h-52 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200 dark:border-gray-800/80">
                <div className="flex items-center gap-1.5">
                  {/* ChatGPT-Style Action Menu (+) Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActionMenuOpen(!actionMenuOpen)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                        actionMenuOpen
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-md rotate-45'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-gray-800/90 hover:bg-slate-200 dark:hover:bg-gray-700 border-slate-300 dark:border-gray-700/60'
                      }`}
                      title="Add photos, files, presentations, sketches, or tools"
                    >
                      <Plus size={16} className="transition-transform duration-200" />
                    </button>

                    <ActionMenu
                      isOpen={actionMenuOpen}
                      onClose={() => setActionMenuOpen(false)}
                      onUploadFile={() => fileInputRef.current?.click()}
                      onOpenLibrary={() => setLibraryModalOpen(true)}
                      onOpenImageStudio={() => setImageStudioOpen(true)}
                      onCreateImage={() => {
                        setInput('Create an image of ');
                        textareaRef.current?.focus();
                      }}
                      onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
                      webSearchActive={webSearchEnabled}
                      onToggleDeepThink={() => setDeepThinkEnabled(!deepThinkEnabled)}
                      deepThinkActive={deepThinkEnabled}
                      onCreatePresentation={() => {
                        setInput('Create a 5-slide presentation on ');
                        textareaRef.current?.focus();
                      }}
                      onCreatePdf={() => {
                        setInput('Generate a comprehensive PDF document for ');
                        textareaRef.current?.focus();
                      }}
                      onOpenSketch={() => setSketchModalOpen(true)}
                      onVisualizeData={() => {
                        setInput('Create an interactive chart and visualization for ');
                        textareaRef.current?.focus();
                      }}
                      onOpenGitHub={() => {
                        setInput('Analyze GitHub repository code and summarize recent commit changes.');
                        textareaRef.current?.focus();
                      }}
                    />
                  </div>

                  {/* File Upload Button */}
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    title="Attach file (PDF, Word, PowerPoint, CSV, Text, Images)"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={15} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach((file) => handleFileUpload(file));
                        e.target.value = '';
                      }
                    }}
                    accept=".pdf,.docx,.pptx,.ppt,.txt,.csv,.md,.png,.jpg,.jpeg,.webp"
                  />

                  {/* Web Search Toggle (Perplexity-style) */}
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      webSearchEnabled
                        ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-500/50 shadow-sm'
                        : 'bg-slate-100 dark:bg-gray-800/50 hover:bg-slate-200 dark:hover:bg-gray-800 border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
                    }`}
                    title={webSearchEnabled ? 'Web search enabled' : 'Toggle real-time web intelligence'}
                  >
                    <Globe size={12} className={webSearchEnabled ? 'text-cyan-600 dark:text-cyan-400 animate-pulse' : ''} />
                    <span>Search</span>
                  </button>

                  {/* Deep Reasoning Toggle (Claude / DeepSeek style) */}
                  <button
                    type="button"
                    onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      deepThinkEnabled
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-500/50 shadow-sm'
                        : 'bg-slate-100 dark:bg-gray-800/50 hover:bg-slate-200 dark:hover:bg-gray-800 border-slate-300 dark:border-gray-700/60 text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
                    }`}
                    title={deepThinkEnabled ? 'Deep reasoning active' : 'Toggle deep step-by-step reasoning'}
                  >
                    <Brain size={12} className={deepThinkEnabled ? 'text-purple-600 dark:text-purple-400' : ''} />
                    <span>DeepThink</span>
                  </button>

                  {/* Image Studio Quick Opener */}
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                    title="Open AI Image Studio"
                    onClick={() => setImageStudioOpen(true)}
                  >
                    <Palette size={15} />
                  </button>
                </div>

                {/* Send or Stop Generation Button */}
                <button
                  type="button"
                  className={`p-2 rounded-xl text-white transition-all cursor-pointer flex items-center justify-center ${
                    isGenerating
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30'
                      : 'bg-slate-900 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-indigo-600 hover:bg-slate-800 dark:hover:opacity-95 shadow-md disabled:bg-slate-200 dark:disabled:bg-gray-800 disabled:text-slate-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed'
                  }`}
                  disabled={!isGenerating && !input.trim() && attachments.length === 0}
                  onClick={() => (isGenerating ? stopGeneration() : handleSend())}
                  title={isGenerating ? 'Stop generating' : 'Send message'}
                >
                  {isGenerating ? <Square size={13} fill="currentColor" /> : <ArrowUp size={15} />}
                </button>
              </div>
            </div>
          )}
          <div className="text-center text-[11px] text-slate-500 dark:text-gray-500 mt-2">
            {isCurrentImg
              ? 'Asura FLUX.1 Art Studio generates visuals in real time at zero cost.'
              : webSearchEnabled
              ? 'Real-time intelligence cache synchronized with 2026 facts.'
              : 'Asura AI by Cretivra processes queries with frontier intelligence. Verify important output.'}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={(id) => {
          loadConversation(id);
          setSearchOpen(false);
        }}
        onSearchQuery={setSearchQuery}
        conversations={conversations}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        models={availableModels}
        onConversationsCleared={() => {
          refreshConversations();
          clearActiveChat();
        }}
        onSettingsSaved={(newSettings: SystemSettings) => {
          if (newSettings.default_model) {
            setSelectedModel(newSettings.default_model);
          }
          if (newSettings.theme) {
            applyTheme(newSettings.theme as ThemeMode);
          }
        }}
      />

      <ShareModal
        isOpen={!!shareId}
        onClose={() => setShareId(null)}
        conversationId={shareId}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={(userData, _token, isNewRegistration) => {
          setUser(userData);
          clearActiveChat();
          refreshConversations();
          if (isNewRegistration) {
            setOnboardingOpen(true);
          }
        }}
      />

      <OnboardingTourModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSelectPrompt={(promptText, modelId) => {
          if (modelId) setSelectedModel(modelId);
          setInput(promptText);
          sendMessage(promptText, modelId || selectedModel);
        }}
      />

      <ImageStudioModal
        isOpen={imageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
        onInsertToChat={(_imageUrl, promptText) => {
          sendMessage(promptText, selectedModel);
        }}
      />

      <SketchModal
        isOpen={sketchModalOpen}
        onClose={() => setSketchModalOpen(false)}
        onAttachSketch={(sketchFile) => {
          handleFileUpload(sketchFile);
        }}
      />

      <LibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onAttachFile={(libFile) => {
          handleFileUpload(libFile);
        }}
        onAttachExisting={(att) => {
          attachExisting(att);
        }}
        recentAttachments={allSessionAttachments}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        subtext={confirmDialog.subtext}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        variant={confirmDialog.variant}
      />

      {/* Floating Lower-Right Suggestion & Commenting Widget */}
      <SuggestionBox user={user} />
    </div>
  );
}

export default App;
