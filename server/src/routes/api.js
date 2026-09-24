import { Router } from 'express';
import { SerpApiProvider } from '../providers/serpapi.js';
import { Budget, freshness } from '../services/budget.js';
import { discovery as validateDiscovery, detail as validateDetail, reviewOptions, locale, packageId, InputError, categories, gameCategories, discoverySources, charts } from '../services/validate.js';
import { discovery as normalizeDiscovery, product, reviewPage } from '../normalize/index.js';
import { latestRun, runWithItems, saveDiscovery, saveDetail, saveReviews, log, now } from '../services/store.js';
import { exportOptions, reviewCsvRows } from '../services/review-export.js';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const wrap = fn => (req,res,next) => Promise.resolve().then(() => fn(req,res)).catch(next);
const json = text => { try { return JSON.parse(text || 'null'); } catch { return null; } };
const bool = value => value === null || value === undefined ? null : Boolean(value);
function reviewPagination(query={}) {
  const parse = (value,fallback) => value === undefined ? fallback : typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
  const page = parse(query.page,1), pageSize = parse(query.pageSize,100);
  if (!Number.isSafeInteger(page) || ![25,50,100,200].includes(pageSize) || !Number.isSafeInteger((page-1)*pageSize)) throw new InputError('Invalid review pagination');
  return {page,pageSize,offset:(page-1)*pageSize};
}
function appView(db,p) {
  const app = db.prepare('SELECT * FROM apps WHERE package_id=?').get(p.packageId);
  if (!app) return null;
  const detail = db.prepare('SELECT * FROM app_details WHERE package_id=? AND country=? AND language=?').get(p.packageId,p.country,p.language);
  const listing = db.prepare(`SELECT i.*,r.fetched_at,r.source_observed_at AS listing_source_observed_at,r.country,r.language,r.discovery_source,r.category_id,r.chart FROM discovery_items i JOIN discovery_runs r ON r.id=i.run_id WHERE i.package_id=? AND r.country=? AND r.language=? ORDER BY r.fetched_at DESC LIMIT 1`).get(p.packageId,p.country,p.language);
  const ranks = db.prepare(`SELECT r.source_observed_at AS observed_at,r.discovery_source,r.country,r.language,r.category_id,r.chart,i.chart_rank FROM discovery_items i JOIN discovery_runs r ON r.id=i.run_id WHERE i.package_id=? AND r.kind='chart' AND r.country=? AND r.language=? ORDER BY r.source_observed_at`).all(p.packageId,p.country,p.language);
  const snapshots = db.prepare(`SELECT * FROM app_snapshots WHERE package_id=? AND country=? AND language=? ORDER BY observed_at`).all(p.packageId,p.country,p.language);
  return { app, listing: listing || null, detail: detail ? { ...detail, screenshots: json(detail.screenshots_json), related: json(detail.related_json), ratingDistribution: json(detail.rating_distribution_json), productMetadata: json(detail.product_metadata_json), ads_flag: bool(detail.ads_flag), iap_flag: bool(detail.iap_flag) } : null, history: { ranks, snapshots } };
}
function savedReviews(db,p,query={}) {
  const {page,pageSize,offset}=reviewPagination(query);
  const stars = query.stars ? Number(query.stars) : null;
  if (stars !== null && ![1,2,3,4,5].includes(stars)) throw new InputError('Invalid star filter');
  const order = query.sort === 'helpful' ? 'likes DESC,review_id ASC' : query.sort === 'oldest' ? 'review_date ASC,review_id ASC' : 'review_date DESC,review_id ASC';
  const filter=[p.packageId,p.country,p.language,stars,stars];
  const total=db.prepare('SELECT COUNT(*) AS count FROM reviews WHERE package_id=? AND country=? AND language=? AND (? IS NULL OR stars=?)').get(...filter).count;
  const reviews = db.prepare(`SELECT * FROM reviews WHERE package_id=? AND country=? AND language=? AND (? IS NULL OR stars=?) ORDER BY ${order} LIMIT ? OFFSET ?`).all(...filter,pageSize,offset);
  const coverage = db.prepare(`SELECT rating_filter,source_sort,requested_page_token,next_page_token,result_count,fetched_at FROM review_fetches WHERE package_id=? AND country=? AND language=? ORDER BY fetched_at DESC`).all(p.packageId,p.country,p.language);
  const sampleDistribution = db.prepare(`SELECT stars,COUNT(*) AS count FROM reviews WHERE package_id=? AND country=? AND language=? GROUP BY stars ORDER BY stars`).all(p.packageId,p.country,p.language);
  const count = db.prepare('SELECT COUNT(*) AS count FROM reviews WHERE package_id=? AND country=? AND language=?').get(p.packageId,p.country,p.language).count;
  return { reviews, total, page, pageSize, coverage, sampleDistribution, storedCount: count };
}
export function createApi({ db, provider = new SerpApiProvider(), budget = new Budget(db,provider) }) {
  const router = Router();
  router.get('/config', (req,res) => res.json({ categories: { apps: categories, games: gameCategories }, sources: discoverySources, charts }));
  router.get('/usage', wrap(async (req,res) => res.json(await budget.usage(req.query.refresh === 'true'))));
  router.post('/fetch/preview', wrap(async (req,res) => {
    const op = req.body.operation;
    if (!['chart','search','detail','review'].includes(op)) throw new InputError('Invalid operation');
    const p = op === 'detail' ? validateDetail(req.body,req.body.packageId) : op === 'review' ? reviewOptions(req.body,req.body.packageId) : validateDiscovery({ ...req.body, kind: op });
    res.json(await budget.preview(op,p));
  }));
  router.post('/discoveries', wrap(async (req,res) => {
    const p = validateDiscovery(req.body), cache = freshness(db,p.kind,p);
    if (cache.fresh && !p.refresh) { log(db,p.kind,p,'local_cache',0); return res.json({ ...runWithItems(db,cache.row.id), sourceState: 'local', freshness: 'fresh' }); }
    const key = JSON.stringify(['discovery',p]);
    const result = await budget.run(key,p.kind,p,1,async call => {
      const raw = await call(() => p.kind === 'chart' ? provider.getChart(p) : provider.searchApps(p));
      return saveDiscovery(db,p,normalizeDiscovery(raw,p.kind));
    });
    res.json({ ...result.run, sourceState: result.repeated ? 'provider_cache' : 'provider', freshness: 'fresh' });
  }));
  router.get('/discoveries', wrap((req,res) => {
    const source = req.query.source;
    if (source !== undefined && !discoverySources.includes(source)) throw new InputError('Invalid discovery source');
    res.json(source ? db.prepare('SELECT * FROM discovery_runs WHERE discovery_source=? ORDER BY fetched_at DESC LIMIT 50').all(source) : db.prepare('SELECT * FROM discovery_runs ORDER BY fetched_at DESC LIMIT 50').all());
  }));
  router.get('/discoveries/:id/items', (req,res) => { const row=runWithItems(db,Number(req.params.id)); row ? res.json(row) : res.status(404).json({ error:'Run not found' }); });
  router.get('/apps/:packageId', wrap(async (req,res) => {
    const p = { packageId: packageId(req.params.packageId), ...locale(req.query) }, row = appView(db,p);
    row ? res.json(row) : res.status(404).json({ error: 'App not saved' });
  }));
  router.post('/apps/:packageId/detail', wrap(async (req,res) => {
    const p = validateDetail(req.body,req.params.packageId), cache = freshness(db,'detail',p);
    if (cache.fresh && !p.refresh) { log(db,'detail',p,'local_cache',0); return res.json({ ...appView(db,p), sourceState:'local' }); }
    const key = JSON.stringify(['detail',p]);
    const result = await budget.run(key,'detail',p,1,async call => {
      const raw = await call(() => provider.getApp(p));
      return saveDetail(db,p,product(raw));
    });
    res.json({ ...appView(db,p), sourceState: result.repeated ? 'provider_cache' : 'provider' });
  }));
  router.get('/apps/:packageId/reviews', wrap(async (req,res) => {
    res.json(savedReviews(db,{ packageId:packageId(req.params.packageId),...locale(req.query) },req.query));
  }));
  router.get('/apps/:packageId/reviews/export', wrap(async (req,res) => {
    const options=exportOptions(req.params.packageId,req.query);
    const filename=`reviews-${options.packageId}-${options.country}-${options.language}-${options.scope}.csv`;
    res.attachment(filename);
    res.set('Content-Type','text/csv; charset=utf-8');
    await pipeline(Readable.from(reviewCsvRows(db,options)),res);
  }));
  router.get('/apps/:packageId/reviews/marked', wrap(async (req,res) => {
    const p={ packageId:packageId(req.params.packageId),...locale(req.query) };
    const {page,pageSize,offset}=reviewPagination(req.query), args=[p.packageId,p.country,p.language];
    const total=db.prepare('SELECT COUNT(*) AS count FROM reviews WHERE package_id=? AND country=? AND language=? AND marked_at IS NOT NULL').get(...args).count;
    const reviews=db.prepare('SELECT * FROM reviews WHERE package_id=? AND country=? AND language=? AND marked_at IS NOT NULL ORDER BY marked_at DESC,review_id ASC LIMIT ? OFFSET ?').all(...args,pageSize,offset);
    res.json({reviews,total,page,pageSize});
  }));
  router.patch('/apps/:packageId/reviews/:reviewId/mark', wrap(async (req,res) => {
    const p={ packageId:packageId(req.params.packageId),reviewId:req.params.reviewId,...locale(req.body) };
    const {marked,note}=req.body;
    if (typeof marked !== 'boolean') throw new InputError('marked must be boolean');
    if (note !== undefined && (typeof note !== 'string' || note.length > 5000)) throw new InputError('Invalid note');
    const current=db.prepare('SELECT * FROM reviews WHERE package_id=? AND review_id=? AND country=? AND language=?').get(p.packageId,p.reviewId,p.country,p.language);
    if (!current) return res.status(404).json({error:'Saved review not found'});
    db.prepare('UPDATE reviews SET marked_at=?,review_note=? WHERE package_id=? AND review_id=? AND country=? AND language=?')
      .run(marked ? current.marked_at || now() : null,note === undefined ? current.review_note : note,p.packageId,p.reviewId,p.country,p.language);
    res.json(db.prepare('SELECT * FROM reviews WHERE package_id=? AND review_id=? AND country=? AND language=?').get(p.packageId,p.reviewId,p.country,p.language));
  }));
  router.post('/apps/:packageId/reviews', wrap(async (req,res) => {
    const p = reviewOptions(req.body,req.params.packageId), key = JSON.stringify(['review',p]);
    const result = await budget.run(key,'review',p,p.pages,async call => {
      let token = p.pageToken, pagesFetched = 0;
      for (let i=0;i<p.pages;i++) {
        const raw = await call(() => provider.getReviews({ ...p,pageToken:token }));
        const page = reviewPage(raw);
        saveReviews(db,p,page,token);
        pagesFetched++;
        token = page.nextPageToken;
        if (!token) break;
      }
      return { pagesFetched,nextPageToken:token };
    });
    res.json({ ...result,...savedReviews(db,p) });
  }));
  router.patch('/apps/:packageId/shortlist', wrap(async (req,res) => {
    const id = packageId(req.params.packageId), app=db.prepare('SELECT * FROM apps WHERE package_id=?').get(id);
    if (!app) return res.status(404).json({ error:'App not saved' });
    const starred = req.body.starred;
    if (starred !== undefined && typeof starred !== 'boolean') throw new InputError('starred must be boolean');
    const fields = ['wedge_note','improvement_note','pricing_note','complaints_note'];
    for (const field of fields) if (req.body[field] !== undefined && (typeof req.body[field] !== 'string' || req.body[field].length > 5000)) throw new InputError(`Invalid ${field}`);
    const notes = fields.map(field => req.body[field] === undefined ? app[field] : req.body[field]);
    const time = starred === undefined ? app.shortlisted_at : starred ? now() : null;
    db.prepare(`UPDATE apps SET shortlisted_at=?,wedge_note=?,improvement_note=?,pricing_note=?,complaints_note=?,research_updated_at=? WHERE package_id=?`).run(time,...notes,now(),id);
    res.json(db.prepare('SELECT * FROM apps WHERE package_id=?').get(id));
  }));
  router.get('/shortlist', (req,res) => {
    const {country,language}=locale(req.query);
    const rows=db.prepare(`SELECT a.*,d.title AS detail_title,d.rating AS detail_rating,d.reported_count AS detail_count,d.price_text AS detail_price,d.ads_flag,d.iap_flag,d.install_band_text AS detail_installs,d.source_observed_at AS detail_observed_at,d.fetched_at AS detail_fetched_at,
      (SELECT COUNT(*) FROM reviews v WHERE v.package_id=a.package_id AND v.country=? AND v.language=?) AS review_count,
      (SELECT i.title FROM discovery_items i JOIN discovery_runs r ON r.id=i.run_id WHERE i.package_id=a.package_id AND r.country=? AND r.language=? ORDER BY r.fetched_at DESC LIMIT 1) AS listing_title,
      (SELECT i.rating FROM discovery_items i JOIN discovery_runs r ON r.id=i.run_id WHERE i.package_id=a.package_id AND r.country=? AND r.language=? ORDER BY r.fetched_at DESC LIMIT 1) AS listing_rating,
      (SELECT i.install_band_text FROM discovery_items i JOIN discovery_runs r ON r.id=i.run_id WHERE i.package_id=a.package_id AND r.country=? AND r.language=? ORDER BY r.fetched_at DESC LIMIT 1) AS listing_installs,
      (SELECT MAX(r.source_observed_at) FROM discovery_items i JOIN discovery_runs r ON r.id=i.run_id WHERE i.package_id=a.package_id AND r.country=? AND r.language=?) AS listing_observed_at
      FROM apps a LEFT JOIN app_details d ON d.package_id=a.package_id AND d.country=? AND d.language=? WHERE a.shortlisted_at IS NOT NULL ORDER BY a.research_updated_at DESC`).all(country,language,country,language,country,language,country,language,country,language,country,language);
    res.json(rows);
  });
  router.get('/dashboard', wrap(async (req,res) => {
    const counts = db.prepare(`SELECT (SELECT COUNT(*) FROM apps) AS apps,(SELECT COUNT(DISTINCT package_id) FROM app_details) AS enriched,(SELECT COUNT(*) FROM reviews) AS reviews,(SELECT COUNT(*) FROM (SELECT DISTINCT country,category_id FROM discovery_runs WHERE kind='chart')) AS categoryScans,(SELECT COUNT(*) FROM apps WHERE shortlisted_at IS NOT NULL) AS shortlisted`).get();
    const activity = db.prepare('SELECT operation,outcome,possible_cost,created_at,message FROM api_requests ORDER BY id DESC LIMIT 12').all();
    const shortlist = db.prepare('SELECT package_id,shortlisted_at,wedge_note FROM apps WHERE shortlisted_at IS NOT NULL ORDER BY research_updated_at DESC LIMIT 6').all();
    res.json({ counts,activity,shortlist,usage:await budget.usage() });
  }));
  router.use((error,req,res,next) => { console.error(error); res.status(error.status || 500).json({ error: error.message || 'Internal error' }); });
  return router;
}
