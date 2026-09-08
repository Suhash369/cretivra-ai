'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Share2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { fetchSharedConversation } from '../../../services/api';
import { CretivraMark } from '../../../components/common/CretivraLogo';
import { GeneratedImageCard } from '../../../components/chat/ChatMessage';
import { initTheme } from '../../../services/theme';
import type { Conversation, Message } from '../../../types';

export function ShareClient({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cleanup = initTheme();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    fetchSharedConversation(conversationId)
      .then((data) => {
        setConversation(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load shared conversation:', err);
        setError(err.message || 'Conversation not found or link has expired.');
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = conversation?.created_at
    ? new Date(conversation.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text)] flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-14 border-b border-[var(--border)] bg-[var(--bg-panel)]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <CretivraMark size={24} />
          <span className="font-bold text-sm sm:text-base tracking-wide cv-gradient-text">
            Asura AI
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">
            Shared Snapshot
          </span>
        </a>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text)] hover:border-cyan-500/40 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Link Copied' : 'Share Link'}</span>
          </button>

          <a
            href="/chat"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Transcript Body */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <p className="text-xs text-gray-400 font-mono">Loading shared conversation snapshot...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-[var(--text)]">Conversation Not Found</h2>
            <p className="text-xs text-gray-400 leading-relaxed">{error}</p>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <span>Start New Conversation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Conversation Title & Metadata Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border)] shadow-sm space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
                {conversation?.title || 'Shared Conversation'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1">
                {formattedDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{formattedDate}</span>
                  </div>
                )}
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] font-mono text-[11px] text-cyan-400">
                  {conversation?.model_id || 'cretivra-1'}
                </span>
                <span className="text-[11px] text-gray-500">
                  {conversation?.messages?.length || 0} messages
                </span>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="space-y-4 pt-2">
              {conversation?.messages?.map((msg: Message) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`p-4 sm:p-6 rounded-2xl border transition-colors ${
                      isUser
                        ? 'bg-[var(--bg-card)] border-[var(--border)] ml-4 sm:ml-12'
                        : 'bg-[var(--bg-panel)] border-[var(--border)] mr-4 sm:mr-12 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          isUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {isUser ? 'U' : <CretivraMark size={14} />}
                      </div>
                      <span className="text-xs font-semibold text-[var(--text)]">
                        {isUser ? 'User' : 'Asura AI by Cretivra'}
                      </span>
                    </div>

                    {!isUser && msg.reasoning_status && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2.5 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-[11px] font-medium">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Grounded with real-time intelligence</span>
                      </div>
                    )}

                    <div className="prose prose-invert max-w-none text-sm text-[var(--text)] leading-relaxed font-sans">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img({ src, alt }) {
                            const imageSrc = typeof src === 'string' ? src : undefined;
                            return <GeneratedImageCard src={imageSrc} alt={alt} />;
                          },
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeText = String(children).replace(/\n$/, '');
                            if (!inline && match) {
                              return (
                                <div className="my-2 rounded-xl overflow-hidden bg-gray-950 border border-gray-800 text-xs font-mono">
                                  <div className="px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-gray-400">
                                    {match[1]}
                                  </div>
                                  <pre className="p-3 overflow-x-auto text-emerald-300">
                                    <code>{codeText}</code>
                                  </pre>
                                </div>
                              );
                            }
                            return (
                              <code className="px-1.5 py-0.5 rounded bg-gray-800 text-cyan-300 font-mono text-xs" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Callout Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-cyan-950/30 border border-indigo-500/30 text-center space-y-3 mt-8">
              <h3 className="font-bold text-sm text-[var(--text)]">Experience Asura AI</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Access uncensored intelligence models, fast reasoning, real-time factual grounding, and dedicated AI image studio.
              </p>
              <a
                href="/chat"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-md shadow-cyan-600/20"
              >
                <span>Continue conversation in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-gray-500">
        <p>Asura AI by Cretivra — Frontier Intelligence Platform</p>
      </footer>
    </div>
  );
}
