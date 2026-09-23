import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
export function openDatabase(filename = path.resolve(process.env.DATA_DIR || './data', 'miner.sqlite')) {
  mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const files = readdirSync(migrationDir).filter(x => /^\d+_.*\.sql$/.test(x)).sort();
  try {
    for (const file of files) {
      if (db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(file)) continue;
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec(readFileSync(path.join(migrationDir, file), 'utf8'));
        db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(file, new Date().toISOString());
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw new Error(`Migration ${file} failed`, { cause: error }); }
    }
  } catch (error) { db.close(); throw error; }
  return db;
}
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
