import React from 'react';
import {
  Menu,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Search,
  StopCircle,
  Headphones,
  MessageSquarePlus,
} from 'lucide-react';
import type { CretivraModel, HealthStatus } from '../../types';

interface TopBarProps {
  currentView: string;
  contextTitle?: string;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  // Model
  selectedModel?: string;
  availableModels?: CretivraModel[];
  onOpenModelSelector?: () => void;
  // Plan & Credits
  user?: any;
  onOpenUpgrade?: () => void;
  // Theme & Actions
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenSearch?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenVoiceMode?: () => void;
  onOpenSuggestions?: () => void;
  taskStatus?: string;
}

export function TopBar({
  currentView,
  contextTitle,
  isGenerating = false,
  onStopGeneration,
  selectedModel = 'cretivra-1.2',
  availableModels = [],
  onOpenModelSelector,
  user,
  onOpenUpgrade,
  theme = 'light',
  onToggleTheme,
  onOpenSearch,
  onOpenMobileMenu,
  onOpenVoiceMode,
  onOpenSuggestions,
  taskStatus,
}: TopBarProps) {
  const currentModelObj = availableModels.find((m) => m.id === selectedModel);
  const modelDisplayName = currentModelObj?.display_name || 'Cretivra 1.2 (Fast)';

  const isSubscribed = user?.is_subscribed;
  const planLabel = isSubscribed ? (user?.plan_name || '15-Day Pass') : 'Free plan';

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 text-[var(--foreground)] transition-colors duration-200">
      {/* 1. Left Section: Mobile trigger + Model Selector */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] focus:outline-none"
          title="Open navigation menu"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Model Selector button (Section C: Left - text button with chevron) */}
        {onOpenModelSelector && (
          <button
            onClick={onOpenModelSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-[13px] font-medium transition-all shadow-2xs group cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            title="Switch model"
          >
            <span className="truncate max-w-[140px] sm:max-w-[200px] font-medium">
              {modelDisplayName}
            </span>
            <ChevronDown size={13} className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors shrink-0" />
          </button>
        )}

        {contextTitle && (
          <div className="hidden lg:flex items-center gap-2 min-w-0 ml-2 pl-3 border-l border-[var(--border)]">
            <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[240px]">
              {contextTitle}
            </span>
            {taskStatus && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                {taskStatus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Center Section: Active Stop button if generating */}
      {isGenerating && (
        <div className="flex items-center">
          <button
            onClick={onStopGeneration}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium hover:bg-rose-500/20 transition-all shadow-xs"
          >
            <StopCircle size={13} className="animate-spin text-rose-500" />
            <span>Stop Execution</span>
          </button>
        </div>
      )}

      {/* 3. Right Section: Plan pill, Credits chip, Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Plan pill (Section C: "Free plan | Upgrade") */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] shadow-2xs">
          <span className="text-[var(--muted-foreground)] font-medium text-[11px] sm:text-xs">
            {planLabel}
          </span>
          {!isSubscribed && onOpenUpgrade && (
            <>
              <span className="text-[var(--border)] select-none">|</span>
              <button
                onClick={onOpenUpgrade}
                className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer text-[11px] sm:text-xs"
              >
                Upgrade
              </button>
            </>
          )}
        </div>

        {/* Credits / usage chip with sparkle icon (Section C) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)]">
          <Sparkles size={12} className="text-cyan-500 shrink-0" />
          <span className="font-medium text-[11px] text-[var(--foreground)]">
            {isSubscribed ? 'Unlimited' : '1,000 credits'}
          </span>
        </div>

        {/* Voice Trigger Shortcut */}
        {onOpenVoiceMode && (
          <button
            onClick={onOpenVoiceMode}
            className="hidden md:flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Talk to Asura"
          >
            <Headphones size={13} className="text-cyan-500" />
            <span className="hidden lg:inline text-[11px]">Voice</span>
          </button>
        )}

        {/* Search Modal Trigger (Ctrl+K) */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
            title="Search sessions (Ctrl+K)"
            aria-label="Search sessions"
          >
            <Search size={16} />
          </button>
        )}

        {/* Suggestions & Feedback Trigger */}
        {onOpenSuggestions && (
          <button
            onClick={onOpenSuggestions}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
            title="Suggestions & Feedback"
            aria-label="Suggestions & Feedback"
          >
            <MessageSquarePlus size={16} />
          </button>
        )}

        {/* Theme Toggle (Sun/Moon) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>
    </header>
  );
}
