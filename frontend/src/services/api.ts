import type { HealthStatus, SystemSettings, CretivraModel, Conversation, GroupedConversations, Attachment } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('cretivra_auth_token');
  } catch {
    return null;
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function registerUserApi(payload: { email: string; password: string; full_name?: string }): Promise<{
  access_token: string;
  token_type: string;
  user: { id: string; email: string; full_name?: string };
}> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function loginUserApi(payload: { email: string; password: string }): Promise<{
  access_token: string;
  token_type: string;
  user: { id: string; email: string; full_name?: string };
}> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function fetchCurrentUserProfileApi(): Promise<{ id: string; email: string; full_name?: string }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModels(): Promise<CretivraModel[]> {
  const res = await fetch(`${API_BASE}/models`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`);
  return res.json();
}

export async function updateModelMapping(modelId: string, payload: Partial<CretivraModel>): Promise<CretivraModel> {
  const res = await fetch(`${API_BASE}/models/${modelId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update model mapping: ${res.statusText}`);
  return res.json();
}

export async function fetchConversations(searchQuery?: string): Promise<{ conversations: Conversation[]; grouped: GroupedConversations }> {
  const url = searchQuery ? `${API_BASE}/conversations?q=${encodeURIComponent(searchQuery)}` : `${API_BASE}/conversations`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.statusText}`);
  return res.json();
}

export async function createConversation(title = 'New Conversation', model_id = 'cretivra-1'): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ title, model_id }),
  });
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.statusText}`);
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch conversation ${id}: ${res.statusText}`);
  return res.json();
}

export async function updateConversation(id: string, payload: { title?: string; model_id?: string }): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update conversation: ${res.statusText}`);
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.statusText}`);
}

export async function uploadFile(file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'File upload failed');
  }
  return res.json();
}

export async function fetchSettings(): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
  return res.json();
}

export async function updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Failed to update settings: ${res.statusText}`);
  return res.json();
}

export async function clearAllConversations(): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/clear-conversations`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to clear conversations: ${res.statusText}`);
}

const ASPECT_MAP: Record<string, [number, number]> = {
  '1:1': [1024, 1024],
  '16:9': [1280, 720],
  '9:16': [720, 1280],
  '4:3': [1024, 768],
  '3:4': [768, 1024],
  '21:9': [1344, 576],
};

const STYLE_PROMPTS: Record<string, string> = {
  photorealistic: '8k uhd, photorealistic, cinematic 35mm photography, high detail, studio lighting, hyperrealistic',
  cinematic: 'cinematic shot, epic lighting, film grain, dramatic atmosphere, anamorphic lens, 8k resolution',
  cyberpunk: 'cyberpunk style, glowing neon lights, futuristic cityscape, volumetric lighting, vibrant purple and cyan accents',
  anime: 'masterpiece anime artwork, Makoto Shinkai aesthetic, vibrant colors, expressive lighting, clean line art',
  '3d': '3D octane render, Unreal Engine 5, ray tracing, volumetric lighting, Pixar quality, smooth textures',
  fantasy: 'high fantasy illustration, magical ethereal atmosphere, glowing particles, detailed digital painting',
  minimalist: 'minimalist art, clean lines, elegant composition, subtle color palette, modern design',
  'digital-art': 'digital concept art, intricate details, dynamic composition, trending on ArtStation',
};

const MODEL_ENGINE_MAP: Record<string, string> = {
  'cretivra-flux': 'flux',
  'flux': 'flux',
  'cretivra-diffusion': 'flux-realism',
  'flux-realism': 'flux-realism',
  'cretivra-turbo': 'turbo',
  'turbo': 'turbo',
  'cretivra-anime': 'flux-anime',
  'flux-anime': 'flux-anime',
  'cretivra-3d': 'flux-3d',
  'flux-3d': 'flux-3d',
};

export async function generateImageApi(payload: {
  prompt: string;
  aspect_ratio?: string;
  model?: string;
  style?: string;
  enhance?: boolean;
  seed?: number;
  negative_prompt?: string;
}): Promise<{
  success: boolean;
  prompt: string;
  enhanced_prompt: string;
  image_url: string;
  model: string;
  model_id: string;
  aspect_ratio: string;
  width: number;
  height: number;
  seed: number;
  style?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/images/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Backend image API unreachable, generating direct visual client-side...', e);
  }

  // Graceful direct client-side fallback
  const cleanPrompt = payload.prompt.trim();
  const ratio = payload.aspect_ratio || '1:1';
  const [w, h] = ASPECT_MAP[ratio] || [1024, 1024];
  const engine = MODEL_ENGINE_MAP[payload.model || 'flux'] || 'flux';
  const seed = payload.seed || Math.floor(100000 + Math.random() * 9000000);

  let enhancedPrompt = cleanPrompt;
  if (payload.style && STYLE_PROMPTS[payload.style.toLowerCase()]) {
    enhancedPrompt = `${cleanPrompt}, ${STYLE_PROMPTS[payload.style.toLowerCase()]}`;
  }

  let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${w}&height=${h}&model=${engine}&nologo=true&seed=${seed}`;
  if (payload.enhance !== false) {
    imageUrl += '&enhance=true';
  }
  if (payload.negative_prompt?.trim()) {
    imageUrl += `&negative=${encodeURIComponent(payload.negative_prompt.trim())}`;
  }

  return {
    success: true,
    prompt: cleanPrompt,
    enhanced_prompt: enhancedPrompt,
    image_url: imageUrl,
    model: engine,
    model_id: payload.model || 'cretivra-flux',
    aspect_ratio: ratio,
    width: w,
    height: h,
    seed,
    style: payload.style,
  };
}

