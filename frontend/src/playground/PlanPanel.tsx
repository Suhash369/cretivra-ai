import React from 'react';
import { CheckCircle2, Loader2, Circle, AlertTriangle, XCircle, RefreshCw, Wrench, Cpu } from 'lucide-react';
import type { AgentTask } from '../services/playgroundApi';

interface PlanPanelProps {
  tasks: AgentTask[];
  activeTaskId?: string;
  onSelectTask?: (task: AgentTask) => void;
}

export function PlanPanel({ tasks, activeTaskId, onSelectTask }: PlanPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-[#232d45] rounded-xl overflow-hidden shadow-xs">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-[#232d45] flex items-center justify-between bg-slate-50 dark:bg-[#151c2e]/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Execution Plan</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">
          {tasks.filter((t) => t.status === 'COMPLETED').length} / {tasks.length} Completed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.map((task) => {
          const isSelected = activeTaskId === task.id;
          const statusIcon = (() => {
            switch (task.status) {
              case 'COMPLETED':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />;
              case 'RUNNING':
                return <Loader2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-spin shrink-0" />;
              case 'WAITING_FOR_APPROVAL':
                return <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse shrink-0" />;
              case 'FAILED':
                return <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />;
              case 'RETRYING':
                return <RefreshCw className="w-4 h-4 text-purple-500 dark:text-purple-400 animate-spin shrink-0" />;
              default:
                return <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />;
            }
          })();

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask?.(task)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-500/50 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-[#151c2e]/40 border-slate-200 dark:border-[#232d45]/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#151c2e]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{statusIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{task.description}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">#{task.order}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {task.model_id && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono border border-slate-200 dark:border-slate-700/50">
                        <Cpu className="w-2.5 h-2.5" />
                        {task.model_id}
                      </span>
                    )}
                    {task.tool_name && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-violet-700 dark:text-violet-300 font-mono border border-slate-200 dark:border-slate-700/50">
                        <Wrench className="w-2.5 h-2.5" />
                        {task.tool_name}
                      </span>
                    )}
                    {task.retry_count > 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Retry {task.retry_count}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
