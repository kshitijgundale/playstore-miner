export class InputError extends Error { constructor(message) { super(message); this.status = 400; } }
const fail = message => { throw new InputError(message); };
const codes = /^[a-z]{2}$/i;
export const categories = ['APPLICATION','ART_AND_DESIGN','AUTO_AND_VEHICLES','BEAUTY','BOOKS_AND_REFERENCE','BUSINESS','COMICS','COMMUNICATION','DATING','EDUCATION','ENTERTAINMENT','EVENTS','FINANCE','FOOD_AND_DRINK','HEALTH_AND_FITNESS','HOUSE_AND_HOME','LIFESTYLE','MAPS_AND_NAVIGATION','MEDICAL','MUSIC_AND_AUDIO','NEWS_AND_MAGAZINES','PARENTING','PERSONALIZATION','PHOTOGRAPHY','PRODUCTIVITY','SHOPPING','SOCIAL','SPORTS','TOOLS','TRAVEL_AND_LOCAL','VIDEO_PLAYERS','WEATHER'];
export const gameCategories = ['GAME','GAME_ACTION','GAME_ADVENTURE','GAME_ARCADE','GAME_BOARD','GAME_CARD','GAME_CASINO','GAME_CASUAL','GAME_EDUCATIONAL','GAME_MUSIC','GAME_PUZZLE','GAME_RACING','GAME_ROLE_PLAYING','GAME_SIMULATION','GAME_SPORTS','GAME_STRATEGY','GAME_TRIVIA','GAME_WORD'];
export const discoverySources = ['apps','games'];
export const charts = ['topselling_free','topselling_paid','topgrossing'];
export function locale(body = {}) {
  const country = String(body.country ?? 'US').toUpperCase();
  const language = String(body.language ?? 'en').toLowerCase();
  if (!codes.test(country) || !codes.test(language)) fail('Country and language must be two-letter codes');
  return { country, language };
}
export function packageId(value) {
  const id = String(value || '');
  if (id.length > 255 || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(id)) fail('Invalid package ID');
  return id;
}
export function discovery(body = {}) {
  const kind = body.kind;
  if (!['chart','search'].includes(kind)) fail('Invalid discovery kind');
  const source = body.source ?? 'apps';
  if (!discoverySources.includes(source)) fail('Invalid discovery source');
  const result = { kind, source, ...locale(body), refresh: body.refresh === true, forceLive: body.forceLive === true };
  if (result.forceLive && !result.refresh) fail('Force live requires refresh');
  if (kind === 'chart') {
    result.categoryId = String(body.categoryId || '').toUpperCase();
    result.chart = String(body.chart || 'topselling_free');
    if (!(source === 'apps' ? categories : gameCategories).includes(result.categoryId) || !charts.includes(result.chart)) fail('Unsupported category or chart');
  } else {
    result.keyword = String(body.keyword || '').trim().replace(/\s+/g, ' ');
    if (!result.keyword || result.keyword.length > 100) fail('Keyword must be 1–100 characters');
    result.keyword = result.keyword.toLocaleLowerCase('en');
  }
  return result;
}
export function detail(body = {}, id) {
  const result = { packageId: packageId(id), ...locale(body), refresh: body.refresh === true, forceLive: body.forceLive === true };
  if (result.forceLive && !result.refresh) fail('Force live requires refresh');
  return result;
}
export function reviewOptions(body = {}, id) {
  const rating = body.rating === '' ? null : body.rating == null ? 1 : Number(body.rating);
  const sort = Number(body.sort ?? 1), pages = Number(body.pages ?? 1);
  if (rating !== null && ![1,2,3,4,5].includes(rating)) fail('Invalid review rating');
  if (![1,2,3].includes(sort)) fail('Invalid review sort');
  if (!Number.isInteger(pages) || pages < 1 || pages > 3) fail('Review pages must be 1–3');
  const pageToken = body.pageToken == null ? null : String(body.pageToken);
  if (pageToken && pageToken.length > 4096) fail('Page token is too long');
  return { packageId: packageId(id), ...locale(body), rating, sort, pages, pageToken, forceLive: body.forceLive === true };
}