export async function fetchImageCatalogApi(): Promise<{
  models: Array<{ id: string; engine: string; name: string; description: string; badge: string; is_default: boolean }>;
  aspect_ratios: string[];
  styles: string[];
}> {
  try {
    const res = await fetch(`${API_BASE}/images/models`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Backend image catalog unavailable, using default catalog...', e);
  }

  return {
    models: [
      { id: 'cretivra-flux', engine: 'flux', name: 'Cretivra FLUX.1 Art', description: 'Next-gen photorealism and fine digital art', badge: 'FLUX.1 Pro', is_default: true },
      { id: 'cretivra-diffusion', engine: 'flux-realism', name: 'Cretivra SDXL Studio', description: 'Cinematic lighting and realistic portraits', badge: 'SDXL Realism', is_default: false },
      { id: 'cretivra-turbo', engine: 'turbo', name: 'Cretivra Turbo Visuals', description: 'Ultra-fast instant image synthesis', badge: 'Turbo Speed', is_default: false },
      { id: 'cretivra-anime', engine: 'flux-anime', name: 'Cretivra Anime Studio', description: 'Anime, manga, and stylized Japanese art', badge: 'Anime Studio', is_default: false },
      { id: 'cretivra-3d', engine: 'flux-3d', name: 'Cretivra 3D & CGI', description: 'Octane render, 3D CGI, and Unreal Engine visual aesthetics', badge: '3D Octane', is_default: false },
    ],
    aspect_ratios: Object.keys(ASPECT_MAP),
    styles: Object.keys(STYLE_PROMPTS),
  };
}

export async function enhancePromptApi(prompt: string, style?: string, model?: string): Promise<{
  original_prompt: string;
  enhanced_prompt: string;
  style?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/images/enhance-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style, model }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Backend prompt enhance unavailable, applying local enhancements...', e);
  }

  const clean = prompt.trim();
  const additions: string[] = [];
  if (style && STYLE_PROMPTS[style.toLowerCase()]) {
    additions.push(STYLE_PROMPTS[style.toLowerCase()]);
  } else {
    additions.push('hyperdetailed, 8k resolution, cinematic lighting, masterpiece');
  }

  return {
    original_prompt: clean,
    enhanced_prompt: `${clean}, ${additions.join(', ')}`,
    style,
  };
}


