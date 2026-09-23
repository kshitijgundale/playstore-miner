import React from 'react';
import { show } from '../api.js';

function Link({ href, children }) {
  return href ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <>{show(children)}</>;
}
export default function ProductMetadata({ detail }) {
  if (!detail) return null;
  const m = detail.productMetadata;
  if (!m) return <p className="muted">This detail was saved before the additional product fields were recorded. Use Refresh to retrieve them.</p>;
  const contact = m.developerContact || {};
  return <div className="product-more">
    {m.whatsNew && <section><h3>What’s new</h3><p className="description">{m.whatsNew}</p></section>}
    {(m.editorsChoice === true || m.categories?.length > 0 || m.badges?.length > 0 || m.extensions?.length > 0 || m.offers?.length > 0) && <section><h3>Store labels</h3><div className="chips">{[
      ...(m.editorsChoice === true ? ["Editor's Choice"] : []),
      ...(m.categories || []).map(x=>`Category: ${x}`),
      ...(m.badges || []).map(x=>`Badge: ${x}`),
      ...(m.extensions || []),
      ...(m.offers || []).map(x=>`Offer: ${x}`)
    ].map((x,i)=><span className="badge" key={i}>{x}</span>)}</div></section>}
    {(m.offeredBy || m.interactiveElements) && <section><h3>Publisher and interaction</h3><div className="facts">{m.offeredBy && <div><small>Offered by</small><strong>{m.offeredBy}</strong></div>}{m.interactiveElements && <div><small>Interactive elements</small><strong>{m.interactiveElements}</strong></div>}</div></section>}
    {m.video?.link && <section><h3>App video</h3><p><Link href={m.video.link}>Watch the store video</Link></p></section>}
    {Object.values(contact).some(Boolean) && <section><h3>Developer contact</h3><div className="facts">{contact.name && <div><small>Name</small><strong>{contact.name}</strong></div>}{contact.website && <div><small>Website</small><strong><Link href={contact.website}>{contact.website}</Link></strong></div>}{contact.supportEmail && <div><small>Support email</small><strong><a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a></strong></div>}{contact.privacyPolicy && <div><small>Privacy policy</small><strong><Link href={contact.privacyPolicy}>View policy</Link></strong></div>}{contact.phoneNumber && <div><small>Phone</small><strong>{contact.phoneNumber}</strong></div>}{contact.address && <div><small>Address</small><strong>{contact.address}</strong></div>}</div></section>}
    {m.dataSafety?.length > 0 && <details><summary>Data safety ({m.dataSafety.length})</summary><ul>{m.dataSafety.map((x,i)=><li key={i}>{x.text}{x.subtext ? ` — ${x.subtext}` : ''}</li>)}</ul></details>}
    {m.permissions?.length > 0 && <details><summary>Permissions ({m.permissions.length} groups)</summary>{m.permissions.map((x,i)=><div key={i}><h4>{x.type}</h4><ul>{x.details.map((y,j)=><li key={j}>{y}</li>)}</ul></div>)}</details>}
    {m.featuredReviews?.length > 0 && <details><summary>Featured reviews in product response ({m.featuredReviews.length})</summary><p className="muted">These are part of the product detail response. They are separate from the saved Review Miner sample.</p>{m.featuredReviews.map((x,i)=><article className="featured-review" key={i}><strong>{show(x.rating)}★</strong> <small>{show(x.date)} · {show(x.likes)} likes</small><p>{show(x.body)}</p></article>)}</details>}
  </div>;
}
