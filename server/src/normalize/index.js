import { createHash } from 'node:crypto';
const value = x => x === undefined || x === null ? null : x;
const num = x => typeof x === 'number' && Number.isFinite(x) ? x : null;
const flag = x => typeof x === 'boolean' ? Number(x) : null;
const safeUrl = x => typeof x === 'string' && /^https?:\/\//i.test(x) ? x : null;
export function source(raw) {
  const m = raw.search_metadata || {};
  const parsed = m.created_at ? Date.parse(m.created_at) : NaN;
  const observedAt = Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
  const fingerprint = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
  return { sourceRequestId: m.id || `${observedAt}:${fingerprint}`, observedAt };
}
export function installFloor(text) {
  if (typeof text !== 'string') return null;
  const match = text.trim().match(/^([\d,.]+)\s*([KMB])?\+$/i);
  if (!match) return null;
  return Math.round(Number(match[1].replace(/,/g, '')) * ({ K:1e3,M:1e6,B:1e9 }[match[2]?.toUpperCase()] || 1));
}
function packageFrom(item) {
  if (item.product_id) return item.product_id;
  try { return new URL(item.link).searchParams.get('id'); } catch { return null; }
}
export function listing(item, section, position, chart = false) {
  const id = packageFrom(item);
  if (!id || !/^[A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+$/.test(id)) return null;
  return { package_id: id, section, display_position: position, chart_rank: chart ? position : null,
    title: value(item.title), developer: value(item.author || item.developer), category: value(item.category),
    rating: num(item.rating), reported_count: num(item.reviews), reported_count_source: num(item.reviews) === null ? null : 'listing.reviews',
    install_band_text: value(item.downloads), price_text: value(item.price), icon_url: value(item.thumbnail),
    description: value(item.description), ads_flag: flag(item.contains_ads), iap_flag: flag(item.in_app_purchases), updated_on_text: value(item.updated_on) };
}
export function discovery(raw, kind) {
  let rows = [];
  if (kind === 'chart') rows = (raw.top_charts || []).map((item, i) => listing(item, 'Top chart', i + 1, true));
  else for (const group of raw.organic_results || []) {
    if (Array.isArray(group.items)) rows.push(...group.items.map((item, i) => listing(item, group.title || 'Results', i + 1)));
    else rows.push(listing(group, 'Results', rows.length + 1));
  }
  return { ...source(raw), items: rows.filter(Boolean) };
}
export function product(raw) {
  const p = raw.product_info || {}, media = raw.media || {};
  const screenshots = Array.isArray(media.images) ? media.images.map(x => typeof x === 'string' ? x : x.link || x.thumbnail).filter(Boolean) : [];
  const related = (raw.similar_results || []).map(g => ({ label: g.title || 'Related', apps: (g.items || []).map(x => ({ packageId: packageFrom(x), title: x.title, iconUrl: x.thumbnail })).filter(x => x.packageId) }));
  const about = raw.about_this_app || {};
  const extensions = Array.isArray(p.extensions) ? p.extensions.map(x => String(x).toLowerCase()) : [];
  const iapRange = about.in_app_purchases ?? p.in_app_purchases_price_range ?? (typeof p.in_app_purchases === 'string' ? p.in_app_purchases : null);
  const ads = typeof p.contains_ads === 'boolean' ? p.contains_ads : extensions.includes('contains ads') ? true : null;
  const iap = typeof p.in_app_purchases === 'boolean' ? p.in_app_purchases : iapRange ? true : extensions.includes('in-app purchases') ? true : null;
  const offer = p.offers?.find(x => /[$€£₹]/.test(x.text || ''))?.text;
  const contact = raw.developer_contact || {};
  const metadata = {
    editorsChoice: typeof p.editors_choice === 'boolean' ? p.editors_choice : null,
    offeredBy: value(about.offered_by),
    interactiveElements: value(about.interactive_elements),
    extensions: Array.isArray(p.extensions) ? p.extensions.filter(x => typeof x === 'string') : [],
    offers: Array.isArray(p.offers) ? p.offers.map(x => x.text).filter(x => typeof x === 'string') : [],
    categories: Array.isArray(raw.categories) ? raw.categories.map(x => x.name).filter(x => typeof x === 'string') : [],
    badges: Array.isArray(raw.badges) ? raw.badges.map(x => x.name).filter(x => typeof x === 'string') : [],
    whatsNew: value(raw.what_s_new?.snippet),
    developerContact: { name:value(contact.name), website:safeUrl(contact.website), supportEmail:value(contact.support_email), privacyPolicy:safeUrl(contact.privacy_policy), address:value(contact.address), phoneNumber:value(contact.phone_number) },
    dataSafety: Array.isArray(raw.data_safety) ? raw.data_safety.map(x => ({ text:value(x.text), subtext:value(x.subtext) })).filter(x => x.text) : [],
    permissions: Array.isArray(about.permissions) ? about.permissions.map(x => ({ type:value(x.type), details:Array.isArray(x.details) ? x.details.filter(y => typeof y === 'string') : [] })).filter(x => x.type) : [],
    video: media.video ? { thumbnail:safeUrl(media.video.thumbnail), link:safeUrl(media.video.link) } : null,
    featuredReviews: Array.isArray(raw.reviews) ? raw.reviews.slice(0,8).map(x => ({ rating:num(x.rating), body:value(x.snippet), likes:num(x.likes), date:value(x.iso_date || x.date) })) : []
  };
  return { ...source(raw), title: value(p.title), developer: value(p.authors?.[0]?.name || raw.developer_contact?.name),
    category: value(p.category || raw.categories?.[0]?.name), icon_url: value(p.thumbnail), description: value(p.description || about.snippet),
    screenshots_json: JSON.stringify(screenshots), related_json: JSON.stringify(related), rating_distribution_json: JSON.stringify(raw.ratings || null),
    updated_on_text: value(raw.updated_on || about.updated_on || p.updated_on || p.updated), rating: num(p.rating), reported_count: num(p.reviews),
    reported_count_source: num(p.reviews) === null ? null : 'product_info.reviews', install_band_text: value(about.downloads || p.downloads),
    price_text: value(p.price || offer), ads_flag: flag(ads), iap_flag: flag(iap),
    iap_price_range: value(iapRange), released_on_text:value(about.released_on || p.released_on),
    content_rating_text:value(p.content_rating?.text || about.content_rating), product_metadata_json:JSON.stringify(metadata) };
}
export function reviewPage(raw) {
  return { ...source(raw), nextPageToken: raw.serpapi_pagination?.next_page_token || null,
    reviews: (raw.reviews || []).filter(x => x.id).map(x => ({ review_id: String(x.id), stars: num(x.rating), body: value(x.snippet || x.body), likes: num(x.likes), review_date: value(x.iso_date || x.date) })) };
}
