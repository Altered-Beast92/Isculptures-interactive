import EnquiryForm from '../components/enquiry-form';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Request a Bulk Quote | iSculptures', 'Enquire about bulk 3D printing from 10 units, custom event gifts and ongoing business supply. Contact our Sydney studio.', '/enquiry');
export default function EnquiryPage() {
  return <main id="main-content" className="document-page enquiry-page"><p className="section-tag">LET’S PLAN YOUR PROJECT</p><h1>Tell us about<br/>your next batch.</h1><p className="document-lede">Bulk orders start at 10 units. Share what you know; we’ll review the brief and confirm feasibility, price and timing with you.</p><EnquiryForm/><noscript><p>Please enable JavaScript to use the enquiry form, or email <a href="mailto:info@isculptures.com.au">info@isculptures.com.au</a>.</p></noscript></main>;
}
