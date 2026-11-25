import EnquiryForm from '../components/enquiry-form';
import { pageMetadata } from '../../lib/site';
export const metadata = pageMetadata('Get a quote', 'Tell our Sydney studio what you need printed, from event favours and keepsakes to corporate gifts and parts. Bulk orders welcome.', '/enquiry');
// Beside the heading on larger screens; on phones the copy after the form shows instead, so the
// options come first. Only one copy is ever displayed, and each sits where it appears on screen.
const Direct = ({ className }: { className: string }) => <div className={className}><span>Prefer to talk?</span><a href="mailto:info@isculptures.com.au">info@isculptures.com.au ↗</a><a href="tel:+61437383684">0437 383 684</a></div>;
export default function EnquiryPage() {
  return <main id="main-content" className="enquiry-canvas"><div className="enquiry-layout"><div className="enquiry-introduction"><p className="enquiry-kicker">SYDNEY 3D PRINTING STUDIO</p><h1>GET A{' '}<br/><em>QUOTE.</em></h1><p>Tell us what you’d like made. It takes about a minute, and you can attach photos or files if you have them.</p><Direct className="enquiry-direct"/></div><div className="enquiry-workspace"><EnquiryForm/><noscript><p>Please enable JavaScript to use the enquiry form, or email <a href="mailto:info@isculptures.com.au">info@isculptures.com.au</a>.</p></noscript><Direct className="enquiry-direct enquiry-direct-after"/></div></div></main>;
}
