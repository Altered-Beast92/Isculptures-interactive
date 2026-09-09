'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CUSTOMER_TYPES, validateEnquiry, validateFiles, type EnquiryRoute } from '../../lib/enquiry';
import dynamic from 'next/dynamic';
import { track } from '../../lib/analytics';
const ModelPreview = dynamic(() => import('./model-preview'), { ssr: false });
import RouteIcon from './route-icons';

type Config = { available: boolean; uploads: boolean; turnstileSiteKey?: string };
type TurnstileAPI = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void };
const endpoint = process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT || '/api/enquiry';
const categories: { route: EnquiryRoute; title: string; description: string; guidance: string; prompt: string; flag?: string }[] = [
  { route: 'bulk', title: 'For an Event', description: 'Personalised gifts, bonbonniere and keepsakes for your guests.', guidance: 'Event batches start at 10 units.', prompt: 'Tell us about the occasion, number of guests, personalisation and event date.' },
  { route: 'supply', title: 'Business & Ongoing Supply', description: 'Trade orders, retail stock and repeat batches for your business.', guidance: 'Business batches start at 10 units per order.', prompt: 'What does your business need? Include the quantity and whether this is a one-off order or repeat supply.' },
  { route: 'design', title: 'Custom Design Enquiry', flag: 'FREE MOCKUP', description: 'Start with an idea, sketch or reference. We’ll review the design work needed.', guidance: 'Bulk production starts at 10 units. Design requirements and costs are confirmed with your quote.', prompt: 'Describe your idea, intended use, approximate size and any references you can share.' },
  { route: 'file', title: 'I have a 3D File', description: 'Bring your model for a review of printing and production requirements.', guidance: 'Bulk production starts at 10 units. Prototype requirements are reviewed with your quote.', prompt: 'What is the model for? Include the quantity, dimensions, material preferences and any critical tolerances.' },
];
export default function EnquiryForm() {
  const [route, setRoute] = useState<EnquiryRoute>('bulk');
  const [hasSelected, setHasSelected] = useState(false);
  const [step, setStep] = useState(0);
  const selectedCategory = categories.find(category => category.route === route)!;
  const projectHeading = useRef<HTMLHeadingElement>(null);
  const categoryHeading = useRef<HTMLHeadingElement>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<File | null>(null);
  const started = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [token, setToken] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const challenge = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const submissionId = useRef('');
  const source = useRef({ sourcePath: '/enquiry', referrerHost: '', campaign: { source: '', medium: '', campaign: '' } });
  useEffect(() => {
    submissionId.current = crypto.randomUUID();
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('route');
    if (requested === 'bulk' || requested === 'supply' || requested === 'design' || requested === 'file') { setRoute(requested); setHasSelected(true); }
    const project = params.get('project')?.slice(0, 200);
    const briefInput = form.current?.elements.namedItem('brief');
    if (project && briefInput instanceof HTMLTextAreaElement && !briefInput.value) briefInput.value = `I'm interested in a project similar to ${project}.\n\n`;
    let referrerHost = '';
    try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
    source.current = { sourcePath: window.location.pathname, referrerHost, campaign: { source: params.get('utm_source') || '', medium: params.get('utm_medium') || '', campaign: params.get('utm_campaign') || '' } };
    try {
      const saved = JSON.parse(sessionStorage.getItem('isculptures-attribution') || 'null');
      if (!params.has('utm_source') && saved?.campaign && typeof saved.referrerHost === 'string') source.current = { ...source.current, referrerHost: saved.referrerHost, campaign: saved.campaign };
    } catch { /* The enquiry works without optional attribution. */ }
    const abort = new AbortController();
    const timeout = window.setTimeout(() => { abort.abort(); setConfig({ available: false, uploads: false }); }, 10000);
    fetch(endpoint, { signal: abort.signal }).then(async response => {
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error();
      const value = await response.json();
      setConfig({ available: value.available === true, uploads: value.uploads === true, turnstileSiteKey: value.turnstileSiteKey });
    }).catch(() => { if (!abort.signal.aborted) setConfig({ available: false, uploads: false }); }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); abort.abort(); };
  }, []);
  useEffect(() => {
    if (!config?.turnstileSiteKey || !challenge.current || !hasSelected || step !== 2) return;
    let cancelled = false;
    const mount = () => {
      const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile;
      if (!cancelled && api && challenge.current && widget.current === null) widget.current = api.render(challenge.current, { sitekey: config.turnstileSiteKey, action: 'enquiry', callback: (value: string) => setToken(value), 'expired-callback': () => setToken(''), 'error-callback': () => { setToken(''); setMessage('Verification could not load. Please retry or email the studio.'); } });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-enquiry-turnstile]');
    if (!script) { script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.dataset.enquiryTurnstile = 'true'; document.head.appendChild(script); }
    script.addEventListener('load', mount); mount();
    return () => { cancelled = true; script?.removeEventListener('load', mount); const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile; if (widget.current !== null) api?.remove(widget.current); widget.current = null; };
  }, [config?.turnstileSiteKey, hasSelected, step]);
  useEffect(() => { if (state === 'sent' || state === 'error' || Object.keys(errors).length) feedback.current?.focus(); }, [state, errors]);
  useEffect(() => { if (hasSelected) projectHeading.current?.focus(); }, [hasSelected, route]);
  const error = (key: string) => errors[key] ? <span className="field-error" id={'error-' + key}>{errors[key]}</span> : null;
  const props = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? 'error-' + key : undefined });
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (state === 'sending' || !hasSelected || !form.current) return;
    const values = new FormData(form.current); const field = (key: string) => String(values.get(key) || '');
    const payload = { submissionId: submissionId.current, route, website: field('website'), consent: values.get('consent') === 'on',
      contact: { name: field('name'), email: field('email'), company: field('company'), phone: field('phone'), customerType: field('customerType') },
      brief: field('brief'), quantity: field('quantity'), annualQuantity: route === 'supply' ? field('annualQuantity') : '', frequency: route === 'supply' ? field('frequency') : '',
      material: field('material'), dimensions: field('dimensions'), finish: field('finish'), packaging: field('packaging'), budget: field('budget'),
      requiredBy: field('requiredBy'), deadlineFixed: values.get('deadlineFixed') === 'on', postcode: field('postcode'), destinations: field('destinations'),
      notes: field('notes'), ...source.current
    };
    const checked = validateEnquiry(payload);
    const fileError = validateFiles(files);
    if (fileError) checked.errors.files = fileError;
    setErrors(checked.errors); setMessage('');
    if (!checked.data || Object.keys(checked.errors).length) {
      const keys = Object.keys(checked.errors);
      setStep(keys.some(key => ['brief', 'quantity', 'annualQuantity', 'files'].includes(key)) ? 0 : keys.includes('requiredBy') ? 1 : 2);
      return;
    }
    if (!config?.available) { setState('error'); setMessage('Online enquiries are temporarily unavailable. Please email your brief to info@isculptures.com.au.'); return; }
    if (config.turnstileSiteKey && !token) { setState('error'); setMessage('Please complete the verification before sending.'); return; }
    const body = new FormData(); body.set('payload', JSON.stringify({ ...checked.data, turnstileToken: token }));
    files.forEach(file => body.append('files', file));
    setState('sending');
    try {
      const response = await fetch(endpoint, { method: 'POST', body, signal: AbortSignal.timeout(60000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true || typeof result.id !== 'string') throw new Error(result.error || 'We could not confirm receipt. Please try again or email the studio.');
      setReference(result.id); setState('sent');
      track('enquiry_submitted', route);
    } catch (problem) {
      track('enquiry_error', route);
      setState('error'); setMessage(problem instanceof Error ? problem.message : 'We could not confirm receipt. Please try again.');
      const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile; if (widget.current !== null) api?.reset(widget.current); setToken('');
    }
  };
  if (state === 'sent') return <div ref={feedback} tabIndex={-1} className="enquiry-success" role="status"><p className="section-tag">ENQUIRY RECEIVED</p><h2>Thank you. Your brief is saved.</h2><p>Keep your reference: <strong>{reference}</strong></p><p>The studio will review your requirements and reply to the email you provided. A submitted enquiry does not reserve production or confirm an order.</p><a className="primary" href="/">Back to the studio</a></div>;
  return <>
    <section className="route-picker" aria-labelledby="category-heading" hidden={hasSelected}>
      <p className="route-step">01 / YOUR STARTING POINT</p>
      <h2 id="category-heading" ref={categoryHeading} tabIndex={-1}>What are we making?</h2><p className="route-help">Choose a starting point. We’ll work through the details with you.</p>
      {config && !config.available && <p className="route-availability" role="status">Online sending is not connected yet. <a href="mailto:info@isculptures.com.au">Enquire by email ↗</a></p>}
      <div className="route-grid">{categories.map(category => <button key={category.route} type="button" className="route-tab" aria-controls="project-enquiry-form" disabled={state === 'sending'} onClick={() => { setRoute(category.route); setHasSelected(true); setStep(0); setErrors({}); setMessage(''); }}>
        <span className="route-tab-top"><span className="route-icon" aria-hidden="true"><RouteIcon route={category.route}/></span><span className="route-arrow" aria-hidden="true">↗</span></span>
        <span className="route-title">{category.title}</span><span className="route-description">{category.description}</span><span className="route-foot">{category.flag && <span className="route-flag">{category.flag}</span>}<span className="route-minimum">BULK ORDERS / 10+ UNITS</span></span>
      </button>)}</div>
      <p className="route-footnote">Your brief → A studio review → Your quote</p>
    </section>
    <form id="project-enquiry-form" hidden={!hasSelected} ref={form} className="enquiry-form staged-enquiry" onSubmit={send} onChange={() => { if (!started.current) { started.current = true; track('enquiry_started', route); } }} noValidate>
    <div className="enquiry-category-intro"><button className="change-category" type="button" disabled={state === 'sending'} onClick={() => { setHasSelected(false); requestAnimationFrame(() => categoryHeading.current?.focus()); }}>← Change category</button><p className="section-tag">YOUR PROJECT</p><h2 ref={projectHeading} tabIndex={-1}>{selectedCategory.title}</h2><p>{selectedCategory.guidance}</p></div>
    {config && !config.available && <div className="form-notice" role="status"><b>Send your brief by email for now.</b><p>The online form is not accepting enquiries yet. Email <a href="mailto:info@isculptures.com.au">info@isculptures.com.au</a> or call <a href="tel:+61437383684">0437 383 684</a>.</p></div>}
    <nav className="enquiry-stages" aria-label="Enquiry steps">{['Project', 'Delivery', 'Contact'].map((label, index) => <button key={label} type="button" aria-current={step === index ? 'step' : undefined} disabled={state === 'sending'} onClick={() => { setStep(index); setMessage(''); }}>0{index + 1}<span>{label}</span></button>)}</nav>
    <fieldset hidden={step !== 0} disabled={state === 'sending'}><legend>Your project</legend>
      <input type="hidden" name="route" value={route}/>
      <label>What would you like to make? <span>(required)</span><textarea name="brief" maxLength={5000} rows={4} {...props('brief')} placeholder={selectedCategory.prompt}/>{error('brief')}</label>
      <div className="enquiry-grid"><label>Quantity per order <span>(leave blank if unsure)</span><input name="quantity" type="number" min={route === 'bulk' || route === 'supply' ? 10 : 1} max={10000000} step="1" {...props('quantity')}/>{error('quantity')}</label><label>Approximate size / dimensions<input name="dimensions" maxLength={500} placeholder="e.g. 80 mm tall"/></label></div>
      <div className="enquiry-grid" hidden={route !== 'supply'}><label>Estimated annual quantity<input name="annualQuantity" disabled={route !== 'supply'} type="number" min="1" max={10000000} step="1" {...props('annualQuantity')}/>{error('annualQuantity')}</label><label>Order frequency<input name="frequency" maxLength={200} placeholder="e.g. one-off, monthly, quarterly, seasonal" disabled={route !== 'supply'}/></label></div>
      <details className="optional-details"><summary>Materials, finish, packaging &amp; budget (optional)</summary><div className="enquiry-grid"><label>Material preference<input name="material" maxLength={200} placeholder="Not sure? We can recommend."/></label><label>Finish / colour / branding<input name="finish" maxLength={500}/></label><label>Packaging requirements<input name="packaging" maxLength={500}/></label><label>Budget or target unit price (AUD)<input name="budget" maxLength={100} placeholder="e.g. $15 per item, or $2,000 total"/></label></div></details>
      <div className="attachment-panel"><label htmlFor="files">Supporting files <span>(optional)</span></label><p id="file-help">STL, OBJ, 3MF, PDF, PNG or JPG. Up to 5 files; 10 MB each, 20 MB total. Files are sent with your enquiry and stored privately. For larger models, mention the file in your brief and we’ll arrange a transfer.</p>
        <input id="files" type="file" multiple accept=".stl,.obj,.3mf,.pdf,.png,.jpg,.jpeg" disabled={!config?.uploads} aria-describedby="file-help" onChange={event => { const chosen = Array.from(event.target.files || []); const issue = validateFiles(chosen); setErrors(previous => ({ ...previous, files: issue || '' })); setFiles(chosen); }}/>
        {error('files')}{files.length > 0 && <ul>{files.map((file, index) => <li key={file.name + index}>{file.name} ({(file.size / 1048576).toFixed(1)} MB) <button type="button" className="text-btn" onClick={() => setFiles(previous => previous.filter((_, i) => i !== index))} aria-label={'Remove ' + file.name}>Remove</button></li>)}</ul>}
      </div>
      {files.some(file => /\.(stl|obj)$/i.test(file.name) && !validateFiles([file])) && <button className="text-btn" type="button" onClick={() => setPreview(preview ? null : files.find(file => /\.(stl|obj)$/i.test(file.name) && !validateFiles([file])) || null)}>{preview ? 'Close 3D preview' : 'Preview a 3D model (optional)'}</button>}
      {preview && files.includes(preview) && <ModelPreview key={preview.name + preview.lastModified} file={preview}/>}
    </fieldset>
    <fieldset hidden={step !== 1} disabled={state === 'sending'}><legend>Timing &amp; delivery</legend><div className="enquiry-grid"><label>Required delivery date<input name="requiredBy" type="date" {...props('requiredBy')}/>{error('requiredBy')}</label><label>Delivery suburb / postcode<input name="postcode" maxLength={100} autoComplete="postal-code"/></label></div><label className="check-label"><input type="checkbox" name="deadlineFixed"/>This delivery date is fixed</label><label>Multiple destinations or delivery notes <span>(optional)</span><input name="destinations" maxLength={500}/></label></fieldset>
    <fieldset hidden={step !== 2} disabled={state === 'sending'}><legend>Your contact details</legend><div className="enquiry-grid"><label>Your name <span>(required)</span><input name="name" autoComplete="name" maxLength={200} {...props('name')}/>{error('name')}</label><label>Email <span>(required)</span><input name="email" type="email" autoComplete="email" maxLength={254} {...props('email')}/>{error('email')}</label><label>Company / organisation<input name="company" autoComplete="organization" maxLength={200}/></label><label>Phone <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40}/></label></div>
    <label>I’m enquiring as<select name="customerType" defaultValue=""><option value="">Please select (optional)</option>{CUSTOMER_TYPES.map(type => <option key={type}>{type}</option>)}</select></label><label>Anything else we should know?<textarea name="notes" rows={3} maxLength={3000} placeholder="Repeat order reference, approvals, tolerances, supplier onboarding or confidentiality requirements."/></label>
    <div className="trap" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="check-label"><input name="consent" type="checkbox" {...props('consent')}/><span>I have read the <a href="/policies/privacy-policy" target="_blank" rel="noreferrer">privacy notice</a> and understand my details and files will be used to respond to this enquiry.</span></label>{error('consent')}
    </fieldset>
    <div ref={challenge} hidden={step !== 2}/><div ref={feedback} tabIndex={-1} role={state === 'error' || Object.values(errors).some(Boolean) ? 'alert' : undefined}>{Object.values(errors).some(Boolean) && <p className="form-error">Please check the highlighted fields above.</p>}{message && <p className="form-error">{message} <a href="mailto:info@isculptures.com.au">Email the studio</a>.</p>}</div>
    <div className="enquiry-step-actions">{step > 0 && <button className="previous-step" type="button" disabled={state === 'sending'} onClick={() => setStep(previous => previous - 1)}>← Back</button>}{step < 2 && <button className="primary next-step" type="button" onClick={() => { setStep(previous => previous + 1); projectHeading.current?.focus(); }}>Continue to {step === 0 ? 'delivery' : 'contact'} ↗</button>}
    <button hidden={step !== 2} className="primary" type="submit" disabled={state === 'sending' || !config?.available || (!!config?.turnstileSiteKey && !token)}>{state === 'sending' ? 'Sending your enquiry…' : 'Send project enquiry ↗'}</button></div>
    <p className="fineprint">We confirm availability, materials, pricing and lead time after reviewing your brief. <a href="/policies/terms-of-service">About enquiries and orders</a>.</p>
  </form></>;
}
