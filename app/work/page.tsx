import WorkGrid from '../components/work-grid';
import { projects } from '../../content/projects';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Selected work — custom favours & gifts', 'Explore iSculptures event favours, personalised keepsakes, commemorative icons and custom gift boxes. Enquire about bulk orders from 10 units.', '/work');
export default function WorkPage() {
  return <main id="main-content" className="document-page portfolio-page"><p className="section-tag">FROM THE STUDIO</p><h1>Details made<br/>to be shared.</h1><p className="document-lede">A selection of our sculptural keepsakes, event favours and personalised gifts. Bring an example you like to your next enquiry.</p><WorkGrid items={projects}/><div className="portfolio-actions"><a className="primary" href="/enquiry">Plan your own batch ↗</a><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">Latest work on Instagram ↗</a></div></main>;
}
