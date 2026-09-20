'use client';
import { Analytics } from '@vercel/analytics/next';

/** Vercel Analytics injects its own tag once the page hydrates. It records page views
 *  and, on a paid plan, the custom enquiry events fired from lib/analytics.ts.
 *  Microsoft Clarity is not here: it is server-rendered in the layout so that a session
 *  recording starts with the page rather than with hydration. */
export default function SiteAnalytics() {
  return <Analytics/>;
}
