import { backup, DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, linkSync, unlinkSync, chmodSync } from 'node:fs';
import path from 'node:path';

export function desktopPaths(userData) {
  const directory = path.join(userData, 'miner');
  return { directory, database: path.join(directory, 'miner.sqlite'), settings: path.join(directory, 'settings.json') };
}

function recordCounts(db) {
  return Object.fromEntries([
    ['apps', 'SELECT COUNT(*) AS count FROM apps'],
    ['discoveryRuns', 'SELECT COUNT(*) AS count FROM discovery_runs'],
    ['reviews', 'SELECT COUNT(*) AS count FROM reviews'],
    ['shortlisted', 'SELECT COUNT(*) AS count FROM apps WHERE shortlisted_at IS NOT NULL']
  ].map(([name, sql]) => [name, db.prepare(sql).get().count]));
}

export async function importDatabase(sourcePath, destination) {
  if (existsSync(destination)) throw new Error('Desktop database already exists');
  mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const temporary = path.join(path.dirname(destination), `.import-${randomUUID()}.sqlite`);
  let source;
  try {
    source = new DatabaseSync(sourcePath, { readOnly: true });
    await backup(source, temporary);
    const imported = new DatabaseSync(temporary, { readOnly: true });
    let counts;
    try {
      const integrity = imported.prepare('PRAGMA integrity_check').get();
      if (Object.values(integrity)[0] !== 'ok') throw new Error('Database integrity check failed');
      const required = ['schema_migrations', 'apps', 'discovery_runs', 'reviews', 'app_details', 'review_fetches'];
      const tables = new Set(imported.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name));
      if (required.some(table => !tables.has(table))) throw new Error('Selected database is not a Play Store Miner database');
      counts = recordCounts(source);
      if (JSON.stringify(counts) !== JSON.stringify(recordCounts(imported))) throw new Error('Database backup record counts do not match');
    } finally { imported.close(); }
    source.close(); source = null;
    chmodSync(temporary, 0o600);
    // Hard-link creation fails if another database appeared while importing.
    linkSync(temporary, destination);
    return counts;
  } finally {
    source?.close();
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export async function moveDatabase(sourcePath, destination) {
  const counts = await importDatabase(sourcePath, destination);
  for (const sidecar of [`${sourcePath}-wal`, `${sourcePath}-shm`]) {
    if (existsSync(sidecar)) unlinkSync(sidecar);
  }
  unlinkSync(sourcePath);
  return counts;
}
