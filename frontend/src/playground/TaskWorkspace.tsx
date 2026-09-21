import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Activity,
  Layers,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PlanPanel } from './PlanPanel';
import { TaskGraph } from './TaskGraph';
import { ApprovalCard } from './ApprovalCard';
import { ArtifactPanel } from './ArtifactPanel';
import { PreviewPanel } from './PreviewPanel';
import {
  getPlaygroundRunApi,
  cancelPlaygroundRunApi,
  approveActionApi,
  resolveArtifactDownloadUrl,
  type AgentRunDetail,
  type AgentTask,
  type Artifact,
  type ApprovalRequest,
} from '../services/playgroundApi';
import { API_BASE } from '../services/api';

interface TaskWorkspaceProps {
  runId: string;
  onBackToHome: () => void;
}

interface ActivityLogItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  details?: any;
}

export function TaskWorkspace({ runId, onBackToHome }: TaskWorkspaceProps) {
  const [runDetail, setRunDetail] = useState<AgentRunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const [activeLeftView, setActiveLeftView] = useState<'plan' | 'graph'>('plan');
  const [activeCenterView, setActiveCenterView] = useState<'activity' | 'preview'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [durationTimer, setDurationTimer] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial fetch of run details
  const fetchRunDetails = async () => {
    try {
      const data = await getPlaygroundRunApi(runId);
      setRunDetail(data);
      setTasks(data.tasks || []);
      if (data.artifacts && data.artifacts.length > 0) {
        setArtifacts(data.artifacts);
        setSelectedArtifact((curr) => curr || data.artifacts[0]);
      } else {
        setArtifacts([]);
      }
      if (data.approvals && data.approvals.length > 0) {
        const pending = data.approvals.find((a) => a.status === 'pending');
        setPendingApproval(pending || null);
      }
    } catch (err) {
      console.error('Failed to fetch run details:', err);
    }
  };

  useEffect(() => {
    fetchRunDetails();
  }, [runId]);

  // Load preview content when artifact is selected
  useEffect(() => {
    if (selectedArtifact) {
      if (
        selectedArtifact.type === 'WEBSITE' ||
        selectedArtifact.name.endsWith('.html') ||
        selectedArtifact.name.endsWith('.htm')
      ) {
        const url = resolveArtifactDownloadUrl(selectedArtifact.download_url);
        fetch(url)
          .then((res) => (res.ok ? res.text() : ''))
          .then((html) => {
            if (html) setPreviewHtml(html);
          })
          .catch(() => {});
      } else {
        setPreviewHtml(null);
      }
    }
  }, [selectedArtifact]);

  // Duration timer
  useEffect(() => {
    if (runDetail?.status === 'RUNNING') {
      const interval = setInterval(() => {
        setDurationTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [runDetail?.status]);

  // Connect SSE Event Stream
  useEffect(() => {
    const sseUrl = `${API_BASE}/playground/stream/${runId}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    const addLog = (type: string, message: string, details?: any) => {
      setActivityLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type,
          message,
          timestamp: new Date().toLocaleTimeString(),
          details,
        },
      ]);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { event: eventType, data } = payload;

        switch (eventType) {
          case 'agent.run.started':
            addLog('run', `Run started with intent: ${data.intent}`);
            setRunDetail((prev) => (prev ? { ...prev, status: 'RUNNING' } : null));
            break;

          case 'agent.plan.created':
            addLog('plan', `Plan created with ${data.task_count} subtasks.`);
            if (data.tasks) {
              setTasks(data.tasks);
            }
            break;

          case 'agent.task.started':
            addLog('task', `[Task #${data.task_order}] ${data.description}`);
            setTasks((prev) =>
              prev.map((t) => (t.id === data.task_id ? { ...t, status: 'RUNNING' } : t))
            );
            break;

          case 'agent.tool.started':
            addLog('tool', `Invoking tool: ${data.tool_name}`, data.input);
            break;

          case 'agent.tool.completed':
            addLog('tool_complete', `Tool '${data.tool_name}' finished (${data.success ? 'success' : 'failed'})`);
            break;

          case 'agent.task.completed':
            addLog('task_done', `Completed: ${data.description}`);
            setTasks((prev) =>
              prev.map((t) => (t.id === data.task_id ? { ...t, status: 'COMPLETED' } : t))
            );
            break;

          case 'agent.task.failed':
            addLog('task_error', `Failed: ${data.description} (${data.error})`);
            setTasks((prev) =>
              prev.map((t) => (t.id === data.task_id ? { ...t, status: 'FAILED', error: data.error } : t))
            );
            break;

          case 'agent.approval.required':
            addLog('approval', `Action requires confirmation: ${data.description}`);
            setPendingApproval({
              id: data.approval_id,
              tool_name: data.tool_name,
              description: data.description,
              risk_level: 'HIGH',
              status: 'pending',
              payload: data,
            });
            setRunDetail((prev) => (prev ? { ...prev, status: 'WAITING_FOR_APPROVAL' } : null));
            break;

          case 'agent.artifacts.updated':
            if (data.artifacts) {
              setArtifacts(data.artifacts);
              // Auto-select latest artifact
              if (data.artifacts.length > 0) {
                const latest = data.artifacts[data.artifacts.length - 1];
                setSelectedArtifact(latest);
              }
            }
            break;

          case 'agent.run.completed':
            addLog('run_done', `Run finished: ${data.status} (duration: ${data.duration}s)`);
            setRunDetail((prev) => (prev ? { ...prev, status: data.status, duration: data.duration, result: data.result } : null));
            es.close();
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE frame:', err);
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [runId]);

  const handleApprove = async (approvalId: string, modifiedPayload?: any) => {
    setIsProcessingApproval(true);
    try {
      await approveActionApi(runId, approvalId, 'approve', modifiedPayload);
      setPendingApproval(null);
      setRunDetail((prev) => (prev ? { ...prev, status: 'RUNNING' } : null));
      // Re-trigger execution or fetch update
      await fetchRunDetails();
    } catch (err) {
      alert(`Approval error: ${err}`);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDeny = async (approvalId: string) => {
    setIsProcessingApproval(true);
    try {
      await approveActionApi(runId, approvalId, 'deny');
      setPendingApproval(null);
      setRunDetail((prev) => (prev ? { ...prev, status: 'FAILED' } : null));
    } catch (err) {
      alert(`Deny error: ${err}`);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('Cancel this autonomous run?')) {
      try {
        await cancelPlaygroundRunApi(runId);
        setRunDetail((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      } catch (err) {
        alert('Failed to cancel run');
      }
    }
  };

  const statusBadge = (() => {
    const s = runDetail?.status || 'RUNNING';
    switch (s) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      case 'RUNNING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse">RUNNING</span>;
      case 'WAITING_FOR_APPROVAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">APPROVAL NEEDED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">{s}</span>;
    }
  })();

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-slate-200 dark:border-[#232d45] px-4 flex items-center justify-between bg-white dark:bg-[#0d121f]/90 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToHome}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Back to Playground Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">
              {runDetail?.prompt || 'Autonomous Task Run'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{runDetail?.duration ? `${runDetail.duration}s` : `${durationTimer}s`}</span>
          </div>

          {statusBadge}

          {runDetail?.status === 'RUNNING' && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Plan & Task Graph (4 cols) */}
        <div className="col-span-4 flex flex-col gap-2 h-full overflow-hidden">
          <div className="flex bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-[#232d45] rounded-lg p-1 shrink-0">
            <button
              onClick={() => setActiveLeftView('plan')}
              className={`flex-1 py-1 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeLeftView === 'plan' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Plan Checklist
            </button>
            <button
              onClick={() => setActiveLeftView('graph')}
              className={`flex-1 py-1 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeLeftView === 'graph' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Task Graph
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeLeftView === 'plan' ? (
              <PlanPanel
                tasks={tasks}
                activeTaskId={selectedTask?.id}
                onSelectTask={(t) => setSelectedTask(t)}
              />
            ) : (
              <TaskGraph
                tasks={tasks}
                selectedTaskId={selectedTask?.id}
                onSelectTask={(t) => setSelectedTask(t)}
              />
            )}
          </div>
        </div>

        {/* Center Column: Live Agent Activity & Pending Approval (5 cols) */}
        <div className="col-span-5 flex flex-col gap-3 h-full overflow-hidden">
          {pendingApproval && (
            <div className="shrink-0">
              <ApprovalCard
                approval={pendingApproval}
                onApprove={handleApprove}
                onDeny={handleDeny}
                isProcessing={isProcessingApproval}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-[#232d45] rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-[#232d45] flex items-center justify-between bg-slate-50 dark:bg-[#151c2e]/50 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                  Live Agent Activity
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Real Backend Execution Events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {activityLogs.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <span>Waiting for agent event stream...</span>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-600 text-[10px] shrink-0 mt-0.5">{log.timestamp}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                        log.type.includes('error')
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : log.type.includes('tool')
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : log.type.includes('done')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="flex-1 break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Artifacts & Live Preview (3 cols) */}
        <div className="col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          <div className="h-1/2 overflow-hidden">
            <ArtifactPanel
              artifacts={artifacts}
              selectedArtifactId={selectedArtifact?.id}
              onSelectPreview={(art) => setSelectedArtifact(art)}
            />
          </div>

          <div className="h-1/2 overflow-hidden">
            <PreviewPanel
              artifact={selectedArtifact}
              htmlContent={previewHtml}
              markdownContent={runDetail?.result}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
