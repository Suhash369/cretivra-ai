'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquarePlus,
  X,
  Sparkles,
  Send,
  Star,
  CheckCircle2,
  Database,
  Lightbulb,
  Bug,
  MessageCircle,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { submitSuggestion, SuggestionCategory } from '../../services/supabase';

interface SuggestionBoxProps {
  user?: { id?: string; email?: string; full_name?: string } | null;
  className?: string;
}

const CATEGORIES: { id: SuggestionCategory; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb },
  { id: 'feature', label: 'Feature Idea', icon: Sparkles },
  { id: 'bug', label: 'Bug Report', icon: Bug },
  { id: 'comment', label: 'Comment', icon: MessageCircle },
];

const QUICK_TAGS = ['⚡ AI Speed', '🎨 UI Design', '🧠 Accuracy', '🖼️ Image Studio', '📱 Mobile Experience'];

const PLACEHOLDERS: Record<SuggestionCategory, string> = {
  suggestion: 'What improvement or idea would make Cretivra AI even better for you?',
  feature: 'Describe the feature, tool, or integration you would love to see built...',
  bug: 'What happened? Describe the issue and steps to reproduce...',
  comment: 'Share your thoughts, impressions, or feedback with the Cretivra team...',
};

export function SuggestionBox({ user, className = '' }: SuggestionBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<SuggestionCategory>('suggestion');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen && !isSuccess) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, isSuccess]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Append selected tags to comment if any
      let finalComment = comment.trim();
      if (selectedTags.length > 0) {
        finalComment += `\n\n[Tags: ${selectedTags.join(', ')}]`;
      }

      await submitSuggestion({
        category,
        comment: finalComment,
        rating: rating || undefined,
        user_email: user?.email || guestEmail.trim() || undefined,
        user_name: user?.full_name || guestName.trim() || undefined,
        page_url: typeof window !== 'undefined' ? window.location.pathname : '/',
      });

      setIsSuccess(true);
      setComment('');
      setSelectedTags([]);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setComment('');
    setCategory('suggestion');
    setSelectedTags([]);
    setErrorMsg(null);
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6 font-sans select-none ${className}`}
      id="cretivra-suggestion-widget"
    >
      {/* Expanded Suggestion Card */}
      {isOpen && (
        <div
          ref={cardRef}
          className="mb-3 w-[360px] sm:w-[410px] max-w-[calc(100vw-32px)] bg-[#0d121f]/95 backdrop-blur-2xl border border-cyan-500/35 rounded-2xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ maxHeight: '88vh' }}
        >
          {/* Glowing Ambient Backdrop Accents */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="relative px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#111827]/70">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
                <Lightbulb size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Suggestions &amp; Feedback
                </h3>
                <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Database size={11} className="text-emerald-400/90" />
                  <span>Connected to Supabase</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Minimize"
              >
                <ChevronDown size={17} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="relative p-4 max-h-[calc(85vh-60px)] overflow-y-auto space-y-4">
            {isSuccess ? (
              /* Success State */
              <div className="py-6 px-2 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Suggestion Received!
                  </h4>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                    Thank you! Your feedback has been saved to Supabase and shared with the Cretivra development team.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all"
                  >
                    Submit Another
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Category Selection Tabs */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Feedback Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-500/25 to-purple-500/25 border border-cyan-400/50 text-cyan-200 shadow-sm'
                              : 'bg-[#151c2e] hover:bg-[#1c263d] border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon size={13} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating Stars */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Rate Experience
                    </label>
                    <span className="text-[11px] text-amber-400 font-medium">
                      {hoverRating !== null ? `${hoverRating} / 5` : `${rating} / 5`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 bg-[#151c2e] rounded-xl border border-slate-800/80 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-slate-600 hover:scale-110 transition-transform"
                        title={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={18}
                          className={`transition-colors ${
                            star <= (hoverRating ?? rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Your Suggestion / Comment <span className="text-cyan-400">*</span>
                    </label>
                    <span
                      className={`text-[10.5px] ${
                        comment.length > 800 ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {comment.length} / 1000
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    required
                    rows={4}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={PLACEHOLDERS[category]}
                    className="w-full bg-[#151c2e] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Quick Topic Chips */}
                <div>
                  <div className="text-[10px] text-slate-400 mb-1 font-medium">Quick Topics:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => {
                      const isTagSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`text-[10.5px] px-2 py-0.5 rounded-md border transition-all ${
                            isTagSelected
                              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                              : 'bg-[#151c2e] border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* User / Guest Info */}
                {user?.email ? (
                  <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Submitting as:</span>
                    <span className="font-semibold text-cyan-300 truncate max-w-[200px]">
                      {user.full_name || user.email}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-[#151c2e] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-[#151c2e] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={!comment.trim() || isSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Submit Suggestion</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Lower-Right Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#0d121f]/95 hover:bg-[#151c2e] border border-cyan-500/40 hover:border-cyan-400 text-slate-200 hover:text-white shadow-xl shadow-cyan-950/50 backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
        title="Share a suggestion or comment"
        aria-label="Open suggestion commenting box"
      >
        {/* Glow halo on trigger */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 rounded-full blur-sm opacity-30 group-hover:opacity-60 transition duration-300 pointer-events-none" />

        <div className="relative flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <MessageSquarePlus size={14} />
          </div>

          <span className="text-xs font-semibold tracking-wide text-slate-200 group-hover:text-cyan-300 transition-colors">
            Suggestions
          </span>

          {/* Glowing Supabase active dot */}
          <span className="relative flex h-2 w-2 ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
      </button>
    </div>
  );
}
