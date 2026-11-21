import { supabase } from './supabase.js';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function authHeaders(body) {
  const headers = body ? { 'Content-Type': 'application/json' } : {};
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  }
  return headers;
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: await authHeaders(body),
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;

    throw new Error(
      'Cannot reach the MeetPilot API. Make sure the backend is running on http://localhost:5000.',
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // The API always returns JSON, but keep this defensive for proxy errors.
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || `The request failed with status ${response.status}.`;
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.details = payload?.error?.details || null;
    throw requestError;
  }

  return payload?.data ?? payload;
}

export const api = {
  getHealth: (signal) => request('/health', { signal }),

  getMeetings: (signal) => request('/meetings', { signal }),
  getMeeting: (id, signal) => request(`/meetings/${encodeURIComponent(id)}`, { signal }),
  createMeeting: (payload) => request('/meetings', { method: 'POST', body: payload }),
  analyzeMeeting: (payload) => request('/meetings/analyze', { method: 'POST', body: payload }),
  transcribeAudio: async (file) => {
    const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    const form = new FormData();
    form.append('audio', file);
    const headers = {};
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    }

    let response;
    try {
      response = await fetch(`${API_BASE}/meetings/transcribe`, {
        method: 'POST',
        body: form,
        headers,
      });
    } catch {
      throw new Error(
        'Cannot reach the MeetPilot API. Make sure the backend is running on http://localhost:5000.',
      );
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error?.message || `The request failed with status ${response.status}.`);
    }
    return payload?.data ?? payload;
  },

  getTasks: (signal) => request('/tasks', { signal }),
  updateTask: (id, payload) =>
    request(`/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),

  getDecisions: (signal) => request('/decisions', { signal }),
  compareDecisions: (payload) =>
    request('/decisions/compare', { method: 'POST', body: payload }),
  updateConflict: (id, reviewStatus) =>
    request(`/decisions/conflicts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { reviewStatus },
    }),

  chat: (payload) => request('/assistant/chat', { method: 'POST', body: payload }),
};
