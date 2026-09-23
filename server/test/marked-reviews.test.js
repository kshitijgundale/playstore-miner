import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import supertest from 'supertest';
import { openDatabase } from '../src/db/index.js';
import { createApi } from '../src/routes/api.js';
import { saveReviews } from '../src/services/store.js';

test('marks and notes stay local, locale scoped, and survive provider upserts', async () => {
  const db=openDatabase(':memory:');
  const provider={getReviews(){throw new Error('Unexpected provider request');}};
  const app=express();app.use(express.json());app.use('/api',createApi({db,provider}));
  const agent=supertest(app), base='/api/apps/com.example.alpha/reviews';
  const params={packageId:'com.example.alpha',country:'US',language:'en',rating:1,sort:1};
  const page=(sourceRequestId,body)=>({sourceRequestId,observedAt:'2026-09-01',nextPageToken:null,reviews:[{review_id:'a',stars:1,body,likes:0,review_date:'2026-09-01'}]});
  try {
    saveReviews(db,params,page('first','First'),null);
    saveReviews(db,{...params,language:'fr'},page('french','French'),null);
    const mark=await agent.patch(base+'/a/mark').send({country:'US',language:'en',marked:true,note:'Useful complaint'});
    assert.equal(mark.status,200);assert.ok(mark.body.marked_at);assert.equal(mark.body.review_note,'Useful complaint');
    const firstMark=mark.body.marked_at;
    const repeat=await agent.patch(base+'/a/mark').send({country:'US',language:'en',marked:true});
    assert.equal(repeat.body.marked_at,firstMark);
    saveReviews(db,params,page('second','Updated'),null);
    const saved=await agent.get(base+'?country=US&language=en');
    assert.equal(saved.body.reviews[0].body,'Updated');assert.equal(saved.body.reviews[0].review_note,'Useful complaint');
    assert.equal(saved.body.reviews[0].marked_at,firstMark);
    const french=await agent.get(base+'/marked?country=US&language=fr');assert.deepEqual(french.body,[]);
    const clear=await agent.patch(base+'/a/mark').send({country:'US',language:'en',marked:false,note:''});
    assert.equal(clear.status,200);assert.equal(clear.body.marked_at,null);assert.equal(clear.body.review_note,'');
    await agent.patch(base+'/a/mark').send({country:'US',language:'en',marked:true,note:'Keep me'});
    const unmark=await agent.patch(base+'/a/mark').send({country:'US',language:'en',marked:false});
    assert.equal(unmark.body.review_note,'Keep me');
    const remark=await agent.patch(base+'/a/mark').send({country:'US',language:'en',marked:true});
    assert.equal(remark.body.review_note,'Keep me');
    for (const body of [{marked:'true'},{marked:true,note:1},{marked:true,note:'x'.repeat(5001)}]) {
      const bad=await agent.patch(base+'/a/mark').send({country:'US',language:'en',...body});assert.equal(bad.status,400);
    }
    const missing=await agent.patch(base+'/missing/mark').send({country:'US',language:'en',marked:true});assert.equal(missing.status,404);
    const stored=db.prepare('SELECT marked_at,review_note FROM reviews WHERE package_id=? AND review_id=? AND country=? AND language=?').get('com.example.alpha','a','US','en');
    assert.equal(stored.review_note,'Keep me');assert.equal(stored.marked_at,remark.body.marked_at);
    assert.equal(db.prepare('SELECT marked_at FROM reviews WHERE language=?').get('fr').marked_at,null);
  } finally {db.close();}
});

test('marked list includes a review beyond the ordinary 1000-row browse limit', async () => {
  const db=openDatabase(':memory:');
  try {
    db.prepare('INSERT INTO apps(package_id,first_seen_at,last_seen_at) VALUES (?,?,?)').run('com.example.alpha','2026-09-01','2026-09-01');
    const insert=db.prepare('INSERT INTO reviews(package_id,review_id,country,language,stars,body,first_fetched_at,last_seen_at,review_date,marked_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    for(let i=0;i<1001;i++) insert.run('com.example.alpha',String(i),'US','en',1,`Review ${i}`,'2026-09-01','2026-09-01',String(i).padStart(4,'0'),i===0?'2026-09-23':null);
    const app=express();app.use(express.json());app.use('/api',createApi({db,provider:{}}));const agent=supertest(app);
    const ordinary=await agent.get('/api/apps/com.example.alpha/reviews?country=US&language=en');
    assert.equal(ordinary.status,200);assert.equal(ordinary.body.reviews.length,1000);assert.ok(!ordinary.body.reviews.some(x=>x.review_id==='0'));
    const marked=await agent.get('/api/apps/com.example.alpha/reviews/marked?country=US&language=en');
    assert.equal(marked.status,200);assert.equal(marked.body.length,1);assert.equal(marked.body[0].review_id,'0');
  } finally {db.close();}
});
