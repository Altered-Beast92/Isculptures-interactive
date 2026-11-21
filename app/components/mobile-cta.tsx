'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CONTACT } from '../../lib/site';

/** Phone call bar: Call and Get a quote, fixed to the bottom of the screen once the visitor has
 *  scrolled past the first screen. CSS shows it only below 760px. Not rendered on the quote
 *  page, where the form is the call to action and a fixed bar could cover the field being typed
 *  in. The Call link is counted by the delegated tel: tracking in the site menu. */
export default function MobileCta() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const update = () => setShown(window.scrollY > 320);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [pathname]);
  if (pathname === '/enquiry') return null;
  return <nav className={'mobile-cta' + (shown ? ' is-shown' : '')} aria-label="Call or get a quote">
    <a className="mobile-cta-call" href={'tel:' + CONTACT.tel}>Call {CONTACT.phone}</a>
    <a className="mobile-cta-quote" href="/enquiry">Get a quote <span aria-hidden="true">↗</span></a>
  </nav>;
}
