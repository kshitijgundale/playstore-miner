const BASE = 'https://serpapi.com';
export class SerpApiProvider {
  constructor({ apiKey = process.env.SERPAPI_API_KEY, fetchImpl = fetch } = {}) {
    this.apiKey = apiKey; this.fetchImpl = fetchImpl;
  }
  async request(path, params = {}) {
    if (!this.apiKey) throw new Error('SERPAPI_API_KEY is not configured');
    const url = new URL(path, BASE);
    for (const [key, value] of Object.entries({ ...params, api_key: this.apiKey })) if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    const response = await this.fetchImpl(url, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`SerpApi HTTP ${response.status}`);
    const data = await response.json();
    if (data.error || data.search_metadata?.status === 'Error') throw new Error(`SerpApi: ${data.error || 'search failed'}`);
    return data;
  }
  getChart({ source = 'apps', country, language, categoryId, chart, forceLive }) {
    return this.request('/search.json', { engine: source === 'games' ? 'google_play_games' : 'google_play', ...(source === 'games' ? { games_category: categoryId } : { store: 'apps', apps_category: categoryId }), gl: country.toLowerCase(), hl: language, chart, no_cache: forceLive || undefined });
  }
  searchApps({ source = 'apps', country, language, keyword, forceLive }) {
    return this.request('/search.json', { engine: source === 'games' ? 'google_play_games' : 'google_play', ...(source === 'games' ? {} : { store: 'apps' }), gl: country.toLowerCase(), hl: language, q: keyword, no_cache: forceLive || undefined });
  }
  getApp({ country, language, packageId, forceLive }) {
    return this.request('/search.json', { engine: 'google_play_product', store: 'apps', gl: country.toLowerCase(), hl: language, product_id: packageId, no_cache: forceLive || undefined });
  }
  getReviews({ country, language, packageId, rating, sort, pageToken, forceLive }) {
    return this.request('/search.json', { engine: 'google_play_product', store: 'apps', gl: country.toLowerCase(), hl: language, product_id: packageId, all_reviews: true, rating, sort_by: sort, num: 199, next_page_token: pageToken, no_cache: forceLive || undefined });
  }
  async getAccount() {
    const raw = await this.request('/account.json');
    return { searches_per_month: raw.searches_per_month ?? null, this_month_usage: raw.this_month_usage ?? null, plan_searches_left: raw.plan_searches_left ?? null, plan_renewal_date: raw.plan_renewal_date ?? null };
  }
}
