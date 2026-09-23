import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import supertest from 'supertest';
import { openDatabase } from '../src/db/index.js';
import { createApi } from '../src/routes/api.js';

test('saved and marked review pagination uses local filtered counts and stable order', async () => {
  const db=openDatabase(':memory:');
  let providerCalls=0;
  try {
    db.prepare('INSERT INTO apps(package_id,first_seen_at,last_seen_at) VALUES (?,?,?)').run('com.example.alpha','2026-09-01','2026-09-01');
    const insert=db.prepare('INSERT INTO reviews(package_id,review_id,country,language,stars,body,likes,first_fetched_at,last_seen_at,review_date,marked_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for(let i=0;i<205;i++) insert.run('com.example.alpha',String(i).padStart(3,'0'),'US','en',i%2?1:5,`Review ${i}`,i%3,'2026-09-01','2026-09-01','2026-09-01',i<101?'2026-09-23':null);
    insert.run('com.example.alpha','other','US','fr',1,'Other locale',0,'2026-09-01','2026-09-01','2026-09-01',null);
    const app=express();app.use(express.json());app.use('/api',createApi({db,provider:{getReviews(){providerCalls++;throw new Error('Unexpected provider request');}}}));
    const agent=supertest(app), base='/api/apps/com.example.alpha/reviews?country=US&language=en';
    const first=await agent.get(base);
    assert.equal(first.status,200);assert.equal(first.body.page,1);assert.equal(first.body.pageSize,100);assert.equal(first.body.total,205);assert.equal(first.body.storedCount,205);assert.equal(first.body.reviews.length,100);
    assert.deepEqual(first.body.reviews.slice(0,2).map(x=>x.review_id),['000','001']);
    const last=await agent.get(base+'&page=3');
    assert.equal(last.body.reviews.length,5);assert.equal(last.body.reviews[0].review_id,'200');
    const filtered=await agent.get(base+'&stars=1&sort=helpful&pageSize=25&page=2');
    assert.equal(filtered.status,200);assert.equal(filtered.body.total,102);assert.equal(filtered.body.storedCount,205);assert.equal(filtered.body.page,2);assert.equal(filtered.body.pageSize,25);assert.equal(filtered.body.reviews.length,25);
    assert.ok(filtered.body.reviews.every(x=>x.stars===1));
    const allHelpful=await agent.get(base+'&stars=1&sort=helpful&pageSize=200');
    assert.deepEqual(filtered.body.reviews.map(x=>x.review_id),allHelpful.body.reviews.slice(25,50).map(x=>x.review_id));
    const marked=await agent.get('/api/apps/com.example.alpha/reviews/marked?country=US&language=en&page=2');
    assert.equal(marked.status,200);assert.equal(marked.body.total,101);assert.equal(marked.body.reviews.length,1);assert.equal(marked.body.reviews[0].review_id,'100');
    for(const query of ['page=0','page=-1','page=abc','pageSize=0','pageSize=50.5','pageSize=1000']) {
      assert.equal((await agent.get(base+'&'+query)).status,400,query);
      assert.equal((await agent.get('/api/apps/com.example.alpha/reviews/marked?country=US&language=en&'+query)).status,400,query);
    }
    assert.equal(providerCalls,0);
  } finally { db.close(); }
});
