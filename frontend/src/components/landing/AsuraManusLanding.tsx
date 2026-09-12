'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowUp,
  ArrowRight,
  Presentation,
  Globe,
  Palette,
  Gamepad2,
  ChevronDown,
  FileText,
  X,
  Search,
  Zap,
  Layers,
  LogOut,
  LineChart,
} from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import { AuthModal } from '../auth/AuthModal';
import { ImageStudioModal } from '../image-studio/ImageStudioModal';
import { SlideGeneratorModal } from './SlideGeneratorModal';
import { WebsiteGeneratorModal } from './WebsiteGeneratorModal';
import { GameCreatorModal } from './GameCreatorModal';
import { NavModal, type NavModalType } from './NavModal';
import { uploadFile } from '../../services/api';
import type { Attachment } from '../../types';

export function AsuraManusLanding() {
  const router = useRouter();

  // User state
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('cretivra_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Main task input
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Modals
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [navModalType, setNavModalType] = useState<NavModalType>(null);
  const [announcementClosed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 260)}px`;
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Execute a task prompt
  const executeTask = useCallback(
    (promptToRun?: string) => {
      const finalPrompt = (promptToRun ?? input).trim();
      if (!finalPrompt && attachments.length === 0) return;

      if (!user) {
        try {
          sessionStorage.setItem('asura_pending_prompt', finalPrompt);
        } catch {}
        setAuthTab('login');
        setAuthOpen(true);
        return;
      }

      // Save initial query to localStorage and redirect to studio/chat workspace
      try {
        sessionStorage.setItem('asura_initial_prompt', finalPrompt);
        if (attachments.length > 0) {
          sessionStorage.setItem('asura_initial_attachments', JSON.stringify(attachments));
        }
      } catch {}

      router.push('/studio');
    },
    [input, attachments, user, router]
  );

  // Check for queued pending prompt after login
  useEffect(() => {
    try {
      const pendingPrompt = sessionStorage.getItem('asura_pending_prompt');
      if (pendingPrompt && user) {
        sessionStorage.removeItem('asura_pending_prompt');
        executeTask(pendingPrompt);
      }
    } catch {}
  }, [user, executeTask]);

  // Handle file uploads via + button
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await uploadFile(file);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      console.warn('File upload failed:', err);
      // Fallback local attachment preview
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAttachments((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}-${i}`,
            filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            path: URL.createObjectURL(file),
            size: file.size,
            file_type: file.type || 'document',
          },
        ]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeTask();
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setAuthOpen(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('cretivra_auth_token');
    localStorage.removeItem('cretivra_user');
    setUser(null);
    setUserMenuOpen(false);
  };

  const canSubmit = input.trim().length > 0 || attachments.length > 0;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0c0f17] text-gray-900 dark:text-gray-100 flex flex-col font-sans selection:bg-gray-200 dark:selection:bg-gray-800 antialiased">
      {/* 1. Header (Identical structure to Image 1) */}
      <header className="w-full bg-white dark:bg-[#0c0f17] border-b border-gray-100 dark:border-gray-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-6 h-6 flex items-center justify-center">
              <CretivraMark size={24} animated={false} />
            </div>
            <span className="text-[21px] font-bold tracking-tight text-gray-900 dark:text-white font-sans lowercase">
              asura
            </span>
          </Link>

          {/* Navigation Links (Matching Image 1: Features, Solutions, Resources, Events, Team, Pricing) */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-gray-600 dark:text-gray-300">
            <button
              onClick={() => setNavModalType('features')}
              className="hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => setNavModalType('solutions')}
              className="hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Solutions
            </button>
            <button
              onClick={() => setNavModalType('resources')}
              className="hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Resources
            </button>
            <button
              onClick={() => setNavModalType('events')}
              className="hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Events
            </button>
            <button
              onClick={() => setNavModalType('team')}
              className="hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Team
            </button>
            <button
              onClick={() => setNavModalType('pricing')}
              className="hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Auth Actions (Matching Image 1: Sign in & Sign up pills) */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 hover:border-gray-400 bg-white dark:bg-gray-800 text-xs font-semibold cursor-pointer shadow-xs transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-[10px] font-bold">
                    {user.full_name ? user.full_name[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user.full_name || user.email?.split('@')[0]}</span>
                  <ChevronDown size={13} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-1.5 z-50 animate-in fade-in duration-100">
                    <Link
                      href="/studio"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Layers size={14} className="text-cyan-500" />
                      <span>Open Studio</span>
                    </Link>
                    <Link
                      href="/test-bench"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <LineChart size={14} className="text-purple-500" />
                      <span>Model Arena</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setAuthOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-[#18181b] hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setAuthOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Top Announcement Banner (Matching Image 1) */}
      {!announcementClosed && (
        <div className="w-full bg-[#f9fafb] dark:bg-[#111622] border-b border-gray-100 dark:border-gray-800/80 py-2.5 px-4 text-center text-xs text-gray-700 dark:text-gray-300 transition-colors relative">
          <button
            onClick={() => setNavModalType('features')}
            className="inline-flex items-center gap-1.5 hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <span>Asura has resumed independent operations. Our next chapter starts now.</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* 3. Hero Center Section (Clean Minimalist Canvas matching Image 1) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto w-full my-auto">
        {/* Editorial Serif Heading */}
        <h1 className="font-manus-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-gray-900 dark:text-white tracking-tight text-center mb-8 select-none leading-tight">
          What can I do for you?
        </h1>

        {/* Large Floating Task Prompt Card */}
        <div className="w-full max-w-2xl bg-white dark:bg-[#111520] border border-gray-200/90 dark:border-gray-800/90 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] p-4 sm:p-5 transition-all focus-within:border-gray-400 dark:focus-within:border-gray-600 focus-within:shadow-[0_12px_36px_rgb(0,0,0,0.09)]">
          {/* Uploaded attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                >
                  <FileText size={12} className="text-gray-500" />
                  <span className="truncate max-w-[140px]">{att.filename}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-0.5 hover:text-rose-500 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Assign a task or ask anything"
            className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base sm:text-[17px] leading-relaxed resize-none focus:outline-none min-h-[70px] max-h-[260px]"
          />

          {/* Bottom Action Bar inside card */}
          <div className="flex items-center justify-between pt-2 mt-2">
            {/* Left + Button for attachments & tools */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                title="Attach documents, data, images or code"
              >
                <Plus size={18} />
              </button>
              {isUploading && (
                <span className="text-xs text-gray-400 animate-pulse">Uploading...</span>
              )}
            </div>

            {/* Right ↑ Send Button */}
            <button
              type="button"
              onClick={() => executeTask()}
              disabled={!canSubmit}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                canSubmit
                  ? 'bg-[#18181b] hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-950 cursor-pointer shadow-sm scale-100'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed scale-95'
              }`}
              title="Run task with Asura AI"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>

        {/* 4. Quick Action Suggestion Chips (Create slides, Build website, Design, Create games, More) */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mt-6 max-w-2xl">
          {/* Option 1: Create slides */}
          <button
            type="button"
            onClick={() => setSlideModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#111520] border border-gray-200/90 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Presentation size={15} className="text-amber-500" />
            <span>Create slides</span>
          </button>

          {/* Option 2: Build website */}
          <button
            type="button"
            onClick={() => setWebsiteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#111520] border border-gray-200/90 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Globe size={15} className="text-blue-500" />
            <span>Build website</span>
          </button>

          {/* Option 3: Design */}
          <button
            type="button"
            onClick={() => setDesignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#111520] border border-gray-200/90 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Palette size={15} className="text-purple-500" />
            <span>Design</span>
          </button>

          {/* Option 4: Create games */}
          <button
            type="button"
            onClick={() => setGameModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#111520] border border-gray-200/90 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Gamepad2 size={15} className="text-emerald-500" />
            <span>Create games</span>
          </button>

          {/* Option 5: More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#111520] border border-gray-200/90 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <span>More</span>
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 sm:left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-2 z-50 animate-in fade-in duration-100 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    executeTask('Conduct a comprehensive deep research investigation on autonomous AI agent execution frameworks, comparing multi-agent orchestration vs. monolithic single-loop LLMs.');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <Search size={14} className="text-cyan-500" />
                  <span>Deep Research</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    executeTask('Analyze quarterly revenue metrics and customer churn data. Produce executive summary tables and mathematical projections for next fiscal year.');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <LineChart size={14} className="text-blue-500" />
                  <span>Data Analysis</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    executeTask('Write a resilient Python automation workflow that monitors customer support webhooks, extracts priority tags, and dispatches automated resolutions.');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <Zap size={14} className="text-amber-500" />
                  <span>Automate Workflow</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    executeTask('Perform a detailed legal and compliance contract review on terms of service, highlighting liability caps, indemnification clauses, and SLA guarantees.');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <FileText size={14} className="text-purple-500" />
                  <span>Document Review</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive Modals */}
      <SlideGeneratorModal
        isOpen={slideModalOpen}
        onClose={() => setSlideModalOpen(false)}
        onGenerateWithAgent={(prompt) => executeTask(prompt)}
      />

      <WebsiteGeneratorModal
        isOpen={websiteModalOpen}
        onClose={() => setWebsiteModalOpen(false)}
        onGenerateWithAgent={(prompt) => executeTask(prompt)}
      />

      <ImageStudioModal
        isOpen={designModalOpen}
        onClose={() => setDesignModalOpen(false)}
      />

      <GameCreatorModal
        isOpen={gameModalOpen}
        onClose={() => setGameModalOpen(false)}
        onGenerateWithAgent={(prompt) => executeTask(prompt)}
      />

      <NavModal
        type={navModalType}
        onClose={() => setNavModalType(null)}
        onOpenAuth={(tab) => {
          setAuthTab(tab);
          setAuthOpen(true);
        }}
        onSelectPrompt={(prompt) => executeTask(prompt)}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authTab}
      />
    </div>
  );
}
