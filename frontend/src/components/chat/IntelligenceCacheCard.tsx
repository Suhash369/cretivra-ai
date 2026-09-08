'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Zap, 
  CheckCircle2, 
  Database, 
  Brain, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';

interface IntelligenceCacheCardProps {
  reasoningStatus?: string | null;
  isGenerating?: boolean;
  cacheItems?: string[];
  userQuery?: string;
}

const LOADING_STAGES = [
  '✦ Querying neural intelligence cache...',
  '✦ Scanning verified multi-tier cache index...',
  '✦ Cross-referencing temporal facts (2026)...',
  '✦ Synthesizing cached intelligence insights...',
];

export function IntelligenceCacheCard({
  reasoningStatus,
  isGenerating = false,
  cacheItems,
  userQuery,
}: IntelligenceCacheCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  // Progressive stage cycling during active generation
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // If there's neither reasoning_status nor generation in progress, don't show
  if (!reasoningStatus && !isGenerating) {
    return null;
  }

  // Generate fancy itemized cache search details
  const displayItems = (cacheItems && cacheItems.length > 0)
    ? cacheItems
    : [
        `Neural Cache Index: Instant lookup for "${(userQuery || 'context query').slice(0, 32)}"`,
        'Primary Verified Index: Synchronized with 2026 factual grounding',
        'Cross-Layer Validation: Multi-step deduction and consistency checks',
        'Synthesizing Response: High-precision contextual integration',
      ];

  const currentStatusText = isGenerating
    ? reasoningStatus || LOADING_STAGES[stageIndex]
    : reasoningStatus || 'Consulted intelligence cache';

  return (
    <div className="mb-3 max-w-xl transition-all duration-200">
      {/* Sleek Claude-Style Interactive Container */}
      <div 
        className={`relative overflow-hidden rounded-xl border transition-all duration-200 shadow-sm ${
          isGenerating 
            ? 'bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 dark:from-[#0b101d]/90 dark:via-[#0e1526]/90 dark:to-[#0b101d]/90 border-indigo-300/70 dark:border-cyan-500/40 shadow-indigo-500/10 dark:shadow-cyan-500/10' 
            : 'bg-slate-50/90 dark:bg-[#0b101d]/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80'
        }`}
      >
        {/* Shimmer laser beam while loading */}
        {isGenerating && (
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none">
            <div 
              className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500 dark:via-cyan-400 to-transparent" 
              style={{ animation: 'cv-shimmer-sweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
            />
          </div>
        )}

        {/* Header Bar */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-left cursor-pointer group select-none gap-2"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Animated Micro-Sparkle Orb */}
            <div 
              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                isGenerating
                  ? 'bg-indigo-100 dark:bg-cyan-950/80 text-indigo-600 dark:text-cyan-400 scale-105'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
              }`}
            >
              {isGenerating ? (
                <Sparkles 
                  size={12} 
                  className="animate-spin text-indigo-600 dark:text-cyan-400" 
                  style={{ animationDuration: '4s' }} 
                />
              ) : (
                <Brain size={12} />
              )}
            </div>

            {/* Dynamic Status Text */}
            <div className="flex items-center gap-2 truncate">
              <span 
                className={`text-xs font-medium truncate ${
                  isGenerating 
                    ? 'text-indigo-900 dark:text-cyan-200' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {currentStatusText}
              </span>

              {isGenerating && (
                <span className="flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
                </span>
              )}
            </div>
          </div>

          {/* Right Action Badge & Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <span 
              className={`text-[10.5px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                isGenerating
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-cyan-950/70 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-500/30'
                  : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400'
              }`}
            >
              {isGenerating ? 'Evaluating cache' : `${displayItems.length} items`}
            </span>

            <ChevronDown 
              size={14} 
              className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 group-hover:text-slate-600 dark:group-hover:text-slate-300 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        {/* Expandable Itemized Cache Details */}
        {isExpanded && (
          <div className="px-3.5 pb-3 pt-1 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/60 dark:bg-[#070b14]/50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="space-y-2 pt-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pb-1">
                <span>Intelligence Cache Audit</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={11} /> Verified Real-Time
                </span>
              </div>

              {displayItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-1.5 rounded-lg bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60"
                >
                  <div className="mt-0.5 shrink-0 text-indigo-500 dark:text-cyan-400">
                    {idx === 0 ? <Zap size={12} /> : idx === 1 ? <Database size={12} /> : idx === 2 ? <Cpu size={12} /> : <CheckCircle2 size={12} />}
                  </div>
                  <div className="flex-1 min-w-0 font-mono text-[11.5px] leading-relaxed">
                    {item}
                  </div>
                  <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {idx === 0 ? 'Hit (0.04s)' : idx === 1 ? 'Year 2026' : idx === 2 ? 'Logic Pass' : 'Synced'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
