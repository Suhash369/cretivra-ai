import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Plus,
  Search,
  ArrowRight,
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../services/api';

export interface AgentRunSummary {
  id: string;
  prompt: string;
  intent: string;
  status: string;
  duration: number;
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
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
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
        : filter === 'running'
        ? r.status === 'RUNNING' || r.status === 'PLANNING' || r.status === 'WAITING'
        : filter === 'completed'
        ? r.status === 'COMPLETED'
        : r.status === 'FAILED' || r.status === 'CANCELLED';

    const matchesSearch =
      !search.trim() ||
      r.prompt.toLowerCase().includes(search.toLowerCase()) ||
      r.intent.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#060911] overflow-hidden p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#E7EAF4] tracking-tight">Tasks</h1>
          <p className="text-xs text-[#8891A8] mt-1">
            Monitor and review autonomous agent execution workloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRuns}
            className="p-2 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#8891A8] hover:text-[#E7EAF4] transition-colors asura-btn-interactive"
            title="Refresh runs"
          >
            <RotateCw size={15} />
          </button>
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06B6D4] text-[#060911] text-xs font-semibold hover:bg-[#06B6D4]/90 transition-colors shadow-sm asura-btn-interactive"
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[#0D121F] p-1 rounded-xl border border-[#232D45]">
          {(['all', 'running', 'completed', 'failed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === tab
                  ? 'bg-[#151C2E] text-[#E7EAF4] font-semibold shadow-xs border border-[#232D45]'
                  : 'text-[#8891A8] hover:text-[#E7EAF4]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-2.5 text-[#8891A8]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0D121F] border border-[#232D45] rounded-xl text-xs text-[#E7EAF4] placeholder-[#8891A8] focus:outline-none focus:border-[#06B6D4]/40"
          />
        </div>
      </div>

      {/* Runs Table / Grid */}
      <div className="flex-1 overflow-y-auto space-y-2.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#8891A8]">Loading tasks...</div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8891A8] rounded-xl border border-dashed border-[#232D45]">
            No matching tasks found.
          </div>
        ) : (
          filteredRuns.map((r) => {
            const isRunning = r.status === 'RUNNING' || r.status === 'PLANNING';
            const isCompleted = r.status === 'COMPLETED';
            const isFailed = r.status === 'FAILED' || r.status === 'CANCELLED';

            return (
              <div
                key={r.id}
                onClick={() => onSelectRun(r.id)}
                className="p-4 rounded-xl bg-[#0D121F] border border-[#232D45] hover:border-[#06B6D4]/40 transition-all cursor-pointer flex items-center justify-between gap-4 group asura-card-interactive"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#151C2E] border border-[#232D45] flex items-center justify-center shrink-0">
                    {isRunning ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-ping" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={16} className="text-[#10B981]" />
                    ) : (
                      <AlertCircle size={16} className="text-[#F43F5E]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#E7EAF4] truncate group-hover:text-[#06B6D4] transition-colors">
                      {r.prompt}
                    </div>
                    <div className="text-[11px] text-[#8891A8] mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#151C2E] rounded border border-[#232D45]">
                        {r.intent || 'TASK'}
                      </span>
                      {r.duration > 0 && <span>Duration: {r.duration.toFixed(1)}s</span>}
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
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide ${
                      isCompleted
                        ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                        : isRunning
                        ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 animate-pulse'
                        : 'bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/30'
                    }`}
                  >
                    {r.status}
                  </span>
                  <ArrowRight size={14} className="text-[#8891A8] group-hover:text-[#06B6D4] transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
