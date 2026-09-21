import React from 'react';
import { ArrowDown, Check, Loader2, AlertTriangle, X, Play } from 'lucide-react';
import type { AgentTask } from '../services/playgroundApi';

interface TaskGraphProps {
  tasks: AgentTask[];
  onSelectTask?: (task: AgentTask) => void;
  selectedTaskId?: string;
}

export function TaskGraph({ tasks, onSelectTask, selectedTaskId }: TaskGraphProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-[#232d45] rounded-xl overflow-hidden shadow-xs">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-[#232d45] flex items-center justify-between bg-slate-50 dark:bg-[#151c2e]/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
          <span>Task Dependency Graph</span>
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 inline-block" /> Pending</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 inline-block" /> Running</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block" /> Done</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 inline-block" /> Approval</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        {tasks.map((task, idx) => {
          const isSelected = selectedTaskId === task.id;
          const isLast = idx === tasks.length - 1;

          const nodeColorClass = (() => {
            switch (task.status) {
              case 'COMPLETED':
                return 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
              case 'RUNNING':
                return 'border-cyan-500/80 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 ring-1 ring-cyan-500/50';
              case 'WAITING_FOR_APPROVAL':
                return 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/50';
              case 'FAILED':
                return 'border-rose-500/60 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
              default:
                return 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151c2e]/60 text-slate-600 dark:text-slate-400';
            }
          })();

          return (
            <React.Fragment key={task.id}>
              <div
                onClick={() => onSelectTask?.(task)}
                className={`w-full max-w-md p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${nodeColorClass} ${
                  isSelected ? 'shadow-lg shadow-cyan-500/10' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-900 border border-current text-[10px] font-mono font-bold">
                      {task.order}
                    </span>
                    <span className="text-xs font-semibold line-clamp-1">{task.description}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">{task.status}</span>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-current/10 text-[10px] opacity-75">
                  <span>Model: <b>{task.model_id}</b></span>
                  {task.tool_name && <span>&bull; Tool: <b>{task.tool_name}</b></span>}
                </div>
              </div>

              {!isLast && (
                <div className="py-1.5 flex justify-center text-slate-600">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
