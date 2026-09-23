import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import supertest from 'supertest';
import { readFileSync } from 'node:fs';
import { openDatabase } from '../src/db/index.js';
import { createApi } from '../src/routes/api.js';
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url)));
test('core research flow with a mock provider uses local reads without searches', async () => {
  const db=openDatabase(':memory:');
  const calls={ chart:0,search:0,detail:0,reviews:0,account:0 };
  const provider={
    async getAccount(){calls.account++;return {searches_per_month:250,this_month_usage:0,plan_searches_left:250,plan_renewal_date:'2026-10-01'};},
    async getChart(){calls.chart++;return fixture('chart');},
    async searchApps(){calls.search++;return fixture('search');},
    async getApp(){calls.detail++;return fixture('product');},
    async getReviews(){calls.reviews++;return fixture('reviews');}
  };
  const app=express();app.use(express.json());app.use('/api',createApi({db,provider}));
  const agent=supertest(app);
  async function request(method,path,body){const r=await agent[method.toLowerCase()](path).send(body || undefined);assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
  try {
    const params={kind:'chart',country:'US',language:'en',categoryId:'PRODUCTIVITY',chart:'topselling_free'};
    const preview=await request('POST','/api/fetch/preview',{operation:'chart',...params});assert.equal(preview.possibleCost,1);
    const first=await request('POST','/api/discoveries',params);assert.equal(first.items.length,2);
    const second=await request('POST','/api/discoveries',params);assert.equal(second.sourceState,'local');assert.equal(calls.chart,1);
    await request('GET',`/api/discoveries/${first.id}/items`);
    const appPath='/api/apps/com.example.alpha';
    const local=await request('GET',appPath);assert.equal(local.detail,null);assert.equal(calls.detail,0);
    const detail=await request('POST',appPath+'/detail',{country:'US',language:'en'});assert.equal(detail.detail.title,'Alpha');assert.equal(detail.detail.released_on_text,'Jan 5, 2020');assert.equal(detail.detail.reported_count,1250);assert.equal(detail.detail.productMetadata.whatsNew,'Improved performance');assert.equal(detail.detail.productMetadata.featuredReviews.length,1);
    await request('GET',appPath);assert.equal(calls.detail,1);
    await request('POST',appPath+'/reviews',{country:'US',language:'en',rating:1,sort:1,pages:1});
    const filtered=await request('GET',appPath+'/reviews?country=US&language=en&stars=1&sort=helpful');assert.equal(filtered.storedCount,2);
    await request('PATCH',appPath+'/shortlist',{starred:true,wedge_note:'Less ads'});
    const shortlist=await request('GET','/api/shortlist?country=US&language=en');assert.equal(shortlist.length,1);
    const dashboard=await request('GET','/api/dashboard');assert.equal(dashboard.counts.apps,2);assert.equal(dashboard.counts.reviews,2);
    assert.equal(calls.reviews,1);assert.equal(calls.chart,1);
    const activity=db.prepare("SELECT COUNT(*) n FROM api_requests WHERE outcome='local_cache'").get().n;assert.equal(activity,1);
  } finally {db.close();}
});
