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
    <div className="flex-1 flex flex-col h-full bg-[#060911] overflow-hidden">
      {/* 1. Sub-Header: Task Title & Status */}
      <div className="h-12 border-b border-[#232D45] bg-[#0D121F]/90 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToHome}
            className="p-1.5 rounded-lg text-[#8891A8] hover:text-[#E7EAF4] hover:bg-[#151C2E] transition-colors"
            title="Return to Home Command Center"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-[#8891A8] uppercase tracking-wider">
              Goal
            </span>
            <span className="text-xs text-[#232D45]">•</span>
            <span className="text-xs font-medium text-[#E7EAF4] truncate max-w-[340px] sm:max-w-[500px]">
              {runDetail?.prompt || 'Autonomous Task'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {runDetail?.status === 'RUNNING' && (
            <button
              onClick={handleStopRun}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] text-xs font-medium hover:bg-[#F43F5E]/20 transition-all asura-btn-interactive"
            >
              <Square size={12} fill="currentColor" />
              <span>Cancel Task</span>
            </button>
          )}

          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide ${
              runDetail?.status === 'COMPLETED'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40'
                : runDetail?.status === 'FAILED' || runDetail?.status === 'CANCELLED'
                ? 'bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/40'
                : 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/40 animate-pulse'
            }`}
          >
            {runDetail?.status || 'INITIALIZING'}
          </span>
        </div>
      </div>

      {/* 2. Main 3-Panel Dynamic Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail: Agent Execution Plan */}
        <AgentPlanRail
          tasks={tasks}
          activeTaskId={selectedTask?.id}
          onSelectTask={setSelectedTask}
        />

        {/* Center: Live Workspace / Preview / Activity */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#060911] overflow-y-auto">
          {/* Human Approval Alert Banner (Part 43) */}
          {pendingApproval && (
            <div className="m-4 p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-[#E7EAF4] animate-enter">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-[#F59E0B] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">
                    Human Approval Required
                  </div>
                  <div className="text-sm font-medium text-[#E7EAF4] mt-1">
                    {pendingApproval.description || 'Asura requests permission to execute a high-risk operation.'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleApproveAction('approve')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#060911] text-xs font-bold hover:bg-[#F59E0B]/90 transition-colors asura-btn-interactive shadow-sm"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApproveAction('deny')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151C2E] border border-[#232D45] text-[#E7EAF4] text-xs font-medium hover:text-[#F43F5E] hover:border-[#F43F5E]/40 transition-colors asura-btn-interactive"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* If an HTML / Website preview is active, render the browser-like frame (Part 41) */}
          {previewHtml ? (
            <div className="flex-1 flex flex-col m-4 rounded-xl border border-[#232D45] bg-[#0D121F] overflow-hidden shadow-xl animate-enter">
              {/* Browser Chrome Header */}
              <div className="h-10 px-3 bg-[#151C2E] border-b border-[#232D45] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/70" />
                  </div>
                  <span className="text-xs text-[#8891A8] font-mono ml-2 truncate max-w-[200px]">
                    {selectedArtifact?.name || 'live-preview.html'}
                  </span>
                </div>

                {/* Viewport controls: Desktop, Tablet, Mobile */}
                <div className="flex items-center gap-1 bg-[#060911] p-0.5 rounded-lg border border-[#232D45]">
                  <button
                    onClick={() => setPreviewViewport('desktop')}
                    className={`p-1 rounded ${
                      previewViewport === 'desktop' ? 'bg-[#151C2E] text-[#06B6D4]' : 'text-[#8891A8]'
                    }`}
                    title="Desktop (100%)"
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('tablet')}
                    className={`p-1 rounded ${
                      previewViewport === 'tablet' ? 'bg-[#151C2E] text-[#06B6D4]' : 'text-[#8891A8]'
                    }`}
                    title="Tablet (768px)"
                  >
                    <Tablet size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('mobile')}
                    className={`p-1 rounded ${
                      previewViewport === 'mobile' ? 'bg-[#151C2E] text-[#06B6D4]' : 'text-[#8891A8]'
                    }`}
                    title="Mobile (375px)"
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
              </div>

              {/* Iframe Viewport Container */}
              <div className="flex-1 flex justify-center bg-[#060911] p-4 overflow-auto">
                <div
                  className="h-full bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
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

        {/* Right Rail: Artifacts & Deliverables (Expands contextually) */}
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
