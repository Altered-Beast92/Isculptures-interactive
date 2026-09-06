'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '../../lib/analytics';
import BrandLogo from './brand-logo';
export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    try {
      if (!sessionStorage.getItem('isculptures-attribution') || query.has('utm_source')) {
        const referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
        sessionStorage.setItem('isculptures-attribution', JSON.stringify({ referrerHost, campaign: { source: query.get('utm_source') || '', medium: query.get('utm_medium') || '', campaign: query.get('utm_campaign') || '' } }));
      }
    } catch { /* Attribution is optional when browser storage is unavailable. */ }
    const contactClick = (event: MouseEvent) => { const link = event.target instanceof Element ? event.target.closest('a') : null; const href = link?.getAttribute('href') || ''; if (/^(mailto:|tel:)/.test(href)) track('contact_click', href.startsWith('tel:') ? 'phone' : 'email'); };
    document.addEventListener('click', contactClick);
    return () => document.removeEventListener('click', contactClick);
  }, []);
  useEffect(() => {
    const legacy = () => { if (window.location.hash === '#project') window.location.replace('/enquiry' + window.location.search); };
    legacy(); window.addEventListener('hashchange', legacy);
    return () => window.removeEventListener('hashchange', legacy);
  }, []);
  return <header className="site-header"><nav aria-label="Main navigation" onKeyDown={event => { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); } }}>
    <BrandLogo/>
    <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="site-links" onClick={() => setOpen(!open)}>{open ? 'Close menu' : 'Menu'}</button>
    <div className={'site-links' + (open ? ' is-open' : '')} id="site-links">
      <a href="/pages/wholesale" aria-current={pathname === '/pages/wholesale' ? 'page' : undefined}>Bulk &amp; trade</a>
      <a href="/pages/bonbonniere-custom" aria-current={pathname === '/pages/bonbonniere-custom' || pathname === '/pages/events-custom-gifts' ? 'page' : undefined}>Events &amp; keepsakes</a>
      <a href="/pages/industrial" aria-current={pathname === '/pages/industrial' ? 'page' : undefined}>Parts &amp; prototypes</a>
      <a href="/pages/ongoing-supply" aria-current={pathname === '/pages/ongoing-supply' ? 'page' : undefined}>Ongoing supply</a>
      <a href="/work" aria-current={pathname.startsWith('/work') ? 'page' : undefined}>Our work</a><a href="/guides" aria-current={pathname.startsWith('/guides') ? 'page' : undefined}>Guides</a>
      <a href="/enquiry" className="nav-cta">Request a quote ↗</a>
    </div>
  </nav></header>;
}
