'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { scroll } from './world/scroll';
import { projects } from '../content/projects';
import { featuredTestimonials } from '../content/testimonials';
import { CATEGORY_LABELS, SOURCE_LABELS, type Category } from '../content/types';

// The whole three.js graph — react-three-fiber, drei and three itself, roughly
// 300 KiB — used to sit in the first-load bundle and mount during hydration.
// Both canvases are now their own chunks, fetched after the page is interactive.
const World = dynamic(() => import("./world/hero"), { ssr: false });
const Preview = dynamic(() => import("./world/preview"), { ssr: false, loading: () => <div className="model-preview"/> });

type Decision = 'file' | 'design' | 'bulk' | null;
const materials = ['Matte nylon', 'Recycled PLA', 'Resin detail', 'Aluminium'];
const colours = ['Bone', 'Graphite', 'Clay', 'Sage'];
// Bulk enquiries are qualified by band rather than an exact count: at this stage
// the studio needs to know which production process applies, not a firm number.
const volumeBands = ['25 – 100', '100 – 500', '500 – 2,000', '2,000+'];
const timelines = ['Within 4 weeks', '1 – 3 months', '3 months+', 'Ongoing supply'];

// The nav has always linked to #work; this is the section it was pointing at.
// Projects with no imagery yet render a typographic tile rather than a broken
// image, so the layout can be judged before the Shopify export lands.
function WorkSection() {
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const shown = filter === 'all' ? projects : projects.filter(p => p.category === filter);
  return <section className="case work" id="work">
    <p className="section-tag">05 / SELECTED WORK</p>
    <h2>Things we have<br/>actually <i>made.</i></h2>
    <div className="work-filters">
      <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>All</button>
      {/* Only categories with real work get a tab. Offering "Industrial" before
          there is an industrial job to show would lead to an empty grid. */}
      {(Object.keys(CATEGORY_LABELS) as Category[]).filter(key => projects.some(p => p.category === key)).map(key => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{CATEGORY_LABELS[key]}</button>)}
    </div>
    <div className="work-grid">{shown.map(project => <a key={project.slug} className="work-card" href={`/work/${project.slug}`}>
      {project.images[0]
        ? <img src={project.images[0].src} alt={project.images[0].alt || project.title} loading="lazy"/>
        : <div className="work-thumb placeholder"><span>{project.title}</span></div>}
      <div className="work-meta"><small>{CATEGORY_LABELS[project.category]}</small><b>{project.title}</b><p>{project.summary}</p></div>
    </a>)}</div>
  </section>;
}

function TestimonialsSection() {
  const quotes = featuredTestimonials();
  if (!quotes.length) return null;
  return <section className="case testimonials" id="testimonials">
    <p className="section-tag">06 / IN THEIR WORDS</p>
    <h2>Trusted with the<br/>things that <i>matter.</i></h2>
    <div className="quote-grid">{quotes.map(quote => <figure key={quote.id}>
      {quote.rating && <div className="stars" aria-label={`${quote.rating} out of 5`}>{'★'.repeat(quote.rating)}</div>}
      <blockquote>{quote.quote}</blockquote>
      <figcaption>{quote.author}{quote.company ? `, ${quote.company}` : quote.role ? `, ${quote.role}` : ''} <span>{SOURCE_LABELS[quote.source]}</span></figcaption>
    </figure>)}</div>
  </section>;
}

