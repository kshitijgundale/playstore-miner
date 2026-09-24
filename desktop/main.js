import { app, BrowserWindow, dialog, ipcMain, session } from 'electron';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server/src/server.js';
import { SerpApiProvider } from '../server/src/providers/serpapi.js';
import { desktopPaths } from './data.js';
import { createKeySettings } from './settings.js';

const root = path.dirname(fileURLToPath(import.meta.url));
if (process.env.PLAY_STORE_MINER_SMOKE_DATA_DIR) {
  mkdirSync(process.env.PLAY_STORE_MINER_SMOKE_DATA_DIR, { recursive: true, mode: 0o700 });
  app.setPath('userData', process.env.PLAY_STORE_MINER_SMOKE_DATA_DIR);
}
const preload = path.join(root, 'preload.cjs');
const gotLock = app.requestSingleInstanceLock();
let window, server, token, paths, keySettings, closing = false;

if (!gotLock) app.quit();
else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.show(); window?.focus();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', event => {
    if (server && !closing) {
      event.preventDefault(); closing = true;
      server.close().finally(() => { server = null; app.quit(); });
    }
  });
  app.whenReady().then(launch).catch(error => { dialog.showErrorBox('Play Store Miner could not start', error.message); app.quit(); });
}

function makeWindow() {
  const next = new BrowserWindow({
    width: 1280, height: 860, minWidth: 900, minHeight: 650,
    webPreferences: { preload, sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true }
  });
  next.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  next.webContents.on('will-navigate', (event, url) => {
    if (url !== `${server.url}/`) event.preventDefault();
  });
  next.on('closed', () => { if (window === next) window = null; });
  window = next;
  return next;
}

function senderIs(event) {
  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) return false;
  return Boolean(server && event.senderFrame.url === `${server.url}/`);
}

function guard(event) { if (!senderIs(event)) throw new Error('Invalid desktop request'); }

const routes = [
  ['GET', /^\/api\/(config|usage|dashboard|discoveries|shortlist)$/],
  ['GET', /^\/api\/discoveries\/\d+\/items$/],
  ['GET', /^\/api\/apps\/[^/]+$/],
  ['GET', /^\/api\/apps\/[^/]+\/reviews(?:\/export|\/marked)?$/],
  ['POST', /^\/api\/(fetch\/preview|discoveries)$/],
  ['POST', /^\/api\/apps\/[^/]+\/(detail|reviews)$/],
  ['PATCH', /^\/api\/apps\/[^/]+\/shortlist$/],
  ['PATCH', /^\/api\/apps\/[^/]+\/reviews\/[^/]+\/mark$/]
];

function allowedRequest(method, requestPath, body) {
  if (!['GET', 'POST', 'PATCH'].includes(method) || typeof requestPath !== 'string' || requestPath.length > 2048 || !requestPath.startsWith('/api/')) return false;
  const url = new URL(requestPath, 'http://desktop.invalid');
  if (url.origin !== 'http://desktop.invalid' || url.pathname.includes('%2f') || url.pathname.includes('%2F') || !routes.some(([verb, pattern]) => verb === method && pattern.test(url.pathname))) return false;
  return method === 'GET' ? body === undefined : body === undefined || typeof body === 'string' && body.length <= 100_000;
}

async function launch() {
  paths = desktopPaths(app.getPath('userData'));
  keySettings = createKeySettings(paths.settings);
  // The renderer uses IPC. Direct renderer network access is blocked by CSP.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'"] } });
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  ipcMain.handle('desktop:request', async (event, input) => {
    guard(event);
    const method = input?.method || 'GET', requestPath = input?.path, body = input?.body;
    if (!allowedRequest(method, requestPath, body)) throw new Error('Unsupported API request');
    const response = await fetch(server.url + requestPath, { method, headers: { 'X-Desktop-Token': token, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) return { ok: response.ok, status: response.status, csv: Buffer.from(await response.arrayBuffer()).toString('base64'), filename: response.headers.get('content-disposition')?.match(/filename="?([^";]+)/)?.[1] };
    return { ok: response.ok, status: response.status, json: await response.json() };
  });
  ipcMain.handle('desktop:settings', event => { guard(event); return { ...keySettings.status(), directory: paths.directory }; });
  ipcMain.handle('desktop:save-key', (event, value) => { guard(event); return keySettings.save(value); });
  ipcMain.handle('desktop:clear-key', event => { guard(event); return keySettings.clear(); });
  await openWorkspace();
}

async function openWorkspace() {
  if (server) return;
  token = randomBytes(32).toString('hex');
  server = await startServer({ filename: paths.database, token, provider: new SerpApiProvider({ getApiKey: keySettings.getKey }), clientDir: path.join(root, '..', 'client', 'dist') });
  const current = window || makeWindow();
  await current.loadURL(`${server.url}/`);
}
