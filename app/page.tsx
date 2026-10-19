import PrinterBackdrop from './components/printer-backdrop';
import GuideGrid from './components/guide-grid';
import MockupNote from './components/mockup-note';
import { featuredTestimonials } from '../content/testimonials';
import { products, getProduct, priceRange, aud } from '../content/products';
import { reviewedBusiness, aggregateRating } from '../lib/reviews';
import { guidesByUpdated } from '../lib/guides';
import { SOURCE_LABELS } from '../content/types';
import media from '../content/work-media.json';
import productMedia from '../content/product-media.json';
import { CONTACT, SITE_URL, etsyShopLink } from '../lib/site';

const gallery = [
  { key: 'custom-sculptures', slug: 'custom-sculptures-keepsakes', title: 'Gold character sculptures', label: 'CUSTOM SCULPTURES' },
  { key: 'commemorative-icons', slug: 'commemorative-religious-icons', title: 'Commemorative religious icons', label: 'PERSONALISED ICONS' },
  { key: 'yellow-rose-sculptures', slug: 'personalised-rose-sculptures', title: 'Personalised yellow roses', label: 'PERSONALISED KEEPSAKES' },
] as const;
// The events band shows what a finished order looks like before anyone reads about it.
const eventPhotos = [
  { photo: productMedia['st-gabriel-icon-bonbonniere'][0], href: '/products/st-gabriel-icon-bonbonniere', caption: 'Saint Gabriel bonbonniere, sets of five' },
  { photo: media['personalised-batch'], href: '/work/personalised-boxed-keepsakes', caption: 'Christening favours with name tags' },
  { photo: media['event-display'], href: '/work/ribbon-finished-event-favours', caption: 'Favours set out on the day' },
];
// The five pieces with published reviews, most reviewed first. Each card opens the piece's
// own page, whose Etsy button is tracked, rather than sending the visitor straight to Etsy.
const bestSellers = ['saint-michael-statue', 'jesus-christ-sacred-heart', 'saint-charbel-statue', 'saint-george-the-victorious', 'st-gabriel-icon-bonbonniere'].map(slug => getProduct(slug)!);
// Rendered into the page and into FAQPage data from one source, so the answer a visitor
// reads and the answer a search or AI engine quotes can never drift apart.
const faqs: { q: string; a: string; more?: { href: string; label: string } }[] = [
  { q: 'What’s the minimum order?', a: '10 units. The price per piece depends on the size, finish and how much design work is involved. Single statues and icons are sold through our Etsy shop.', more: { href: '/products', label: 'Browse statues & icons' } },
  { q: 'Can you meet an event deadline?', a: 'Tell us the date you need everything in hand. We’ll check it against design approval, printing and shipping before you commit.' },
  { q: 'Can I reorder the same design?', a: 'Yes. Let us know roughly how many you’d need per batch and per year so we can plan for it.' },
  { q: 'Do I need a 3D file?', a: 'No. A description, rough measurements and a few reference photos are enough to get started.' },
  { q: 'Can I see the design before I order?', a: 'Yes. Send us your idea and we’ll put together a free design mockup with your quote. You don’t have to go ahead with the order.' },
  { q: 'Do you deliver across Australia?', a: 'Yes. Freight is quoted based on your order and where it’s going.' },
];
const smallSet = (photo: { src: string; width: number; smallWidth: number }) => `${photo.src.replace('.webp', '-small.webp')} ${photo.smallWidth}w, ${photo.src} ${photo.width}w`;
function Chapter({ number, label }: { number: string; label: string }) { return <div className="chapter-marker"><span>{number}</span><span>{label}</span></div>; }

