import PrinterBackdrop from './components/printer-backdrop';
import MockupNote from './components/mockup-note';
import { guides } from '../content/guides';
import { featuredTestimonials } from '../content/testimonials';
import { reviewedBusiness, aggregateRating } from '../lib/reviews';
import { SOURCE_LABELS } from '../content/types';
import media from '../content/work-media.json';
import { CONTACT, SITE_URL } from '../lib/site';

const gallery = [
  { key: 'custom-sculptures', slug: 'custom-sculptures-keepsakes', title: 'Gold character sculptures', label: 'CUSTOM SCULPTURES' },
  { key: 'event-favours', slug: 'ribbon-finished-event-favours', title: 'Boxed favours with ribbon', label: 'EVENT FAVOURS' },
  { key: 'yellow-rose-sculptures', slug: 'personalised-rose-sculptures', title: 'Personalised yellow roses', label: 'PERSONALISED KEEPSAKES' },
] as const;
// The guides worth reading before ordering, linked beside the answers they expand on.
const reading = [guides[0], guides[2], guides[3]];
// Rendered into the page and into FAQPage data from one source, so the answer a visitor
// reads and the answer a search or AI engine quotes can never drift apart.
const faqs = [
  { q: 'What’s the minimum order?', a: '10 units. The price per piece depends on the size, finish and how much design work is involved. For a single piece, have a look at our Etsy shop.' },
  { q: 'Can you meet an event deadline?', a: 'Tell us the date you need everything in hand. We’ll check it against design approval, printing and shipping before you commit.' },
  { q: 'Can I reorder the same design?', a: 'Yes. Let us know roughly how many you’d need per batch and per year so we can plan for it.' },
  { q: 'Do I need a 3D file?', a: 'No. A description, rough measurements and a few reference photos are enough to get started.' },
  { q: 'Can I see the design before I order?', a: 'Yes. Send us your idea and we’ll put together a free design mockup with your quote. You don’t have to go ahead with the order.' },
  { q: 'Do you deliver across Australia?', a: 'Yes. Freight is quoted based on your order and where it’s going.' },
];
function Chapter({ number, label }: { number: string; label: string }) { return <div className="chapter-marker"><span>{number}</span><span>{label}</span></div>; }

