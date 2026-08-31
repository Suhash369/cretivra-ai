import { getAuthHeaders } from './api';

export interface StreamChunkData {
  conversation_id: string;
  model_id: string;
  content: string;
  full_content: string;
  done: boolean;
  reasoning_status?: string | null;
  cancelled?: boolean;
}

export async function readSSEStream(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
    onChunk: (data: StreamChunkData) => void;
    onError?: (err: Error) => void;
    onComplete?: () => void;
  }
) {
  try {
    const res = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP status ${res.status}`);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported by browser environment.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.substring(6);
          try {
            const parsed: StreamChunkData = JSON.parse(jsonStr);
            options.onChunk(parsed);
          } catch (e) {
            console.error('Error parsing SSE line:', e);
          }
        }
      }
    }

    if (options.onComplete) {
      options.onComplete();
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Stream generation aborted by user.');
    } else {
      if (options.onError) {
        options.onError(err);
      }
    }
  }
}
