import React from 'react';
import {
  Search,
  Globe,
  Brain,
  Sun,
  Moon,
  Activity,
  Menu,
  StopCircle,
  Play,
  Save,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import type { CretivraModel, HealthStatus } from '../../types';

interface ContextualHeaderProps {
  currentView: string;
  contextTitle?: string;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  // Model
  selectedModel?: string;
  availableModels?: CretivraModel[];
  onSelectModel?: (id: string) => void;
  onOpenModelSelector?: () => void;
  // Toggles
  webSearchEnabled?: boolean;
  onToggleWebSearch?: () => void;
  deepThinkEnabled?: boolean;
  onToggleDeepThink?: () => void;
  // Theme & Modals
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  healthStatus?: HealthStatus | null;
  onOpenHealth?: () => void;
  onOpenSearch?: () => void;
  onOpenMobileMenu?: () => void;
  // Task specific
  taskStatus?: string;
  // Playground specific
  onPlaygroundRun?: () => void;
  onPlaygroundSave?: () => void;
}

export function ContextualHeader({
  currentView,
  contextTitle,
  isGenerating = false,
  onStopGeneration,
  selectedModel = 'cretivra-1',
  availableModels = [],
  onSelectModel,
  onOpenModelSelector,
  webSearchEnabled = false,
  onToggleWebSearch,
  deepThinkEnabled = false,
  onToggleDeepThink,
  theme = 'dark',
  onToggleTheme,
  healthStatus,
  onOpenHealth,
  onOpenSearch,
  onOpenMobileMenu,
  taskStatus,
  onPlaygroundRun,
  onPlaygroundSave,
}: ContextualHeaderProps) {
  const currentModelObj = availableModels.find((m) => m.id === selectedModel);
  const modelDisplayName = currentModelObj?.display_name || 'Cretivra 1';

  return (
    <header className="h-14 border-b border-[#232D45] bg-[#060911]/80 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      {/* 1. Left Section: Mobile trigger + Context Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] focus:outline-none"
          title="Open menu"
        >
          <Menu size={18} />
        </button>

        {contextTitle ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-[#8891A8] uppercase tracking-wider hidden sm:inline">
              Asura
            </span>
            <span className="text-[#232D45] hidden sm:inline">/</span>
            <span className="text-sm font-medium text-[#E7EAF4] truncate max-w-[200px] sm:max-w-[320px]">
              {contextTitle}
            </span>
            {taskStatus && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                  taskStatus === 'RUNNING'
                    ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 animate-pulse'
                    : taskStatus === 'COMPLETED'
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                    : 'bg-[#8891A8]/10 text-[#8891A8] border border-[#8891A8]/30'
                }`}
              >
                {taskStatus}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#E7EAF4] tracking-wide">
              ASURA
            </span>
            <span className="text-[11px] text-[#8891A8] font-manus-serif italic hidden sm:inline">
              Think beyond.
            </span>
          </div>
        )}
      </div>

      {/* 2. Center Section: Active Stop button or Playground Actions */}
      <div className="flex items-center gap-2">
        {isGenerating && (
          <button
            onClick={onStopGeneration}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] text-xs font-medium hover:bg-[#F43F5E]/20 transition-all asura-btn-interactive shadow-sm"
          >
            <StopCircle size={13} className="animate-spin text-[#F43F5E]" />
            <span>Stop Execution</span>
          </button>
        )}

        {currentView === 'playground' && (
          <div className="flex items-center gap-1.5">
            {onPlaygroundRun && (
              <button
                onClick={onPlaygroundRun}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#06B6D4] text-[#060911] text-xs font-semibold hover:bg-[#06B6D4]/90 transition-colors shadow-sm asura-btn-interactive"
              >
                <Play size={12} fill="currentColor" />
                <span>Run</span>
              </button>
            )}
            {onPlaygroundSave && (
              <button
                onClick={onPlaygroundSave}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#E7EAF4] text-xs font-medium hover:border-[#06B6D4]/40 transition-colors asura-btn-interactive"
              >
                <Save size={12} />
                <span>Save</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Right Section: Controls & Context badges */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Web Search Toggle */}
        {onToggleWebSearch && (
          <button
            onClick={onToggleWebSearch}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all asura-btn-interactive ${
              webSearchEnabled
                ? 'bg-[#06B6D4]/15 border-[#06B6D4]/40 text-[#06B6D4]'
                : 'bg-[#151C2E] border-[#232D45] text-[#8891A8] hover:text-[#E7EAF4]'
            }`}
            title={webSearchEnabled ? 'Web search enabled' : 'Enable live web search'}
          >
            <Globe size={14} />
            <span className="hidden sm:inline">Web</span>
          </button>
        )}

        {/* Reasoning / Deep Think Toggle */}
        {onToggleDeepThink && (
          <button
            onClick={onToggleDeepThink}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all asura-btn-interactive ${
              deepThinkEnabled
                ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#8B5CF6]'
                : 'bg-[#151C2E] border-[#232D45] text-[#8891A8] hover:text-[#E7EAF4]'
            }`}
            title={deepThinkEnabled ? 'Reasoning mode enabled' : 'Enable deep reasoning'}
          >
            <Brain size={14} />
            <span className="hidden sm:inline">Reason</span>
          </button>
        )}

        {/* Model Selector Dropdown Trigger */}
        {onOpenModelSelector && (
          <button
            onClick={onOpenModelSelector}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#E7EAF4] text-xs font-medium hover:border-[#06B6D4]/50 transition-colors asura-btn-interactive"
            title="Switch Cretivra Neural Engine model"
          >
            <span className="truncate max-w-[100px] sm:max-w-[130px]">
              {modelDisplayName}
            </span>
            <ChevronDown size={12} className="text-[#8891A8]" />
          </button>
        )}

        {/* Quick Search Button */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-1.5 rounded-lg text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors"
            title="Command Palette (Ctrl+K)"
          >
            <Search size={15} />
          </button>
        )}

        {/* System Health Status Indicator */}
        {onOpenHealth && (
          <button
            onClick={onOpenHealth}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#8891A8] hover:text-[#E7EAF4] text-[11px] transition-colors"
            title="System Telemetry & Health"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus?.status === 'healthy'
                  ? 'bg-[#10B981]'
                  : 'bg-[#F59E0B]'
              }`}
            />
            <span className="hidden md:inline">Operational</span>
          </button>
        )}

        {/* Theme Switcher */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
      </div>
    </header>
  );
}
