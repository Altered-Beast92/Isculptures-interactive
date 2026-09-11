import WorkGrid from '../components/work-grid';
import Breadcrumbs from '../components/breadcrumbs';
import { projects } from '../../content/projects';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Our work: favours, keepsakes & gifts', 'Photos of event favours, personalised keepsakes, religious icons and gift boxes made by Impeccable Sculptures. Bulk orders start at 10 units.', '/work');
export default function WorkPage() {
  return <main id="main-content" className="document-page portfolio-page"><Breadcrumbs items={[{ name: 'Our work', path: '/work' }]}/><header className="page-intro"><p className="section-tag">OUR WORK</p><h1>Our work</h1><p className="document-lede">Keepsakes, event favours and personalised gifts we’ve made for customers. If you like something here, mention it in your enquiry.</p></header><WorkGrid items={projects}/><div className="portfolio-actions"><a className="primary" href="/enquiry">Get a quote ↗</a><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">More on Instagram ↗</a></div></main>;
}
