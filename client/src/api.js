export async function api(path, options = {}) {
  if (window.desktop) {
    const response = await window.desktop.request('/api' + path, options.method || 'GET', options.body);
    if (!response.ok) throw new Error(response.json?.error || `HTTP ${response.status}`);
    return response.json;
  }
  const response = await fetch('/api' + path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}
export const post = (path, body) => api(path, { method:'POST', body:JSON.stringify(body) });
export const patch = (path, body) => api(path, { method:'PATCH', body:JSON.stringify(body) });
export const qs = fields => '?' + new URLSearchParams(fields).toString();
export async function download(path, filename) {
  if (window.desktop) {
    const response = await window.desktop.request('/api' + path);
    if (!response.ok) throw new Error(response.json?.error || `HTTP ${response.status}`);
    const bytes = Uint8Array.from(atob(response.csv), char => char.charCodeAt(0));
    saveBlob(new Blob([bytes], { type: 'text/csv;charset=utf-8' }), response.filename || filename);
    return;
  }
  const response = await fetch('/api' + path);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `HTTP ${response.status}`);
  }
  saveBlob(await response.blob(), filename);
}
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
export const show = value => value === null || value === undefined || value === '' ? 'Unknown' : String(value);
export const date = value => value ? new Date(value).toLocaleString() : 'Unknown';
