import GuideGrid from '../components/guide-grid';
import { guides } from '../../content/guides';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Guides to bulk 3D printing & custom orders', 'Practical guides to planning bulk 3D printing, event favours, custom gift packaging and repeat production orders with Impeccable Sculptures.', '/guides');
export default function GuidesPage() {
  return <main id="main-content" className="document-page guides-index"><p className="section-tag">PLANNING & PRACTICAL ADVICE</p><h1>A better brief.<br/><i>A clearer quote.</i></h1><p className="document-lede">Useful starting points for your first batch, an upcoming event or a repeat order.</p><GuideGrid items={guides}/><div className="guide-enquiry"><h2>Already have a project in mind?</h2><p>Send the idea, quantity and delivery requirements. We’ll review the details with you.</p><a href="/enquiry" className="primary">Request a bulk quote ↗</a></div></main>;
}

