import { transaction } from '../db/index.js';
import { installFloor } from '../normalize/index.js';
export const now = () => new Date().toISOString();
export function log(db, operation, params, outcome, possibleCost, sourceRequestId = null, message = null) {
  const safe = Object.fromEntries(Object.entries(params).filter(([k]) => !['apiKey','pageToken'].includes(k)));
  db.prepare('INSERT INTO api_requests(operation,params_json,outcome,possible_cost,source_request_id,created_at,message) VALUES (?,?,?,?,?,?,?)')
    .run(operation, JSON.stringify(safe), outcome, possibleCost, sourceRequestId, now(), message?.slice(0, 300) || null);
}
export function latestRun(db, p) {
  return db.prepare(`SELECT * FROM discovery_runs WHERE discovery_source=? AND kind=? AND country=? AND language=? AND category_id IS ? AND chart IS ? AND keyword IS ? ORDER BY fetched_at DESC LIMIT 1`)
    .get(p.source || 'apps',p.kind,p.country,p.language,p.categoryId || null,p.chart || null,p.keyword || null);
}
export function runWithItems(db, id) {
  const run = db.prepare('SELECT * FROM discovery_runs WHERE id=?').get(id);
  if (!run) return null;
  return { ...run, items: db.prepare(`SELECT i.*,a.shortlisted_at FROM discovery_items i JOIN apps a USING(package_id) WHERE i.run_id=? ORDER BY i.section,i.display_position`).all(id) };
}
function upsertApp(db, id, time) {
  db.prepare(`INSERT INTO apps(package_id,first_seen_at,last_seen_at) VALUES (?,?,?) ON CONFLICT(package_id) DO UPDATE SET last_seen_at=excluded.last_seen_at`).run(id,time,time);
}
function snapshot(db, id, p, src, type, item) {
  db.prepare(`INSERT OR IGNORE INTO app_snapshots(package_id,country,language,source_type,source_request_id,observed_at,rating,reported_count,reported_count_source,install_band_text,install_floor,price_text,ads_flag,iap_flag) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id,p.country,p.language,type,src.sourceRequestId,src.observedAt,item.rating,item.reported_count,item.reported_count_source,item.install_band_text,installFloor(item.install_band_text),item.price_text,item.ads_flag,item.iap_flag);
}
export function saveDiscovery(db,p,src) {
  return transaction(db, () => {
    const existing = db.prepare(`SELECT id FROM discovery_runs WHERE discovery_source=? AND kind=? AND country=? AND language=? AND category_id IS ? AND chart IS ? AND keyword IS ? AND provider='serpapi' AND source_request_id=?`)
      .get(p.source || 'apps',p.kind,p.country,p.language,p.categoryId || null,p.chart || null,p.keyword || null,src.sourceRequestId);
    if (existing) { db.prepare('UPDATE discovery_runs SET fetched_at=? WHERE id=?').run(now(),existing.id); return { run: runWithItems(db,existing.id), repeated: true }; }
    const fetchedAt = now();
    const id = Number(db.prepare(`INSERT INTO discovery_runs(discovery_source,kind,country,language,category_id,chart,keyword,provider,fetched_at,source_observed_at,source_request_id) VALUES (?,?,?,?,?,?,?,'serpapi',?,?,?)`)
      .run(p.source || 'apps',p.kind,p.country,p.language,p.categoryId || null,p.chart || null,p.keyword || null,fetchedAt,src.observedAt,src.sourceRequestId).lastInsertRowid);
    const put = db.prepare(`INSERT INTO discovery_items(run_id,package_id,section,display_position,chart_rank,title,developer,category,rating,reported_count,reported_count_source,install_band_text,price_text,icon_url,description,ads_flag,iap_flag,updated_on_text) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const x of src.items) {
      upsertApp(db,x.package_id,fetchedAt);
      put.run(id,x.package_id,x.section,x.display_position,x.chart_rank,x.title,x.developer,x.category,x.rating,x.reported_count,x.reported_count_source,x.install_band_text,x.price_text,x.icon_url,x.description,x.ads_flag,x.iap_flag,x.updated_on_text);
      snapshot(db,x.package_id,p,src,'listing',x);
    }
    return { run: runWithItems(db,id), repeated: false };
  });
}
export function saveDetail(db,p,item) {
  return transaction(db, () => {
    const prev = db.prepare('SELECT source_request_id FROM app_details WHERE package_id=? AND country=? AND language=?').get(p.packageId,p.country,p.language);
    const fetchedAt = now(); upsertApp(db,p.packageId,fetchedAt);
    const columns = ['title','developer','category','icon_url','description','screenshots_json','related_json','rating_distribution_json','updated_on_text','rating','reported_count','reported_count_source','install_band_text','price_text','ads_flag','iap_flag','iap_price_range','released_on_text','content_rating_text','product_metadata_json'];
    const values = columns.map(x => item[x]);
    db.prepare(`INSERT INTO app_details(package_id,country,language,fetched_at,source_observed_at,source_request_id,${columns.join(',')}) VALUES (?,?,?,?,?, ?,${columns.map(()=>'?').join(',')}) ON CONFLICT(package_id,country,language) DO UPDATE SET fetched_at=excluded.fetched_at,source_observed_at=excluded.source_observed_at,source_request_id=excluded.source_request_id,${columns.map(x=>`${x}=excluded.${x}`).join(',')}`)
      .run(p.packageId,p.country,p.language,fetchedAt,item.observedAt,item.sourceRequestId,...values);
    snapshot(db,p.packageId,p,item,'product',item);
    return { repeated: prev?.source_request_id === item.sourceRequestId };
  });
}
export function saveReviews(db,p,page,token) {
  return transaction(db, () => {
    const existing = db.prepare('SELECT id FROM review_fetches WHERE package_id=? AND country=? AND language=? AND source_request_id=?').get(p.packageId,p.country,p.language,page.sourceRequestId);
    if (existing) return true;
    const time = now(); upsertApp(db,p.packageId,time);
    const put = db.prepare(`INSERT INTO reviews(package_id,review_id,country,language,stars,body,likes,review_date,first_fetched_at,last_seen_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(package_id,review_id,country,language) DO UPDATE SET stars=excluded.stars,body=excluded.body,likes=excluded.likes,review_date=excluded.review_date,last_seen_at=excluded.last_seen_at`);
    for (const r of page.reviews) put.run(p.packageId,r.review_id,p.country,p.language,r.stars,r.body,r.likes,r.review_date,time,time);
    db.prepare(`INSERT INTO review_fetches(package_id,country,language,rating_filter,source_sort,requested_page_token,next_page_token,result_count,fetched_at,source_observed_at,source_request_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(p.packageId,p.country,p.language,p.rating,p.sort,token,page.nextPageToken,page.reviews.length,time,page.observedAt,page.sourceRequestId);
    return false;
  });
}
