import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { mkdtempSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createServerApp } from '../src/server.js';
import { openDatabase } from '../src/db/index.js';
import { importDatabase, moveDatabase } from '../../desktop/data.js';
import { createKeySettings } from '../../desktop/settings.js';
import { SerpApiProvider } from '../src/providers/serpapi.js';

test('desktop API authenticates reads, writes, and CSV before provider access while browser access remains available', async () => {
  const db = openDatabase(':memory:');
  const calls = { account: 0 };
  const provider = { async getAccount() { calls.account++; return { plan_searches_left: 100 }; } };
  try {
    const desktop = supertest(createServerApp({ db, provider, token: 'secret' }));
    for (const [method, url] of [['get', '/api/dashboard'], ['get', '/api/apps/example/reviews/export'], ['post', '/api/discoveries']]) {
      const response = await desktop[method](url);
      assert.equal(response.status, 403);
    }
    assert.equal(calls.account, 0);
    assert.equal((await desktop.get('/api/config').set('X-Desktop-Token', 'secret')).status, 200);
    assert.equal((await supertest(createServerApp({ db, provider })).get('/api/config')).status, 200);
  } finally { db.close(); }
});

test('database backup includes committed WAL rows and never replaces existing data', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'miner-import-'));
  const source = path.join(dir, 'source.sqlite'), destination = path.join(dir, 'desktop', 'miner.sqlite');
  const db = openDatabase(source);
  db.prepare("INSERT INTO apps(package_id,first_seen_at,last_seen_at,shortlisted_at,wedge_note) VALUES ('wal.app','today','today','today','keep')").run();
  db.prepare("INSERT INTO reviews(package_id,review_id,country,language,stars,body,first_fetched_at,last_seen_at,marked_at,review_note) VALUES ('wal.app','one','US','en',1,'saved','today','today','today','marked')").run();
  db.prepare("INSERT INTO discovery_runs(kind,country,language,provider,fetched_at,source_observed_at,source_request_id) VALUES ('search','US','en','mock','today','today','run-one')").run();
  assert.ok(existsSync(`${source}-wal`));
  await importDatabase(source, destination);
  const imported = new DatabaseSync(destination, { readOnly: true });
  assert.equal(imported.prepare("SELECT wedge_note FROM apps WHERE package_id='wal.app'").get().wedge_note, 'keep');
  assert.equal(imported.prepare("SELECT shortlisted_at FROM apps WHERE package_id='wal.app'").get().shortlisted_at, 'today');
  assert.equal(imported.prepare("SELECT review_note FROM reviews WHERE review_id='one'").get().review_note, 'marked');
  assert.equal(imported.prepare('SELECT COUNT(*) AS count FROM discovery_runs').get().count, 1);
  imported.close();
  await assert.rejects(importDatabase(source, destination), /already exists/);
  const reopened = new DatabaseSync(destination, { readOnly: true });
  assert.equal(reopened.prepare('SELECT COUNT(*) AS count FROM apps').get().count, 1);
  reopened.close();
  db.close();
});

test('failed database backup leaves no activated or temporary database', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'miner-import-fail-'));
  const source = path.join(dir, 'invalid.sqlite'), destination = path.join(dir, 'desktop', 'miner.sqlite');
  writeFileSync(source, 'invalid SQLite');
  await assert.rejects(importDatabase(source, destination));
  assert.equal(readFileSync(source, 'utf8'), 'invalid SQLite');
  assert.equal(existsSync(destination), false);
  assert.deepEqual(readdirSync(path.dirname(destination)), []);
});

test('one-time move removes the old database only after a validated copy', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'miner-move-'));
  const source = path.join(dir, 'source.sqlite'), destination = path.join(dir, 'desktop', 'miner.sqlite');
  const db = openDatabase(source);
  db.prepare("INSERT INTO apps(package_id,first_seen_at,last_seen_at) VALUES ('moved.app','today','today')").run();
  db.close();
  const counts = await moveDatabase(source, destination);
  assert.equal(counts.apps, 1);
  assert.equal(existsSync(source), false);
  const moved = new DatabaseSync(destination, { readOnly: true });
  assert.equal(moved.prepare("SELECT COUNT(*) AS count FROM apps WHERE package_id='moved.app'").get().count, 1);
  moved.close();
});

test('key settings replace and clear without exposing key through status; provider uses current key', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'miner-settings-'));
  const file = path.join(dir, 'settings.json');
  const settings = createKeySettings(file);
  const sent = [];
  const provider = new SerpApiProvider({ getApiKey: settings.getKey, fetchImpl: async url => { sent.push(url.searchParams.get('api_key')); return { ok: true, json: async () => ({}) }; } });
  await assert.rejects(provider.getAccount(), /not configured/);
  assert.deepEqual(settings.save('first'), { configured: true });
  await provider.getAccount();
  assert.deepEqual(settings.save('second'), { configured: true });
  await provider.getAccount();
  assert.deepEqual(sent, ['first', 'second']);
  assert.equal(statSync(file).mode & 0o777, 0o600);
  assert.deepEqual(settings.clear(), { configured: false });
  await assert.rejects(provider.getAccount(), /not configured/);
  assert.equal(existsSync(file), false);
});
