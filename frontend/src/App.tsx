'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
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
  Lightbulb,
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
  Gamepad2,
  Palette,
  LineChart,
  Zap,
  Maximize2,
  Minimize2,
  MessageSquare,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { exportPdf, fetchCurrentUserProfileApi, getAuthToken, updateConversation } from './services/api';
import { initTheme, applyTheme, getResolvedTheme, getStoredTheme, type ThemeMode } from './services/theme';
import { SearchModal } from './components/sidebar/SearchModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ShareModal } from './components/settings/ShareModal';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingTourModal } from './components/onboarding/OnboardingTourModal';
import { ImageStudioModal } from './components/image-studio/ImageStudioModal';
import { SlideGeneratorModal } from './components/landing/SlideGeneratorModal';
import { WebsiteGeneratorModal } from './components/landing/WebsiteGeneratorModal';
import { GameCreatorModal } from './components/landing/GameCreatorModal';
import { SuggestionBox } from './components/feedback/SuggestionBox';
import { IntelligenceCacheCard } from './components/chat/IntelligenceCacheCard';
import { SourceLinksCard } from './components/chat/SourceLinksCard';
import { MarkdownRenderer } from './components/chat/MarkdownRenderer';
import { CretivraMark } from './components/common/CretivraLogo';
import { ConfirmModal } from './components/common/ConfirmModal';
import { ActionMenu } from './components/chat/ActionMenu';
import { SketchModal } from './components/chat/SketchModal';
import { LibraryModal } from './components/chat/LibraryModal';
import { PlaygroundHome } from './playground/PlaygroundHome';
import { TaskWorkspace } from './playground/TaskWorkspace';
import { WorkspaceSidebar, type WorkspaceView } from './components/navigation/WorkspaceSidebar';
import { ContextualHeader } from './components/navigation/ContextualHeader';
import { HomeWorkspace } from './components/landing/HomeWorkspace';
import { GoalComposer } from './components/composer/GoalComposer';
import { AgentWorkspace } from './components/agent/AgentWorkspace';
import { TasksWorkspace } from './components/tasks/TasksWorkspace';
import { ProjectsWorkspace } from './components/projects/ProjectsWorkspace';
import { KnowledgeWorkspace } from './components/knowledge/KnowledgeWorkspace';
import { ArtifactsWorkspace } from './components/artifacts/ArtifactsWorkspace';
import { fetchHealth } from './services/api';
import { startPlaygroundRunApi, type Artifact } from './services/playgroundApi';
import { ModelSelectorModal } from './components/model-selector/ModelSelectorModal';
import { ArtifactPreviewModal } from './components/artifacts/ArtifactPreviewModal';
import { DragAndDropOverlay } from './components/chat/DragAndDropOverlay';
import { AsuraOpeningAnimation } from './components/opening';
import type { Conversation, CretivraModel, SystemSettings, Attachment, HealthStatus } from './types';

