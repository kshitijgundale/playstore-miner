import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, post, patch, qs, download, show, date } from './api.js';
import ProductMetadata from './components/ProductMetadata.jsx';
import './style.css';

const charts = { topselling_free:'Top Free', topselling_paid:'Top Paid', topgrossing:'Top Grossing' };
const defaultLocale = { country:'US', language:'en' };
const savedResultLabel = { miss:'No saved result', fresh:'Fresh saved result', stale:'Saved result is outdated' };
function useAsync() {
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  async function run(fn) { setBusy(true); setError(''); try { return await fn(); } catch(e) { setError(e.message); } finally { setBusy(false); } }
  return { busy,error,run };
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function State({ busy,error }) { return <>{busy && <span className="badge">Working…</span>}{error && <p className="error" role="alert">{error}</p>}</>; }
function PreviewButton({ operation, params, onFetch, text='Fetch', disabled=false }) {
  const [preview,setPreview]=useState(null), task=useAsync();
  async function prepare() { await task.run(async()=>setPreview(await post('/fetch/preview',{operation,...params}))); }
  return <span className="preview"><button onClick={prepare} disabled={disabled || task.busy}>Preview {text.toLowerCase()}</button>{preview && <span className="preview-panel"><strong>{preview.possibleCost} possible search{preview.possibleCost===1?'':'es'}</strong> · {savedResultLabel[preview.cacheStatus] || preview.cacheStatus} · Minimum to keep: {preview.floor} searches · {show(preview.account?.plan_searches_left)} remaining{preview.reason && <> · {preview.reason}</>}<button disabled={!preview.allowed || task.busy} onClick={()=>{setPreview(null);onFetch();}}>{text}</button></span>}<State {...task}/></span>;
}
function AppTable({ items, open, locale, onStar }) {
  const [filter,setFilter]=useState(''),[sort,setSort]=useState('position'),[direction,setDirection]=useState(1);
  const rows=useMemo(()=>items.filter(x=>`${x.title||''} ${x.developer||''} ${x.category||''}`.toLowerCase().includes(filter.toLowerCase())).sort((a,b)=>{
    const field = sort==='position'?'display_position':sort;
    const av=a[field],bv=b[field]; if(av==null)return 1;if(bv==null)return -1;
    return direction*(typeof av==='number'?av-bv:String(av).localeCompare(String(bv)));
  }),[items,filter,sort,direction]);
  function order(field){if(sort===field)setDirection(-direction);else {setSort(field);setDirection(1);}}
  return <><div className="row"><input placeholder="Filter saved results" value={filter} onChange={e=>setFilter(e.target.value)}/><small>{rows.length} apps · sorting uses saved data</small></div><div className="table-scroll"><table><thead><tr>{[['position','#'],['title','App'],['developer','Developer'],['category','Category'],['rating','Rating'],['reported_count','Reported count'],['install_band_text','Installs'],['price_text','Price'],['ads_flag','Ads'],['iap_flag','IAP'],['updated_on_text','Updated']].map(([key,name])=><th key={key}><button onClick={()=>order(key)}>{name}</button></th>)}<th>Save</th></tr></thead><tbody>{rows.map((x,i)=><tr key={`${x.package_id}-${x.section}-${i}`}><td>{x.chart_rank ? `Rank ${x.chart_rank}` : `${x.section} #${x.display_position}`}</td><td><button className="app-link" onClick={()=>open(x.package_id)}>{x.icon_url&&<img src={x.icon_url} alt=""/>}{show(x.title)}</button><small>{x.package_id}</small></td><td>{show(x.developer)}</td><td>{show(x.category)}</td><td>{show(x.rating)}</td><td>{show(x.reported_count)}</td><td>{show(x.install_band_text)}</td><td>{show(x.price_text)}</td><td>{x.ads_flag==null?'Unknown':x.ads_flag?'Yes':'No'}</td><td>{x.iap_flag==null?'Unknown':x.iap_flag?'Yes':'No'}</td><td>{show(x.updated_on_text)}</td><td><button onClick={()=>onStar(x)} title="Toggle shortlist">{x.shortlisted_at?'★':'☆'}</button></td></tr>)}</tbody></table></div>{!rows.length&&<p className="empty">No matching apps in this saved run.</p>}</>;
}
function Discovery({source,locale,open}) {
  const [kind,setKind]=useState('chart'),[category,setCategory]=useState(source==='games'?'GAME':'PRODUCTIVITY'),[chart,setChart]=useState('topselling_free'),[keyword,setKeyword]=useState(''),[refresh,setRefresh]=useState(false),[forceLive,setForceLive]=useState(false),[results,setResults]=useState({chart:null,search:null}),[runs,setRuns]=useState([]),[config,setConfig]=useState(null),task=useAsync();
  useEffect(()=>{api('/config').then(setConfig).catch(()=>{});},[]);
  useEffect(()=>{api('/discoveries'+qs({source})).then(setRuns).catch(()=>{});},[source]);
  const available=config?.categories?.[source]||[];
  const selectedCategory=available.includes(category)?category:available[0];
  const data=results[kind];
  const params=kind==='chart'?{kind,source,...locale,categoryId:selectedCategory,chart,refresh,forceLive}:{kind,source,...locale,keyword,refresh,forceLive};
  function setResult(value){setResults(current=>({...current,[kind]:value}));}
  function fetchRun(){task.run(async()=>{setResult(await post('/discoveries',params));setRuns(await api('/discoveries'+qs({source})));});}
  function star(x){task.run(async()=>{await patch(`/apps/${encodeURIComponent(x.package_id)}/shortlist`,{starred:!x.shortlisted_at});setResults(current=>({...current,[kind]:{...current[kind],items:current[kind].items.map(item=>item.package_id===x.package_id?{...item,shortlisted_at:x.shortlisted_at?null:new Date().toISOString()}:item)}}));});}
  return <section><h1>{source==='games'?'Games':'Apps'}</h1><p>Browse {source==='games'?'game':'app'} category charts or search Google Play by keyword. Saved runs below belong to this tab.</p><div className="app-tabs" aria-label={`${source} discovery views`}><button type="button" aria-current={kind==='chart'?'page':undefined} onClick={()=>setKind('chart')}>Category charts</button><button type="button" aria-current={kind==='search'?'page':undefined} onClick={()=>setKind('search')}>Search</button></div>{kind==='search'&&source==='games'&&<p className="muted">Games search uses the Games discovery endpoint. Keyword results may also include apps.</p>}<div className="controls">{kind==='chart'?<><Field label="Category"><select value={selectedCategory||''} onChange={e=>setCategory(e.target.value)} disabled={!available.length}>{available.map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select></Field><Field label="Chart"><select value={chart} onChange={e=>setChart(e.target.value)}>{Object.entries(charts).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field></>:<Field label="Keyword"><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="e.g. puzzle game"/></Field>}<label className="check"><input type="checkbox" checked={refresh} onChange={e=>{setRefresh(e.target.checked);if(!e.target.checked)setForceLive(false);}}/> Refresh</label><label className="check"><input type="checkbox" checked={forceLive} disabled={!refresh} onChange={e=>setForceLive(e.target.checked)}/> Force live</label><PreviewButton key={JSON.stringify(params)} operation={kind} params={params} onFetch={fetchRun} text="Get results" disabled={kind==='search'?!keyword.trim():!selectedCategory}/></div><State {...task}/>{data&&<><div className="section-head"><h2>Saved run #{data.id}</h2><span className="badge">{data.discovery_source==='games'?'Games':'Apps'} · {data.sourceState||'saved'} · {data.freshness||'saved'} · {date(data.source_observed_at)} · {data.country}/{data.language}</span></div><AppTable items={data.items} open={open} locale={locale} onStar={star}/></>}<h2>Recent runs</h2><div className="run-list">{runs.map(x=><button key={x.id} onClick={()=>task.run(async()=>{const saved=await api(`/discoveries/${x.id}/items`);setKind(x.kind);setResults(current=>({...current,[x.kind]:saved}));})}>{x.kind==='chart'?`${x.category_id.replaceAll('_',' ')} · ${charts[x.chart]||x.chart}`:`Search · “${x.keyword}”`} <small>{x.country}/{x.language} · {date(x.fetched_at)}</small></button>)}</div></section>;
}
function History({history}) {
  const [group,setGroup]=useState('');
  const rankContext=x=>`${x.discovery_source==='games'?'Games':'Apps'} · ${x.country}/${x.language} · ${x.category_id} · ${x.chart}`;
  const groups=[...new Set(history.ranks.map(rankContext))];
  const current=groups.includes(group)?group:groups[0],ranks=history.ranks.filter(x=>rankContext(x)===current);
  const metrics=history.snapshots.filter(x=>x.source_type==='product');
  const counts=metrics.filter(x=>x.reported_count_source==='product_info.reviews');
  function plot(rows,key,label,reverse=false){return <div className="chart-card"><h3>{label}</h3>{rows.length<2?<p className="empty">Insufficient comparable history ({rows.length} observation{rows.length===1?'':'s'}).</p>:<ResponsiveContainer width="100%" height={180}><LineChart data={rows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="observed_at" tickFormatter={x=>new Date(x).toLocaleDateString()}/><YAxis reversed={reverse}/><Tooltip labelFormatter={date}/><Line type="linear" dataKey={key} stroke="#4263eb" connectNulls={false}/></LineChart></ResponsiveContainer>}</div>}
  return <><h2>Observed history</h2>{groups.length>0&&<Field label="Rank context"><select value={current} onChange={e=>setGroup(e.target.value)}>{groups.map(x=><option key={x}>{x}</option>)}</select></Field>}<div className="chart-grid">{plot(ranks,'chart_rank',`Chart rank · ${current||'no chart'}`,true)}{plot(metrics,'rating','Product rating')}{plot(counts,'reported_count','Product review count')}</div><h3>Install thresholds</h3><p className="muted">Thresholds from product observations; changes do not indicate exact new installs.</p><div className="chips">{metrics.filter(x=>x.install_band_text).map((x,i)=><span className="badge" key={i}>{show(x.install_band_text)} · {date(x.observed_at)}</span>)}</div>{metrics.filter(x=>x.install_floor!=null).length>1&&new Set(metrics.map(x=>x.install_floor).filter(x=>x!=null)).size>1&&<ResponsiveContainer width="100%" height={180}><LineChart data={metrics.filter(x=>x.install_floor!=null)}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="observed_at" tickFormatter={x=>new Date(x).toLocaleDateString()}/><YAxis/><Tooltip labelFormatter={date}/><Line type="stepAfter" dataKey="install_floor" stroke="#20a278"/></LineChart></ResponsiveContainer>}</>;
}
function ReviewRow({review,id,locale,onSaved}) {
  const [draft,setDraft]=useState(review.review_note || ''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const dirty=draft !== (review.review_note || '');
  useEffect(()=>{if (!dirty) setDraft(review.review_note || '');},[review.review_note]);
  async function save(changes) {
    setBusy(true);setError('');
    try {
      const updated=await patch(`/apps/${encodeURIComponent(id)}/reviews/${encodeURIComponent(review.review_id)}/mark`,{...locale,marked:!!review.marked_at,...changes});
      onSaved(updated);
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  }
  return <article><strong>{show(review.stars)}★</strong> <small>{show(review.review_date)} · {show(review.likes)} likes</small><p>{show(review.body)}</p><div className="review-actions"><button type="button" disabled={busy} aria-label={`${review.marked_at?'Unmark':'Mark'} review ${review.review_id}`} onClick={()=>save({marked:!review.marked_at})}>{review.marked_at?'Unmark':'Mark'}</button><label className="review-note">Note for review {review.review_id}<textarea maxLength={5000} value={draft} onChange={e=>setDraft(e.target.value)}/></label><button type="button" className="primary" disabled={busy || !dirty} onClick={()=>save({note:draft})}>Save note</button>{dirty&&<small>Unsaved note</small>}{busy&&<small role="status">Saving…</small>}</div>{error&&<p className="error" role="alert">{error}</p>}</article>;
}
function ReviewPagination({data,pageSize,onPage,onPageSize}) {
  if (!data) return null;
  const total=data.total, last=Math.max(1,Math.ceil(total/pageSize));
  const start=total ? (data.page-1)*pageSize+1 : 0, end=Math.min(data.page*pageSize,total);
  return <div className="controls" aria-label="Review display pages"><Field label="Reviews per page"><select value={pageSize} onChange={e=>onPageSize(Number(e.target.value))}>{[25,50,100,200].map(n=><option key={n} value={n}>{n}</option>)}</select></Field><span role="status">{total ? `${start}–${end} of ${total}` : '0 reviews'}</span><button type="button" disabled={data.page<=1} onClick={()=>onPage(data.page-1)}>Previous</button><span>Page {data.page} of {last}</span><button type="button" disabled={data.page>=last} onClick={()=>onPage(data.page+1)}>Next</button></div>;
}
function MarkedReviews({id,locale,active,revision,onAnnotation}) {
  const [data,setData]=useState(null),[page,setPage]=useState(1),[pageSize,setPageSize]=useState(100),task=useAsync();
  useEffect(()=>{if(!active)return;let cancelled=false;task.run(async()=>{const result=await api(`/apps/${encodeURIComponent(id)}/reviews/marked`+qs({...locale,page,pageSize}));if(cancelled)return;const last=Math.max(1,Math.ceil(result.total/pageSize));if(page>last){setPage(last);return;}setData(result);});return()=>{cancelled=true;};},[id,locale.country,locale.language,active,revision,page,pageSize]);
  return <section className="panel"><h2>Marked reviews</h2><State {...task}/>{data?.total===0&&<p className="empty">No marked reviews for this app and locale yet.</p>}<ReviewPagination data={data} pageSize={pageSize} onPage={next=>{setData(null);setPage(next);}} onPageSize={size=>{setData(null);setPageSize(size);setPage(1);}}/><div className="reviews">{data?.reviews.map(r=><ReviewRow key={r.review_id} review={r} id={id} locale={locale} onSaved={updated=>{if(!updated.marked_at){if(data.reviews.length===1&&page>1){setData(null);setPage(page-1);}else setData(current=>current&&({...current,total:current.total-1,reviews:current.reviews.filter(x=>x.review_id!==updated.review_id)}));}else setData(current=>current&&({...current,reviews:current.reviews.map(x=>x.review_id===updated.review_id?updated:x)}));onAnnotation();}}/>)}</div></section>;
}
function ReviewMiner({id,locale,distribution,onAnnotation}) {
  const [rating,setRating]=useState('1'),[sort,setSort]=useState('1'),[pages,setPages]=useState(1);
  const [filter,setFilter]=useState(''),[localSort,setLocalSort]=useState('newest');
  const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(100),[reload,setReload]=useState(0);
  const [data,setData]=useState(null),[forceLive,setForceLive]=useState(false),[exportScope,setExportScope]=useState('all');
  const task=useAsync(),exportTask=useAsync();
  const path=`/apps/${encodeURIComponent(id)}/reviews`;
  useEffect(()=>{let cancelled=false;task.run(async()=>{
    const result=await api(path+qs({...locale,stars:filter,sort:localSort,page,pageSize}));
    if(cancelled)return;
    const last=Math.max(1,Math.ceil(result.total/pageSize));
    if(page>last){setPage(last);return;}
    setData(result);
  });return()=>{cancelled=true;};},[id,locale.country,locale.language,filter,localSort,page,pageSize,reload]);
  const params={...locale,packageId:id,rating:rating||null,sort:Number(sort),pages:Number(pages),forceLive};
  return <section className="panel">
    <h2>Review Miner</h2>
    <p>Fetch a bounded sample. Saved reviews and filters use local data.</p>
    <div className="controls">
      <Field label="Source rating"><select value={rating} onChange={e=>setRating(e.target.value)}><option value="">All</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x} star</option>)}</select></Field>
      <Field label="Source sort"><select value={sort} onChange={e=>setSort(e.target.value)}><option value="1">Most relevant</option><option value="2">Newest</option><option value="3">Rating</option></select></Field>
      <Field label="Source pages"><select value={pages} onChange={e=>setPages(e.target.value)}>{[1,2,3].map(x=><option key={x}>{x}</option>)}</select></Field>
      <label className="check"><input type="checkbox" checked={forceLive} onChange={e=>setForceLive(e.target.checked)}/> Force live</label>
      <PreviewButton key={JSON.stringify(params)} operation="review" params={params} text="Fetch reviews" onFetch={()=>task.run(async()=>{await post(path,params);setReload(x=>x+1);})}/>
    </div>
    <State {...task}/>
    {data&&<>
      <div className="stats"><strong>{data.storedCount} distinct saved reviews</strong><span>{data.coverage.length} fetched source pages</span></div>
      <p className="muted">Saved sample distribution: {data.sampleDistribution.map(x=>`${x.stars}★ ${x.count}`).join(' · ')||'No reviews yet'}. Product rating distribution: {distribution?'available separately in detail':'Unknown'}.</p>
      <div className="chips">{data.coverage.slice(0,8).map((x,i)=><span key={i} className="badge">{x.rating_filter?`${x.rating_filter}★`:'all ratings'} · sort {x.source_sort} · {x.result_count} results · {date(x.fetched_at)}</span>)}</div>
      <div className="controls">
        <Field label="Filter saved stars"><select value={filter} onChange={e=>{setData(null);setFilter(e.target.value);setPage(1);}}><option value="">All</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x} star</option>)}</select></Field>
        <Field label="Sort saved reviews"><select value={localSort} onChange={e=>{setData(null);setLocalSort(e.target.value);setPage(1);}}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="helpful">Helpful</option></select></Field>
      </div>
      <div className="controls">
        <Field label="Export scope"><select value={exportScope} onChange={e=>setExportScope(e.target.value)}><option value="all">All saved reviews</option><option value="current">Current filter</option></select></Field>
        <button type="button" disabled={exportTask.busy} onClick={()=>exportTask.run(async()=>{const query={...locale,scope:exportScope,...(exportScope==='current'?{stars:filter,sort:localSort}:{})};await download(path+'/export'+qs(query),`reviews-${id}-${locale.country}-${locale.language}-${exportScope}.csv`);})}>Download CSV</button><State {...exportTask}/>
      </div>
      {data.total===0&&<p className="empty">No saved reviews match this filter.</p>}
      <ReviewPagination data={data} pageSize={pageSize} onPage={next=>{setData(null);setPage(next);}} onPageSize={size=>{setData(null);setPageSize(size);setPage(1);}}/>
      <div className="reviews">{data.reviews.map(r=><ReviewRow key={r.review_id} review={r} id={id} locale={locale} onSaved={updated=>{setData(current=>({...current,reviews:current.reviews.map(x=>x.review_id===updated.review_id?updated:x)}));onAnnotation();}}/>)}</div>
    </>}
  </section>;
}
function Detail({id,locale,back}) {
  const [data,setData]=useState(null),[notes,setNotes]=useState({}),[refresh,setRefresh]=useState(false),[forceLive,setForceLive]=useState(false),[tab,setTab]=useState('overview'),[revision,setRevision]=useState(0),task=useAsync();
  const path=`/apps/${encodeURIComponent(id)}`;
  function load(){task.run(async()=>{const result=await api(path+qs(locale));setData(result);setNotes(result.app);});}
  useEffect(load,[id,locale.country,locale.language]);
  function save(body){task.run(async()=>{const app=await patch(path+'/shortlist',body);setData({...data,app});setNotes(app);});}
  const d=data?.detail,l=data?.listing,app=data?.app;
  return <section><button onClick={back}>← Back</button><div className="section-head"><h1>{show(d?.title||l?.title||id)}</h1><button className="primary" onClick={()=>save({starred:!app.shortlisted_at})}>{app?.shortlisted_at?'★ Shortlisted':'☆ Shortlist'}</button></div><p>{id} · {locale.country}/{locale.language}</p><State {...task}/>{data&&<><div className="app-tabs" role="tablist" aria-label="App sections">{[["overview","Overview"],["reviews","Reviews"],["marked","Marked reviews"]].map(([key,label])=><button key={key} type="button" role="tab" id={`tab-${key}`} aria-controls={`panel-${key}`} aria-selected={tab===key} tabIndex={tab===key?0:-1} onKeyDown={e=>{const keys=["overview","reviews","marked"];const i=keys.indexOf(key);const next=e.key==='ArrowRight'?keys[(i+1)%3]:e.key==='ArrowLeft'?keys[(i+2)%3]:e.key==='Home'?keys[0]:e.key==='End'?keys[2]:null;if(next){e.preventDefault();setTab(next);document.getElementById(`tab-${next}`)?.focus();}}} onClick={()=>setTab(key)}>{label}</button>)}</div><div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={tab!=="overview"}><div className="panel"><div className="section-head"><h2>App detail</h2><span className="controls"><label className="check"><input type="checkbox" checked={refresh} onChange={e=>{setRefresh(e.target.checked);if(!e.target.checked)setForceLive(false);}}/> Refresh</label><label className="check"><input type="checkbox" checked={forceLive} disabled={!refresh} onChange={e=>setForceLive(e.target.checked)}/> Force live</label><PreviewButton operation="detail" key={id+JSON.stringify(locale)+String(refresh)+String(forceLive)} params={{...locale,packageId:id,refresh,forceLive}} text="Fetch detail" onFetch={()=>task.run(async()=>{setData(await post(path+'/detail',{...locale,refresh,forceLive}));})}/></span></div><p className="muted">{d?`Product observed ${date(d.source_observed_at)}`:'No product detail saved. Listing values appear below when available.'}</p><div className="facts">{[['Developer',d?.developer||l?.developer],['Category',d?.category||l?.category],['Rating',d?.rating??l?.rating],['Product review count',d?.reported_count??l?.reported_count],['Install threshold',d?.install_band_text||l?.install_band_text],['Purchase price',d?.price_text||l?.price_text],['Ads',d?.ads_flag==null?null:d.ads_flag?'Yes':'No'],['IAP',d?.iap_flag==null?null:d.iap_flag?'Yes':'No'],['IAP range',d?.iap_price_range],['Subscription price',null],['Released',d?.released_on_text],['Content rating',d?.content_rating_text],['Updated',d?.updated_on_text||l?.updated_on_text]].map(([k,v])=><div key={k}><small>{k}</small><strong>{show(v)}</strong></div>)}</div><h3>Description</h3><p className="description">{show(d?.description||l?.description)}</p>{Array.isArray(d?.ratingDistribution)&&<><h3>Product rating distribution</h3><div className="chips">{d.ratingDistribution.map((x,i)=><span key={i} className="badge">{show(x.stars)}★ · {show(x.count)}</span>)}</div></>}{d?.screenshots?.length>0&&<><h3>Screenshots</h3><div className="screenshots">{d.screenshots.map((x,i)=><img key={i} src={x} alt={`App screenshot ${i+1}`}/>)}</div></>}{d?.related?.map((group,i)=><div key={i}><h3>{group.label}</h3><div className="chips">{group.apps.map(x=><span className="badge" key={x.packageId}>{x.title}</span>)}</div></div>)}<ProductMetadata detail={d}/></div><History history={data.history}/><section className="panel"><h2>Research notes</h2>{[['wedge_note','Possible wedge'],['improvement_note','Build better'],['pricing_note','Pricing opportunity'],['complaints_note','Interesting complaints']].map(([key,label])=><Field key={key} label={label}><textarea value={notes[key]||''} onChange={e=>setNotes({...notes,[key]:e.target.value})}/></Field>)}<button className="primary" onClick={()=>save(Object.fromEntries(['wedge_note','improvement_note','pricing_note','complaints_note'].map(k=>[k,notes[k]||''])))}>Save notes</button></section></div><div id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews" hidden={tab!=="reviews"}><ReviewMiner id={id} locale={locale} distribution={d?.ratingDistribution} onAnnotation={()=>setRevision(x=>x+1)}/></div><div id="panel-marked" role="tabpanel" aria-labelledby="tab-marked" hidden={tab!=="marked"}><MarkedReviews id={id} locale={locale} active={tab==="marked"} revision={revision} onAnnotation={()=>setRevision(x=>x+1)}/></div></>}</section>;
}
function Shortlist({locale,open}) {
  const [rows,setRows]=useState([]),task=useAsync();
  function load(){task.run(async()=>setRows(await api('/shortlist'+qs(locale))));}
  useEffect(load,[locale.country,locale.language]);
  return <section><h1>Shortlist</h1><p>Manual candidates with their saved evidence.</p><State {...task}/>{!rows.length&&<p className="empty">No starred apps yet. Star one from a result table or app detail.</p>}<div className="cards">{rows.map(x=><article className="panel" key={x.package_id}><div className="section-head"><h2><button className="app-link" onClick={()=>open(x.package_id)}>{x.detail_title||x.listing_title||x.package_id}</button></h2><button onClick={()=>task.run(async()=>{await patch(`/apps/${encodeURIComponent(x.package_id)}/shortlist`,{starred:false});await load();})}>Unstar</button></div><small>{x.package_id} · starred {date(x.shortlisted_at)}</small><p>Rating {show(x.detail_rating)} · reported count {show(x.detail_count)} · install threshold {show(x.detail_installs)} · price {show(x.detail_price)} · ads {x.ads_flag==null?'Unknown':x.ads_flag?'Yes':'No'} · IAP {x.iap_flag==null?'Unknown':x.iap_flag?'Yes':'No'}</p><p className="muted">Listing observed {date(x.listing_observed_at)} · detail observed {date(x.detail_observed_at)} · saved reviews {x.review_count}</p><p><strong>Wedge:</strong> {show(x.wedge_note)}<br/><strong>Improve:</strong> {show(x.improvement_note)}<br/><strong>Pricing:</strong> {show(x.pricing_note)}<br/><strong>Complaints:</strong> {show(x.complaints_note)}</p></article>)}</div></section>;
}
function Dashboard({navigate,open}) {
  const [data,setData]=useState(null),task=useAsync();
  useEffect(()=>{task.run(async()=>setData(await api('/dashboard')));},[]);
  return <section><h1>Research dashboard</h1><p>Resume from local evidence and check current account status before spending searches.</p><State {...task}/>{data&&<><div className="stats">{[['Discovered apps',data.counts.apps],['Enriched apps',data.counts.enriched],['Saved reviews',data.counts.reviews],['Category scans',data.counts.categoryScans],['Shortlisted',data.counts.shortlisted]].map(([k,v])=><div key={k}><strong>{v}</strong><small>{k}</small></div>)}</div><div className="panel"><div className="section-head"><h2>SerpApi quota</h2><button onClick={()=>task.run(async()=>setData({...data,usage:await api('/usage?refresh=true')}))}>Refresh status</button></div><p>{data.usage.status==='unavailable'?'Account status unavailable':`${show(data.usage.plan_searches_left)} remaining · ${show(data.usage.this_month_usage)} used of ${show(data.usage.searches_per_month)} monthly`}</p><small>Status {data.usage.status} · checked {date(data.usage.fetched_at)} · renewal {show(data.usage.plan_renewal_date)}</small></div><div className="columns"><div className="panel"><h2>Recent fetch activity</h2>{data.activity.length?data.activity.map((x,i)=><p key={i}><strong>{x.operation}</strong> · {x.outcome} · {x.possible_cost} possible search{ x.possible_cost===1?'':'es'} <small>{date(x.created_at)}</small></p>):<p className="empty">No fetch activity yet.</p>}</div><div className="panel"><h2>Recent candidates</h2>{data.shortlist.length?data.shortlist.map(x=><p key={x.package_id}><button className="app-link" onClick={()=>open(x.package_id)}>{x.package_id}</button><small>{show(x.wedge_note)}</small></p>):<p className="empty">No candidates starred yet.</p>}</div></div><div className="controls"><button className="primary" onClick={()=>navigate('apps')}>Browse Apps</button><button onClick={()=>navigate('games')}>Browse Games</button></div></>}</section>;
}
function App(){const [page,setPage]=useState('dashboard'),[selected,setSelected]=useState(null),[returnPage,setReturnPage]=useState('apps'),[locale,setLocale]=useState(defaultLocale);const open=id=>{setSelected(id);setReturnPage(page);setPage('detail');};return <><header><div className="brand">◈ Play Store Miner</div><nav>{[['dashboard','Dashboard'],['apps','Apps'],['games','Games'],['shortlist','Shortlist']].map(([key,label])=><button key={key} className={page===key?'active':''} onClick={()=>setPage(key)}>{label}</button>)}</nav><div className="locale"><input aria-label="Country" maxLength="2" value={locale.country} onChange={e=>setLocale({...locale,country:e.target.value.toUpperCase()})}/><span>/</span><input aria-label="Language" maxLength="2" value={locale.language} onChange={e=>setLocale({...locale,language:e.target.value.toLowerCase()})}/></div></header><main><div hidden={page!=='apps'}><Discovery source="apps" locale={locale} open={open}/></div><div hidden={page!=='games'}><Discovery source="games" locale={locale} open={open}/></div>{page==='dashboard'&&<Dashboard navigate={setPage} open={open}/ >}{page==='detail'&&<Detail key={`${selected}-${locale.country}-${locale.language}`} id={selected} locale={locale} back={()=>setPage(returnPage)}/ >}{page==='shortlist'&&<Shortlist locale={locale} open={open}/>}</main></>}
createRoot(document.getElementById('root')).render(<App/>);