type SendState = 'idle' | 'sending' | 'error' | 'sent';
// Read defensively: Turbopack only inlines NEXT_PUBLIC_* when the variable is
// actually defined, and `process` does not exist in the browser bundle, so an
// unset endpoint must degrade to undefined rather than throw on first click.
const ENQUIRY_ENDPOINT = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT : undefined;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProjectFlow({ onClose, initialChoice = null }: { onClose: () => void; initialChoice?: Decision }) {
  const [choice, setChoice] = useState<Decision>(initialChoice); const [step, setStep] = useState(0); const [file, setFile] = useState<File | null>(null); const [modelUrl, setModelUrl] = useState<string>(); const [qty, setQty] = useState(1); const [material, setMaterial] = useState(materials[0]); const [colour, setColour] = useState(colours[0]);
  const [refs, setRefs] = useState<string[]>([]); const [brief, setBrief] = useState(''); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [company, setCompany] = useState(''); const [due, setDue] = useState(''); const [notes, setNotes] = useState('');
  const [volume, setVolume] = useState(volumeBands[0]); const [timeline, setTimeline] = useState(timelines[0]); const [targetPrice, setTargetPrice] = useState(''); const [recurring, setRecurring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); const [state, setState] = useState<SendState>('idle'); const [failure, setFailure] = useState('');
  const trap = useRef('');
  const upload = (f?: File) => { if (!f) return; setFile(f); setModelUrl(f.name === 'concept-model.stl' ? undefined : URL.createObjectURL(f)); setStep(1); };

  const send = async () => {
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Please tell us your name.';
    if (!email.trim()) found.email = 'We need an email address to reply to.';
    else if (!EMAIL.test(email.trim())) found.email = 'That email address doesn’t look right.';
    if ((choice === 'design' || choice === 'bulk') && !brief.trim()) found.brief = 'A short description helps us give you a useful answer.';
    setErrors(found);
    if (Object.keys(found).length) return;
    // A bot that fills every field trips the honeypot. Report success to it
    // rather than an error, so it learns nothing, and send nothing onward.
    if (trap.current.trim()) { setState('sent'); return; }
    const endpoint = ENQUIRY_ENDPOINT;
    if (!endpoint) { setState('error'); setFailure('The enquiry form isn’t connected yet. Please email us directly while we finish setting this up.'); return; }
    setState('sending'); setFailure('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: choice, submittedAt: new Date().toISOString(), sourceUrl: window.location.href,
          contact: { name: name.trim(), email: email.trim(), company: company.trim(), requiredBy: due },
          brief: brief.trim(), notes: notes.trim(),
          model: file ? { name: file.name, sizeBytes: file.size, type: file.type || file.name.split('.').pop() } : null,
          references: refs,
          spec: choice === 'file' ? { quantity: qty, material, colour } : null,
          bulk: choice === 'bulk' ? { volume, timeline, material, targetUnitPrice: targetPrice.trim() || null, recurring } : null,
        }),
      });
      if (!response.ok) throw new Error(`The studio inbox returned ${response.status}.`);
      setState('sent');
    } catch (problem) {
      setState('error');
      setFailure(problem instanceof Error ? problem.message : 'Something went wrong sending your enquiry.');
    }
  };

  const sending = state === 'sending';
  return <section className="project" id="project" aria-label="Start your project"><button className="close" onClick={onClose} aria-label="Close project planner">×</button><div className="project-kicker">PROJECT PLANNER <span>0{step + 1} / 03</span></div>
    {!choice && <><h2>Let’s make the first move.</h2><p className="lede">Most of our work is volume: event favours, corporate runs and trade orders. Choose the route that feels closest — a real person reviews every project before production.</p><div className="decision-grid"><button onClick={() => setChoice('bulk')}><span>01</span><strong>Bulk, Events or Trade</strong><em>Favours · corporate · wholesale</em></button><button onClick={() => setChoice('design')}><span>02</span><strong>I Need Help Designing It</strong><em>Sketches · photos · ideas</em></button><button onClick={() => setChoice('file')}><span>03</span><strong>Upload a 3D File</strong><em>STL · OBJ · 3MF</em></button></div></>}
    {choice === 'file' && step === 0 && <div className="upload-panel"><h2>Your model, in the studio.</h2><label className="drop"><input type="file" accept=".stl,.obj,.3mf" onChange={e => upload(e.target.files?.[0])}/><b>Drop your file here</b><span>or choose STL, OBJ or 3MF · max 250 MB</span></label><button className="text-btn" onClick={() => upload(new File([''], 'concept-model.stl'))}>Try with a sample model →</button></div>}
    {choice === 'file' && step === 1 && <div className="config-grid"><Preview quantity={qty} colour={colour} modelUrl={modelUrl} kind={file?.name.split('.').pop()?.toLowerCase()}/><div className="config"><div><small>MODEL</small><b>{file?.name}</b><p>{file?.name.endsWith('.3mf') ? '3MF received · visual inspection begins after upload' : 'Interactive 3D inspection enabled · orbit to examine'}</p></div><div className="specs"><span><b>Detected</b> geometry</span><span><b>Studio review</b> dimensions</span></div><label>Quantity <input aria-label="Quantity" type="number" min="1" max="20" value={qty} onChange={e => setQty(+e.target.value || 1)}/></label><div className="chips">{materials.map(x => <button className={material === x ? 'selected' : ''} onClick={() => setMaterial(x)} key={x}>{x}</button>)}</div><div className="chips colours">{colours.map(x => <button className={colour === x ? 'selected' : ''} onClick={() => setColour(x)} key={x}>{x}</button>)}</div><button className="primary" onClick={() => setStep(2)}>Continue with this model</button></div></div>}
    {choice === 'design' && step === 0 && <div className="assist"><h2>Tell us what you’re imagining.</h2><p>Reference images, napkin sketches and technical drawings all help. We’ll turn the unknowns into a clear next step.</p><label className="drop"><input type="file" accept="image/*,.pdf" multiple onChange={e => setRefs(Array.from(e.target.files || []).map(f => f.name))}/><b>Add photos, sketches or PDFs</b><span>{refs.length ? `${refs.length} file${refs.length > 1 ? 's' : ''} selected` : 'Drag and drop or browse your files'}</span></label><textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe the object, who it’s for, and what it needs to do."/>{errors.brief && <p className="field-error">{errors.brief}</p>}<button className="primary" onClick={() => { if (!brief.trim()) { setErrors({ brief: 'A short description helps us give you a useful answer.' }); return; } setErrors({}); setStep(2); }}>Continue</button></div>}
    {choice === 'bulk' && step === 0 && <div className="assist"><h2>Volume changes everything.</h2><p>Batch size and deadline decide the process, the tooling and the price. Tell us the shape of the run and we’ll come back with a realistic production path.</p>
      <div className="band-block"><small>ANNUAL OR PER-RUN VOLUME</small><div className="chips">{volumeBands.map(band => <button key={band} className={volume === band ? 'selected' : ''} onClick={() => setVolume(band)}>{band}</button>)}</div></div>
      <div className="band-block"><small>TIMELINE</small><div className="chips">{timelines.map(item => <button key={item} className={timeline === item ? 'selected' : ''} onClick={() => setTimeline(item)}>{item}</button>)}</div></div>
      <div className="band-block"><small>PREFERRED MATERIAL</small><div className="chips">{materials.map(item => <button key={item} className={material === item ? 'selected' : ''} onClick={() => setMaterial(item)}>{item}</button>)}</div></div>
      <label className="band-inline"><span>Target price per unit (optional)</span><input value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="e.g. $12" aria-label="Target price per unit"/></label>
      <label className="band-check"><input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)}/><span>This is a repeat or ongoing supply arrangement</span></label>
      <textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="What are we making, and what does it need to do?"/>{errors.brief && <p className="field-error">{errors.brief}</p>}
      <button className="primary" onClick={() => { if (!brief.trim()) { setErrors({ brief: 'A short description helps us give you a useful answer.' }); return; } setErrors({}); setStep(2); }}>Continue</button></div>}
    {step === 2 && state !== 'sent' && <div className="details"><h2>Almost there.</h2><p>We’ll respond with thoughtful advice, a realistic production path and pricing.</p>
      <div className="form-grid">
        <div><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" aria-label="Your name" aria-invalid={!!errors.name}/>{errors.name && <p className="field-error">{errors.name}</p>}</div>
        <div><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" aria-label="Email address" aria-invalid={!!errors.email}/>{errors.email && <p className="field-error">{errors.email}</p>}</div>
        <div><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company (optional)" aria-label="Company"/></div>
        <div><input value={due} onChange={e => setDue(e.target.value)} placeholder="Required by date" type="date" aria-label="Required by date"/></div>
      </div>
      <input className="trap" tabIndex={-1} autoComplete="off" aria-hidden="true" onChange={e => { trap.current = e.target.value; }} placeholder="Leave this field empty"/>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes, tolerances or finishes we should know about?"/>
      {state === 'error' && <p className="form-error" role="alert">{failure} You can also reach us at <a href="mailto:info@isculptures.com.au">info@isculptures.com.au</a>.</p>}
      <button className="primary" onClick={send} disabled={sending}>{sending ? 'Sending…' : 'Send project enquiry'}</button>
      {file && <p className="fineprint">We’ll reply with a secure link to upload <b>{file.name}</b> — your model isn’t sent with this form.</p>}
    </div>}
    {state === 'sent' && <div className="success"><span>✦</span><h2>It’s on its way.</h2><p>Your brief is with the iSculptures studio and we’ll be in touch shortly{file ? ', including a link to send your model file' : ''}.</p><button className="text-btn" onClick={onClose}>Back to the studio →</button></div>}
    {choice && step > 0 && state !== 'sent' && <button className="back" onClick={() => setStep(choice === 'file' ? step - 1 : 0)}>← Back</button>}
  </section>;
}

