const API_BASE = import.meta.env.VITE_NEXUS_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error?.message || 'Nexus request failed');
  return payload;
}

export const nexusApi = {
  getStatus: () => request('/status'),
  breakBackend: () => request('/break/backend', { method: 'POST' }),
  breakDatabase: () => request('/break/database', { method: 'POST' }),
  enableLatency: (delayMs = 3000) => request('/break/latency', { method: 'POST', body: JSON.stringify({ delayMs }) }),
  rebuild: () => request('/rebuild', { method: 'POST' }),
  getTimeline: () => request('/timeline'),
  analyze: () => request('/ai/analyze', { method: 'POST' }),
  toggleForceFail: (forceFail) => request('/sandbox/force-fail', { method: 'POST', body: JSON.stringify({ forceFail }) }),
};
