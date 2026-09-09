'use client';

import { useState, useRef, useEffect } from 'react';
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
  FileText,
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
} from 'lucide-react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { initTheme } from './services/theme';
import { SearchModal } from './components/sidebar/SearchModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ShareModal } from './components/settings/ShareModal';
import { AuthModal } from './components/auth/AuthModal';
import { ImageStudioModal } from './components/image-studio/ImageStudioModal';
import { SuggestionBox } from './components/feedback/SuggestionBox';
import { IntelligenceCacheCard } from './components/chat/IntelligenceCacheCard';
import { MarkdownRenderer } from './components/chat/MarkdownRenderer';
import { CretivraMark } from './components/common/CretivraLogo';
import type { Conversation, CretivraModel } from './types';

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
      const saved = localStorage.getItem("cretivra_user");
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
    deleteConversation,
    bulkDeleteConversations,
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
    stopGeneration,
    handleFileUpload,
    removeAttachment,
    deleteSingleMessage,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [imageStudioOpen, setImageStudioOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'good' | 'bad'>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme on mount
  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Auto-scroll on new message / token stream
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Cmd+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setModelOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSend = (textToSend?: string) => {
    const content = (textToSend ?? input).trim();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if ((content || attachments.length > 0) && !isGenerating) {
      sendMessage(content, selectedModel);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleNewChat = async () => {
    clearActiveChat();
    const newConv = await createNew(selectedModel);
    loadConversation(newConv.id);
  };

  const handleDeleteActiveChat = async () => {
    if (!activeConversationId) return;
    if (window.confirm('Delete this chat history? All messages will be permanently removed.')) {
      await deleteConversation(activeConversationId);
      clearActiveChat();
    }
  };

  const handleDeleteSingleConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(id);
      if (activeConversationId === id) {
        clearActiveChat();
      }
    }
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

  const handleExecuteBulkDelete = async () => {
    if (selectedChatIds.size === 0) return;
    if (window.confirm(`Delete ${selectedChatIds.size} selected conversations? This cannot be undone.`)) {
      await bulkDeleteConversations(Array.from(selectedChatIds));
      if (activeConversationId && selectedChatIds.has(activeConversationId)) {
        clearActiveChat();
      }
      setSelectedChatIds(new Set());
      setSelectMode(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (window.confirm('Delete this message from your chat history?')) {
      await deleteSingleMessage(msgId);
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

  const handleRegenerateFrom = (msgIndex: number) => {
    const lastUser = messages.slice(0, msgIndex).reverse().find((msg) => msg.role === 'user');
    if (lastUser) {
      sendMessage(lastUser.content);
    }
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

      {/* Sidebar */}
      <div className={`cv-sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="cv-sb-head">
          <CretivraMark size={22} />
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>Asura AI by Cretivra</span>
          <div style={{ flex: 1 }} />
          <button className="cv-icon-btn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar">
            <PanelLeftClose size={15} />
          </button>
        </div>
        <div style={{ padding: '10px 12px 0' }}>
          <button className="cv-new-chat" onClick={handleNewChat}>
            <Plus size={15} /> New chat
          </button>
        </div>

        {/* Search & Select Mode Toggle Bar */}
        <div className="flex items-center gap-1.5 px-3 py-1 mt-2">
          <div className="cv-sb-search flex-1 m-0" onClick={() => setSearchOpen(true)}>
            <Search size={13} /> Search chats <span style={{ marginLeft: 'auto', opacity: 0.6 }}>⌘K</span>
          </div>
          <button
            className={`cv-icon-btn shrink-0 ${selectMode ? 'text-cyan-400 bg-cyan-950/50 border-cyan-500/40' : ''}`}
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

        <div className="cv-sb-scroll flex flex-col">
          {!user ? (
            <div className="p-4 text-center flex flex-col items-center justify-center gap-2.5 my-auto text-slate-400">
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 shadow-sm">
                <Brain size={16} />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-200">Sign in for chat history</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Your conversations are privately encrypted and synced to your account.
                </div>
              </div>
              <button
                onClick={() => setAuthOpen(true)}
                className="mt-1 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-white font-medium text-xs shadow transition-all cursor-pointer"
              >
                Sign In
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 my-auto">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]: [string, Conversation[]]) => (
              items.length > 0 && (
                <div key={group}>
                  <div className="cv-sb-group-label">{group.replace('_', ' ')}</div>
                  {items.map((conv) => {
                    const isSelected = selectedChatIds.has(conv.id);
                    const isActive = conv.id === activeConversationId;
                    return (
                      <div
                        key={conv.id}
                        className={`cv-sb-item group flex items-center justify-between ${isActive ? 'active' : ''} ${
                          isSelected ? 'bg-cyan-950/40 border border-cyan-500/30' : ''
                        }`}
                        onClick={() => (selectMode ? handleToggleSelectChat({ stopPropagation: () => {} } as any, conv.id) : loadConversation(conv.id))}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {selectMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleSelectChat(e as any, conv.id)}
                              className="rounded border-gray-700 text-cyan-500 focus:ring-0 cursor-pointer"
                            />
                          )}
                          <span className="truncate">{conv.title}</span>
                        </div>
                        {!selectMode && (
                          <button
                            onClick={(e) => handleDeleteSingleConv(e, conv.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-400 transition-opacity cursor-pointer shrink-0"
                            title="Delete chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="cv-main flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <div className="cv-header">
          {!sidebarOpen && (
            <button className="cv-icon-btn" onClick={() => setSidebarOpen(true)} title="Expand sidebar">
              <PanelLeftOpen size={15} />
            </button>
          )}
          <div className="cv-brand">
            {!sidebarOpen && <CretivraMark size={20} />}
            <span className="cv-gradient-text">Asura AI by Cretivra</span>
          </div>

          {/* Model Selector Pill */}
          <div style={{ position: 'relative' }}>
            <div
              className={`cv-model-pill ${isCurrentImg ? 'cv-model-pill-image' : ''}`}
              onClick={() => setModelOpen((o) => !o)}
            >
              {isCurrentImg ? (
                <Palette size={13} className="cv-model-icon-img shrink-0" />
              ) : (
                <Brain size={13} className="cv-model-icon-brain shrink-0" />
              )}
              <span>{currentModelObj.display_name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isCurrentImg ? 'cv-badge-purple' : 'cv-badge-cyan'}`}>
                {currentModelObj.category}
              </span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </div>

            {modelOpen && (
              <div className="cv-glass cv-model-menu w-80 max-h-96 overflow-y-auto">
                {/* Language Models */}
                {languageModels.length > 0 && (
                  <div className="p-1">
                    <div className="cv-model-menu-section-header cv-section-cyan">
                      💬 Language & Reasoning
                    </div>
                    {languageModels.map((m) => (
                      <div
                        key={m.id}
                        className={`cv-model-opt ${m.id === selectedModel ? 'cv-model-opt-active-cyan' : ''}`}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModelOpen(false);
                        }}
                      >
                        <div className="cv-model-opt-icon cv-model-icon-box-cyan">
                          <Brain size={14} />
                        </div>
                        <div>
                          <div className="cv-model-opt-name flex items-center gap-1.5">
                            <span>{m.display_name}</span>
                            <span className="cv-model-badge-sub">
                              {m.category}
                            </span>
                          </div>
                          <div className="cv-model-opt-tag">{m.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Generation Models */}
                {imageModels.length > 0 && (
                  <div className="p-1 border-t cv-model-divider mt-1">
                    <div className="cv-model-menu-section-header cv-section-purple flex items-center gap-1">
                      <Palette size={12} />
                      <span>🎨 AI Image Generation Studio</span>
                    </div>
                    {imageModels.map((m) => (
                      <div
                        key={m.id}
                        className={`cv-model-opt ${m.id === selectedModel ? 'cv-model-opt-active-purple' : ''}`}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModelOpen(false);
                        }}
                      >
                        <div className="cv-model-opt-icon cv-model-icon-box-purple">
                          <Palette size={14} />
                        </div>
                        <div>
                          <div className="cv-model-opt-name flex items-center gap-1.5">
                            <span className="cv-model-name-purple">{m.display_name}</span>
                            <span className="cv-badge-purple text-[9px] px-1 py-0.2 rounded font-mono">
                              FLUX/SDXL
                            </span>
                          </div>
                          <div className="cv-model-opt-tag">{m.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="cv-header-spacer" />

          {/* Dedicated Image Studio Button */}
          <button
            onClick={() => setImageStudioOpen(true)}
            className="cv-header-btn-studio"
            title="Open Cretivra Image Generation Studio"
          >
            <Palette size={13} className="shrink-0" />
            <span>Image Studio</span>
          </button>

          {/* Test Bench / Arena Button */}
          <a
            href="/test-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="cv-header-btn-bench"
            title="Open Model Test Bench & Performance Arena"
          >
            <Scale size={13} className="shrink-0" />
            <span>Test Bench</span>
          </a>

          {/* Action buttons */}
          {activeConversationId && (
            <>
              <button className="cv-icon-btn" title="Share conversation" onClick={() => setShareId(activeConversationId)}>
                <Share2 size={15} />
              </button>
              <button
                className="cv-icon-btn hover:text-rose-400"
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
              onClick={() => {
                if (confirm(`Logged in as ${user.email}. Do you want to sign out?`)) {
                  localStorage.removeItem("cretivra_auth_token");
                  localStorage.removeItem("cretivra_user");
                  setUser(null);
                  clearActiveChat();
                  refreshConversations();
                }
              }}
              className="cv-user-pill"
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

          <button className="cv-icon-btn" title="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={15} />
          </button>
        </div>

        {/* Error Banner */}
        {chatError && (
          <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{chatError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-900 text-white font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Landing or Chat View */}
        {isLanding ? (
          <div className="cv-landing flex-1">
            <CretivraMark size={48} />
            <div className="cv-greeting">What can I help with today?</div>
            <div className="cv-cards">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  className="cv-card"
                  onClick={() => {
                    if (s.title === 'Generate an AI Image') {
                      setSelectedModel('cretivra-flux');
                    }
                    handleSend(s.prompt);
                  }}
                >
                  <s.icon size={15} color={s.title === 'Generate an AI Image' ? '#c084fc' : '#06b6d4'} style={{ marginBottom: 6 }} />
                  <div className="cv-card-title">{s.title}</div>
                  <div className="cv-card-sub">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="cv-chat-scroll flex-1" ref={scrollRef}>
            {messages.map((m, i) => (
              <div className="cv-msg-row" key={m.id || i}>
                {m.role === 'user' ? (
                  <div className="cv-msg-user group relative flex flex-col items-end">
                    {/* User attachments if present */}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2 justify-end">
                        {m.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300"
                          >
                            <FileText size={12} className="text-cyan-400" />
                            <span className="truncate max-w-[120px]">{att.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-rose-400 cursor-pointer"
                        title="Delete message from history"
                      >
                        <Trash2 size={12} />
                      </button>
                      <div className="cv-msg-user-bubble">{m.content}</div>
                    </div>
                  </div>
                ) : (
                  <div className="cv-msg-assistant group relative">
                    {/* Assistant Header: Model Identifier & Brand Badge */}
                    <div className="flex items-center justify-between mb-2 text-xs select-none">
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

                    <IntelligenceCacheCard
                      reasoningStatus={m.reasoning_status}
                      isGenerating={isGenerating && i === messages.length - 1}
                      cacheItems={m.cache_items}
                      userQuery={i > 0 && messages[i - 1]?.role === 'user' ? messages[i - 1].content : undefined}
                    />

                    {m.content ? (
                      <div className="relative">
                        <MarkdownRenderer content={m.content} />
                        {isGenerating && i === messages.length - 1 && <span className="cv-cursor" />}
                      </div>
                    ) : isGenerating && i === messages.length - 1 ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2 animate-pulse">
                        <Sparkles size={13} className="animate-spin text-cyan-500 dark:text-cyan-400" />
                        <span>Formulating response...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-xs text-amber-500 dark:text-amber-400">
                        <AlertCircle size={13} />
                        <span>No response received.</span>
                        <button
                          onClick={() => handleRegenerateFrom(i)}
                          className="underline font-semibold hover:text-amber-400 ml-1 cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Assistant Action Toolbar (ChatGPT / Claude / Gemini style) */}
                    {m.content && (
                      <div className="flex items-center gap-1.5 pt-3 mt-2 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/50 select-none">
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

                        {/* Good Response */}
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

                        {/* Bad Response */}
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

                        {/* Regenerate */}
                        <button
                          disabled={isGenerating}
                          onClick={() => handleRegenerateFrom(i)}
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

                        <div className="flex-1" />

                        {/* Delete message */}
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
          </div>
        )}

        {/* Global Chat Error Banner */}
        {chatError && (
          <div className="max-w-[820px] mx-auto px-4 py-2 mb-2 flex items-center justify-between gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{chatError}</span>
            </div>
            <button
              onClick={() => {
                const lastUser = [...messages].reverse().find(msg => msg.role === 'user');
                if (lastUser) sendMessage(lastUser.content);
              }}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Floating Composer */}
        <div className="cv-composer-wrap">
          <div className={`cv-composer ${isCurrentImg ? 'border-purple-500/40 focus-within:border-purple-400' : ''}`}>
            {/* Attachment preview chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 mb-2 border-b border-gray-800">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800 text-xs text-gray-200">
                    {att.mime_type.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                    <span className="truncate max-w-[120px]">{att.filename}</span>
                    <X size={12} className="cursor-pointer hover:text-white" onClick={() => removeAttachment(att.id)} />
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={isCurrentImg ? `Prompt visual with ${currentModelObj.display_name}...` : 'Message Cretivra...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="cv-composer-row">
              <div className="cv-composer-left">
                <button className="cv-icon-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>
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
                  accept=".pdf,.docx,.txt,.csv,.md,.png,.jpg,.jpeg,.webp"
                />
                {/* Image Studio Quick Opener */}
                <button
                  className="cv-icon-btn"
                  title="Open AI Image Studio"
                  onClick={() => setImageStudioOpen(true)}
                >
                  <Palette size={15} className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300" />
                </button>
              </div>
              <button
                className={`cv-send-btn ${isGenerating ? 'stop' : ''}`}
                disabled={!isGenerating && !input.trim() && attachments.length === 0}
                onClick={() => (isGenerating ? stopGeneration() : handleSend())}
              >
                {isGenerating ? <Square size={12} fill="currentColor" /> : <ArrowUp size={16} />}
              </button>
            </div>
          </div>
          <div className="cv-hint">
            {isCurrentImg ? 'Asura FLUX.1 Art Studio generates visuals in real time at zero cost.' : 'Asura AI by Cretivra processes queries with real-time intelligence. Verify important output.'}
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
      />

      <ShareModal
        isOpen={!!shareId}
        onClose={() => setShareId(null)}
        conversationId={shareId}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={(userData) => {
          setUser(userData);
          clearActiveChat();
          refreshConversations();
        }}
      />

      <ImageStudioModal
        isOpen={imageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
        onInsertToChat={(_imageUrl, promptText) => {
          sendMessage(promptText, selectedModel);
        }}
      />

      {/* Floating Lower-Right Suggestion & Commenting Widget */}
      <SuggestionBox user={user} />
    </div>
  );
}

export default App;
