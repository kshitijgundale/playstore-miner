export async function api(path, options = {}) {
  const response = await fetch('/api' + path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}
export const post = (path, body) => api(path, { method:'POST', body:JSON.stringify(body) });
export const patch = (path, body) => api(path, { method:'PATCH', body:JSON.stringify(body) });
export const qs = fields => '?' + new URLSearchParams(fields).toString();
export const show = value => value === null || value === undefined || value === '' ? 'Unknown' : String(value);
export const date = value => value ? new Date(value).toLocaleString() : 'Unknown';