export default function Home() {
  const reviews = featuredTestimonials();
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', '@id': SITE_URL + '/#faq', mainEntity: faqs.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) };
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL + '/', name: CONTACT.name, alternateName: 'iSculptures', inLanguage: 'en-AU', publisher: { '@id': SITE_URL + '/#organisation' } };
  const batchPhoto = media['event-favours'];
  // Headings keep a space before each <br/> so crawlers don't read the lines as one word.
  return <main id="main-content" className="cinematic-home sculpture-story">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([website, faqSchema, reviewedBusiness(reviews)]).replace(/</g, '\\u003c') }}/>
    <PrinterBackdrop/>
    <section className="hero cinema-hero" id="top">
      <div className="eyebrow">CUSTOM &amp; BULK 3D PRINTING / SYDNEY STUDIO</div>
      <h1 className="business-heading">Custom 3D printing <br/><i>in Sydney.</i></h1>
      <div className="hero-brief"><p className="hero-service">Personalised favours, keepsakes and gifts.</p><p>Made for businesses, parishes and families, and delivered anywhere in Australia.</p><div className="actions"><a className="primary" href="/enquiry">Get a quote <span>↗</span></a><a className="secondary" href="/products">Browse statues &amp; icons</a></div><MockupNote/></div>
      <div className="cinema-caption"><span>A PRINT IN PROGRESS</span><span>SCROLL TO WATCH ↓</span></div>
    </section>
    {/* The print finishes as this chapter scrolls past; every block after it is opaque. */}
    <section className="story-stage block-glass" id="b2b" data-print-end><Chapter number="01" label="BULK & TRADE"/><div className="story-columns"><div><h2>Bulk 3D printing, <br/><em>made to order.</em></h2><p className="heading-note">Shops, event planners, parishes and businesses order from us in batches. Every piece can share one design, or carry its own name or message.</p><a className="batch-photo" href="/work/ribbon-finished-event-favours"><img src={batchPhoto.src} srcSet={smallSet(batchPhoto)} sizes="(max-width: 760px) 90vw, 44vw" alt={batchPhoto.alt} width={batchPhoto.width} height={batchPhoto.height} loading="lazy"/><span>One design, one batch, every box tied by hand</span></a></div><article className="supply-ledger ledger-panel"><div><span>01</span><h3>One-off batches</h3><p>A single run for your shop, your clients or your event.</p></div><div><span>02</span><h3>Repeat production</h3><p>Reorder the same design, or change the wording and colours.</p></div><div><span>03</span><h3>Ongoing supply</h3><p>Send us your yearly quantities, delivery schedule and any supplier paperwork.</p></div><a className="studio-button" href="/enquiry?route=supply">Ask about a bulk order <span>↗</span></a></article></div></section>
    {/* The events chapter drops the two-column rhythm for a full-width band, so the work
        most visitors arrive for is the one block that doesn't look like the others. */}
    <section className="story-stage feature-band block-ivory" id="events"><Chapter number="02" label="EVENTS & KEEPSAKES"/><div className="feature-head"><h2>Personalised event favours <br/><em>and keepsakes.</em></h2><p><a href="/pages/events-custom-gifts">Corporate gifts and event favours</a> for business. <a href="/pages/bonbonniere-custom">Bonbonniere and religious keepsakes</a> for weddings, christenings and baptisms.</p></div><div className="event-strip">{eventPhotos.map(item => <a key={item.href} href={item.href}><img src={item.photo.src} srcSet={smallSet(item.photo)} sizes="(max-width: 760px) 45vw, 30vw" alt={item.photo.alt} width={item.photo.width} height={item.photo.height} loading="lazy"/><span>{item.caption}</span></a>)}</div><dl className="feature-notes"><div><dt>Personalisation</dt><dd>Names, dates, wording and colours.</dd></div><div><dt>Packaging</dt><dd>Boxes, ribbon and tags.</dd></div><div><dt>Timing</dt><dd>Planned around your event date.</dd></div></dl><a className="studio-button feature-action" href="/enquiry?route=bulk">Enquire about event favours <span>↗</span></a></section>
    <section className="floating-work block-solid" id="work"><Chapter number="03" label="OUR WORK"/><div className="story-section-heading"><h2>Some of our <br/><em>3D printed work.</em></h2><a className="studio-text-link" href="/work">See all our work ↗</a></div><div className="studio-gallery">{gallery.map(item => { const photo = media[item.key]; return <a key={item.key} className={'studio-project project-' + item.key} href={'/work/' + item.slug}><img src={photo.src} srcSet={smallSet(photo)} sizes="(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 52vw" alt={photo.alt} width={photo.width} height={photo.height} loading="lazy"/><div className="project-caption"><span>{item.label}</span><h3>{item.title}</h3><b aria-hidden="true">↗</b></div></a>; })}</div></section>
    {/* Reviews sit before the ordering steps, where a visitor decides whether to enquire,
        and each one shows the piece it is about. */}
    <section className="story-stage testimonial-stage block-ivory" id="testimonials"><Chapter number="04" label="REVIEWS"/><div className="story-section-heading"><h2>Customer <br/><em>reviews.</em></h2><p><strong>{aggregateRating.ratingValue.toFixed(1)} out of 5</strong> from {aggregateRating.reviewCount} reviews across Google, Etsy and Judge.me.</p></div><div className="testimonial-grid">{reviews.map(review => {
      const product = products.find(item => item.reviews?.includes(review.id));
      const photo = product && productMedia[product.slug as keyof typeof productMedia][0];
      return <figure className="testimonial-card" key={review.id}>
        <div className="testimonial-rating" role="img" aria-label={`${review.rating} out of 5 stars`}><span aria-hidden="true">★★★★★</span></div><blockquote>“{review.quote}”</blockquote><figcaption><strong>{review.author}</strong><span>{review.role}</span><small>{SOURCE_LABELS[review.source]}</small></figcaption>
        {product && photo && <a className="testimonial-piece" href={'/products/' + product.slug}><img src={photo.src.replace('.webp', '-small.webp')} alt="" width={photo.smallWidth} height={Math.round(photo.height * photo.smallWidth / photo.width)} loading="lazy"/><span>{product.title}</span></a>}
      </figure>;
    })}</div></section>
    {/* The free mockup sits at the end of the steps, in the page's one inverted panel,
        because that is the point where a visitor decides whether to enquire. */}
    <section className="floating-process block-dark" id="process"><Chapter number="05" label="HOW IT WORKS"/><h2>How ordering <br/><em>works.</em></h2><ol className="studio-process step-row"><li><span>01</span><h3>Send your brief</h3><p>What it’s for, how many you need and your deadline. You don’t need a finished design.</p></li><li><span>02</span><h3>Get your quote</h3><p>We agree the price and the timing with you before anything is made.</p></li><li><span>03</span><h3>Approve and print</h3><p>Once you’ve approved the design, we start printing.</p></li></ol><aside className="mockup-offer"><span className="mockup-flag">FREE</span><div><h3>A design mockup with your quote</h3><p>Send us your idea and we’ll draw it up alongside the price. No charge, and no obligation to order.</p></div><a className="studio-button" href="/enquiry?route=design">Request a mockup <span>↗</span></a></aside></section>
    <section className="story-stage block-solid" id="printing"><Chapter number="06" label="PARTS & 3D FILES"/><div className="story-columns"><h2>Have a 3D file? <br/><em>We can print it.</em></h2><article className="chapter-copy"><div className="file-formats" aria-label="3D model formats">.STL <span>/</span> .OBJ <span>/</span> .3MF</div><p>Parts, prototypes, jigs and custom objects. Send us the model with its dimensions and what it’s for, and we’ll work out the best way to print it.</p><a className="studio-button" href="/enquiry?route=file">Send us your file <span>↗</span></a></article></div></section>
    <section className="story-stage block-ivory" id="statues"><Chapter number="07" label="STATUES & ICONS"/><div className="story-section-heading"><div><h2>Statues and icons, <br/><em>one at a time.</em></h2><p className="heading-note">Single pieces are sold through <a href={etsyShopLink('home')} target="_blank" rel="noopener">our Etsy shop ↗</a>. Each page below shows the sizes, colours and current prices.</p></div><a className="studio-text-link" href="/products">See all {products.length} pieces ↗</a></div><div className="piece-rail">{bestSellers.map(product => { const photo = productMedia[product.slug as keyof typeof productMedia][0]; const { low } = priceRange(product); return <a key={product.slug} href={'/products/' + product.slug}><img src={photo.src.replace('.webp', '-small.webp')} alt={photo.alt} width={photo.smallWidth} height={Math.round(photo.height * photo.smallWidth / photo.width)} loading="lazy"/><b>{product.title}</b><span>from {aud(low)}{product.soldAsSet ? ' a set' : ''}</span></a>; })}</div></section>
    <section className="story-stage faq-stage block-solid" id="faq"><Chapter number="08" label="FAQ"/><div className="story-columns"><div><h2>Frequently asked <br/><em>questions.</em></h2></div><div className="faq-list">{faqs.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}{item.more && <> <a href={item.more.href}>{item.more.label} →</a></>}</p></details>)}</div></div></section>
    {/* The three newest posts, so each new one gets a homepage link the day it goes live. */}
    <section className="story-stage block-ivory latest-posts" id="blog"><Chapter number="09" label="FROM THE BLOG"/><div className="story-section-heading"><h2>From the <br/><em>blog.</em></h2><a className="studio-text-link" href="/guides">All posts ↗</a></div><GuideGrid items={guidesByUpdated().slice(0, 3)} photos/></section>
  </main>;
}
