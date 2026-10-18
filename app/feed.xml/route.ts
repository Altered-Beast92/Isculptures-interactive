import { guidesByUpdated, guidePublished, guideUpdated } from '../../lib/guides';
import { CONTACT, SITE_URL } from '../../lib/site';
// A route handler becomes a static file under output: 'export' only when marked force-static.
export const dynamic = 'force-static';
const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const rfc822 = (iso: string) => new Date(iso + 'T00:00:00Z').toUTCString();
export function GET() {
  const sorted = guidesByUpdated();
  const items = sorted.map(guide => {
    const url = `${SITE_URL}/guides/${guide.slug}`;
    return `    <item>
      <title>${escapeXml(guide.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(guidePublished(guide))}</pubDate>
      <category>${escapeXml(guide.category)}</category>
      <description>${escapeXml(guide.summary)}</description>
    </item>`;
  }).join('\n');
  // lastBuildDate comes from the newest guide, not the clock, so a rebuild with no content change leaves the file identical.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(CONTACT.name)} guides</title>
    <link>${SITE_URL}/guides</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Guides to ordering bulk 3D printing, custom favours and religious keepsakes from a Sydney studio.</description>
    <language>en-AU</language>
    <lastBuildDate>${rfc822(sorted.length ? guideUpdated(sorted[0]) : '2026-09-11')}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
