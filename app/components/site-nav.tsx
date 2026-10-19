'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '../../lib/analytics';
import BrandLogo from './brand-logo';
import { etsyShopLink } from '../../lib/site';
// Five service pages fold into two short lists, so the whole menu fits on a laptop
// screen instead of collapsing to a button below 1400px.
const groups = [
  { id: 'bulk', label: 'Bulk & trade', links: [
    ['Wholesale & bulk orders', 'Batches for shops and businesses', '/pages/wholesale'],
    ['Repeat orders & ongoing supply', 'Reorders and yearly supply', '/pages/ongoing-supply'],
    ['Parts & prototypes', 'Send an STL, OBJ or 3MF', '/pages/industrial'],
  ] },
  { id: 'events', label: 'Events', links: [
    ['Corporate gifts & event favours', 'For businesses and events', '/pages/events-custom-gifts'],
    ['Bonbonniere & keepsakes', 'Weddings, christenings and baptisms', '/pages/bonbonniere-custom'],
  ] },
] as const;
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const links = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); setOpenGroup(null); }, [pathname]);
  useEffect(() => {
    if (!openGroup) return;
    const outside = (event: PointerEvent) => { if (!(event.target instanceof Node && links.current?.contains(event.target))) setOpenGroup(null); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [openGroup]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    try {
      if (!sessionStorage.getItem('isculptures-attribution') || query.has('utm_source')) {
        const referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
        sessionStorage.setItem('isculptures-attribution', JSON.stringify({ referrerHost, campaign: { source: query.get('utm_source') || '', medium: query.get('utm_medium') || '', campaign: query.get('utm_campaign') || '' } }));
      }
    } catch { /* Attribution is optional when browser storage is unavailable. */ }
    // Delegated from the document so static product pages stay server-rendered: a click
    // handler on every buy button would make each of them a client component.
    const outboundClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      const href = link?.getAttribute('href') || '';
      if (/^(mailto:|tel:)/.test(href)) return track('contact_click', href.startsWith('tel:') ? 'phone' : 'email');
      // Which product page sent the click matters more than the click itself, so the
      // slug is read back off the campaign tag the link already carries.
      if (/^https:\/\/www\.etsy\.com\/au\/listing\//.test(href)) {
        const slug = new URLSearchParams(href.split('?')[1] || '').get('utm_content') || 'unknown';
        track('etsy_click', slug);
      }
      // Shop-front links are counted by where they sit: header, footer or home.
      if (/^https:\/\/www\.etsy\.com\/au\/shop\//.test(href)) {
        track('etsy_click', 'shop-' + (new URLSearchParams(href.split('?')[1] || '').get('utm_campaign') || 'unknown'));
      }
    };
    document.addEventListener('click', outboundClick);
    return () => document.removeEventListener('click', outboundClick);
  }, []);
  useEffect(() => {
    const legacy = () => { if (window.location.hash === '#project') window.location.replace('/enquiry' + window.location.search); };
    legacy(); window.addEventListener('hashchange', legacy);
    return () => window.removeEventListener('hashchange', legacy);
  }, []);
  const closeGroup = (id: string) => { setOpenGroup(null); document.getElementById('nav-toggle-' + id)?.focus(); };
  return <header className="site-header"><nav aria-label="Main navigation" onKeyDown={event => {
    if (event.key !== 'Escape') return;
    if (openGroup) closeGroup(openGroup);
    else if (open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <BrandLogo/>
    <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="site-links" onClick={() => setOpen(!open)}>{open ? 'Close menu' : 'Menu'}</button>
    <div ref={links} className={'site-links' + (open ? ' is-open' : '')} id="site-links">
      {/* On a laptop each group is a button that opens a short list. In the phone menu the
          button is hidden and the list shows under a plain label instead. */}
      {groups.map(group => {
        const current = group.links.some(([, , href]) => pathname === href);
        return <div className="nav-group" key={group.id}>
          <button type="button" id={'nav-toggle-' + group.id} className="nav-group-toggle" aria-expanded={openGroup === group.id} aria-controls={'nav-group-' + group.id} data-current={current || undefined} onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}>{group.label} <span aria-hidden="true">▾</span></button>
          <div className={'nav-group-panel' + (openGroup === group.id ? ' is-open' : '')} id={'nav-group-' + group.id}>
            <p className="nav-group-label">{group.label}</p>
            {group.links.map(([label, note, href]) => <a key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}<small>{note}</small></a>)}
          </div>
        </div>;
      })}
      <a href="/products" aria-current={pathname.startsWith('/products') ? 'page' : undefined}>Statues &amp; icons</a>
      <a href={etsyShopLink('header')} target="_blank" rel="noopener">Shop<span className="visually-hidden"> on Etsy (opens in a new tab)</span> <span aria-hidden="true">↗</span></a>
      <a href="/work" aria-current={pathname.startsWith('/work') ? 'page' : undefined}>Our work</a><a href="/guides" aria-current={pathname.startsWith('/guides') ? 'page' : undefined}>Blog</a>
      <a href="/enquiry" className="nav-cta">Get a quote ↗</a>
    </div>
  </nav></header>;
}
