import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { API_BASE, getAuthHeaders } from './api';

// Retrieve Supabase credentials from Next.js or Vite environment
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key] as string;
  }
  return '';
};

export const SUPABASE_URL =
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('VITE_SUPABASE_URL') ||
  'https://srlsfrylhqspwiudrpdo.supabase.co';

export const SUPABASE_ANON_KEY =
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  '';

// Initialize direct Supabase client if anon key is available
export const supabase: SupabaseClient | null = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export type SuggestionCategory = 'suggestion' | 'feature' | 'bug' | 'comment';

export interface SuggestionPayload {
  category: SuggestionCategory;
  comment: string;
  rating?: number; // 1 to 5
  user_email?: string;
  user_name?: string;
  page_url?: string;
  device_info?: string;
}

export interface SuggestionResult {
  success: boolean;
  id?: string;
  message: string;
  source: 'supabase_direct' | 'supabase_backend';
}

/**
 * Submits a user suggestion/comment to Supabase.
 * First tries direct Supabase PostgREST insertion if configured;
 * otherwise automatically uses the Cretivra API backend connected to Supabase PostgreSQL.
 */
export async function submitSuggestion(payload: SuggestionPayload): Promise<SuggestionResult> {
  const cleanedComment = payload.comment?.trim();
  if (!cleanedComment) {
    throw new Error('Please enter a comment or suggestion before submitting.');
  }

  const enrichedPayload: SuggestionPayload = {
    ...payload,
    comment: cleanedComment,
    page_url: payload.page_url || (typeof window !== 'undefined' ? window.location.pathname : ''),
    device_info:
      payload.device_info ||
      (typeof navigator !== 'undefined'
        ? `${navigator.userAgent?.slice(0, 100)} [${window.innerWidth}x${window.innerHeight}]`
        : ''),
  };

  // 1. If direct Supabase client is configured, attempt direct insert
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert([
          {
            category: enrichedPayload.category,
            comment: enrichedPayload.comment,
            rating: enrichedPayload.rating || null,
            user_email: enrichedPayload.user_email || null,
            user_name: enrichedPayload.user_name || null,
            page_url: enrichedPayload.page_url || null,
            device_info: enrichedPayload.device_info || null,
            status: 'pending',
          },
        ])
        .select();

      if (!error && data && data.length > 0) {
        return {
          success: true,
          id: data[0].id,
          message: 'Suggestion submitted successfully!',
          source: 'supabase_direct',
        };
      } else if (error) {
        console.warn('Direct insert failed, falling back to backend bridge:', error.message);
      }
    } catch (err: any) {
      console.warn('Direct insert error, falling back to backend bridge:', err);
    }
  }

  // 2. Fallback to Cretivra API backend
  try {
    const res = await fetch(`${API_BASE}/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(enrichedPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorData.detail || 'Failed to submit suggestion');
    }

    const data = await res.json();
    return {
      success: true,
      id: data.id,
      message: data.message || 'Suggestion saved successfully!',
      source: 'supabase_backend',
    };
  } catch (err: any) {
    console.error('Failed to submit suggestion via backend:', err);
    throw new Error(err.message || 'Unable to submit suggestion. Please try again.');
  }
}
