import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Plus,
  Search,
  ArrowRight,
  ShieldAlert,
  Coins,
  Cpu,
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../services/api';

export interface AgentRunSummary {
  id: string;
  prompt: string;
  intent: string;
  status: string;
  duration: number;
  tokens?: number;
  project_id?: string;
  created_at?: string;
}

interface TasksWorkspaceProps {
  onSelectRun: (runId: string) => void;
  onNewTask: () => void;
}

export function TasksWorkspace({ onSelectRun, onNewTask }: TasksWorkspaceProps) {
  const [runs, setRuns] = useState<AgentRunSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'RUNNING' | 'COMPLETED' | 'WAITING_FOR_APPROVAL' | 'FAILED'>('all');
  const [search, setSearch] = useState('');

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agents/runs`, {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (e) {
      console.error('Failed to fetch tasks/runs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const filteredRuns = runs.filter((r) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'RUNNING'
        ? r.status === 'RUNNING' || r.status === 'PLANNING' || r.status === 'WAITING'
        : filter === 'WAITING_FOR_APPROVAL'
        ? r.status === 'WAITING_FOR_APPROVAL'
        : filter === 'COMPLETED'
        ? r.status === 'COMPLETED'
        : r.status === 'FAILED' || r.status === 'CANCELLED';

    const matchesSearch =
      !search.trim() ||
      r.prompt.toLowerCase().includes(search.toLowerCase()) ||
      r.intent.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden p-6 sm:p-8 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">Tasks</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Monitor and review autonomous agent execution workloads and DAG milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRuns}
            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="Refresh runs"
            aria-label="Refresh tasks"
          >
            <RotateCw size={15} />
          </button>
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Section G: RUNNING, COMPLETED, WAITING_FOR_APPROVAL, FAILED) */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-2xl border border-[var(--border)] text-xs">
          {(['all', 'RUNNING', 'COMPLETED', 'WAITING_FOR_APPROVAL', 'FAILED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-2xs border border-[var(--border)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab === 'all'
                ? 'All'
                : tab === 'RUNNING'
                ? 'Running'
                : tab === 'COMPLETED'
                ? 'Completed'
                : tab === 'WAITING_FOR_APPROVAL'
                ? 'Approval Needed'
                : 'Failed'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Runs Table / List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-0">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Loading tasks...</div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--muted-foreground)] rounded-2xl border border-dashed border-[var(--border)]">
            No matching tasks found.
          </div>
        ) : (
          filteredRuns.map((r) => {
            const isRunning = r.status === 'RUNNING' || r.status === 'PLANNING';
            const isApproval = r.status === 'WAITING_FOR_APPROVAL';
            const isCompleted = r.status === 'COMPLETED';
            const isFailed = r.status === 'FAILED' || r.status === 'CANCELLED';

            return (
              <div
                key={r.id}
                onClick={() => onSelectRun(r.id)}
                className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-cyan-500/40 hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex items-center justify-between gap-4 group shadow-2xs hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    {isRunning ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                    ) : isApproval ? (
                      <ShieldAlert size={16} className="text-amber-500" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {r.prompt}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] mt-1 flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[var(--surface-secondary)] rounded-md border border-[var(--border)]">
                        {r.intent || 'TASK'}
                      </span>
                      {r.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>{r.duration.toFixed(1)}s</span>
                        </span>
                      )}
                      {r.tokens ? (
                        <span className="flex items-center gap-1">
                          <Coins size={11} />
                          <span>{r.tokens} tokens</span>
                        </span>
                      ) : null}
                      {r.created_at && (
                        <span>
                          {new Date(r.created_at).toLocaleDateString()}{' '}
                          {new Date(r.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : isRunning
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 animate-pulse'
                        : isApproval
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {r.status}
                  </span>
                  <ArrowRight size={14} className="text-[var(--muted-foreground)] group-hover:text-cyan-500 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
