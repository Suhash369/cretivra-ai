import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import type { AgentTask } from '../../services/playgroundApi';

interface AgentPlanRailProps {
  tasks: AgentTask[];
  activeTaskId?: string | null;
  onSelectTask?: (task: AgentTask) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AgentPlanRail({
  tasks,
  activeTaskId,
  onSelectTask,
  isCollapsed = false,
  onToggleCollapse,
}: AgentPlanRailProps) {
  if (tasks.length === 0) {
    return (
      <div className="p-4 text-xs text-[#8891A8] text-center italic">
        Generating execution plan...
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100) || 0;

  return (
    <div className="flex flex-col h-full bg-[#0D121F] border-r border-[#232D45] w-[260px] select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#232D45]/60 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-[#8891A8] uppercase tracking-wider">
            Agent Plan
          </div>
          <div className="text-xs text-[#E7EAF4] font-medium mt-0.5">
            {completedCount} of {tasks.length} completed ({progressPercent}%)
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#151C2E] h-1">
        <div
          className="bg-[#06B6D4] h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Task Rail with connecting line */}
      <div className="flex-1 overflow-y-auto p-3.5 relative space-y-4 scrollbar-thin scrollbar-thumb-[#232D45]">
        {/* Continuous vertical connecting line */}
        <div className="absolute left-[26px] top-6 bottom-6 w-[2px] bg-[#232D45]" />

        {tasks.map((task, idx) => {
          const isSelected = activeTaskId === task.id;
          const isCompleted = task.status === 'COMPLETED';
          const isRunning = task.status === 'RUNNING' || task.status === 'PLANNING';
          const isFailed = task.status === 'FAILED';
          const isWaiting = task.status === 'WAITING' || task.status === 'WAITING_FOR_APPROVAL';

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask && onSelectTask(task)}
              className={`relative flex items-start gap-3 cursor-pointer group transition-all ${
                isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'
              }`}
            >
              {/* Status Indicator Dot */}
              <div className="relative z-10 shrink-0 w-6 h-6 rounded-full bg-[#0D121F] border border-[#232D45] flex items-center justify-center transition-colors">
                {isCompleted ? (
                  <CheckCircle2 size={16} className="text-[#10B981] animate-success" />
                ) : isRunning ? (
                  <div className="relative flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                  </div>
                ) : isFailed ? (
                  <AlertCircle size={16} className="text-[#F43F5E] animate-error" />
                ) : isWaiting ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#8891A8]/40 group-hover:bg-[#8891A8]" />
                )}
              </div>

              {/* Task Details */}
              <div
                className={`flex-1 p-2 rounded-lg transition-all text-left ${
                  isSelected
                    ? 'bg-[#151C2E] border border-[#06B6D4]/30 shadow-sm'
                    : 'hover:bg-[#151C2E]/40 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-medium leading-snug line-clamp-2 ${
                      isCompleted
                        ? 'text-[#8891A8] line-through'
                        : isRunning
                        ? 'text-[#06B6D4] font-semibold'
                        : 'text-[#E7EAF4]'
                    }`}
                  >
                    {task.description}
                  </span>
                </div>

                {task.tool_name && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8891A8]">
                    <span className="px-1.5 py-0.2 bg-[#060911] border border-[#232D45] rounded font-mono">
                      {task.tool_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
