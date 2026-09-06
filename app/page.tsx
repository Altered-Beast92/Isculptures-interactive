import PrinterBackdrop from './components/printer-backdrop';
import WorkGrid from './components/work-grid';
import GuideGrid from './components/guide-grid';
import { featuredProjects } from '../content/projects';
import { guides } from '../content/guides';
import media from '../content/work-media.json';

export default function Home() {
  return <main id="main-content" className="cinematic-home">
    <PrinterBackdrop/>
    <section className="hero cinema-hero" id="top">
      <div className="eyebrow">ISCULPTURES / SYDNEY STUDIO</div>
      <h1 className="business-heading">Made for<br/><i>more than one.</i></h1>
      <div className="hero-brief"><p className="hero-service">Custom 3D printing.<br/>Bulk orders. Individual character.</p><p>For businesses, events and communities. From personalised keepsakes to the next production run.</p><div className="actions"><a className="primary" href="/enquiry">Start your project <span>↗</span></a><a className="secondary" href="#work">Explore our work ↓</a></div></div>
      <div className="cinema-caption"><span>AN IDEA TAKES SHAPE</span><span>SCROLL TO BUILD ↓</span></div>
      <div className="hero-order-note"><b>10<span>+</span></b><span>UNITS TO START<br/>YOUR NEXT BATCH</span></div>
    </section>
    <section className="story-stage" id="b2b"><div className="chapter-marker"><span>01</span><span>MADE IN MULTIPLES</span></div><article className="glass-panel">
      <p className="section-tag">BULK &amp; BUSINESS</p><h2>One idea.<br/><i>A whole batch.</i></h2><p>Something for your customers, your guests or your community. Tell us the idea, the quantity and the date. We’ll work through the production brief with you.</p>
      <div className="glass-facts"><div><b>10+</b><span>Bulk order minimum</span></div><div><b>Your details</b><span>Custom wording &amp; presentation</span></div></div>
      <a className="panel-link" href="/pages/wholesale">Explore bulk &amp; trade <span>↗</span></a>
    </article></section>
    <section className="floating-work" id="work"><div className="chapter-marker"><span>02</span><span>FROM THE STUDIO</span></div><div className="floating-heading"><h2>The details<br/><i>make it yours.</i></h2><p>Real pieces. Personal touches.<br/>A closer look at what we make.</p></div><WorkGrid items={featuredProjects()}/><div className="portfolio-actions"><a className="secondary" href="/work">View the collection of work ↗</a><a href="https://www.instagram.com/impeccablesculptures/" target="_blank" rel="noreferrer">Latest from the studio on Instagram ↗</a></div></section>
    <section className="story-stage stage-pair" id="events"><div className="chapter-marker"><span>03</span><span>FOR THE OCCASION</span></div>
      <a className="floating-photo" href="/work/personalised-boxed-keepsakes"><img src={media['boxed-keepsakes'].src} alt={media['boxed-keepsakes'].alt} width={media['boxed-keepsakes'].width} height={media['boxed-keepsakes'].height} loading="lazy"/><span>PERSONALISED BOXED KEEPSAKES <b>↗</b></span></a>
      <article className="glass-panel"><p className="section-tag">EVENTS &amp; KEEPSAKES</p><h2>Many pieces.<br/><i>One occasion.</i></h2><p>A name, a date, a detail that belongs to you. Plan bonbonniere, religious keepsakes or personalised gifts as one coordinated run.</p><a className="panel-link" href="/pages/bonbonniere-custom">Bonbonniere &amp; keepsakes <span>↗</span></a><a className="panel-link" href="/pages/events-custom-gifts">Corporate gifts &amp; events <span>↗</span></a></article>
    </section>
    <section className="story-stage" id="supply"><div className="chapter-marker"><span>04</span><span>BEYOND THE FIRST RUN</span></div><article className="glass-panel">
      <p className="section-tag">ONGOING SUPPLY</p><h2>Make it once.<br/><i>Plan for more.</i></h2><p>Ordering for clients, a store or an organisation? Discuss repeat batches, packaging and scheduled deliveries. Start with the first order and where you want to take it.</p><a className="panel-link" href="/pages/ongoing-supply">Explore repeat supply <span>↗</span></a><a className="primary" href="/enquiry?route=supply">Discuss an arrangement ↗</a>
    </article></section>
    <section className="story-stage stage-offset" id="printing"><div className="chapter-marker"><span>05</span><span>FROM IDEA TO OBJECT</span></div><article className="glass-panel">
      <p className="section-tag">CUSTOM PARTS &amp; PROTOTYPES</p><h2>A purpose.<br/><i>A starting point.</i></h2><p>A sketch, a reference or a 3D file. Share the dimensions and intended use so we can review the design, material and production requirements.</p><a className="panel-link" href="/pages/industrial">Parts &amp; prototypes <span>↗</span></a>
    </article></section>
    <section className="floating-process" id="process"><div className="chapter-marker"><span>06</span><span>THE NEXT STEPS</span></div><h2>Let’s give it <i>shape.</i></h2><ol className="process-grid"><li className="glass-panel"><b>01 / THE BRIEF</b><h3>Tell us the idea.</h3><p>Use, quantity, budget and delivery. A finished design is optional.</p></li><li className="glass-panel"><b>02 / THE DETAILS</b><h3>Agree the approach.</h3><p>Scope, pricing, lead time and any design or sample costs, confirmed together.</p></li><li className="glass-panel"><b>03 / THE BATCH</b><h3>Approve &amp; produce.</h3><p>Agree the specification and approval steps before production begins.</p></li></ol><a className="text-link" href="/guides/bulk-3d-printing-quote-checklist">What to include in your brief →</a></section>
    <section className="floating-guides"><div className="floating-heading"><div><p className="section-tag">A LITTLE PREPARATION</p><h2>A better brief.<br/><i>A clearer quote.</i></h2></div><a className="text-link" href="/guides">Explore all guides ↗</a></div><GuideGrid items={[guides[0], guides[3]]}/></section>
    <section className="story-stage faq-stage" id="faq"><div className="chapter-marker"><span>07</span><span>BEFORE WE BEGIN</span></div><div className="glass-panel"><h2>A few<br/><i>useful answers.</i></h2><div className="faq-list"><details><summary>What is the minimum order?</summary><p>Bulk orders start at 10 units. Pricing depends on the product, size, finish and design work involved.</p></details><details><summary>Can you work to an event deadline?</summary><p>Tell us the date you need delivery, not just the event date. We’ll review capacity, approvals and shipping before confirming a timeframe.</p></details><details><summary>Can I order the same design again?</summary><p>Repeat order and ongoing supply enquiries are welcome. Include your likely quantity per batch and estimated annual demand.</p></details><details><summary>Do I need a 3D file?</summary><p>No. Start with a description, dimensions and reference images. Any design work and approval stages are included in the quote.</p></details><details><summary>Do you deliver across Australia?</summary><p>Australia-wide delivery is available. Freight, packaging and delivery timing are confirmed for your order and destination.</p></details></div></div></section>
  </main>;
}

