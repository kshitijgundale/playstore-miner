import { readFileSync, writeFileSync, renameSync, mkdirSync, chmodSync, unlinkSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export function createKeySettings(filename) {
  let key = '';
  try { key = JSON.parse(readFileSync(filename, 'utf8')).serpApiKey || ''; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return {
    getKey: () => key,
    status: () => ({ configured: Boolean(key) }),
    save(value) {
      if (typeof value !== 'string' || !value.trim() || value.length > 4096) throw new Error('Enter a valid SerpApi key');
      const next = value.trim();
      mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
      const temporary = `${filename}.${randomUUID()}.tmp`;
      try {
        writeFileSync(temporary, JSON.stringify({ serpApiKey: next }), { mode: 0o600, flag: 'wx' });
        chmodSync(temporary, 0o600);
        renameSync(temporary, filename);
      } finally { if (existsSync(temporary)) unlinkSync(temporary); }
      key = next;
      return this.status();
    },
    clear() {
      if (existsSync(filename)) unlinkSync(filename);
      key = '';
      return this.status();
    }
  };
}
