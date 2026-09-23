import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import supertest from 'supertest';
import { openDatabase } from '../src/db/index.js';
import { createApi } from '../src/routes/api.js';

function parseCsv(source) {
  const rows=[]; let row=[], cell='', quoted=false;
  for (let i=0;i<source.length;i++) {
    const char=source[i];
    if (quoted) {
      if (char==='"' && source[i+1]==='"') { cell+='"'; i++; }
      else if (char==='"') quoted=false;
      else cell+=char;
    } else if (char==='"') quoted=true;
    else if (char===',') { row.push(cell); cell=''; }
    else if (char==='\r' && source[i+1]==='\n') { row.push(cell); rows.push(row); row=[]; cell=''; i++; }
    else cell+=char;
  }
  assert.equal(quoted,false);
  assert.equal(cell,'');
  assert.deepEqual(row,[]);
  return rows;
}

test('review CSV exports all or the current saved filter from one app and locale', async () => {
  const db=openDatabase(':memory:');
  let providerCalls=0;
  const provider=new Proxy({}, {get(){providerCalls++;throw new Error('Unexpected provider call');}});
  try {
    const stamp='2026-09-23';
    db.prepare('INSERT INTO apps(package_id,first_seen_at,last_seen_at) VALUES (?,?,?)').run('com.example.alpha',stamp,stamp);
    const insert=db.prepare('INSERT INTO reviews(package_id,review_id,country,language,stars,body,likes,review_date,first_fetched_at,last_seen_at,marked_at,review_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    for (let i=0;i<1001;i++) insert.run('com.example.alpha',String(i),'US','en',1,`Review ${i}`,i,String(i).padStart(4,'0'),stamp,stamp,i===0?stamp:null,i===0?'Important':null);
    insert.run('com.example.alpha','special','US','en',5,'=SUM(1,2), "great"\n雪',null,'9999',stamp,stamp,stamp,'+run()');
    insert.run('com.example.alpha','french','US','fr',1,'French',0,'9999',stamp,stamp,null,null);
    const app=express();app.use('/api',createApi({db,provider}));
    const agent=supertest(app), base='/api/apps/com.example.alpha/reviews/export';

    const all=await agent.get(base+'?country=US&language=en&scope=all&stars=5&sort=oldest');
    assert.equal(all.status,200);
    assert.match(all.headers['content-type'],/^text\/csv; charset=utf-8/);
    assert.match(all.headers['content-disposition'],/attachment; filename="reviews-com\.example\.alpha-US-en-all\.csv"/);
    const rows=parseCsv(all.text);
    assert.equal(rows.length,1003);
    assert.deepEqual(rows[0],['package_id','country','language','review_id','stars','body','likes','review_date','first_fetched_at','last_seen_at','marked_at','review_note']);
    assert.equal(rows[1][3],'special'); // All ignores the current star filter and sort.
    assert.equal(rows[1][5],'\'=SUM(1,2), "great"\n雪');
    assert.equal(rows[1][6],'');
    assert.equal(rows[1][11],"'+run()");
    assert.equal(rows.at(-1)[3],'0'); // Outside the ordinary newest-first browse limit.
    assert.equal(rows.at(-1)[10],stamp);
    assert.equal(rows.at(-1)[11],'Important');
    assert.ok(rows.slice(1).every(row=>row[0]==='com.example.alpha' && row[1]==='US' && row[2]==='en'));

    const current=await agent.get(base+'?country=US&language=en&scope=current&stars=1&sort=helpful');
    assert.equal(current.status,200);
    const filtered=parseCsv(current.text);
    assert.equal(filtered.length,1002);
    assert.equal(filtered[1][3],'1000');
    assert.equal(filtered.at(-1)[3],'0');
    assert.ok(filtered.slice(1).every(row=>row[4]==='1'));

    const oldest=await agent.get(base+'?country=US&language=en&scope=current&stars=1&sort=oldest');
    assert.equal(parseCsv(oldest.text)[1][3],'0');
    const french=await agent.get(base+'?country=US&language=fr&scope=all');
    assert.deepEqual(parseCsv(french.text).slice(1).map(row=>row[3]),['french']);
    const empty=await agent.get(base+'?country=GB&language=en&scope=all');
    assert.equal(parseCsv(empty.text).length,1);
    assert.equal(providerCalls,0);
  } finally {db.close();}
});

test('invalid review export options are rejected without a CSV', async () => {
  const db=openDatabase(':memory:');
  try {
    const app=express();app.use('/api',createApi({db,provider:{}}));
    const agent=supertest(app);
    const base='/api/apps/com.example.alpha/reviews/export?country=US&language=en';
    for (const suffix of ['&scope=wrong','&stars=0','&stars=1.0','&sort=rating','&country=USA','&language=english']) {
      const result=await agent.get(base+suffix);
      assert.equal(result.status,400,suffix);
      assert.match(result.headers['content-type'],/json/);
    }
    const badId=await agent.get('/api/apps/invalid/reviews/export?scope=all');
    assert.equal(badId.status,400);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM reviews').get().count,0);
  } finally {db.close();}
});
