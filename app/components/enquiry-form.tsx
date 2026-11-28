'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CUSTOMER_TYPES, HEARD_FROM, EXTENSIONS, IMAGE_EXTENSIONS, MAX_FILES, MAX_SLOTS, extensionOf, validateEnquiry, validateFiles, type EnquiryRoute } from '../../lib/enquiry';
import dynamic from 'next/dynamic';
import RouteIcon from './route-icons';
import PrintComplete from './print-complete';
import { track } from '../../lib/analytics';
const ModelPreview = dynamic(() => import('./model-preview'), { ssr: false });

type Config = { available: boolean; uploads: boolean; turnstileSiteKey?: string };
type TurnstileAPI = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void };
type Ticket = { ticket: string; expires: string };
// A file chosen before the human check has passed waits, and uploads the moment it does.
type Upload = { slot: number; name: string; size: number; file: File; status: 'waiting' | 'uploading' | 'done' | 'error'; progress: number; error?: string };
const endpoint = process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT || '/api/enquiry';
const categories: { route: EnquiryRoute; title: string; description: string; guidance: string; prompt: string; flag?: string }[] = [
  { route: 'bulk', title: 'Event favours & gifts', description: 'Bonbonniere, keepsakes and personalised gifts for weddings, christenings and other events.', guidance: '', prompt: 'What’s the occasion? Include the number of guests, any names or wording, and the event date.' },
  { route: 'supply', title: 'Business & repeat orders', description: 'Stock for your shop, branded products or batches you’ll reorder.', guidance: '', prompt: 'What do you need made? Include the quantity and whether it’s a one-off or something you’ll reorder.' },
  { route: 'design', title: 'Start from an idea', flag: 'FREE DESIGN MOCKUP', description: 'No 3D file? Send a sketch, photo or description and we’ll work out the design.', guidance: 'Any design costs are included in your quote.', prompt: 'Describe your idea: what it’s for, roughly how big, and any photos or references you like.' },
  { route: 'file', title: 'I have a 3D file', description: 'Send an STL, OBJ or 3MF and we’ll check it’s ready to print.', guidance: 'Tell us if you need a prototype first.', prompt: 'What’s the part for? Include the quantity, size, any material preference and the tolerances that matter.' },
];
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
// One page, not steps. The only things a visitor must give are what they want made, a name and
// an email; everything else is either optional in plain sight or folded into "Add more detail".
// The Send button is never silently disabled: pressing it always either sends or says why not.
export default function EnquiryForm() {
  const [route, setRoute] = useState<EnquiryRoute>('bulk');
  const [hasSelected, setHasSelected] = useState(false);
  const [heardFrom, setHeardFrom] = useState('');
  const heardDetail = HEARD_FROM.find(item => item.option === heardFrom)?.detail;
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
  // Read by code that runs after an await, where the rendered `ticket` may already be stale.
  const ticketRef = useRef<Ticket | null>(null);
  const holdTicket = (value: Ticket | null) => { ticketRef.current = value; setTicket(value); };
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const challenge = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const submissionId = useRef('');
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
  // The check mounts as soon as the form shows, so most visitors have passed it long before they
  // reach Send. It sits directly above Send, where anyone Cloudflare asks to tick it will see it.
  useEffect(() => {
    if (!config?.turnstileSiteKey || !challenge.current || !hasSelected) return;
    let cancelled = false;
    const claim = async (value: string) => {
      try {
        const response = await fetch(endpoint + '/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: submissionId.current, turnstileToken: value }), signal: AbortSignal.timeout(15000) });
        const result = await response.json() as Ticket & { error?: string };
        if (!response.ok || typeof result.ticket !== 'string') throw new Error(result.error || 'Verification could not be completed. Please retry.');
        if (!cancelled) { holdTicket({ ticket: result.ticket, expires: String(result.expires) }); setMessage(''); setState(current => current === 'error' ? 'idle' : current); }
      } catch (problem) {
        if (!cancelled) { holdTicket(null); setMessage(problem instanceof Error ? problem.message : 'Verification could not be completed. Please retry.'); }
      }
    };
    const mount = () => {
      const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile;
      // The ticket a token buys lasts far longer than the token, so an expired token keeps the
      // ticket. The widget refreshes itself, and a fresh pass simply replaces the ticket.
      if (!cancelled && api && challenge.current && widget.current === null) widget.current = api.render(challenge.current, { sitekey: config.turnstileSiteKey, action: 'enquiry', callback: (value: string) => claim(value), 'error-callback': () => { holdTicket(null); setMessage('The human check could not load. Please refresh the page, or email the studio.'); } });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-enquiry-turnstile]');
    if (!script) { script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.dataset.enquiryTurnstile = 'true'; document.head.appendChild(script); }
    script.addEventListener('load', mount); mount();
    return () => { cancelled = true; script?.removeEventListener('load', mount); const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile; if (widget.current !== null) api?.remove(widget.current); widget.current = null; };
  }, [config?.turnstileSiteKey, hasSelected]);
  useEffect(() => { if (state === 'sent') feedback.current?.focus(); }, [state]);
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
  // Files chosen before the check passed start uploading as soon as it does.
  useEffect(() => {
    if (!ticket) return;
    for (const item of uploads) if (item.status === 'waiting') transfer(item, ticket);
  }, [ticket]); // eslint-disable-line react-hooks/exhaustive-deps
  const attach = async (chosen: File[]) => {
    const room = MAX_FILES - uploads.length;
    if (chosen.length > room) { setErrors(previous => ({ ...previous, files: 'Choose up to ' + MAX_FILES + ' files.' })); return; }
    const prepared = await Promise.all(chosen.map(shrinkImage));
    const issue = validateFiles([...uploads, ...prepared]);
    if (issue) { setErrors(previous => ({ ...previous, files: issue })); return; }
    if (nextSlot.current + prepared.length > MAX_SLOTS) { setErrors(previous => ({ ...previous, files: 'Too many changes to the attachments. Please refresh the page and start again.' })); return; }
    setErrors(previous => ({ ...previous, files: '' }));
    const held = ticketRef.current;
    const entries = prepared.map<Upload>(file => ({ slot: nextSlot.current++, name: file.name, size: file.size, file, status: held ? 'uploading' : 'waiting', progress: 0 }));
    setUploads(previous => [...previous, ...entries]);
    if (held) for (const entry of entries) transfer(entry, held);
  };
  const detach = (slot: number) => {
    transfers.current.get(slot)?.abort();
    transfers.current.delete(slot);
    setUploads(previous => previous.filter(item => item.slot !== slot));
    setPreview(current => current === slot ? null : current);
    setErrors(previous => ({ ...previous, files: '' }));
  };
  const uploading = uploads.some(item => item.status === 'uploading' || item.status === 'waiting');
  const failed = uploads.filter(item => item.status === 'error');
  const stored = uploads.filter(item => item.status === 'done');
  const previewable = stored.find(item => item.slot === preview);
  const inspect = () => {
    const values = new FormData(form.current!); const field = (key: string) => String(values.get(key) || '');
    // Consent is the privacy line printed directly above the Send button: pressing Send after
    // reading it is the acknowledgement, so the visitor no longer has to tick a box for it.
    const payload = { submissionId: submissionId.current, route, website: field('website'), consent: true,
      contact: { name: field('name'), email: field('email'), company: field('company'), phone: field('phone'), customerType: field('customerType') },
      brief: field('brief'), quantity: field('quantity'), annualQuantity: route === 'supply' ? field('annualQuantity') : '', frequency: route === 'supply' ? field('frequency') : '',
      material: field('material'), dimensions: field('dimensions'), finish: field('finish'), packaging: field('packaging'), budget: field('budget'),
      requiredBy: field('requiredBy'), deadlineFixed: values.get('deadlineFixed') === 'on', postcode: field('postcode'), destinations: field('destinations'),
      notes: field('notes'), heardFrom: field('heardFrom'), heardFromDetail: field('heardFromDetail'), ...source.current
    };
    const checked = validateEnquiry(payload);
    // An attachment that never arrived must not be quietly left out of the enquiry.
    const fileError = failed.length ? 'One of your files did not upload. Retry it or remove it before sending.' : validateFiles(stored);
    if (fileError) checked.errors.files = fileError;
    return checked;
  };
  // Two frames, so React has committed the change before anything is measured or scrolled.
  const afterPaint = (act: () => void) => requestAnimationFrame(() => requestAnimationFrame(act));
  // Focus alone does not reliably bring a field back into view, so the scroll is explicit. A
  // field folded inside "Add more detail" is unfolded first, or it could not be seen or fixed.
  const bring = (node: HTMLElement | null | undefined) => {
    if (!node) return;
    const fold = node.closest('details');
    if (fold) fold.open = true;
    node.focus({ preventScroll: true }); node.scrollIntoView({ block: 'center' });
  };
  // Every reason Send cannot go ahead lands here, next to the button, and is read out.
  const refuse = (text: string) => { setState('error'); setMessage(text); afterPaint(() => bring(feedback.current)); };
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (state === 'sending' || !hasSelected || !form.current) return;
    const checked = inspect();
    setErrors(checked.errors); setMessage('');
    if (!checked.data || Object.values(checked.errors).some(Boolean)) {
      setState('idle');
      afterPaint(() => bring(form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? feedback.current));
      return;
    }
    if (!config) return refuse('Still connecting to the studio. Please wait a moment and press Send again.');
    if (!config.available) return refuse('Online enquiries are temporarily unavailable. Please email your brief to info@isculptures.com.au.');
    if (config.turnstileSiteKey && !ticketRef.current) return refuse('One last step: tick “Verify you are human” just above, then press Send again.');
    if (uploading) return refuse('Your files are still uploading. Press Send again once each one shows “Uploaded”.');
    setState('sending');
    try {
      const held = ticketRef.current;
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ ...checked.data, ticket: held?.ticket, expires: held?.expires, attachments: stored.map(item => item.slot) })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true || typeof result.id !== 'string') {
        const refused = new Error(result.error || 'We could not confirm receipt. Please try again or email the studio.') as Error & { status?: number };
        refused.status = response.status;
        throw refused;
      }
      setReference(result.id); setState('sent');
      track('enquiry_submitted', route);
      const googleTag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      googleTag?.('event', 'conversion', {
        send_to: 'AW-16848127291/0_VsCI__nL8dELuK6OE-',
        transaction_id: result.id
      });
    } catch (problem) {
      track('enquiry_error', route);
      // A refused verification means the check has to be passed again, right above the button.
      if (problem instanceof Error && (problem as Error & { status?: number }).status === 403) {
        const api = (window as Window & { turnstile?: TurnstileAPI }).turnstile;
        if (widget.current !== null) api?.reset(widget.current);
        holdTicket(null);
      }
      refuse(problem instanceof Error ? problem.message : 'We could not confirm receipt. Please try again.');
    }
  };
  if (state === 'sent') return <div ref={feedback} tabIndex={-1} className="enquiry-success" role="status"><div className="enquiry-success-text"><p className="section-tag">ENQUIRY RECEIVED</p><h2>Thanks, we’ve got your enquiry.</h2><p>Your reference is <strong>{reference}</strong></p><p>We’ll read through it and reply to the email address you gave us. Sending an enquiry doesn’t lock in an order or a production slot.</p><a className="primary" href="/">Back to home</a></div><PrintComplete/></div>;
  const hasErrors = Object.values(errors).some(Boolean);
  return <>
    <section className="route-picker" aria-labelledby="category-heading" hidden={hasSelected}>
      
      <h2 id="category-heading" ref={categoryHeading} tabIndex={-1}>What do you need made?</h2><p className="route-help">Pick the closest option. You can explain the rest in the form.</p>
      <div className="route-grid">{categories.map(category => <button key={category.route} type="button" className="route-tab" aria-controls="project-enquiry-form" disabled={state === 'sending'} onClick={() => { setRoute(category.route); setHasSelected(true); setErrors({}); setMessage(''); }}>
        <span className="route-tab-top"><span className="route-icon" aria-hidden="true"><RouteIcon route={category.route}/></span><span className="route-arrow" aria-hidden="true">↗</span></span>
        <span className="route-title">{category.title}</span><span className="route-description">{category.description}</span><span className="route-foot">{category.flag && <span className="route-flag">{category.flag}</span>}</span>
      </button>)}</div>
      <p className="route-footnote">You send a brief → We review it → You get a quote</p>
    </section>
    <form id="project-enquiry-form" hidden={!hasSelected} ref={form} className="enquiry-form staged-enquiry single-enquiry" onSubmit={send}
      onInput={event => clearError(event.target)}
      onChange={event => { clearError(event.target); if (!started.current) { started.current = true; track('enquiry_started', route); } }} noValidate>
    <div className="enquiry-category-intro"><button className="change-category" type="button" disabled={state === 'sending'} onClick={() => { setHasSelected(false); requestAnimationFrame(() => categoryHeading.current?.focus()); }}>← Change category</button><p className="section-tag">YOUR PROJECT</p><h2 ref={projectHeading} tabIndex={-1}>{selectedCategory.title}</h2><p>{[selectedCategory.guidance, 'Only your idea, name and email are needed.'].filter(Boolean).join(' ')}</p></div>
    <fieldset disabled={state === 'sending'}><legend className="visually-hidden">Your enquiry</legend>
      <input type="hidden" name="route" value={route}/>
      <label>What would you like made? <span>(required)</span><textarea name="brief" maxLength={5000} rows={5} {...props('brief')} placeholder={selectedCategory.prompt}/>{error('brief')}</label>
      <div className="enquiry-grid">
        <label>{route === 'supply' ? 'Quantity per order' : 'How many?'} <span>(optional)</span><input name="quantity" type="number" inputMode="numeric" min={1} max={10000000} step="1" {...props('quantity')}/>{error('quantity')}</label>
        <label>Needed by <span>(optional)</span><input name="requiredBy" type="date" min={today || undefined} {...props('requiredBy')}/>{error('requiredBy')}</label>
      </div>
      <div className="enquiry-grid">
        <label>Your name <span>(required)</span><input name="name" autoComplete="name" maxLength={200} {...props('name')}/>{error('name')}</label>
        <label>Email <span>(required)</span><input name="email" type="email" autoComplete="email" maxLength={254} {...props('email')}/>{error('email')}</label>
      </div>
      <div className="enquiry-grid">
        <label>Phone <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40}/></label>
        <label>Delivery suburb or postcode <span>(optional)</span><input name="postcode" maxLength={100} autoComplete="postal-code"/></label>
      </div>
      {/* Visible rather than folded into "Add more detail", or almost nobody would answer it. The
          follow-up box is keyed to the answer so text typed for one choice never rides onto another. */}
      <div className="enquiry-grid">
        <label>How did you hear about us? <span>(optional)</span><select name="heardFrom" value={heardFrom} onChange={event => setHeardFrom(event.target.value)}><option value="">Please select</option>{HEARD_FROM.map(({ option }) => <option key={option}>{option}</option>)}</select></label>
        {heardDetail && <label key={heardFrom}>{heardDetail} <span>(optional)</span><input name="heardFromDetail" maxLength={200}/></label>}
      </div>
      <div className="attachment-panel"><label htmlFor="files">Photos, sketches or 3D files <span>(optional)</span></label><p id="file-help">PNG, JPG, HEIC, PDF, STL, OBJ or 3MF. Up to {MAX_FILES} files, 50 MB each. They’re stored privately.</p>
        <input id="files" type="file" multiple accept={EXTENSIONS.map(value => '.' + value).join(',')} disabled={!config?.uploads || uploads.length >= MAX_FILES} aria-describedby="file-help" onChange={event => { const chosen = Array.from(event.target.files || []); event.target.value = ''; attach(chosen); }}/>
        {error('files')}
        {uploads.length > 0 && <ul className="attachment-list">{uploads.map(item => <li key={item.slot} className={'attachment attachment-' + item.status}>
          <span className="attachment-name">{item.name}</span><span className="attachment-size">{fileSize(item.size)}</span>
          <span className="attachment-state">{item.status === 'waiting' ? 'Uploads after the check below' : item.status === 'uploading' ? Math.round(item.progress * 100) + '%' : item.status === 'done' ? 'Uploaded' : 'Failed'}</span>
          <progress className="attachment-progress" max={100} value={item.status === 'done' ? 100 : Math.round(item.progress * 100)} aria-label={'Upload progress for ' + item.name}/>
          {item.status === 'error' && <span className="attachment-error">{item.error} <button type="button" className="text-btn" onClick={() => { if (ticketRef.current) transfer(item, ticketRef.current); }}>Retry</button></span>}
          <button type="button" className="text-btn attachment-remove" onClick={() => detach(item.slot)} aria-label={'Remove ' + item.name}>Remove</button>
        </li>)}</ul>}
        {stored.some(item => /\.(stl|obj)$/i.test(item.name)) && <button className="text-btn" type="button" onClick={() => setPreview(preview === null ? stored.find(item => /\.(stl|obj)$/i.test(item.name))!.slot : null)}>{preview === null ? 'Preview a 3D model (optional)' : 'Close 3D preview'}</button>}
        {previewable && <ModelPreview key={previewable.slot} file={previewable.file}/>}
      </div>
      <details className="optional-details"><summary>Add more detail (optional)</summary>
        <div className="enquiry-grid" hidden={route !== 'supply'}><label>Estimated annual quantity<input name="annualQuantity" disabled={route !== 'supply'} type="number" inputMode="numeric" min="1" max={10000000} step="1" {...props('annualQuantity')}/>{error('annualQuantity')}</label><label>Order frequency<input name="frequency" maxLength={200} placeholder="e.g. one-off, monthly, quarterly, seasonal" disabled={route !== 'supply'}/></label></div>
        <div className="enquiry-grid">
          <label>Approximate size<input name="dimensions" maxLength={500} placeholder="e.g. 80 mm tall"/></label>
          <label>Finish, colour or branding<input name="finish" maxLength={500}/></label>
          <label>Packaging<input name="packaging" maxLength={500} placeholder="e.g. boxed with ribbon and a name tag"/></label>
          <label>Budget or target price (AUD)<input name="budget" maxLength={100} placeholder="e.g. $15 per item, or $2,000 total"/></label>
          <label>Material preference<input name="material" maxLength={200} placeholder="Not sure? We can recommend."/></label>
          <label>Company or organisation<input name="company" autoComplete="organization" maxLength={200}/></label>
        </div>
        <label>I’m enquiring as<select name="customerType" defaultValue=""><option value="">Please select</option>{CUSTOMER_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
        <label className="check-label"><input type="checkbox" name="deadlineFixed"/>The date can’t move (for example, an event day)</label>
        <label>Multiple destinations or delivery notes<input name="destinations" maxLength={500}/></label>
        <label>Anything else we should know?<textarea name="notes" rows={3} maxLength={3000} placeholder="Repeat order reference, approvals, tolerances, supplier onboarding or confidentiality requirements."/></label>
      </details>
    </fieldset>
    <div className="trap" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="challenge-panel" hidden={!config?.turnstileSiteKey}><div ref={challenge}/></div>
    <div ref={feedback} tabIndex={-1} className="enquiry-feedback" aria-live="assertive">{hasErrors && <p className="form-error">Please check the highlighted fields above.</p>}{message && <p className="form-error">{message} <a href="mailto:info@isculptures.com.au">Email the studio</a>.</p>}</div>
    <p className="fineprint consent-note">By sending, you agree we can use your details and any files to reply to this enquiry, as set out in our <a href="/policies/privacy-policy" target="_blank" rel="noreferrer">privacy notice</a>.</p>
    <div className="enquiry-step-actions enquiry-send"><button className="primary" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending your enquiry…' : 'Send enquiry ↗'}</button></div>
    <p className="fineprint">We’ll confirm materials, price and lead time once we’ve seen your brief. <a href="/policies/terms-of-service">How enquiries and orders work</a>.</p>
  </form></>;
}
