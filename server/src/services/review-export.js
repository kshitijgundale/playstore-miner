import { InputError, locale, packageId } from './validate.js';

const columns = ['package_id','country','language','review_id','stars','body','likes','review_date','first_fetched_at','last_seen_at','marked_at','review_note'];
const ordering = { newest:'review_date DESC', oldest:'review_date ASC', helpful:'likes DESC' };

export function exportOptions(id, query) {
  const scope = query.scope ?? 'all';
  if (!['all','current'].includes(scope)) throw new InputError('Invalid export scope');
  const stars = query.stars == null || query.stars === '' ? null : query.stars;
  if (stars !== null && !/^[1-5]$/.test(stars)) throw new InputError('Invalid star filter');
  const sort = query.sort ?? 'newest';
  if (!Object.hasOwn(ordering,sort)) throw new InputError('Invalid saved review sort');
  return { packageId:packageId(id), ...locale(query), scope, stars:scope === 'current' && stars !== null ? Number(stars) : null, sort:scope === 'current' ? sort : 'newest' };
}

function csvCell(value) {
  if (value == null) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[\s\x00-\x1f]*[=+\-@]/u.test(text)) text = "'" + text;
  return `"${text.replaceAll('"','""')}"`;
}

export function* reviewCsvRows(db, options) {
  yield columns.join(',') + '\r\n';
  const sql = `SELECT ${columns.join(',')} FROM reviews WHERE package_id=? AND country=? AND language=? AND (? IS NULL OR stars=?) ORDER BY ${ordering[options.sort]}, review_id ASC`;
  for (const row of db.prepare(sql).iterate(options.packageId,options.country,options.language,options.stars,options.stars)) {
    yield columns.map(column => csvCell(row[column])).join(',') + '\r\n';
  }
}
