import PrinterBackdrop from './components/printer-backdrop';
import WorkGrid from './components/work-grid';
import GuideGrid from './components/guide-grid';
import { featuredProjects } from '../content/projects';
import { guides } from '../content/guides';

export default function Home() {
  return <main id="main-content" className="business-home">
    <section className="hero compact-hero" id="top">
      <PrinterBackdrop/>
      <div className="eyebrow">SYDNEY STUDIO · AUSTRALIA-WIDE DELIVERY</div>
      <h1 className="business-heading">Custom 3D printing.<br/><i>Made for bulk.</i></h1>
      <p className="hero-service">Your next occasion. Your next production run.</p>
      <p>Personalised keepsakes, event favours and custom products for businesses, planners and communities. Start with 10 units; discuss repeat supply as you grow.</p>
      <div className="actions"><a className="primary" href="/enquiry">Request a bulk quote <span>↗</span></a><a className="secondary" href="/work">See our work</a></div>
      <a className="hero-supply-link" href="/enquiry?route=supply">Planning repeat orders? Discuss ongoing supply →</a>
    </section>
    <div className="buyer-strip" aria-label="Order essentials"><span><b>10+</b> units for bulk orders</span><span>Custom wording &amp; presentation</span><span>Direct contact with the Sydney studio</span></div>
    <section className="content-section selected-work" id="work"><div className="section-heading"><div><p className="section-tag">FROM THE STUDIO</p><h2>Details made<br/><i>to be shared.</i></h2></div><p>A closer look at our event favours, commemorative pieces and personalised gift boxes.</p></div><WorkGrid items={featuredProjects()}/><div className="portfolio-actions"><a className="secondary" href="/work">Explore selected work ↗</a><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">Latest work on Instagram ↗</a></div></section>
    <section className="content-section home-services" id="b2b"><div className="section-heading"><div><p className="section-tag">BULK &amp; BUSINESS</p><h2>Start with<br/><i>your brief.</i></h2></div><p>Tell us what you need, how many and when. We’ll review the design and production requirements before confirming a quote.</p></div>
      <div className="service-overview">
        <article id="events"><span className="section-tag">01 / OCCASIONS</span><h3>Favours &amp; custom gifts</h3><p>Bonbonniere, religious keepsakes and personalised gifts brought together for an event or community.</p><a href="/pages/bonbonniere-custom">Bonbonniere &amp; keepsakes →</a><a href="/pages/events-custom-gifts">Corporate gifts &amp; events →</a></article>
        <article id="supply"><span className="section-tag">02 / BUSINESS</span><h3>Bulk &amp; repeat supply</h3><p>Ordering for customers, clients or an organisation? Discuss your first batch, packaging and expected repeat demand.</p><a href="/pages/wholesale">Bulk &amp; trade orders →</a><a href="/pages/ongoing-supply">Ongoing supply →</a></article>
        <article id="printing"><span className="section-tag">03 / CUSTOM PARTS</span><h3>Parts &amp; prototypes</h3><p>Send a model, drawing or dimensions. We review the intended use and requirements before confirming suitability.</p><a href="/pages/industrial">Explore parts &amp; prototypes →</a></article>
      </div>
    </section>
    <section className="content-section" id="process"><p className="section-tag">HOW IT WORKS</p><h2>A clear path to production.</h2><ol className="process-grid"><li><b>01 / Share the brief</b><p>Tell us the use, quantity, budget and delivery requirements. You don’t need a finished design.</p></li><li><b>02 / Agree the details</b><p>We review feasibility and confirm scope, pricing, lead time and any design or sample costs.</p></li><li><b>03 / Approve &amp; produce</b><p>Agree the specification and approval steps before production. Delivery and repeat orders are planned with you.</p></li></ol><a className="inline-link" href="/guides/bulk-3d-printing-quote-checklist">Use our quote request checklist →</a></section>
    <section className="content-section home-guides"><div className="section-heading"><div><p className="section-tag">GUIDES</p><h2>Plan a better batch.</h2></div><a className="inline-link" href="/guides">All guides →</a></div><GuideGrid items={[guides[0], guides[3]]}/></section>
    <section className="content-section" id="faq"><p className="section-tag">BEFORE YOU ENQUIRE</p><h2>A few useful answers.</h2><div className="faq-list"><details><summary>What is the minimum order?</summary><p>Bulk orders start at 10 units. Pricing depends on the product, size, finish and design work involved. Send your expected quantity and we’ll confirm a quote.</p></details><details><summary>Can you work to an event deadline?</summary><p>Tell us the date you need delivery, not just the event date. We’ll review capacity, approvals and shipping before confirming a timeframe.</p></details><details><summary>Can I order the same design again?</summary><p>You can enquire about repeat orders or ongoing supply. Include your likely quantity per batch and expected annual demand so we can discuss an arrangement.</p></details><details><summary>Do I need a 3D file?</summary><p>No. A description, dimensions and reference images are a useful starting point. Any design work and approval stages will be included in the quote.</p></details><details><summary>Do you deliver across Australia?</summary><p>Australia-wide delivery is available. Freight, packaging and delivery timing are confirmed for your order and destination.</p></details></div></section>
  </main>;
}

