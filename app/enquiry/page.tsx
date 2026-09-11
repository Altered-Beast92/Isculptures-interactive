import EnquiryForm from '../components/enquiry-form';
import MockupNote from '../components/mockup-note';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Get a quote', 'Tell our Sydney studio what you need printed, from event favours and keepsakes to corporate gifts and parts. Bulk orders start at 10 units.', '/enquiry');
export default function EnquiryPage() {
  return <main id="main-content" className="enquiry-canvas"><header className="enquiry-masthead"><span>IMPECCABLE SCULPTURES / GET A QUOTE</span><a href="/">Back to home ↗</a></header><div className="enquiry-layout"><div className="enquiry-introduction"><p className="enquiry-kicker">SYDNEY 3D PRINTING STUDIO</p><h1>GET A{' '}<br/><em>QUOTE.</em></h1><p>Tell us what you’d like made. The form takes a few minutes and you can attach files or photos.</p><MockupNote/><div className="enquiry-direct"><span>Prefer to talk?</span><a href="mailto:info@isculptures.com.au">info@isculptures.com.au ↗</a><a href="tel:+61437383684">0437 383 684</a></div></div><div className="enquiry-workspace"><EnquiryForm/><noscript><p>Please enable JavaScript to use the enquiry form, or email <a href="mailto:info@isculptures.com.au">info@isculptures.com.au</a>.</p></noscript></div></div></main>;
}
