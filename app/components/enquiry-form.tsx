'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CUSTOMER_TYPES, EXTENSIONS, IMAGE_EXTENSIONS, MAX_FILES, MAX_SLOTS, extensionOf, validateEnquiry, validateFiles, type EnquiryRoute } from '../../lib/enquiry';
import dynamic from 'next/dynamic';
import RouteIcon from './route-icons';
import { track } from '../../lib/analytics';
const ModelPreview = dynamic(() => import('./model-preview'), { ssr: false });

type Config = { available: boolean; uploads: boolean; turnstileSiteKey?: string };
type TurnstileAPI = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void };
type Ticket = { ticket: string; expires: string };
type Upload = { slot: number; name: string; size: number; file: File; status: 'uploading' | 'done' | 'error'; progress: number; error?: string };
const endpoint = process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT || '/api/enquiry';
const categories: { route: EnquiryRoute; title: string; description: string; guidance: string; prompt: string; flag?: string }[] = [
  { route: 'bulk', title: 'For an Event', description: 'Personalised gifts, bonbonniere and keepsakes for your guests.', guidance: 'Event batches start at 10 units.', prompt: 'Tell us about the occasion, number of guests, personalisation and event date.' },
  { route: 'supply', title: 'Business & Ongoing Supply', description: 'Trade orders, retail stock and repeat batches for your business.', guidance: 'Business batches start at 10 units per order.', prompt: 'What does your business need? Include the quantity and whether this is a one-off order or repeat supply.' },
  { route: 'design', title: 'Custom Design Enquiry', flag: 'FREE MOCKUP', description: 'Start with an idea, sketch or reference. We’ll review the design work needed.', guidance: 'Bulk production starts at 10 units. Design requirements and costs are confirmed with your quote.', prompt: 'Describe your idea, intended use, approximate size and any references you can share.' },
  { route: 'file', title: 'I have a 3D File', description: 'Bring your model for a review of printing and production requirements.', guidance: 'Bulk production starts at 10 units. Prototype requirements are reviewed with your quote.', prompt: 'What is the model for? Include the quantity, dimensions, material preferences and any critical tolerances.' },
];
const STEPS = ['Project', 'Delivery', 'Contact'];
// Which step owns each field, so an error can be shown where it can actually be fixed.
const FIELD_STEP: Record<string, number> = { brief: 0, quantity: 0, annualQuantity: 0, files: 0, requiredBy: 1, name: 2, email: 2, consent: 2 };
const stepFor = (key: string) => FIELD_STEP[key] ?? 2;
const fileSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? Math.round(bytes / 1024) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
// A quote needs to see the piece, not every pixel, so photographs travel at a workable size.
async function shrinkImage(file: File) {
  if (!IMAGE_EXTENSIONS.includes(extensionOf(file.name)) || file.size < 900000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (context) context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    if (!context) return file;
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return file; /* A browser that cannot decode this image simply sends the original. */ }
}
// XMLHttpRequest rather than fetch, because only it reports how far an upload has actually travelled.
function putFile(url: string, file: File, onProgress: (fraction: number) => void, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.timeout = 15 * 60 * 1000;
    request.upload.onprogress = event => { if (event.lengthComputable && event.total) onProgress(event.loaded / event.total); };
    request.onload = () => {
      let message = 'This file could not be uploaded. Please try again.';
      try {
        const body = JSON.parse(request.responseText) as { ok?: boolean; error?: string };
        if (request.status < 300 && body.ok) return resolve();
        if (body.error) message = body.error;
      } catch { /* A non-JSON reply keeps the general message. */ }
      reject(new Error(message));
    };
    request.onerror = () => reject(new Error('The upload could not reach the studio. Check your connection and retry.'));
    request.ontimeout = () => reject(new Error('The upload timed out. Please retry.'));
    request.onabort = () => reject(new Error('Upload cancelled.'));
    signal.addEventListener('abort', () => request.abort(), { once: true });
    request.send(file);
  });
}
export default function EnquiryForm() {
  const [route, setRoute] = useState<EnquiryRoute>('bulk');
  const [hasSelected, setHasSelected] = useState(false);
  const [step, setStep] = useState(0);
  const selectedCategory = categories.find(category => category.route === route)!;
  const projectHeading = useRef<HTMLHeadingElement>(null);
  const categoryHeading = useRef<HTMLHeadingElement>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [preview, setPreview] = useState<number | null>(null);
  const started = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const challenge = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const submissionId = useRef('');
  const legends = useRef<(HTMLLegendElement | null)[]>([]);
  // Set after mount so the exported HTML does not carry a build-time date.
  const [today, setToday] = useState('');
  const nextSlot = useRef(0);
  const transfers = useRef(new Map<number, AbortController>());
  const source = useRef({ sourcePath: '/enquiry', referrerHost: '', campaign: { source: '', medium: '', campaign: '' } });
  useEffect(() => {
    submissionId.current = crypto.randomUUID();
    setToday(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
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
  // The check runs on the first step so a verified ticket can authorise uploads while the brief is still being written.
  useEffect(() => {
    if (!config?.turnstileSiteKey || !challenge.current || !hasSelected) return;
    let cancelled = false;
    const claim = async (value: string) => {
      try {
        const response = await fetch(endpoint + '/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: submissionId.current, turnstileToken: value }), signal: AbortSignal.timeout(15000) });
        const result = await response.json() as Ticket & { error?: string };
        if (!response.ok || typeof result.ticket !== 'string') throw new Error(result.error || 'Verification could not be completed. Please retry.');
        if (!cancelled) { setTicket({ ticket: result.ticket, expires: String(result.expires) }); setMessage(''); }
      } catch (problem) {
        if (!cancelled) { setTicket(null); setMessage(problem instanceof Error ? problem.message : 'Verification could not be completed. Please retry.'); }
      }
    };
    const mount = () => {
      const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile;
      if (!cancelled && api && challenge.current && widget.current === null) widget.current = api.render(challenge.current, { sitekey: config.turnstileSiteKey, action: 'enquiry', callback: (value: string) => claim(value), 'expired-callback': () => setTicket(null), 'error-callback': () => { setTicket(null); setMessage('Verification could not load. Please retry or email the studio.'); } });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-enquiry-turnstile]');
    if (!script) { script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.dataset.enquiryTurnstile = 'true'; document.head.appendChild(script); }
    script.addEventListener('load', mount); mount();
    return () => { cancelled = true; script?.removeEventListener('load', mount); const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile; if (widget.current !== null) api?.remove(widget.current); widget.current = null; };
  }, [config?.turnstileSiteKey, hasSelected]);
  useEffect(() => { if (state === 'sent' || state === 'error' || Object.keys(errors).length) feedback.current?.focus(); }, [state, errors]);
  useEffect(() => { if (hasSelected) projectHeading.current?.focus(); }, [hasSelected, route]);
  const error = (key: string) => errors[key] ? <span className="field-error" id={'error-' + key}>{errors[key]}</span> : null;
  const props = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? 'error-' + key : undefined });
  // A corrected field should stop looking wrong straight away, not wait for the next send.
  const clearError = (target: EventTarget | null) => {
    const field = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement ? target : null;
    const name = field?.name;
    if (name && errors[name]) setErrors(previous => { const next = { ...previous }; delete next[name]; return next; });
  };
  const patch = (slot: number, change: Partial<Upload>) => setUploads(previous => previous.map(item => item.slot === slot ? { ...item, ...change } : item));
  const transfer = (entry: Upload, held: Ticket) => {
    const url = new URL(endpoint + '/upload', window.location.origin);
    url.searchParams.set('id', submissionId.current); url.searchParams.set('slot', String(entry.slot));
    url.searchParams.set('name', entry.name); url.searchParams.set('ticket', held.ticket); url.searchParams.set('expires', held.expires);
    const controller = new AbortController();
    transfers.current.get(entry.slot)?.abort();
    transfers.current.set(entry.slot, controller);
    patch(entry.slot, { status: 'uploading', progress: 0, error: undefined });
    putFile(url.href, entry.file, fraction => patch(entry.slot, { progress: fraction }), controller.signal)
      .then(() => patch(entry.slot, { status: 'done', progress: 1 }))
      .catch(problem => { if (!controller.signal.aborted) patch(entry.slot, { status: 'error', error: problem instanceof Error ? problem.message : 'This file could not be uploaded.' }); })
      .finally(() => { if (transfers.current.get(entry.slot) === controller) transfers.current.delete(entry.slot); });
  };
  const attach = async (chosen: File[]) => {
    if (!ticket) { setErrors(previous => ({ ...previous, files: 'Complete the verification above before attaching files.' })); return; }
    const room = MAX_FILES - uploads.length;
    if (chosen.length > room) { setErrors(previous => ({ ...previous, files: 'Choose up to ' + MAX_FILES + ' files.' })); return; }
    const prepared = await Promise.all(chosen.map(shrinkImage));
    const issue = validateFiles([...uploads, ...prepared]);
    if (issue) { setErrors(previous => ({ ...previous, files: issue })); return; }
    if (nextSlot.current + prepared.length > MAX_SLOTS) { setErrors(previous => ({ ...previous, files: 'Too many changes to the attachments. Please refresh the page and start again.' })); return; }
    setErrors(previous => ({ ...previous, files: '' }));
    const entries = prepared.map<Upload>(file => ({ slot: nextSlot.current++, name: file.name, size: file.size, file, status: 'uploading', progress: 0 }));
    setUploads(previous => [...previous, ...entries]);
    for (const entry of entries) transfer(entry, ticket);
  };
  const detach = (slot: number) => {
    transfers.current.get(slot)?.abort();
    transfers.current.delete(slot);
    setUploads(previous => previous.filter(item => item.slot !== slot));
    setPreview(current => current === slot ? null : current);
    setErrors(previous => ({ ...previous, files: '' }));
  };
  const uploading = uploads.some(item => item.status === 'uploading');
  const failed = uploads.filter(item => item.status === 'error');
  const stored = uploads.filter(item => item.status === 'done');
  const previewable = stored.find(item => item.slot === preview);
  // Both the step buttons and the send button read the form through here, so they agree on what is wrong.
  const inspect = () => {
    const values = new FormData(form.current!); const field = (key: string) => String(values.get(key) || '');
    const payload = { submissionId: submissionId.current, route, website: field('website'), consent: values.get('consent') === 'on',
      contact: { name: field('name'), email: field('email'), company: field('company'), phone: field('phone'), customerType: field('customerType') },
      brief: field('brief'), quantity: field('quantity'), annualQuantity: route === 'supply' ? field('annualQuantity') : '', frequency: route === 'supply' ? field('frequency') : '',
      material: field('material'), dimensions: field('dimensions'), finish: field('finish'), packaging: field('packaging'), budget: field('budget'),
      requiredBy: field('requiredBy'), deadlineFixed: values.get('deadlineFixed') === 'on', postcode: field('postcode'), destinations: field('destinations'),
      notes: field('notes'), ...source.current
    };
    const checked = validateEnquiry(payload);
    // An attachment that never arrived must not be quietly left out of the enquiry.
    const fileError = failed.length ? 'One of your files did not upload. Retry it or remove it before sending.' : validateFiles(stored);
    if (fileError) checked.errors.files = fileError;
    return checked;
  };
  // Two frames, so React has committed the new step before anything is measured or scrolled.
  const afterPaint = (act: () => void) => requestAnimationFrame(() => requestAnimationFrame(act));
  // Focus alone does not reliably bring a field back into view, so the scroll is explicit.
  const bring = (node: HTMLElement | null | undefined) => { if (!node) return; node.focus({ preventScroll: true }); node.scrollIntoView({ block: 'center' }); };
  const firstProblem = () => form.current?.querySelector<HTMLElement>('fieldset:not([hidden]) [aria-invalid="true"]') ?? null;
  // Moving only moves. Clearing the message is the caller's business, so a failure can send
  // the visitor to another step while its explanation stays on screen.
  const reveal = (next: number) => {
    setStep(next);
    afterPaint(() => bring(firstProblem() ?? legends.current[next]));
  };
  const goTo = (next: number) => { setMessage(''); reveal(next); };
  // Continue only moves on once this step is sound, so nothing is discovered at the very end.
  const advance = () => {
    setMessage('');
    const { errors: found } = inspect();
    const blocking = Object.fromEntries(Object.entries(found).filter(([key, value]) => value && stepFor(key) === step));
    setErrors(previous => ({ ...previous, ...blocking }));
    if (Object.keys(blocking).length) { afterPaint(() => bring(firstProblem())); return; }
    reveal(step + 1);
  };
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (state === 'sending' || !hasSelected || !form.current) return;
    const checked = inspect();
    setErrors(checked.errors); setMessage('');
    if (!checked.data || Object.keys(checked.errors).length) {
      const first = Object.keys(checked.errors).filter(key => checked.errors[key]).map(stepFor).sort()[0] ?? 0;
      setState('idle'); reveal(first);
      return;
    }
    if (!config?.available) { setState('error'); setMessage('Online enquiries are temporarily unavailable. Please email your brief to info@isculptures.com.au.'); return; }
    if (uploading) { setState('error'); setMessage('Your files are still uploading. Please wait for them to finish.'); return; }
    if (config.turnstileSiteKey && !ticket) { setState('error'); setMessage('Please complete the verification on the first step before sending.'); return; }
    setState('sending');
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ ...checked.data, ticket: ticket?.ticket, expires: ticket?.expires, attachments: stored.map(item => item.slot) })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true || typeof result.id !== 'string') {
        const refused = new Error(result.error || 'We could not confirm receipt. Please try again or email the studio.') as Error & { status?: number };
        refused.status = response.status;
        throw refused;
      }
      setReference(result.id); setState('sent');
      track('enquiry_submitted', route);
    } catch (problem) {
      track('enquiry_error', route);
      setState('error'); setMessage(problem instanceof Error ? problem.message : 'We could not confirm receipt. Please try again.');
      // Only a refused verification is worth re-challenging for, and the widget lives on the first step.
      if (problem instanceof Error && (problem as Error & { status?: number }).status === 403) {
        const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile;
        if (widget.current !== null) api?.reset(widget.current);
        setTicket(null); reveal(0);
      }
    }
  };
  if (state === 'sent') return <div ref={feedback} tabIndex={-1} className="enquiry-success" role="status"><p className="section-tag">ENQUIRY RECEIVED</p><h2>Thank you. Your brief is saved.</h2><p>Keep your reference: <strong>{reference}</strong></p><p>The studio will review your requirements and reply to the email you provided. A submitted enquiry does not reserve production or confirm an order.</p><a className="primary" href="/">Back to the studio</a></div>;
  return <>
    <section className="route-picker" aria-labelledby="category-heading" hidden={hasSelected}>
      <p className="route-step">01 / YOUR STARTING POINT</p>
      <h2 id="category-heading" ref={categoryHeading} tabIndex={-1}>What are we making?</h2><p className="route-help">Choose a starting point. We’ll work through the details with you.</p>
      <div className="route-grid">{categories.map(category => <button key={category.route} type="button" className="route-tab" aria-controls="project-enquiry-form" disabled={state === 'sending'} onClick={() => { setRoute(category.route); setHasSelected(true); setStep(0); setErrors({}); setMessage(''); }}>
        <span className="route-tab-top"><span className="route-icon" aria-hidden="true"><RouteIcon route={category.route}/></span><span className="route-arrow" aria-hidden="true">↗</span></span>
        <span className="route-title">{category.title}</span><span className="route-description">{category.description}</span><span className="route-foot">{category.flag && <span className="route-flag">{category.flag}</span>}<span className="route-minimum">BULK ORDERS / 10+ UNITS</span></span>
      </button>)}</div>
      <p className="route-footnote">Your brief → A studio review → Your quote</p>
    </section>
    <form id="project-enquiry-form" hidden={!hasSelected} ref={form} className="enquiry-form staged-enquiry" onSubmit={send}
      onInput={event => clearError(event.target)}
      onChange={event => { clearError(event.target); if (!started.current) { started.current = true; track('enquiry_started', route); } }} noValidate>
    <div className="enquiry-category-intro"><button className="change-category" type="button" disabled={state === 'sending'} onClick={() => { setHasSelected(false); requestAnimationFrame(() => categoryHeading.current?.focus()); }}>← Change category</button><p className="section-tag">YOUR PROJECT</p><h2 ref={projectHeading} tabIndex={-1}>{selectedCategory.title}</h2><p>{selectedCategory.guidance}</p></div>
    <nav className="enquiry-stages" aria-label="Enquiry steps">{STEPS.map((label, index) => {
      const unresolved = Object.keys(errors).some(key => errors[key] && stepFor(key) === index);
      return <button key={label} type="button" className={unresolved ? 'stage-unresolved' : undefined} aria-current={step === index ? 'step' : undefined} aria-label={'0' + (index + 1) + ' ' + label + (unresolved ? ', needs attention' : '')} disabled={state === 'sending'} onClick={() => goTo(index)}>0{index + 1}<span>{label}</span>{unresolved && <em aria-hidden="true">!</em>}</button>;
    })}</nav>
    <fieldset hidden={step !== 0} disabled={state === 'sending'}><legend ref={node => { legends.current[0] = node; }} tabIndex={-1}>Your project</legend>
      <input type="hidden" name="route" value={route}/>
      <label>What would you like to make? <span>(required)</span><textarea name="brief" maxLength={5000} rows={4} {...props('brief')} placeholder={selectedCategory.prompt}/>{error('brief')}</label>
      <div className="enquiry-grid"><label>Quantity per order <span>(leave blank if unsure)</span><input name="quantity" type="number" min={route === 'bulk' || route === 'supply' ? 10 : 1} max={10000000} step="1" {...props('quantity')}/>{error('quantity')}</label><label>Approximate size / dimensions<input name="dimensions" maxLength={500} placeholder="e.g. 80 mm tall"/></label></div>
      <div className="enquiry-grid" hidden={route !== 'supply'}><label>Estimated annual quantity<input name="annualQuantity" disabled={route !== 'supply'} type="number" min="1" max={10000000} step="1" {...props('annualQuantity')}/>{error('annualQuantity')}</label><label>Order frequency<input name="frequency" maxLength={200} placeholder="e.g. one-off, monthly, quarterly, seasonal" disabled={route !== 'supply'}/></label></div>
      <details className="optional-details"><summary>Materials, finish, packaging &amp; budget (optional)</summary><div className="enquiry-grid"><label>Material preference<input name="material" maxLength={200} placeholder="Not sure? We can recommend."/></label><label>Finish / colour / branding<input name="finish" maxLength={500}/></label><label>Packaging requirements<input name="packaging" maxLength={500}/></label><label>Budget or target unit price (AUD)<input name="budget" maxLength={100} placeholder="e.g. $15 per item, or $2,000 total"/></label></div></details>
      <div className="attachment-panel"><label htmlFor="files">Supporting files <span>(optional)</span></label><p id="file-help">STL, OBJ, 3MF, PDF, PNG, JPG or HEIC. Up to {MAX_FILES} files; 50 MB each, 150 MB total. Files upload as you choose them and are stored privately. Photographs are resized before sending.</p>
        <input id="files" type="file" multiple accept={EXTENSIONS.map(value => '.' + value).join(',')} disabled={!config?.uploads || !ticket || uploads.length >= MAX_FILES} aria-describedby="file-help" onChange={event => { const chosen = Array.from(event.target.files || []); event.target.value = ''; attach(chosen); }}/>
        <div className="challenge-panel" hidden={!config?.turnstileSiteKey}><div ref={challenge}/></div>
        {config?.uploads && !ticket && <p className="attachment-hint">Complete the check above to attach files.</p>}
        {error('files')}
        {uploads.length > 0 && <ul className="attachment-list">{uploads.map(item => <li key={item.slot} className={'attachment attachment-' + item.status}>
          <span className="attachment-name">{item.name}</span><span className="attachment-size">{fileSize(item.size)}</span>
          <span className="attachment-state">{item.status === 'uploading' ? Math.round(item.progress * 100) + '%' : item.status === 'done' ? 'Uploaded' : 'Failed'}</span>
          <progress className="attachment-progress" max={100} value={item.status === 'done' ? 100 : Math.round(item.progress * 100)} aria-label={'Upload progress for ' + item.name}/>
          {item.status === 'error' && <span className="attachment-error">{item.error} <button type="button" className="text-btn" onClick={() => { if (ticket) transfer(item, ticket); }}>Retry</button></span>}
          <button type="button" className="text-btn attachment-remove" onClick={() => detach(item.slot)} aria-label={'Remove ' + item.name}>Remove</button>
        </li>)}</ul>}
      </div>
      {stored.some(item => /\.(stl|obj)$/i.test(item.name)) && <button className="text-btn" type="button" onClick={() => setPreview(preview === null ? stored.find(item => /\.(stl|obj)$/i.test(item.name))!.slot : null)}>{preview === null ? 'Preview a 3D model (optional)' : 'Close 3D preview'}</button>}
      {previewable && <ModelPreview key={previewable.slot} file={previewable.file}/>}
    </fieldset>
    <fieldset hidden={step !== 1} disabled={state === 'sending'}><legend ref={node => { legends.current[1] = node; }} tabIndex={-1}>Timing &amp; delivery</legend><div className="enquiry-grid"><label>Required delivery date<input name="requiredBy" type="date" min={today || undefined} {...props('requiredBy')}/>{error('requiredBy')}</label><label>Delivery suburb / postcode<input name="postcode" maxLength={100} autoComplete="postal-code"/></label></div><label className="check-label"><input type="checkbox" name="deadlineFixed"/>This delivery date is fixed</label><label>Multiple destinations or delivery notes <span>(optional)</span><input name="destinations" maxLength={500}/></label></fieldset>
    <fieldset hidden={step !== 2} disabled={state === 'sending'}><legend ref={node => { legends.current[2] = node; }} tabIndex={-1}>Your contact details</legend><div className="enquiry-grid"><label>Your name <span>(required)</span><input name="name" autoComplete="name" maxLength={200} {...props('name')}/>{error('name')}</label><label>Email <span>(required)</span><input name="email" type="email" autoComplete="email" maxLength={254} {...props('email')}/>{error('email')}</label><label>Company / organisation<input name="company" autoComplete="organization" maxLength={200}/></label><label>Phone <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40}/></label></div>
    <label>I’m enquiring as<select name="customerType" defaultValue=""><option value="">Please select (optional)</option>{CUSTOMER_TYPES.map(type => <option key={type}>{type}</option>)}</select></label><label>Anything else we should know?<textarea name="notes" rows={3} maxLength={3000} placeholder="Repeat order reference, approvals, tolerances, supplier onboarding or confidentiality requirements."/></label>
    <div className="trap" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="check-label"><input name="consent" type="checkbox" {...props('consent')}/><span>I have read the <a href="/policies/privacy-policy" target="_blank" rel="noreferrer">privacy notice</a> and understand my details and files will be used to respond to this enquiry.</span></label>{error('consent')}
    </fieldset>
    <div ref={feedback} tabIndex={-1} role={state === 'error' || Object.values(errors).some(Boolean) ? 'alert' : undefined}>{Object.values(errors).some(Boolean) && <p className="form-error">Please check the highlighted fields above.</p>}{message && <p className="form-error">{message} <a href="mailto:info@isculptures.com.au">Email the studio</a>.</p>}</div>
    <div className="enquiry-step-actions">{step > 0 && <button className="previous-step" type="button" disabled={state === 'sending'} onClick={() => goTo(step - 1)}>← Back</button>}{step < 2 && <button className="primary next-step" type="button" onClick={advance}>Continue to {step === 0 ? 'delivery' : 'contact'} ↗</button>}
    <button hidden={step !== 2} className="primary" type="submit" disabled={state === 'sending' || !config?.available || uploading || (!!config?.turnstileSiteKey && !ticket)}>{state === 'sending' ? 'Sending your enquiry…' : uploading ? 'Waiting for your files…' : 'Send project enquiry ↗'}</button></div>
    <p className="fineprint">We confirm availability, materials, pricing and lead time after reviewing your brief. <a href="/policies/terms-of-service">About enquiries and orders</a>.</p>
  </form></>;
}