const SUGGESTIONS = [
  {
    title: 'Brainstorm ideas',
    sub: 'Innovative product features, strategic plans, or creative campaigns',
    icon: Lightbulb,
    prompt: 'Brainstorm 5 innovative, high-impact product features for a modern AI intelligence workstation platform.',
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

export function App({ initialMode }: { initialMode?: 'chat' | 'playground' } = {}) {
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
  const [imageModeEnabled, setImageModeEnabled] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [sketchModalOpen, setSketchModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [replayOpening, setReplayOpening] = useState(false);

  const handleOpeningComplete = useCallback(() => {
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    }, 60);
  }, []);

  const handleReplayHandled = useCallback(() => {
    setReplayOpening(false);
  }, []);

  // Artifact preview & Drag-and-drop file upload state
  const [previewArtifact, setPreviewArtifact] = useState<Artifact | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

  // Model switching with persistence to active conversation
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    if (activeConversationId) {
      addOrUpdateConversation({ id: activeConversationId, model_id: modelId });
      if (!activeConversationId.startsWith('guest-')) {
        updateConversation(activeConversationId, { model_id: modelId }).catch((err) =>
          console.warn('Failed to update conversation model on server:', err)
        );
      }
    }
  };

  // Window drag and drop listeners for instant file upload
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingFile(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        setIsDraggingFile(false);
        dragCounterRef.current = 0;
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      dragCounterRef.current = 0;
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach((file) => handleFileUpload(file));
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleFileUpload]);

  // Playground Mode & Autonomous Agent state
  const [appMode, setAppMode] = useState<'chat' | 'playground'>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/playground')) return 'playground';
      const p = new URLSearchParams(window.location.search);
      if (p.get('mode') === 'playground') return 'playground';
    }
    return 'chat';
  });

  const [activePlaygroundRunId, setActivePlaygroundRunId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('run') || null;
    }
    return null;
  });

  const [playgroundPrompt, setPlaygroundPrompt] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('prompt') || '';
    }
    return '';
  });

  const handleRunInPlayground = (promptText: string, openInNewTab: boolean = false) => {
    if (openInNewTab && typeof window !== 'undefined') {
      window.open(`/playground?prompt=${encodeURIComponent(promptText)}`, '_blank');
      return;
    }
    setPlaygroundPrompt(promptText);
    setActivePlaygroundRunId(null);
    setAppMode('playground');
  };

  const handleNewPlaygroundRun = () => {
    setPlaygroundPrompt('');
    setActivePlaygroundRunId(null);
    setAppMode('playground');
    setWorkspaceView('playground');
  };

  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(() => {
    if (initialMode === 'playground') return 'playground';
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('run')) return 'agent_workspace' as any;
      if (window.location.pathname.startsWith('/playground') || p.get('mode') === 'playground') return 'playground';
      if (window.location.pathname.startsWith('/tasks')) return 'tasks';
      if (window.location.pathname.startsWith('/projects')) return 'projects';
      if (window.location.pathname.startsWith('/knowledge')) return 'knowledge';
      if (window.location.pathname.startsWith('/artifacts')) return 'artifacts';
      if (window.location.pathname.startsWith('/chat')) return 'chat';
    }
    return 'home';
  });

  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return getResolvedTheme(getStoredTheme());
  });

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  const loadHealth = useCallback(async () => {
    try {
      const h = await fetchHealth();
      setHealthStatus(h);
    } catch (e) {
      console.warn('Health check non-fatal:', e);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleGoalSubmit = async (promptOverride?: string) => {
    const promptToRun = promptOverride || input;
    if (!promptToRun.trim() && attachments.length === 0) return;

    const cleanPrompt = promptToRun.trim();
    const lower = cleanPrompt.toLowerCase();

    // Intelligent task detection (Part 64)
    const isAgentTask =
      deepThinkEnabled ||
      attachments.length > 0 ||
      lower.startsWith('build') ||
      lower.startsWith('research') ||
      lower.startsWith('create a presentation') ||
      lower.startsWith('find customers') ||
      lower.startsWith('analyze') ||
      lower.includes('landing page') ||
      lower.includes('website') ||
      lower.includes('report') ||
      lower.includes('presentation') ||
      lower.includes('slides') ||
      lower.includes('lead');

    if (isAgentTask) {
      try {
        setInput('');
        const res = await startPlaygroundRunApi({
          prompt: cleanPrompt,
          model_id: selectedModel,
        });
        setActivePlaygroundRunId(res.run_id);
        setWorkspaceView('agent_workspace' as any);
      } catch (e) {
        console.warn('Fallback to chat execution:', e);
        setWorkspaceView('chat');
        sendMessage(cleanPrompt, selectedModel, webSearchEnabled, deepThinkEnabled, imageModeEnabled);
      }
    } else {
      setInput('');
      setWorkspaceView('chat');
      sendMessage(cleanPrompt, selectedModel, webSearchEnabled, deepThinkEnabled, imageModeEnabled);
    }
  };

  const handleNewTask = () => {
    setInput('');
    clearActiveChat();
    setActivePlaygroundRunId(null);
    setWorkspaceView('home');
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
    setWorkspaceView('chat');
  };

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
  const [expandedMsgIds, setExpandedMsgIds] = useState<Set<string>>(new Set());

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

  const contextTitle = useMemo(() => {
    if (workspaceView === 'home') return undefined;
    if (workspaceView === 'tasks') return 'Tasks';
    if (workspaceView === 'projects') return 'Projects';
    if (workspaceView === 'knowledge') return 'Knowledge';
    if (workspaceView === 'artifacts') return 'Artifacts';
    if (workspaceView === 'playground') return 'Playground';
    if (workspaceView === 'agent_workspace') return 'Agent Workspace';
    if (workspaceView === 'chat') return activeChatTitle;
    return undefined;
  }, [workspaceView, activeChatTitle]);

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

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure scroll-to-bottom indicator is never shown on initial landing view
  useEffect(() => {
    if (messages.length === 0) {
      setShowScrollBottom(false);
      isUserScrolledUpRef.current = false;
    }
  }, [messages.length]);

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

  // Listen for tasks queued from Manus Landing Page
  useEffect(() => {
    try {
      const queuedPrompt = sessionStorage.getItem('asura_initial_prompt');
      if (queuedPrompt) {
        sessionStorage.removeItem('asura_initial_prompt');
        const initialAttsStr = sessionStorage.getItem('asura_initial_attachments');
        if (initialAttsStr) {
          sessionStorage.removeItem('asura_initial_attachments');
          try {
            const parsed = JSON.parse(initialAttsStr);
            if (Array.isArray(parsed)) {
              parsed.forEach((att: Attachment) => attachExisting(att));
            }
          } catch {}
        }
        setTimeout(() => {
          sendMessage(queuedPrompt);
        }, 150);
      }
    } catch {}
  }, [sendMessage, attachExisting]);

  // Listen for direct URL requests to open Image Studio (?studio=image or #image-studio)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrlForStudio = () => {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      if (search.includes('studio=image') || hash === '#image-studio') {
        setImageStudioOpen(true);
      }
    };

    checkUrlForStudio();
    window.addEventListener('hashchange', checkUrlForStudio);

    const handleOpenStudioEvent = () => setImageStudioOpen(true);
    window.addEventListener('open-image-studio', handleOpenStudioEvent);

    return () => {
      window.removeEventListener('hashchange', checkUrlForStudio);
      window.removeEventListener('open-image-studio', handleOpenStudioEvent);
    };
  }, []);

  // Validate authentication session with backend on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetchCurrentUserProfileApi()
      .then((profile) => {
        setUser(profile);
        try {
          localStorage.setItem('cretivra_user', JSON.stringify(profile));
        } catch {}
      })
      .catch((err) => {
        console.warn('Stored session is invalid or user was deleted from database:', err);
        try {
          localStorage.removeItem('cretivra_auth_token');
          localStorage.removeItem('cretivra_user');
        } catch {}
        setUser(null);
        setAuthOpen(true);
      });
  }, []);

  // Listen for unauthorized 401 broadcast events from API / streaming calls
  useEffect(() => {
    const handleUnauthorized = () => {
      try {
        localStorage.removeItem('cretivra_auth_token');
        localStorage.removeItem('cretivra_user');
      } catch {}
      setUser(null);
      setAuthOpen(true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
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
    if (isLanding || !scrollRef.current) {
      setShowScrollBottom(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom <= 80) {
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
    } else if (distanceFromBottom > 200 && e.deltaY < 0) {
      isUserScrolledUpRef.current = true;
      setShowScrollBottom(true);
    }
  };

  const handleUserTouchMove = () => {
    if (isLanding || !scrollRef.current) {
      setShowScrollBottom(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom <= 80) {
      isUserScrolledUpRef.current = false;
      setShowScrollBottom(false);
    } else if (distanceFromBottom > 200) {
      isUserScrolledUpRef.current = true;
      setShowScrollBottom(true);
    }
  };

  // Scroll listener for "Scroll to bottom" button & position tracking (ChatGPT-style)
  const handleChatScroll = () => {
    if (!scrollRef.current || isLanding) {
      if (showScrollBottom) setShowScrollBottom(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If within 80px of the bottom, user is effectively at the bottom
    if (distanceFromBottom <= 80) {
      isUserScrolledUpRef.current = false;
      if (showScrollBottom) setShowScrollBottom(false);
      return;
    }

    // Only show button if user has scrolled up significantly (more than 200px)
    if (distanceFromBottom > 200) {
      isUserScrolledUpRef.current = true;
      if (!showScrollBottom) setShowScrollBottom(true);
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
    return (
      m.category === 'Image Studio' ||
      m.capabilities?.includes('image') ||
      m.provider === 'pollinations' ||
      m.provider === 'vision_studio'
    );
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

  const renderComposer = (isCenter: boolean = false) => {
    return (
      <div className={`w-full ${isCenter ? 'relative' : ''}`}>
        <div className={isCenter ? 'relative w-full group' : ''}>
          {isCenter && <div className="cv-search-glow-aura" />}
          <div
            className={`relative z-10 transition-all ${
              isCenter
                ? 'rounded-[28px] bg-white dark:bg-[#111520] border border-slate-200/90 dark:border-gray-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] focus-within:border-slate-400 dark:focus-within:border-gray-600 focus-within:shadow-[0_12px_36px_rgb(0,0,0,0.09)] p-4 sm:p-5'
                : isCurrentImg
                ? 'rounded-2xl bg-white dark:bg-gray-900 border-2 border-purple-400 dark:border-purple-500/40 focus-within:border-purple-500 p-3 sm:p-3.5'
                : 'rounded-2xl bg-white dark:bg-gray-900 border-2 border-slate-300 dark:border-gray-800 focus-within:border-cyan-500 dark:focus-within:border-cyan-500/60 shadow-lg p-3 sm:p-3.5'
            }`}
          >
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
                rows={isCenter ? 2 : 1}
                placeholder={
                  isCenter
                    ? 'Assign a task or ask anything'
                    : isCurrentImg
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
                className={`w-full bg-transparent text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none resize-none leading-relaxed ${
                  isCenter ? 'text-base sm:text-[17px] min-h-[70px] max-h-60' : 'text-sm max-h-52'
                }`}
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
                      onOpenPlayground={() => handleRunInPlayground(input.trim())}
                    />
                  </div>

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

                  {/* Autonomous Playground Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (input.trim()) {
                        handleRunInPlayground(input.trim());
                      } else {
                        setAppMode('playground');
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30 hover:border-violet-500/60 shadow-xs"
                    title="Switch to Autonomous Playground or execute current prompt as an agent task"
                  >
                    <Zap size={12} className="text-violet-500 dark:text-violet-400" />
                    <span>Playground</span>
                  </button>
                </div>

                {/* Send or Stop Generation Button */}
                <button
                  type="button"
                  className={`transition-all cursor-pointer flex items-center justify-center ${
                    isCenter ? 'w-9 h-9 rounded-full' : 'p-2 rounded-xl text-white'
                  } ${
                    isGenerating
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-md text-white'
                      : isCenter
                      ? input.trim() || attachments.length > 0
                        ? 'bg-[#18181b] hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-950 shadow-sm scale-100'
                        : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-600 cursor-not-allowed scale-95'
                      : 'bg-slate-900 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-indigo-600 hover:bg-slate-800 dark:hover:opacity-95 shadow-md disabled:bg-slate-200 dark:disabled:bg-gray-800 disabled:text-slate-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-white'
                  }`}
                  disabled={!isGenerating && !input.trim() && attachments.length === 0}
                  onClick={() => (isGenerating ? stopGeneration() : handleSend())}
                  title={isGenerating ? 'Stop generating' : 'Send message (Enter)'}
                >
                  {isGenerating ? <Square size={13} fill="currentColor" /> : <ArrowUp size={isCenter ? 18 : 15} />}
                </button>
              </div>
            </div>
          </div>
        {!isCenter && (
          <div className="text-center text-[11px] text-slate-500 dark:text-gray-500 mt-2">
            {isCurrentImg
              ? 'Asura FLUX.1 Art Studio generates visuals in real time at zero cost.'
              : webSearchEnabled
              ? 'Real-time intelligence cache synchronized with 2026 facts.'
              : 'Asura AI by Cretivra processes queries with frontier intelligence. Verify important output.'}
          </div>
        )}
      </div>
    );
  };  return (
    <div className="flex h-[100dvh] w-full max-h-[100dvh] bg-[#060911] text-[#E7EAF4] overflow-hidden font-sans relative">
      {/* Background Ambient Glowing Orbs (Part 49) */}
      <div
        className="asura-ambient-orb w-[500px] h-[500px] bg-[#06B6D4] top-[-150px] left-[15%]"
        aria-hidden="true"
      />
      <div
        className="asura-ambient-orb w-[550px] h-[550px] bg-[#8B5CF6] bottom-[-150px] right-[10%]"
        aria-hidden="true"
      />

      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden animate-fade"
        />
      )}

      {/* Asura Workspace Sidebar (Part 10) */}
      <WorkspaceSidebar
        currentView={workspaceView}
        onSelectView={(v) => {
          setWorkspaceView(v);
          if (v === 'playground') setAppMode('playground');
          else if (v === 'chat') setAppMode('chat');
        }}
        isCollapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
        onNewTask={handleNewTask}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onPinConversation={togglePin}
        isPinned={isPinned}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        onShareConversation={(id) => setShareId(id)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        {/* Contextual Header (Part 11) */}
        <ContextualHeader
          currentView={workspaceView}
          contextTitle={contextTitle}
          isGenerating={isGenerating}
          onStopGeneration={stopGeneration}
          selectedModel={selectedModel}
          availableModels={availableModels}
          onSelectModel={handleSelectModel}
          onOpenModelSelector={() => setModelOpen(true)}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
          deepThinkEnabled={deepThinkEnabled}
          onToggleDeepThink={() => setDeepThinkEnabled(!deepThinkEnabled)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          healthStatus={healthStatus}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMobileMenu={() => setSidebarOpen(true)}
          onReplayAnimation={() => setReplayOpening(true)}
          taskStatus={activePlaygroundRunId ? 'RUNNING' : undefined}
          onPlaygroundRun={() => {}}
          onPlaygroundSave={() => {}}
        />

        {/* Global Error Banner */}
        {chatError && (
          <div className="bg-[#F43F5E]/15 border-b border-[#F43F5E]/30 px-4 py-2 flex items-center justify-between text-xs text-[#F43F5E]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#F43F5E]" />
              <span>{chatError}</span>
            </div>
            <button
              onClick={() => {
                const lastUser = [...messages].reverse().find((msg) => msg.role === 'user');
                if (lastUser) sendMessage(lastUser.content, selectedModel, webSearchEnabled, deepThinkEnabled, imageModeEnabled);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#F43F5E]/20 hover:bg-[#F43F5E]/30 text-white font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Dynamic View Router */}
        {workspaceView === 'home' && (
          <HomeWorkspace
            input={input}
            onInputChange={setInput}
            onSubmit={handleGoalSubmit}
            isGenerating={isGenerating}
            onStop={stopGeneration}
            attachments={attachments}
            onUploadFile={handleFileUpload}
            onRemoveAttachment={removeAttachment}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
            deepThinkEnabled={deepThinkEnabled}
            onToggleDeepThink={() => setDeepThinkEnabled(!deepThinkEnabled)}
            imageModeEnabled={imageModeEnabled}
            onToggleImageMode={() => setImageModeEnabled(!imageModeEnabled)}
            onOpenImageStudio={() => setImageStudioOpen(true)}
            selectedModel={selectedModel}
            availableModels={availableModels}
            onSelectModel={handleSelectModel}
            onOpenModelSelector={() => setModelOpen(true)}
            onOpenSketch={() => setSketchModalOpen(true)}
            onOpenLibrary={() => setLibraryModalOpen(true)}
            onOpenSlides={() => setSlideModalOpen(true)}
            onOpenWebsite={() => setWebsiteModalOpen(true)}
            onOpenGame={() => setGameModalOpen(true)}
          />
        )}

        {workspaceView === 'agent_workspace' && (
          <AgentWorkspace
            runId={activePlaygroundRunId || ''}
            onBackToHome={() => setWorkspaceView('home')}
          />
        )}

        {workspaceView === 'tasks' && (
          <TasksWorkspace
            onSelectRun={(runId) => {
              setActivePlaygroundRunId(runId);
              setWorkspaceView('agent_workspace' as any);
            }}
            onNewTask={handleNewTask}
          />
        )}

        {workspaceView === 'projects' && (
          <ProjectsWorkspace
            onSelectProject={(_projId) => {
              setWorkspaceView('playground');
            }}
            onNewTaskWithProject={(_projId) => {
              setWorkspaceView('home');
            }}
          />
        )}

        {workspaceView === 'knowledge' && (
          <KnowledgeWorkspace
            onAskAsura={(prompt) => {
              setInput(prompt);
              setWorkspaceView('home');
            }}
            onUploadFile={handleFileUpload}
          />
        )}

        {workspaceView === 'artifacts' && (
          <ArtifactsWorkspace
            onPreviewArtifact={(art) => setPreviewArtifact(art)}
          />
        )}

        {workspaceView === 'playground' && (
          activePlaygroundRunId ? (
            <TaskWorkspace
              runId={activePlaygroundRunId}
              onBackToHome={() => {
                setActivePlaygroundRunId(null);
                setWorkspaceView('home');
              }}
            />
          ) : (
            <PlaygroundHome
              onStartRun={(runId) => {
                setActivePlaygroundRunId(runId);
              }}
              initialPrompt={playgroundPrompt}
            />
          )
        )}

        {workspaceView === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Scrollable Message Feed */}
            <div
              className="flex-1 min-h-0 overflow-y-auto relative flex flex-col p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#232D45]"
              ref={scrollRef}
              onScroll={handleChatScroll}
              onWheel={handleUserWheel}
              onTouchMove={handleUserTouchMove}
            >
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8891A8]">
                  <p className="text-sm">Conversation is empty. Ask a question or start a task.</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={m.id || i} className="w-full max-w-4xl mx-auto">
                    {m.role === 'user' ? (
                      <div className="flex justify-end group">
                        {editingUserMsgId === m.id ? (
                          <div className="flex flex-col gap-2 w-full max-w-2xl bg-[var(--surface-secondary)] border border-[#06B6D4]/50 rounded-2xl p-4 shadow-sm">
                            <textarea
                              value={editUserText}
                              onChange={(e) => setEditUserText(e.target.value)}
                              className="w-full bg-transparent text-sm text-[var(--foreground)] focus:outline-none resize-none leading-relaxed"
                              rows={Math.min(8, Math.max(2, editUserText.split('\n').length))}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                              <button
                                onClick={() => setEditingUserMsgId(null)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEditUser(m.id)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#06B6D4] text-black hover:bg-[#06B6D4]/90 transition-colors shadow-xs"
                              >
                                Save & Submit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 max-w-2xl">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-1.5">
                              <button
                                onClick={() => handleStartEditUser(m.id, m.content)}
                                className="p-1 text-[var(--muted-foreground)] hover:text-[#06B6D4] transition-colors"
                                title="Edit prompt"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(m.id)}
                                className="p-1 text-[var(--muted-foreground)] hover:text-[#F43F5E] transition-colors"
                                title="Delete message"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div className="bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm">
                              {m.content}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3.5 group">
                        <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shrink-0 mt-1">
                          <CretivraMark size={15} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                            <span className="font-semibold text-[var(--foreground)]">Asura</span>
                          </div>

                          <IntelligenceCacheCard
                            reasoningStatus={m.reasoning_status}
                            isGenerating={isGenerating && i === messages.length - 1}
                            cacheItems={m.cache_items}
                          />
                          <SourceLinksCard sources={m.sources} messageContent={m.content} />

                          <div className="text-[15px] leading-relaxed text-[var(--foreground)]">
                            <MarkdownRenderer content={m.content} />
                          </div>

                          {/* Assistant Hover Action Toolbar */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-1 text-[var(--muted-foreground)]">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.content);
                                setCopiedMsgId(m.id || String(i));
                                setTimeout(() => setCopiedMsgId(null), 2000);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-colors"
                              title="Copy response"
                            >
                              {copiedMsgId === (m.id || String(i)) ? (
                                <Check size={13} className="text-[#10B981]" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                            <button
                              onClick={() => handleSpeakMessage(m.id || String(i), m.content)}
                              className={`p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors ${
                                speakingMsgId === (m.id || String(i)) ? 'text-[#06B6D4]' : 'hover:text-[var(--foreground)]'
                              }`}
                              title={speakingMsgId === (m.id || String(i)) ? 'Stop reading' : 'Read aloud'}
                            >
                              {speakingMsgId === (m.id || String(i)) ? (
                                <VolumeX size={13} />
                              ) : (
                                <Volume2 size={13} />
                              )}
                            </button>
                            <button
                              onClick={() => regenerateMessage(m.id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-colors"
                              title="Regenerate response"
                            >
                              <RotateCw size={13} />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const title = activeChatTitle || 'Asura Intelligence Report';
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
                              className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] transition-colors"
                              title="Export to PDF"
                            >
                              <FileText size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
            </div>

            {/* Jump to latest button */}
            {showScrollBottom && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-enter">
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] shadow-lg text-xs text-[var(--foreground)] hover:bg-[var(--surface)] transition-all"
                >
                  <ArrowDown size={13} />
                  <span>Jump to latest</span>
                </button>
              </div>
            )}

            {/* Bottom Anchored Composer */}
            <div className="p-4 bg-[var(--background)]/90 backdrop-blur-md border-t border-[var(--border)] shrink-0">
              <GoalComposer
                input={input}
                onInputChange={setInput}
                onSubmit={() => {
                  if (input.trim() || attachments.length > 0) {
                    sendMessage(input, selectedModel, webSearchEnabled, deepThinkEnabled, imageModeEnabled);
                    setInput('');
                  }
                }}
                isGenerating={isGenerating}
                onStop={stopGeneration}
                placeholder="Ask Asura anything..."
                attachments={attachments}
                onUploadFile={handleFileUpload}
                onRemoveAttachment={removeAttachment}
                webSearchEnabled={webSearchEnabled}
                onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
                deepThinkEnabled={deepThinkEnabled}
                onToggleDeepThink={() => setDeepThinkEnabled(!deepThinkEnabled)}
                imageModeEnabled={imageModeEnabled}
                onToggleImageMode={() => setImageModeEnabled(!imageModeEnabled)}
                onOpenImageStudio={() => setImageStudioOpen(true)}
                selectedModel={selectedModel}
                availableModels={availableModels}
                onSelectModel={handleSelectModel}
                onOpenModelSelector={() => setModelOpen(true)}
                onOpenSketch={() => setSketchModalOpen(true)}
                onOpenLibrary={() => setLibraryModalOpen(true)}
                onOpenSlides={() => setSlideModalOpen(true)}
                onOpenWebsite={() => setWebsiteModalOpen(true)}
                onOpenGame={() => setGameModalOpen(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={(id) => {
          loadConversation(id);
          setWorkspaceView('chat');
          setSearchOpen(false);
        }}
        onSearchQuery={setSearchQuery}
        conversations={conversations}
        onNavigateView={(v) => setWorkspaceView(v as WorkspaceView)}
        onNewTask={handleNewTask}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenImageStudio={() => setImageStudioOpen(true)}
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
            setTheme(getResolvedTheme(newSettings.theme as ThemeMode));
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

      <SlideGeneratorModal
        isOpen={slideModalOpen}
        onClose={() => setSlideModalOpen(false)}
        onGenerateWithAgent={(prompt) => {
          handleSend(prompt);
        }}
      />

      <WebsiteGeneratorModal
        isOpen={websiteModalOpen}
        onClose={() => setWebsiteModalOpen(false)}
        onGenerateWithAgent={(prompt) => {
          handleSend(prompt);
        }}
      />

      <GameCreatorModal
        isOpen={gameModalOpen}
        onClose={() => setGameModalOpen(false)}
        onGenerateWithAgent={(prompt) => {
          handleSend(prompt);
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

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={modelOpen}
        onClose={() => setModelOpen(false)}
        models={availableModels}
        selectedModelId={selectedModel}
        onSelectModel={handleSelectModel}
      />

      {/* Artifact Deliverable Preview Modal */}
      <ArtifactPreviewModal
        isOpen={!!previewArtifact}
        onClose={() => setPreviewArtifact(null)}
        artifact={previewArtifact}
      />

      {/* Drag & Drop File Upload Overlay */}
      <DragAndDropOverlay isDragging={isDraggingFile} />

      {/* Floating Lower-Right Suggestion & Commenting Widget */}
      <SuggestionBox user={user} />

      {/* Asura Cinematic Opening Animation & Intelligence Core Gate */}
      <AsuraOpeningAnimation
        isAppReady={availableModels.length > 0}
        forceReplay={replayOpening}
        onReplayHandled={handleReplayHandled}
        onComplete={handleOpeningComplete}
      />
    </div>
  );
}

export default App;
