import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Crown,
} from 'lucide-react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { SearchModal } from './components/sidebar/SearchModal';
import { HealthModal } from './components/settings/HealthModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ShareModal } from './components/settings/ShareModal';
import { AuthModal } from './components/auth/AuthModal';
import { ImageStudioModal } from './components/image-studio/ImageStudioModal';
import { SubscriptionModal } from './components/subscription/SubscriptionModal';
import { GeneratedImageCard } from './components/chat/ChatMessage';
import { CretivraMark } from './components/common/CretivraLogo';
import { fetchHealth, fetchSubscriptionStatusApi } from './services/api';
import type { HealthStatus, Conversation, CretivraModel, SubscriptionStatus } from './types';

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
    prompt: 'Draft a clean product launch email announcement for Cretivra AI platform.',
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

/* Code block component with copy action */
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="cv-code-block">
      <div className="cv-code-head">
        <span>{lang || 'code'}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* Helper to render rich markdown, images, and code blocks */
function renderMessageContent(text: string) {
  return (
    <div className="prose prose-invert max-w-none text-sm text-gray-100 leading-relaxed font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img({ src, alt }) {
            return <GeneratedImageCard src={src} alt={alt} />;
          },
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            if (!inline && match) {
              return <CodeBlock lang={match[1]} code={codeText} />;
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-gray-800 text-cyan-300 font-mono text-xs" {...props}>
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2 leading-relaxed">{children}</p>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function App() {
  const {
    grouped,
    conversations,
    setSearchQuery,
    createNew,
    refresh: refreshConversations,
  } = useConversations();

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
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [imageStudioOpen, setImageStudioOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("cretivra_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadHealthStatus = useCallback(async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  }, []);

  const loadSubscriptionStatus = useCallback(async () => {
    if (user) {
      try {
        const data = await fetchSubscriptionStatusApi();
        setSubscription(data);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }
    } else {
      setSubscription(null);
    }
  }, [user]);

  useEffect(() => {
    loadHealthStatus();
    loadSubscriptionStatus();
  }, [loadHealthStatus, loadSubscriptionStatus]);

  const handleSend = (textToSend?: string) => {
    const content = (textToSend ?? input).trim();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!subscription?.is_subscribed || subscription.is_expired) {
      setSubscriptionOpen(true);
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
    <div className="flex h-screen w-screen bg-[#060911] text-[#e7eaf4] overflow-hidden font-sans relative">
      {/* Background Ambient Glowing Orbs */}
      <div className="cv-ambient">
        <div className="cv-orb cv-orb-1" />
        <div className="cv-orb cv-orb-2" />
      </div>

      {/* Sidebar */}
      <div className={`cv-sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="cv-sb-head">
          <CretivraMark size={22} />
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>Cretivra</span>
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
        <div className="cv-sb-search" onClick={() => setSearchOpen(true)}>
          <Search size={13} /> Search chats <span style={{ marginLeft: 'auto', opacity: 0.6 }}>⌘K</span>
        </div>
        <div className="cv-sb-scroll">
          {Object.entries(grouped).map(([group, items]: [string, Conversation[]]) => (
            items.length > 0 && (
              <div key={group}>
                <div className="cv-sb-group-label">{group.replace('_', ' ')}</div>
                {items.map((conv) => (
                  <div
                    key={conv.id}
                    className={`cv-sb-item ${conv.id === activeConversationId ? 'active' : ''}`}
                    onClick={() => loadConversation(conv.id)}
                  >
                    {conv.title}
                  </div>
                ))}
              </div>
            )
          ))}
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
            <span className="cv-gradient-text">Cretivra AI</span>
          </div>

          {/* Model Selector Pill */}
          <div style={{ position: 'relative' }}>
            <div
              className={`cv-model-pill ${isCurrentImg ? 'border-purple-500/50 bg-purple-950/40 text-purple-200' : ''}`}
              onClick={() => setModelOpen((o) => !o)}
            >
              {isCurrentImg ? <Palette size={13} color="#c084fc" /> : <Brain size={13} color="#06b6d4" />}
              <span>{currentModelObj.display_name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isCurrentImg ? 'bg-purple-900 text-purple-300' : 'bg-cyan-950 text-cyan-300'}`}>
                {currentModelObj.category}
              </span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </div>

            {modelOpen && (
              <div className="cv-glass cv-model-menu w-80 max-h-96 overflow-y-auto">
                {/* Language Models */}
                {languageModels.length > 0 && (
                  <div className="p-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                      💬 Language & Reasoning
                    </div>
                    {languageModels.map((m) => (
                      <div
                        key={m.id}
                        className={`cv-model-opt ${m.id === selectedModel ? 'bg-cyan-950/40 border border-cyan-500/40' : ''}`}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModelOpen(false);
                        }}
                      >
                        <div className="cv-model-opt-icon" style={{ background: '#06b6d422' }}>
                          <Brain size={14} color="#06b6d4" />
                        </div>
                        <div>
                          <div className="cv-model-opt-name flex items-center gap-1.5">
                            <span>{m.display_name}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
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
                  <div className="p-1 border-t border-gray-800/80 mt-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Palette size={12} />
                      <span>🎨 AI Image Generation Studio</span>
                    </div>
                    {imageModels.map((m) => (
                      <div
                        key={m.id}
                        className={`cv-model-opt ${m.id === selectedModel ? 'bg-purple-950/40 border border-purple-500/40' : ''}`}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setModelOpen(false);
                        }}
                      >
                        <div className="cv-model-opt-icon" style={{ background: '#a855f722' }}>
                          <Palette size={14} color="#c084fc" />
                        </div>
                        <div>
                          <div className="cv-model-opt-name flex items-center gap-1.5">
                            <span className="text-purple-200">{m.display_name}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 font-mono">
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
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600/30 to-cyan-500/20 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white font-semibold text-xs rounded-full shadow-sm transition-all cursor-pointer"
            title="Open Cretivra Image Generation Studio"
          >
            <Palette size={13} className="text-purple-400" />
            <span>Image Studio</span>
          </button>

          {/* Subscription Pass Pill */}
          <button
            onClick={() => {
              if (!user) setAuthOpen(true);
              else setSubscriptionOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm transition-all cursor-pointer ${
              subscription?.is_subscribed && !subscription.is_expired
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-gradient-to-r from-amber-500/30 to-orange-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:text-white'
            }`}
            title="15-Day Pass (₹20)"
          >
            <Crown size={13} className="text-amber-400" />
            <span>
              {subscription?.is_subscribed && !subscription.is_expired
                ? `${subscription.days_left}d Pass`
                : '₹20 Pass'}
            </span>
          </button>

          {/* Action buttons */}
          {activeConversationId && (
            <button className="cv-icon-btn" title="Share" onClick={() => setShareId(activeConversationId)}>
              <Share2 size={15} />
            </button>
          )}
          <button className="cv-icon-btn" title="System Health" onClick={() => setHealthOpen(true)}>
            <div className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </button>
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
              className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-300 font-medium hover:bg-cyan-500/20 transition-all cursor-pointer"
              title="Click to sign out"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user.full_name ? user.full_name[0] : user.email[0]}
              </div>
              <span className="max-w-[100px] truncate">{user.full_name || user.email.split('@')[0]}</span>
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
              onClick={() => loadHealthStatus()}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-900 text-white font-medium"
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
                  <div className="cv-msg-user">
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
                    <div className="cv-msg-user-bubble">{m.content}</div>
                  </div>
                ) : (
                  <div className="cv-msg-assistant">
                    {m.reasoning_status && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-mono animate-pulse">
                        <Sparkles size={12} className="text-purple-400" />
                        <span>{m.reasoning_status}</span>
                      </div>
                    )}
                    {renderMessageContent(m.content)}
                    {isGenerating && i === messages.length - 1 && <span className="cv-cursor" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Floating Composer */}
        <div className="cv-composer-wrap">
          {user && (!subscription?.is_subscribed || subscription?.is_expired) && (
            <div 
              onClick={() => setSubscriptionOpen(true)}
              className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-between text-xs cursor-pointer hover:border-amber-300 transition-all shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center gap-2 font-medium">
                <Crown size={15} className="text-amber-400 shrink-0" />
                <span>Cretivra AI Pass Required (₹20 for 15 Days) — Click to Pay & Activate</span>
              </div>
              <span className="font-bold text-[11px] bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-400/40 text-white">
                Unlock AI (₹20)
              </span>
            </div>
          )}

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
                  <Palette size={15} className="text-purple-400 hover:text-purple-300" />
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
            {isCurrentImg ? 'Cretivra FLUX.1 Art Studio generates visuals in real time at zero cost.' : 'Cretivra AI processes queries locally. Verify important output.'}
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

      <HealthModal
        isOpen={healthOpen}
        onClose={() => setHealthOpen(false)}
        health={health}
        onRefresh={loadHealthStatus}
        loading={false}
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
          fetchSubscriptionStatusApi().then((sub) => {
            setSubscription(sub);
            if (!sub.is_subscribed || sub.is_expired) {
              setSubscriptionOpen(true);
            }
          });
        }}
      />

      <ImageStudioModal
        isOpen={imageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
        onInsertToChat={(_imageUrl, promptText) => {
          sendMessage(promptText, selectedModel);
        }}
      />

      <SubscriptionModal
        isOpen={subscriptionOpen}
        onClose={() => setSubscriptionOpen(false)}
        subscription={subscription}
        isMandatory={!!user && (!subscription?.is_subscribed || !!subscription?.is_expired)}
        onSubscriptionSuccess={(newSub) => {
          setSubscription(newSub);
        }}
      />
    </div>
  );
}

export default App;
