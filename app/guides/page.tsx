import GuideGrid from '../components/guide-grid';
import Breadcrumbs from '../components/breadcrumbs';
import { guides } from '../../content/guides';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Guides to ordering bulk 3D printing', 'How to plan a bulk 3D printing order: what to include in a quote, what affects cost, and ordering favours for weddings, christenings and baby showers.', '/guides');
export default function GuidesPage() {
  return <main id="main-content" className="document-page guides-index"><Breadcrumbs items={[{ name: 'Guides', path: '/guides' }]}/><header className="page-intro"><p className="section-tag">GUIDES</p><h1>Guides to planning <br/><i>your order.</i></h1><p className="document-lede">Help with quotes, pricing, event favours and repeat orders, written by our studio.</p></header><GuideGrid items={guides}/><div className="guide-enquiry"><h2>Ready to get a quote?</h2><p>Send us your idea, how many you need and when. We’ll take it from there.</p><a href="/enquiry" className="primary">Get a quote ↗</a></div></main>;
}