export default function Home() {
  const reviews = featuredTestimonials();
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', '@id': SITE_URL + '/#faq', mainEntity: faqs.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) };
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL + '/', name: CONTACT.name, alternateName: 'iSculptures', inLanguage: 'en-AU', publisher: { '@id': SITE_URL + '/#organisation' } };
  // Headings keep a space before each <br/> so crawlers don't read the lines as one word.
  return <main id="main-content" className="cinematic-home sculpture-story">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([website, faqSchema, reviewedBusiness(reviews)]).replace(/</g, '\\u003c') }}/>
    <PrinterBackdrop/>
    <section className="hero cinema-hero" id="top">
      <div className="eyebrow">CUSTOM &amp; BULK 3D PRINTING / SYDNEY STUDIO</div>
      <h1 className="business-heading">Custom 3D printing <br/><i>in Sydney.</i></h1>
      <div className="hero-brief"><p className="hero-service">Personalised favours, keepsakes and gifts.</p><p>Made for businesses, parishes and families, and delivered anywhere in Australia.</p><div className="actions"><a className="primary" href="/enquiry">Get a quote <span>↗</span></a><a className="secondary" href="#work">See our work ↓</a></div><MockupNote/></div>
      <div className="cinema-caption"><span>A PRINT IN PROGRESS</span><span>SCROLL TO WATCH ↓</span></div>
    </section>
    <section className="story-stage block-glass" id="b2b"><Chapter number="01" label="BULK & TRADE"/><div className="story-columns"><div><h2>Bulk 3D printing, <br/><em>made to order.</em></h2><p className="heading-note">Shops, event planners, parishes and businesses order from us in batches. Every piece can share one design, or carry its own name or message.</p></div><article className="supply-ledger"><div><span>01</span><h3>One-off batches</h3><p>A single run for your shop, your clients or your event.</p></div><div><span>02</span><h3>Repeat production</h3><p>Reorder the same design, or change the wording and colours.</p></div><div><span>03</span><h3>Ongoing supply</h3><p>Send us your yearly quantities, delivery schedule and any supplier paperwork.</p></div><a className="studio-button" href="/enquiry?route=supply">Ask about a bulk order <span>↗</span></a></article></div></section>
    <section className="floating-work block-solid" id="work"><Chapter number="02" label="OUR WORK"/><div className="story-section-heading"><h2>Some of our <br/><em>3D printed work.</em></h2><a className="studio-text-link" href="/work">See all our work ↗</a></div><div className="studio-gallery">{gallery.map(item => { const photo = media[item.key]; return <a key={item.key} className={'studio-project project-' + item.key} href={'/work/' + item.slug}><img src={photo.src} srcSet={`${photo.src.replace('.webp', '-small.webp')} ${photo.smallWidth}w, ${photo.src} ${photo.width}w`} sizes="(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 52vw" alt={photo.alt} width={photo.width} height={photo.height} loading="lazy"/><div className="project-caption"><span>{item.label}</span><h3>{item.title}</h3><b aria-hidden="true">↗</b></div></a>; })}</div><p className="studio-social"><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">More of our work on Instagram ↗</a></p></section>
    {/* The events chapter drops the two-column rhythm for a full-width band, so the work
        most visitors arrive for is the one block that doesn't look like the others. */}
    <section className="story-stage feature-band block-glass" id="events"><Chapter number="03" label="EVENTS & KEEPSAKES"/><div className="feature-head"><h2>Personalised event favours <br/><em>and keepsakes.</em></h2><p><a href="/pages/bonbonniere-custom">Bonbonniere and religious keepsakes</a> for weddings, christenings and baptisms. <a href="/pages/events-custom-gifts">Corporate gifts and event favours</a> for business.</p></div><dl className="feature-notes"><div><dt>Personalisation</dt><dd>Names, dates, wording and colours.</dd></div><div><dt>Packaging</dt><dd>Boxes, ribbon and tags.</dd></div><div><dt>Timing</dt><dd>Planned around your event date.</dd></div></dl><a className="studio-button feature-action" href="/enquiry?route=bulk">Enquire about event favours <span>↗</span></a></section>
    <section className="story-stage block-solid" id="printing"><Chapter number="04" label="PARTS & 3D FILES"/><div className="story-columns"><h2>Have a 3D file? <br/><em>We can print it.</em></h2><article className="chapter-copy"><div className="file-formats" aria-label="3D model formats">.STL <span>/</span> .OBJ <span>/</span> .3MF</div><p>Parts, prototypes, jigs and custom objects. Send us the model with its dimensions and what it’s for, and we’ll work out the best way to print it.</p><a className="studio-button" href="/enquiry?route=file">Send us your file <span>↗</span></a><a className="studio-text-link" href="/enquiry?route=design">No file yet? Start with your idea ↗</a></article></div></section>
    {/* The free mockup sits at the end of the steps, in the page's one inverted panel,
        because that is the point where a visitor decides whether to enquire. */}
    <section className="floating-process block-glass" id="process"><Chapter number="05" label="HOW IT WORKS"/><h2>How ordering <br/><em>works.</em></h2><ol className="studio-process step-row"><li><span>01</span><h3>Send your brief</h3><p>What it’s for, how many you need and your deadline. You don’t need a finished design.</p></li><li><span>02</span><h3>Get your quote</h3><p>We agree the price and the timing with you before anything is made.</p></li><li><span>03</span><h3>Approve and print</h3><p>Once you’ve approved the design, we start printing.</p></li></ol><aside className="mockup-offer"><span className="mockup-flag">FREE</span><div><h3>A design mockup with your quote</h3><p>Send us your idea and we’ll draw it up alongside the price. No charge, and no obligation to order.</p></div><a className="studio-button" href="/enquiry?route=design">Request a mockup <span>↗</span></a></aside></section>
    <section className="story-stage faq-stage block-solid" id="faq"><Chapter number="06" label="FAQ"/><div className="story-columns"><div><h2>Frequently asked <br/><em>questions.</em></h2><ul className="guide-links">{reading.map(guide => <li key={guide.slug}><a href={'/guides/' + guide.slug}>{guide.title} <span aria-hidden="true">↗</span></a></li>)}<li><a href="/guides">All our guides <span aria-hidden="true">↗</span></a></li></ul></div><div className="faq-list">{faqs.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></div></section>
    <section className="story-stage testimonial-stage block-glass" id="testimonials"><Chapter number="07" label="REVIEWS"/><div className="story-section-heading"><h2>Customer <br/><em>reviews.</em></h2><p><strong>{aggregateRating.ratingValue.toFixed(1)} out of 5</strong> from {aggregateRating.reviewCount} reviews across Google, Etsy and Judge.me.</p></div><div className="testimonial-grid">{reviews.map(review => <figure className="testimonial-card" key={review.id}><div className="testimonial-rating" role="img" aria-label={`${review.rating} out of 5 stars`}><span aria-hidden="true">★★★★★</span></div><blockquote>“{review.quote}”</blockquote><figcaption><strong>{review.author}</strong><span>{review.role}</span><small>{SOURCE_LABELS[review.source]}</small></figcaption></figure>)}</div></section>
  </main>;
}
