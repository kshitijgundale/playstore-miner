import { latestRun, log, now } from './store.js';
export const ttl = { chart: 24 * 3600_000, search: 7 * 24 * 3600_000, detail: 7 * 24 * 3600_000 };
export function freshness(db, operation, p) {
  const row = operation === 'detail'
    ? db.prepare('SELECT * FROM app_details WHERE package_id=? AND country=? AND language=?').get(p.packageId,p.country,p.language)
    : operation === 'review' ? null : latestRun(db,p);
  const fresh = Boolean(row && Date.now() - Date.parse(row.fetched_at) < ttl[operation]);
  return { row, fresh, cacheStatus: row ? fresh ? 'fresh' : 'stale' : 'miss' };
}
export class Budget {
  constructor(db, provider, floor = Number(process.env.SAFETY_FLOOR ?? 20)) {
    this.db = db; this.provider = provider; this.floor = Number.isInteger(floor) && floor >= 0 ? floor : 20;
    this.reserved = 0; this.inflight = new Map(); this.lock = Promise.resolve();
  }
  async account() {
    const fields = await this.provider.getAccount();
    const account = { ...fields, fetched_at: now() };
    this.db.prepare('INSERT INTO account_snapshots(searches_per_month,this_month_usage,plan_searches_left,plan_renewal_date,fetched_at) VALUES (?,?,?,?,?)')
      .run(account.searches_per_month,account.this_month_usage,account.plan_searches_left,account.plan_renewal_date,account.fetched_at);
    return account;
  }
  cachedAccount() { return this.db.prepare('SELECT searches_per_month,this_month_usage,plan_searches_left,plan_renewal_date,fetched_at FROM account_snapshots ORDER BY id DESC LIMIT 1').get() || null; }
  async usage(refresh = false) {
    const cached = this.cachedAccount();
    if (!refresh && cached && Date.now() - Date.parse(cached.fetched_at) < 300_000) return { ...cached, status: 'fresh' };
    try { return { ...await this.account(), status: 'fresh' }; }
    catch { return cached ? { ...cached, status: 'stale' } : { status: 'unavailable' }; }
  }
  async preview(operation,p) {
    const cache = freshness(this.db,operation,p);
    const possibleCost = cache.fresh && !p.refresh && !p.forceLive ? 0 : operation === 'review' ? p.pages : 1;
    if (!possibleCost) return { operation, cacheStatus: cache.cacheStatus, possibleCost, floor: this.floor, allowed: true, account: this.cachedAccount(), reason: null };
    const account = await this.usage(true);
    const remaining = account.plan_searches_left;
    const allowed = account.status === 'fresh' && Number.isInteger(remaining) && remaining - this.reserved - possibleCost >= this.floor;
    return { operation, cacheStatus: cache.cacheStatus, possibleCost, floor: this.floor, allowed, account, reason: allowed ? null : account.status !== 'fresh' ? 'Account status unavailable' : `Request would leave fewer than ${this.floor} searches` };
  }
  async run(key, operation, params, maxCost, fn) {
    if (this.inflight.has(key)) return this.inflight.get(key);
    const work = (async () => {
      let release;
      const prior = this.lock;
      this.lock = new Promise(resolve => { release = resolve; });
      await prior;
      let reserved = false;
      try {
        const account = await this.account();
        if (!Number.isInteger(account.plan_searches_left) || account.plan_searches_left - this.reserved - maxCost < this.floor) {
          const error = new Error(`Request would leave fewer than ${this.floor} searches, or quota is unknown`); error.status = 409; throw error;
        }
        this.reserved += maxCost; reserved = true;
      } catch (error) {
        log(this.db,operation,params,'blocked',0,null,error.message);
        if (!error.status) error.status = 503;
        throw error;
      } finally { release(); }
      let attempts = 0;
      try {
        const result = await fn(async (call, cost = 1) => {
          attempts += cost;
          try {
            const data = await call();
            log(this.db,operation,params,'success',cost,data.search_metadata?.id || null);
            return data;
          } catch (error) { log(this.db,operation,params,'uncertain',cost,null,error.message); throw error; }
        });
        return result;
      } finally {
        if (reserved) this.reserved -= maxCost;
        try { await this.account(); } catch { /* later usage is labeled stale */ }
      }
    })();
    this.inflight.set(key,work);
    try { return await work; } finally { this.inflight.delete(key); }
  }
}
