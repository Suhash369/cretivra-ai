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
  Columns,
  Maximize,
  ChevronRight,
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  X,
} from 'lucide-react';
import { AgentPlanRail } from './AgentPlanRail';
import { ExecutionTimeline, type TimelineEvent } from './ExecutionTimeline';
import { ArtifactGallery } from '../artifacts/ArtifactGallery';
import {
  getPlaygroundRunApi,
  cancelPlaygroundRunApi,
  approveActionApi,
  resolveArtifactDownloadUrl,
  type AgentRunDetail,
  type AgentTask,
  type Artifact,
  type ApprovalRequest,
} from '../../services/playgroundApi';
import { API_BASE } from '../../services/api';

interface AgentWorkspaceProps {
  runId: string;
  onBackToHome: () => void;
  onOpenStitchCanvas?: () => void;
}

export function AgentWorkspace({
  runId,
  onBackToHome,
  onOpenStitchCanvas,
}: AgentWorkspaceProps) {
  const [runDetail, setRunDetail] = useState<AgentRunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Viewport mode for website / HTML preview
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Timeline Activity Events
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [reasoningStatus, setReasoningStatus] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial run detail
  const loadRunDetail = async () => {
    try {
      const data = await getPlaygroundRunApi(runId);
      setRunDetail(data);
      setTasks(data.tasks || []);
      if (data.artifacts && data.artifacts.length > 0) {
        setArtifacts(data.artifacts);
        setSelectedArtifact((curr) => curr || data.artifacts[0]);
      }
      if (data.approvals && data.approvals.length > 0) {
        const pending = data.approvals.find((a) => a.status === 'pending');
        setPendingApproval(pending || null);
      }
    } catch (e) {
      console.error('Error fetching agent run detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRunDetail();
  }, [runId]);

  // Connect SSE stream for live agent execution updates
  useEffect(() => {
    if (!runId) return;

    const streamUrl = `${API_BASE}/playground/stream/${runId}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        const eventType = parsed.event;
        const data = parsed.data || {};
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (eventType === 'agent.run.started') {
          setEvents((prev) => [
            ...prev,
            { id: String(Date.now()), timestamp, type: 'info', title: 'Task Initialized', detail: data.prompt },
          ]);
        } else if (eventType === 'agent.plan.created') {
          if (data.tasks) setTasks(data.tasks);
          setEvents((prev) => [
            ...prev,
            { id: String(Date.now()), timestamp, type: 'info', title: `Plan Created (${data.task_count} milestones)` },
          ]);
        } else if (eventType === 'agent.task.started') {
          setActiveTool(data.tool_name || null);
          setTasks((prev) =>
            prev.map((t) => (t.id === data.task_id ? { ...t, status: 'RUNNING' } : t))
          );
          setEvents((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              timestamp,
              type: 'tool',
              title: data.description,
              toolName: data.tool_name,
              status: 'running',
            },
          ]);
        } else if (eventType === 'agent.tool.completed') {
          setActiveTool(null);
          setEvents((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              timestamp,
              type: 'tool',
              title: `Tool finished: ${data.tool_name || 'execution'}`,
              status: data.success ? 'completed' : 'failed',
            },
          ]);
        } else if (eventType === 'agent.task.completed') {
          setTasks((prev) =>
            prev.map((t) => (t.id === data.task_id ? { ...t, status: 'COMPLETED' } : t))
          );
        } else if (eventType === 'agent.task.failed') {
          setTasks((prev) =>
            prev.map((t) => (t.id === data.task_id ? { ...t, status: 'FAILED', error: data.error } : t))
          );
        } else if (eventType === 'agent.artifacts.updated') {
          if (data.artifacts) {
            setArtifacts(data.artifacts);
            setSelectedArtifact((curr) => curr || data.artifacts[0]);
          }
        } else if (eventType === 'agent.approval.required') {
          setPendingApproval({
            id: data.approval_id,
            tool_name: data.tool_name,
            description: data.description,
            risk_level: 'HIGH',
            status: 'pending',
            payload: {},
          });
        } else if (eventType === 'agent.run.completed') {
          setActiveTool(null);
          setRunDetail((curr) => (curr ? { ...curr, status: data.status, result: data.result } : null));
          setEvents((prev) => [
            ...prev,
            { id: String(Date.now()), timestamp, type: 'info', title: 'Execution Complete', detail: data.result },
          ]);
        }
      } catch (err) {
        console.error('Error handling SSE agent event:', err);
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
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

  const handleApproveAction = async (action: 'approve' | 'deny') => {
    if (!pendingApproval) return;
    try {
      await approveActionApi(runId, pendingApproval.id, action);
      setPendingApproval(null);
      loadRunDetail();
    } catch (e) {
      console.error('Error submitting approval action:', e);
    }
  };

  const handleStopRun = async () => {
    try {
      await cancelPlaygroundRunApi(runId);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      loadRunDetail();
    } catch (e) {
      console.error('Error cancelling run:', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden transition-colors duration-200">
      {/* 1. Sub-Header: Task Title & Status */}
      <div className="h-12 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToHome}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="Return to Home Command Center"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Goal
            </span>
            <span className="text-xs text-[var(--border)]">•</span>
            <span className="text-xs font-medium text-[var(--foreground)] truncate max-w-[340px] sm:max-w-[500px]">
              {runDetail?.prompt || 'Autonomous Task'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {runDetail?.status === 'RUNNING' && (
            <button
              onClick={handleStopRun}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <Square size={12} fill="currentColor" />
              <span>Cancel Task</span>
            </button>
          )}

          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
              runDetail?.status === 'COMPLETED'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : runDetail?.status === 'FAILED' || runDetail?.status === 'CANCELLED'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 animate-pulse'
            }`}
          >
            {runDetail?.status || 'INITIALIZING'}
          </span>
        </div>
      </div>

      {/* 2. Main Split Dynamic Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail: Agent Execution Plan */}
        <AgentPlanRail
          tasks={tasks}
          activeTaskId={selectedTask?.id}
          onSelectTask={setSelectedTask}
        />

        {/* Center: Live Workspace / Preview / Activity */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)] overflow-y-auto">
          {/* Human Approval Alert Banner (Section G) */}
          {pendingApproval && (
            <div className="m-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[var(--foreground)] animate-fade shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Human Approval Required (HITL)
                  </div>
                  <div className="text-sm font-medium text-[var(--foreground)] mt-1">
                    {pendingApproval.description || 'Asura requests permission to execute an elevated operation.'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleApproveAction('approve')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApproveAction('deny')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs font-medium hover:text-rose-500 hover:border-rose-500/40 transition-colors cursor-pointer"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* If an HTML / Website preview is active, render the browser-like frame */}
          {previewHtml ? (
            <div className="flex-1 flex flex-col m-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-lg animate-fade">
              {/* Browser Chrome Header */}
              <div className="h-10 px-3 bg-[var(--surface-secondary)] border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono ml-2 truncate max-w-[200px]">
                    {selectedArtifact?.name || 'live-preview.html'}
                  </span>
                </div>

                {/* Viewport controls: Desktop, Tablet, Mobile */}
                <div className="flex items-center gap-1 bg-[var(--surface)] p-0.5 rounded-lg border border-[var(--border)]">
                  <button
                    onClick={() => setPreviewViewport('desktop')}
                    className={`p-1 rounded cursor-pointer ${
                      previewViewport === 'desktop' ? 'bg-[var(--surface-secondary)] text-cyan-500' : 'text-[var(--muted-foreground)]'
                    }`}
                    title="Desktop (100%)"
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('tablet')}
                    className={`p-1 rounded cursor-pointer ${
                      previewViewport === 'tablet' ? 'bg-[var(--surface-secondary)] text-cyan-500' : 'text-[var(--muted-foreground)]'
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('mobile')}
                    className={`p-1 rounded cursor-pointer ${
                      previewViewport === 'mobile' ? 'bg-[var(--surface-secondary)] text-cyan-500' : 'text-[var(--muted-foreground)]'
                    }`}
                    title="Mobile (375px)"
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
              </div>

              {/* Iframe Viewport Container */}
              <div className="flex-1 flex justify-center bg-[var(--background)] p-4 overflow-auto">
                <div
                  className="h-full bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300"
                  style={{
                    width:
                      previewViewport === 'desktop'
                        ? '100%'
                        : previewViewport === 'tablet'
                        ? '768px'
                        : '375px',
                  }}
                >
                  <iframe
                    title="Live Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Otherwise, show the live execution timeline */
            <div className="flex-1 flex flex-col">
              <ExecutionTimeline
                events={events}
                reasoningStatus={reasoningStatus}
                activeTool={activeTool}
              />
            </div>
          )}
        </div>

        {/* Right Rail: Artifacts & Deliverables */}
        {artifacts.length > 0 && (
          <ArtifactGallery
            artifacts={artifacts}
            selectedArtifact={selectedArtifact}
            onSelectArtifact={setSelectedArtifact}
            onPreviewArtifact={(art) => setSelectedArtifact(art)}
          />
        )}
      </div>
    </div>
  );
}
