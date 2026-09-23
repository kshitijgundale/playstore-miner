import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../src/db/index.js';

test('migration adds product fields to an existing database without losing detail rows', () => {
  const dir=mkdtempSync(path.join(tmpdir(),'miner-migration-'));
  const file=path.join(dir,'miner.sqlite');
  try {
    const old=new DatabaseSync(file);
    old.exec('CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
    for (const name of ['001_initial.sql','002_research_activity.sql']) {
      old.exec(readFileSync(new URL(`../src/db/migrations/${name}`,import.meta.url),'utf8'));
      old.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(name,'2026-09-01T00:00:00.000Z');
    }
    old.prepare('INSERT INTO apps(package_id,first_seen_at,last_seen_at) VALUES (?,?,?)').run('com.example.alpha','2026-09-01','2026-09-01');
    old.prepare('INSERT INTO app_details(package_id,country,language,fetched_at,source_observed_at,source_request_id,title) VALUES (?,?,?,?,?,?,?)').run('com.example.alpha','US','en','2026-09-01','2026-09-01','old-1','Alpha');
    old.close();
    const db=openDatabase(file);
    const row=db.prepare('SELECT title,released_on_text,product_metadata_json FROM app_details WHERE package_id=?').get('com.example.alpha');
    assert.equal(row.title,'Alpha');assert.equal(row.released_on_text,null);assert.equal(row.product_metadata_json,null);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM schema_migrations').get().n,4);
    const reviewColumns=db.prepare('PRAGMA table_info(reviews)').all().map(x=>x.name);
    assert.ok(reviewColumns.includes('marked_at'));
    assert.ok(reviewColumns.includes('review_note'));
    db.close();
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
