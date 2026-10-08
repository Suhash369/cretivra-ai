'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Cpu, Wrench, Clock, Zap } from 'lucide-react';

interface DeveloperDiagnosticsProps {
  metadata?: Record<string, any>;
}

export const DeveloperDiagnosticsCard: React.FC<DeveloperDiagnosticsProps> = ({ metadata }) => {
  const [expanded, setExpanded] = useState(false);

  // Check if developer mode is enabled in localStorage
  const isDevMode = typeof window !== 'undefined' && localStorage.getItem('cretivra_developer_mode') === 'true';

  if (!isDevMode || !metadata) {
    return null;
  }

  const diag = metadata.developer_diagnostics || metadata;
  const provider = diag.provider || 'Internal';
  const model = diag.model || 'asura-core';
  const latency = diag.latency_ms || diag.latency || null;
  const routing = diag.routing || diag.intent || null;
  const tools = diag.tools || diag.selected_tools || [];
  const tokens = diag.tokens || null;

  return (
    <div className="my-2 rounded-xl border border-amber-500/30 bg-amber-950/15 text-xs text-amber-200/90 overflow-hidden font-mono">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 border-b border-amber-500/20 text-[11px] text-amber-300 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold uppercase tracking-wider">Developer Diagnostics</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-[10px] text-amber-300">ADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          {latency && <span className="text-[10px] text-amber-400/80">{latency}ms</span>}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-2 text-[11px] bg-black/40">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-400/70">Provider:</span>
              <span className="font-semibold text-amber-100">{provider}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-400/70">Model:</span>
              <span className="font-semibold text-amber-100">{model}</span>
            </div>
            {routing && (
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-amber-400/70">Intent:</span>
                <span className="font-semibold text-amber-100">{typeof routing === 'object' ? routing.intent : routing}</span>
              </div>
            )}
            {latency && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-amber-400/70">Total Latency:</span>
                <span className="font-semibold text-amber-100">{latency} ms</span>
              </div>
            )}
            {diag.ttft_ms && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-amber-400/70">TTFT:</span>
                <span className="font-semibold text-emerald-400">{diag.ttft_ms} ms</span>
              </div>
            )}
          </div>

          {tools && tools.length > 0 && (
            <div className="flex items-start gap-1.5 pt-1 border-t border-amber-500/20">
              <Wrench className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-400/70">Tools Executed:</span>
              <div className="flex flex-wrap gap-1">
                {tools.map((t: string, idx: number) => (
                  <span key={idx} className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[10px] text-amber-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tokens && (
            <div className="pt-1 text-[10px] text-amber-400/70 border-t border-amber-500/20">
              Token usage: {JSON.stringify(tokens)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
