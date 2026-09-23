import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import supertest from 'supertest';
import { readFileSync } from 'node:fs';
import { openDatabase } from '../src/db/index.js';
import { createApi } from '../src/routes/api.js';
import { SerpApiProvider } from '../src/providers/serpapi.js';

const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`,import.meta.url)));

test('provider selects Games discovery engine and category while product and reviews stay shared', async () => {
  const urls=[];
  const provider=new SerpApiProvider({apiKey:'test',fetchImpl:async url=>{urls.push(new URL(url));return {ok:true,json:async()=>({})};}});
  const common={country:'US',language:'en'};
  await provider.getChart({...common,source:'games',categoryId:'GAME_ACTION',chart:'topselling_free'});
  await provider.searchApps({...common,source:'games',keyword:'alpha'});
  await provider.getChart({...common,source:'apps',categoryId:'PRODUCTIVITY',chart:'topselling_free'});
  await provider.searchApps({...common,source:'apps',keyword:'alpha'});
  await provider.getApp({...common,packageId:'com.example.alpha'});
  await provider.getReviews({...common,packageId:'com.example.alpha',rating:1,sort:1});
  assert.equal(urls[0].searchParams.get('engine'),'google_play_games');
  assert.equal(urls[0].searchParams.get('games_category'),'GAME_ACTION');
  assert.equal(urls[0].searchParams.has('apps_category'),false);
  assert.equal(urls[1].searchParams.get('engine'),'google_play_games');
  assert.equal(urls[1].searchParams.get('q'),'alpha');
  assert.equal(urls[2].searchParams.get('engine'),'google_play');
  assert.equal(urls[2].searchParams.get('apps_category'),'PRODUCTIVITY');
  assert.equal(urls[3].searchParams.get('store'),'apps');
  assert.equal(urls[4].searchParams.get('engine'),'google_play_product');
  assert.equal(urls[5].searchParams.get('engine'),'google_play_product');
});

test('API keeps Apps and Games runs, previews, and history separate', async () => {
  const db=openDatabase(':memory:');
  const calls={charts:[],searches:[]};
  const provider={
    async getAccount(){return {searches_per_month:250,this_month_usage:0,plan_searches_left:250,plan_renewal_date:null};},
    async getChart(p){calls.charts.push(p);return fixture(p.source==='games'?'game-chart':'chart');},
    async searchApps(p){calls.searches.push(p);return fixture(p.source==='games'?'game-search':'search');}
  };
  const app=express();app.use(express.json());app.use('/api',createApi({db,provider}));
  const agent=supertest(app);
  const base={country:'US',language:'en',chart:'topselling_free'};
  try {
    const config=await agent.get('/api/config');
    assert.ok(config.body.categories.games.includes('GAME_ACTION'));
    assert.ok(config.body.categories.apps.includes('PRODUCTIVITY'));
    const invalid=await agent.post('/api/discoveries').send({kind:'chart',source:'apps',...base,categoryId:'GAME_ACTION'});
    assert.equal(invalid.status,400);
    assert.equal((await agent.post('/api/fetch/preview').send({operation:'chart',source:'games',...base,categoryId:'PRODUCTIVITY'})).status,400);
    assert.equal((await agent.post('/api/discoveries').send({kind:'search',source:'unknown',...base,keyword:'alpha'})).status,400);
    const apps=await agent.post('/api/discoveries').send({kind:'chart',...base,categoryId:'PRODUCTIVITY'});
    assert.equal(apps.status,200);assert.equal(apps.body.discovery_source,'apps');
    const gamesParams={kind:'chart',source:'games',...base,categoryId:'GAME_ACTION'};
    const preview=await agent.post('/api/fetch/preview').send({operation:'chart',...gamesParams});
    assert.equal(preview.body.possibleCost,1);
    const games=await agent.post('/api/discoveries').send(gamesParams);
    assert.equal(games.status,200);assert.equal(games.body.discovery_source,'games');
    assert.equal((await agent.post('/api/discoveries').send(gamesParams)).body.sourceState,'local');
    assert.equal((await agent.post('/api/fetch/preview').send({operation:'chart',...gamesParams})).body.possibleCost,0);
    assert.equal(calls.charts.length,2);
    const gamesRuns=await agent.get('/api/discoveries?source=games');
    assert.deepEqual(gamesRuns.body.map(x=>x.id),[games.body.id]);
    const appsRuns=await agent.get('/api/discoveries?source=apps');
    assert.deepEqual(appsRuns.body.map(x=>x.id),[apps.body.id]);
    const appSearch=await agent.post('/api/discoveries').send({kind:'search',...base,keyword:'alpha'});
    assert.equal(appSearch.body.discovery_source,'apps');
    const gameSearchPreview=await agent.post('/api/fetch/preview').send({operation:'search',source:'games',...base,keyword:'alpha'});
    assert.equal(gameSearchPreview.body.possibleCost,1);
    const gameSearch=await agent.post('/api/discoveries').send({kind:'search',source:'games',...base,keyword:'alpha'});
    assert.equal(gameSearch.body.items[0].section,'Recommended');
    assert.equal(calls.searches.length,2);
    const detail=await agent.get('/api/apps/com.example.alpha?country=US&language=en');
    assert.deepEqual(new Set(detail.body.history.ranks.map(x=>x.discovery_source)),new Set(['apps','games']));
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM apps WHERE package_id=?').get('com.example.alpha').n,1);
  } finally { db.close(); }
});
