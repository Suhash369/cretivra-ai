import { API_BASE, getAuthHeaders } from './api';

export interface AgentTask {
  id: string;
  order: number;
  type: string;
  description: string;
  status: 'PENDING' | 'PLANNING' | 'RUNNING' | 'WAITING' | 'WAITING_FOR_APPROVAL' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'CANCELLED';
  model_id: string;
  tool_name?: string;
  error?: string;
  retry_count: number;
}

export interface Artifact {
  id: string;
  name: string;
  type: string;
  size: number;
  download_url: string;
}

export interface ApprovalRequest {
  id: string;
  tool_name: string;
  description: string;
  risk_level: string;
  status: string;
  payload: any;
}

export interface AgentRunDetail {
  id: string;
  prompt: string;
  intent: string;
  status: string;
  duration: number;
  result?: string;
  error?: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    waiting_approval: number;
    percentage: number;
    status: string;
  };
  tasks: AgentTask[];
  artifacts: Artifact[];
  approvals: ApprovalRequest[];
}

export async function startPlaygroundRunApi(payload: {
  prompt: string;
  project_id?: string;
  model_id?: string;
}): Promise<{ run_id: string; status: string; intent: string; project_id: string; stream_url: string }> {
  const res = await fetch(`${API_BASE}/agents/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to start playground run');
  }
  return res.json();
}

export async function getPlaygroundRunApi(runId: string): Promise<AgentRunDetail> {
  const res = await fetch(`${API_BASE}/agents/runs/${runId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch run details');
  }
  return res.json();
}

export async function cancelPlaygroundRunApi(runId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/agents/runs/${runId}/cancel`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    throw new Error('Failed to cancel run');
  }
  return res.json();
}

export async function approveActionApi(
  runId: string,
  approvalId: string,
  action: 'approve' | 'deny' = 'approve',
  modifiedPayload?: any
): Promise<{ status: string }> {
  const endpoint = action === 'approve' ? 'approve' : 'deny';
  const res = await fetch(`${API_BASE}/agents/runs/${runId}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      approval_id: approvalId,
      action,
      modified_payload: modifiedPayload,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to ${action} action`);
  }
  return res.json();
}

export async function fetchToolsCatalogApi(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/tools`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSkillsCatalogApi(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/skills`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchProjectsApi(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/projects`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) return [];
  return res.json();
}

export function resolveArtifactDownloadUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const basePrefix = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
  return `${basePrefix}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function synthesizeUiApi(prompt: string, appName?: string, variantTheme?: string, deviceType: string = 'DESKTOP'): Promise<{ success: boolean; html: string; prompt: string; device_type: string }> {
  const res = await fetch(`${API_BASE}/playground/ui/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ prompt, app_name: appName, variant_theme: variantTheme, device_type: deviceType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to synthesize UI');
  }
  return res.json();
}

export async function fetchUiVariantsApi(prompt: string, appName?: string): Promise<{
  success: boolean;
  prompt: string;
  variants: Array<{ id: string; name: string; theme: string; description: string; html: string }>;
}> {
  const res = await fetch(`${API_BASE}/playground/ui/variants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ prompt, app_name: appName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch UI variants');
  }
  return res.json();
}

export async function refineUiApi(prompt: string, instruction: string, currentHtml?: string): Promise<{ success: boolean; html: string; instruction: string }> {
  const res = await fetch(`${API_BASE}/playground/ui/refine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ prompt, instruction, current_html: currentHtml }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to refine UI');
  }
  return res.json();
}

export async function listProjectsApi(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/projects`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) return [];
  return res.json();
}

export async function createProjectApi(payload: { name: string; description?: string }): Promise<any> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create project');
  }
  return res.json();
}

export async function listArtifactsApi(projectId?: string, runId?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (projectId) params.set('project_id', projectId);
  if (runId) params.set('run_id', runId);
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/artifacts${query}`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) return [];
  return res.json();
}
