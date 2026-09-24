import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { createApi } from './routes/api.js';
import { openDatabase } from './db/index.js';

function authorized(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createServerApp({ db, provider, token, clientDir }) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    if (token && !authorized(req.get('X-Desktop-Token'), token)) return res.status(403).json({ error: 'Forbidden' });
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createApi({ db, provider }));
  if (clientDir) {
    const index = path.join(clientDir, 'index.html');
    if (!existsSync(index)) throw new Error(`Built client missing: ${index}`);
    app.use(express.static(clientDir, { index: false }));
    app.use((req, res, next) => req.method === 'GET' && !req.path.startsWith('/api/') && req.path !== '/api'
      ? res.sendFile(index) : next());
  }
  return app;
}

export async function startServer({ filename, host = '127.0.0.1', port = 0, provider, token, clientDir } = {}) {
  const db = openDatabase(filename);
  let listener;
  try {
    const app = createServerApp({ db, provider, token, clientDir });
    listener = await new Promise((resolve, reject) => {
      const server = app.listen(port, host);
      server.once('error', reject);
      server.once('listening', () => resolve(server));
    });
    return {
      app, db, listener, url: `http://${host}:${listener.address().port}`,
      close: async () => {
        await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
        db.close();
      }
    };
  } catch (error) {
    if (listener) listener.close();
    db.close();
    throw error;
  }
}