export default function Page() {
  const [planner, setPlanner] = useState<{ route: Decision } | null>(null);
  const openPlanner = (route: Decision = null) => setPlanner({ route });
  // The canvas is decorative and expensive, so it is kept off the critical path:
  // it mounts only once the browser goes idle after hydration, and not at all
  // where the stylesheet already hides it for reduced motion.
  const [showWorld, setShowWorld] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => setShowWorld(true);
    if (!window.requestIdleCallback) { const t = window.setTimeout(start, 400); return () => clearTimeout(t); }
    const handle = window.requestIdleCallback(start, { timeout: 2500 });
    return () => window.cancelIdleCallback(handle);
  }, []);
  useEffect(() => {
    // The scroll span is only re-measured on resize. Reading scrollHeight inside
    // the scroll handler forced a synchronous layout on every event, and writing
    // the result to state re-rendered every section of the page with it.
    let span = 1;
    const measure = () => { span = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
    const update = () => {
      scroll.progress = window.scrollY / span;
      scroll.isScrolling = true;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => { scroll.isScrolling = false; }, 110);
    };
    measure(); update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", measure); if (scrollTimer.current) clearTimeout(scrollTimer.current); };
  }, []);
  useEffect(() => { document.body.style.overflow = planner ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [planner]); return <main><div className="world">{showWorld && <World/>}</div><nav><a className="logo" href="#top">i<span>sculptures</span></a><div className="navlinks"><a href="#events">Events</a><a href="#b2b">Trade &amp; B2B</a><a href="#work">Our Work</a><a href="#printing">Capability</a><a href="#about">About</a><a href="https://www.etsy.com/au/shop/iSculptures" target="_blank">Shop ↗</a></div><button className="nav-cta" onClick={() => openPlanner()}>Start a project</button></nav><section className="hero" id="top"><div className="eyebrow">SYDNEY · EST. 2008</div><h1>Ideas Made<br/><i>Tangible.</i></h1><p>Custom 3D printing, design and production in Sydney.</p><div className="actions"><button className="primary" onClick={() => openPlanner()}>Start Your Project <span>↗</span></button><a href="#printing" className="secondary">Explore What We Make <span>↓</span></a></div><div className="scroll-note">SCROLL TO PRINT <b>↓</b></div></section><section className="case" id="events"><p className="section-tag">01 / EVENTS AT VOLUME</p><h2>Hundreds of pieces.<br/>One <i>deadline.</i></h2><div className="case-copy"><p>Bonbonnières, christening and wedding favours, and corporate keepsakes — designed, produced and finished in Sydney, at the quantities an event actually needs.</p><a href="#b2b">How a volume run works →</a></div></section>
      <section className="case light" id="b2b"><p className="section-tag">02 / TRADE &amp; WHOLESALE</p><h2>Built for venues,<br/>planners and <i>parishes.</i></h2><div className="b2b-copy"><p>If you order on behalf of other people, we work to trade terms.</p><ul className="b2b-points"><li>Volume pricing from 100 units</li><li>Repeatable specs across separate runs</li><li>Lead times you can commit to your own clients</li><li>A direct line to the studio, not a ticket queue</li></ul><button className="primary" onClick={() => openPlanner('bulk')}>Start a trade enquiry <span>↗</span></button></div></section>
      <section className="case" id="printing"><p className="section-tag">03 / CAPABILITY</p><h2>From a single detail<br/>to a whole <i>system.</i></h2><div className="case-copy"><p>Design, production and finishing under one roof. We take a sketch, a photo or a CAD file and turn it into something repeatable.</p><a href="#work">See what we have made →</a></div></section>
      {/* Deliberately modest: the studio has not taken an industrial job yet, so
          this is a capability statement rather than a portfolio claim. */}
      <section className="case" id="industrial"><p className="section-tag">04 / INDUSTRIAL</p><h2>Industrial work,<br/>as it <i>comes.</i></h2><p>Functional prototypes, jigs and fixtures sit well within our process, and we take that work on. We would rather show you the event runs we have actually delivered than stock photography of someone else’s factory.</p></section><WorkSection/><TestimonialsSection/><footer id="about"><span>MAKE SOMETHING REAL</span><h2>Have an idea?</h2><button className="primary" onClick={() => openPlanner()}>Start Your Project <span>↗</span></button><small>© 2026 iSculptures / Sydney, Australia</small></footer>{planner && <ProjectFlow initialChoice={planner.route} onClose={() => setPlanner(null)}/>}</main>; }
