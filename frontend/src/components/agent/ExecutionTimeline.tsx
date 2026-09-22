import React, { useState } from 'react';
import {
  Activity,
  Globe,
  Code2,
  FileText,
  FileSpreadsheet,
  Cpu,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'tool' | 'reasoning' | 'artifact' | 'approval' | 'error';
  title: string;
  detail?: string;
  toolName?: string;
  status?: 'running' | 'completed' | 'failed';
  durationMs?: number;
}

interface ExecutionTimelineProps {
  events: TimelineEvent[];
  reasoningStatus?: string | null;
  activeTool?: string | null;
}

export function ExecutionTimeline({
  events,
  reasoningStatus,
  activeTool,
}: ExecutionTimelineProps) {
  const [reasoningExpanded, setReasoningExpanded] = useState(false);

  return (
    <div className="flex flex-col space-y-3 p-4">
      {/* 1. High-level Reasoning Status Card (Part 21) */}
      {reasoningStatus && (
        <div className="rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 p-3 text-xs text-[#E7EAF4] animate-fade">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#8B5CF6] font-medium">
              <Brain size={14} className="animate-pulse" />
              <span>{reasoningStatus}</span>
            </div>
            <button
              onClick={() => setReasoningExpanded(!reasoningExpanded)}
              className="text-[#8891A8] hover:text-[#E7EAF4] p-1"
              title="Toggle reasoning trace details"
            >
              {reasoningExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
          {reasoningExpanded && (
            <div className="mt-2 pt-2 border-t border-[#8B5CF6]/20 text-[11px] text-[#8891A8] leading-relaxed">
              Asura is synthesizing multi-hop evidence and structuring verified data points.
            </div>
          )}
        </div>
      )}

      {/* 2. Active Tool Banner (Part 20) */}
      {activeTool && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-xs text-[#06B6D4] animate-scale">
          <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-ping" />
          <span className="font-semibold capitalize">{activeTool.replace('_', ' ')}</span>
          <span className="text-[#8891A8] text-[11px]">— Executing autonomous step...</span>
        </div>
      )}

      {/* 3. Chronological Activity Stream (Part 19) */}
      <div className="space-y-2">
        {events.map((ev, index) => {
          const isTool = ev.type === 'tool';
          const isSuccess = ev.status === 'completed';
          const isRunning = ev.status === 'running';
          const isError = ev.type === 'error' || ev.status === 'failed';

          return (
            <div
              key={ev.id || index}
              className={`flex items-start gap-3 p-2.5 rounded-lg text-xs transition-all animate-enter ${
                isRunning
                  ? 'bg-[#151C2E] border border-[#06B6D4]/40 shadow-xs'
                  : 'bg-[#151C2E]/40 border border-[#232D45]/40'
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Timestamp */}
              <span className="text-[10px] font-mono text-[#8891A8] shrink-0 pt-0.5">
                {ev.timestamp}
              </span>

              {/* Status Icon */}
              <div className="shrink-0 pt-0.5">
                {isRunning ? (
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4] block animate-ping" />
                ) : isSuccess ? (
                  <CheckCircle2 size={13} className="text-[#10B981]" />
                ) : isError ? (
                  <AlertCircle size={13} className="text-[#F43F5E]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8891A8] block" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-medium truncate ${
                      isRunning
                        ? 'text-[#06B6D4]'
                        : isSuccess
                        ? 'text-[#E7EAF4]'
                        : isError
                        ? 'text-[#F43F5E]'
                        : 'text-[#8891A8]'
                    }`}
                  >
                    {ev.title}
                  </span>
                  {ev.durationMs && (
                    <span className="text-[10px] text-[#8891A8] shrink-0">
                      {(ev.durationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                {ev.detail && (
                  <p className="text-[11px] text-[#8891A8] mt-0.5 leading-relaxed truncate">
                    {ev.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
