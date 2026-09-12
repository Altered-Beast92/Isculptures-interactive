import { EXTENSIONS, MAX_FILES, MAX_FILE_BYTES, MAX_SLOTS, MAX_UPLOAD_BYTES, TICKET_SECONDS, extensionOf, validateEnquiry, validateFiles, validateSlots, type Enquiry } from '../../lib/enquiry.js';

export interface Env {
  ENQUIRIES?: R2Bucket;
  RESEND_API_KEY?: string;
  ENQUIRY_TO?: string;
  ENQUIRY_FROM?: string;
  ENQUIRIES_ENABLED?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  FILE_LINK_SECRET?: string;
  ENQUIRY_ADMIN_TOKEN?: string;
  // Comma-separated exact website origins. Undefined preserves same-origin hosting.
  ENQUIRY_ALLOWED_ORIGINS?: string;
}
type Attachment = { name: string; size: number; key: string };
export type RecordData = Enquiry & { id: string; receivedAt: string; attachments: Attachment[]; notification: 'pending' | 'sent'; receipt: 'pending' | 'sent' };
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' } });
function parseOrigins(value: string): string[] {
  const entries = value.split(',').map(origin => origin.trim()).filter(Boolean);
  if (!entries.length) return [];
  try {
    return entries.every(origin => {
      const url = new URL(origin);
      return !origin.includes('*') && url.origin === origin && (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
    }) ? entries : [];
  } catch { return []; }
}
export function enquiryOrigins(request: Request, env: Env): string[] {
  return env.ENQUIRY_ALLOWED_ORIGINS === undefined ? [new URL(request.url).origin] : parseOrigins(env.ENQUIRY_ALLOWED_ORIGINS);
}
export function configured(env: Env) { return !!(env.ENQUIRIES && env.RESEND_API_KEY && env.ENQUIRY_TO && env.ENQUIRY_FROM && env.FILE_LINK_SECRET && env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY && env.ENQUIRIES_ENABLED === 'true' && (env.ENQUIRY_ALLOWED_ORIGINS === undefined || parseOrigins(env.ENQUIRY_ALLOWED_ORIGINS).length)); }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keyFor = (id: string) => 'enquiries/' + id + '/enquiry.json';
const filesPrefix = (id: string) => 'enquiries/' + id + '/files/';
const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^[-.]+/, '').slice(-120);
// Keys are '<slot>-<name>', so both parts read back without a second lookup.
const tailOf = (key: string) => key.slice(key.lastIndexOf('/') + 1);
const slotOf = (key: string) => Number(tailOf(key).slice(0, tailOf(key).indexOf('-')));
const nameOf = (key: string) => tailOf(key).slice(tailOf(key).indexOf('-') + 1);
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

async function limitedBody(request: Request, max: number): Promise<ArrayBuffer> {
  if (Number(request.headers.get('content-length') || 0) > max) throw new Error('size');
  const reader = request.body?.getReader(); if (!reader) throw new Error('body');
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const result = await reader.read(); if (result.done) break; length += result.value.byteLength; if (length > max) { await reader.cancel(); throw new Error('size'); } chunks.push(result.value); }
  const joined = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  return joined.buffer;
}
async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
async function equal(a: string, b: string) {
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const x = await digest(a), y = await digest(b); let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}
async function fileLink(env: Env, origin: string, key: string) {
  const expires = String(Math.floor(Date.now() / 1000) + 7 * 86400);
  const url = new URL('/api/enquiry/file', origin); url.searchParams.set('key', key); url.searchParams.set('expires', expires);
  url.searchParams.set('signature', await sign(env.FILE_LINK_SECRET!, key + ':' + expires));
  return url.href;
}
async function sendEmail(env: Env, idempotency: string, to: string, subject: string, body: string, replyTo?: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': idempotency },
    body: JSON.stringify({ from: env.ENQUIRY_FROM, to: [to], reply_to: replyTo, subject, text: body, html: '<pre style="white-space:pre-wrap;font:15px/1.6 sans-serif">' + escape(body) + '</pre>' })
  });
  if (!response.ok) throw new Error('Email delivery failed: ' + response.status);
}
export async function notify(record: RecordData, env: Env, origin: string) {
  if (!env.RESEND_API_KEY || !env.ENQUIRY_TO || !env.ENQUIRY_FROM || !env.FILE_LINK_SECRET || !env.ENQUIRIES) return record;
  // Unanswered fields are dropped, so the studio reads only what the visitor actually filled in. The full record stays in R2.
  const filled = (entries: [string, string | number | null][]) => entries.filter(([, value]) => value !== '' && value !== null).map(([label, value]) => label + ': ' + value);
  const delivery = record.requiredBy ? record.requiredBy + (record.deadlineFixed ? ' (fixed deadline)' : '') : record.deadlineFixed ? 'Not given — deadline is fixed' : '';
  const utm: [string, string][] = [['source', record.campaign.source], ['medium', record.campaign.medium], ['campaign', record.campaign.campaign]];
  const campaign = utm.filter(([, value]) => value).map(([label, value]) => label + '=' + value).join(' · ');
  const attachments: string[] = [];
  for (const file of record.attachments) attachments.push(file.name + ' (' + file.size + ' bytes): ' + await fileLink(env, origin, file.key));
  // A group that loses every line loses its separator too, so no run of blank lines survives.
  const lines = [
    filled([['Reference', record.id], ['Received', record.receivedAt], ['Enquiry type', record.route]]),
    filled([['Name', record.contact.name], ['Email', record.contact.email], ['Company', record.contact.company],
      ['Phone', record.contact.phone], ['Customer type', record.contact.customerType]]),
    filled([['Brief', record.brief], ['Quantity per order', record.quantity], ['Annual quantity', record.annualQuantity],
      ['Frequency', record.frequency], ['Material', record.material], ['Dimensions', record.dimensions],
      ['Finish / branding', record.finish], ['Packaging', record.packaging], ['Budget (AUD)', record.budget]]),
    filled([['Required delivery', delivery], ['Postcode / suburb', record.postcode], ['Delivery notes', record.destinations], ['Other notes', record.notes]]),
    filled([['Campaign', campaign], ['Referrer host', record.referrerHost]]),
    attachments.length ? ['Private attachments (links expire in 7 days):', ...attachments] : []
  ].filter(group => group.length).flatMap((group, index) => index ? ['', ...group] : group);
  if (record.notification !== 'sent') {
    try { await sendEmail(env, record.id + '-studio', env.ENQUIRY_TO, 'Project enquiry — ' + record.contact.name + ' — ' + record.id, lines.join('\n'), record.contact.email); record.notification = 'sent'; }
    catch { console.error('enquiry_notification_pending', record.id); }
  }
  if (record.receipt !== 'sent') {
    try { await sendEmail(env, record.id + '-receipt', record.contact.email, 'Your iSculptures enquiry — ' + record.id, 'Thank you for your enquiry.\n\nReference: ' + record.id + '\n\nYour brief has been saved. The studio will review your requirements and reply to this email address. An enquiry does not confirm an order or reserve production.\n\nFor updates, reply quoting your reference.\niSculptures\ninfo@isculptures.com.au\n0437 383 684', env.ENQUIRY_TO); record.receipt = 'sent'; }
    catch { console.error('enquiry_receipt_pending', record.id); }
  }
  await env.ENQUIRIES.put(keyFor(record.id), JSON.stringify(record), { httpMetadata: { contentType: 'application/json' } });
  return record;
}
// Sniffed from the opening bytes of the stream, so a mismatched file never reaches storage.
export function plausibleBytes(name: string, bytes: Uint8Array, size: number) {
  const decode = (from: number, to: number) => new TextDecoder().decode(bytes.slice(from, to));
  const prefix = decode(0, 512);
  switch (extensionOf(name)) {
    case 'pdf': return prefix.startsWith('%PDF-');
    case 'png': return bytes.length >= 8 && Array.from(bytes.slice(0, 8)).join(',') === '137,80,78,71,13,10,26,10';
    case 'jpg': case 'jpeg': return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    // HEIC and HEIF are ISO base media files: a box length, then the 'ftyp' marker.
    case 'heic': case 'heif': return bytes.length >= 12 && decode(4, 8) === 'ftyp';
    case '3mf': return bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
    case 'stl': return /^\s*solid\b/i.test(prefix) || (size >= 84 && bytes.byteLength >= 84 && new DataView(bytes.buffer, bytes.byteOffset, 84).getUint32(80, true) * 50 + 84 === size);
    case 'obj': return !prefix.includes('\0') && !/<(?:html|script|svg)\b/i.test(prefix);
    default: return false;
  }
}
async function verifyTurnstile(env: Env, origin: string, token: unknown, ip: string | null): Promise<'ok' | 'failed' | 'unavailable'> {
  if (typeof token !== 'string' || !token || token.length > 2048) return 'failed';
  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip || undefined })
    });
    const result = await verification.json() as { success?: boolean; hostname?: string; action?: string };
    return result.success === true && result.hostname === new URL(origin).hostname && result.action === 'enquiry' ? 'ok' : 'failed';
  } catch { return 'unavailable'; }
}
// One Turnstile check buys a ticket, and the ticket authorises every upload for that reference.
const ticketFor = (env: Env, id: string, expires: string) => sign(env.FILE_LINK_SECRET!, 'upload:' + id + ':' + expires);
async function ticketValid(env: Env, id: string, expires: string, ticket: string) {
  const seconds = Date.now() / 1000;
  if (!/^\d{10}$/.test(expires) || Number(expires) < seconds || Number(expires) > seconds + TICKET_SECONDS + 60) return false;
  if (!/^[a-f0-9]{64}$/.test(ticket)) return false;
  return equal(ticket, await ticketFor(env, id, expires));
}
function website(request: Request, env: Env) {
  const origin = request.headers.get('origin');
  return origin && enquiryOrigins(request, env).includes(origin) ? origin : null;
}
export async function handleTicket(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const origin = website(request, env);
  if (!origin) return json({ error: 'Please submit from this website.' }, 403);
  if (!configured(env)) return json({ error: 'Online enquiries are not available. Please email info@isculptures.com.au.' }, 503);
  let input: Record<string, unknown>;
  try { input = JSON.parse(new TextDecoder().decode(await limitedBody(request, 8 * 1024))) as Record<string, unknown>; }
  catch { return json({ error: 'Could not read this request.' }, 400); }
  const id = typeof input.submissionId === 'string' ? input.submissionId : '';
  if (!UUID.test(id)) return json({ error: 'Refresh the page and try again.' }, 400);
  const state = await verifyTurnstile(env, origin, input.turnstileToken, request.headers.get('CF-Connecting-IP'));
  if (state === 'unavailable') return json({ error: 'Verification is unavailable. Please retry shortly.' }, 503);
  if (state === 'failed') return json({ error: 'Verification expired or failed. Please retry.' }, 403);
  if (await env.ENQUIRIES!.head(keyFor(id))) return json({ error: 'This enquiry has already been sent.' }, 409);
  const expires = String(Math.floor(Date.now() / 1000) + TICKET_SECONDS);
  return json({ ticket: await ticketFor(env, id, expires), expires });
}
export async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'PUT') return json({ error: 'Method not allowed.' }, 405);
  const origin = website(request, env);
  if (!origin) return json({ error: 'Please submit from this website.' }, 403);
  if (!configured(env)) return json({ error: 'Uploads are not available.' }, 503);
  const parameters = new URL(request.url).searchParams;
  const id = parameters.get('id') || '', slot = Number(parameters.get('slot')), name = safeName(parameters.get('name') || '');
  if (!UUID.test(id) || !Number.isInteger(slot) || slot < 0 || slot >= MAX_SLOTS || !name) return json({ error: 'This upload request is invalid.' }, 400);
  if (!(await ticketValid(env, id, parameters.get('expires') || '', parameters.get('ticket') || ''))) return json({ error: 'Your verification expired. Please verify again.' }, 403);
  if (!EXTENSIONS.includes(extensionOf(name))) return json({ error: 'Use STL, OBJ, 3MF, PDF, PNG, JPG or HEIC files.' }, 400);
  const size = Number(request.headers.get('content-length'));
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_FILE_BYTES) return json({ error: 'Each file must contain data and be no larger than 50 MB.' }, 413);
  if (!request.body) return json({ error: 'Could not read this file.' }, 400);
  const bucket = env.ENQUIRIES!;
  // Files can only be staged while the enquiry is still a draft.
  if (await bucket.head(keyFor(id))) return json({ error: 'This enquiry has already been sent.' }, 409);
  const staged = await bucket.list({ prefix: filesPrefix(id) });
  const slotPrefix = filesPrefix(id) + slot + '-';
  const others = staged.objects.filter(object => !object.key.startsWith(slotPrefix));
  if (others.length >= MAX_FILES) return json({ error: 'Choose up to ' + MAX_FILES + ' files.' }, 400);
  if (others.reduce((sum, object) => sum + object.size, 0) + size > MAX_UPLOAD_BYTES) return json({ error: 'Keep the combined file size under 150 MB.' }, 413);
  const reader = request.body.getReader();
  const head: Uint8Array[] = []; let length = 0;
  try { while (length < 512) { const step = await reader.read(); if (step.done) break; head.push(step.value); length += step.value.byteLength; } }
  catch { return json({ error: 'The upload was interrupted. Please try again.' }, 400); }
  const opening = new Uint8Array(length); let offset = 0;
  for (const chunk of head) { opening.set(chunk, offset); offset += chunk.byteLength; }
  if (!plausibleBytes(name, opening, size)) { await reader.cancel().catch(() => {}); return json({ error: 'This file does not match its format. Please check ' + name + '.' }, 400); }
  // A declared length lets the remainder stream straight into R2 instead of being buffered.
  const key = slotPrefix + name;
  const body = new FixedLengthStream(size);
  const writer = body.writable.getWriter();
  const stored = bucket.put(key, body.readable, { httpMetadata: { contentType: 'application/octet-stream', contentDisposition: 'attachment; filename="' + name + '"' } });
  const pump = (async () => {
    for (const chunk of head) await writer.write(chunk);
    while (true) { const step = await reader.read(); if (step.done) break; await writer.write(step.value); }
    await writer.close();
  })();
  try { await Promise.all([stored, pump]); }
  catch {
    await Promise.allSettled([reader.cancel(), writer.abort(), bucket.delete(key)]);
    return json({ error: 'Could not store this file. Please try again.' }, 502);
  }
  // A replacement in the same slot would otherwise leave the previous name behind.
  await Promise.allSettled(staged.objects.filter(object => object.key.startsWith(slotPrefix) && object.key !== key).map(object => bucket.delete(object.key)));
  return json({ ok: true, slot, name, size });
}
export async function handleEnquiry(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') return json({ available: configured(env), uploads: configured(env), turnstileSiteKey: configured(env) ? env.TURNSTILE_SITE_KEY : undefined });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST' } });
  const origin = website(request, env);
  if (!origin) return json({ error: 'Please submit from this website.' }, 403);
  if (!configured(env)) return json({ error: 'Online enquiries are not available. Please email info@isculptures.com.au.' }, 503);
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) return json({ error: 'Unsupported submission format.' }, 415);
  let input: Record<string, unknown>;
  try { input = JSON.parse(new TextDecoder().decode(await limitedBody(request, 64 * 1024))) as Record<string, unknown>; }
  catch (error) {
    const large = error instanceof Error && error.message === 'size';
    return json({ error: large ? 'Submission is too large.' : 'Could not read this submission.' }, large ? 413 : 400);
  }
  const checked = validateEnquiry(input);
  if (!checked.data) return json({ error: 'Please check the required fields.', errors: checked.errors }, 400);
  if (checked.data.website) return json({ error: 'Could not verify the submission.' }, 400);
  const slots = validateSlots(input.attachments ?? []);
  if (!slots) return json({ error: 'Please re-attach your files and try again.' }, 400);
  const data = checked.data, id = data.submissionId, bucket = env.ENQUIRIES!;
  if (!(await ticketValid(env, id, String(input.expires ?? ''), String(input.ticket ?? '')))) return json({ error: 'Your verification expired. Please verify again.' }, 403);
  const existing = await bucket.get(keyFor(id));
  if (existing) {
    const record = await existing.json<RecordData>();
    if (record.contact.email !== data.contact.email) return json({ error: 'Please start a new enquiry.' }, 409);
    return json({ ok: true, id });
  }
  const staged = await bucket.list({ prefix: filesPrefix(id) });
  const kept = staged.objects.filter(object => slots.includes(slotOf(object.key))).sort((a, b) => slotOf(a.key) - slotOf(b.key));
  const issue = validateFiles(kept.map(object => ({ name: nameOf(object.key), size: object.size })));
  if (issue) return json({ error: issue }, 400);
  const attachments: Attachment[] = kept.map(object => ({ name: nameOf(object.key), size: object.size, key: object.key }));
  try {
    const record: RecordData = { ...data, website: '', id, receivedAt: new Date().toISOString(), attachments, notification: 'pending', receipt: 'pending' };
    // Do not claim receipt unless the durable enquiry record was written.
    await bucket.put(keyFor(id), JSON.stringify(record), { httpMetadata: { contentType: 'application/json' } });
    // Whatever the browser removed before sending is not part of the enquiry.
    await Promise.allSettled(staged.objects.filter(object => !kept.includes(object)).map(object => bucket.delete(object.key)));
    try { await notify(record, env, new URL(request.url).origin); } catch { console.error('enquiry_notification_pending', id); }
    return json({ ok: true, id });
  } catch {
    return json({ error: 'Could not save your enquiry. Please retry or email the studio.' }, 502);
  }
}
// Files staged against an enquiry that was never sent are abandoned drafts, so a daily sweep clears them.
export async function sweep(env: Env, now = Date.now()) {
  if (!env.ENQUIRIES) return 0;
  const bucket = env.ENQUIRIES;
  let removed = 0, cursor: string | undefined;
  for (let page = 0; page < 10; page++) {
    const list = await bucket.list({ prefix: 'enquiries/', delimiter: '/', limit: 100, cursor });
    for (const prefix of list.delimitedPrefixes) {
      if (await bucket.head(prefix + 'enquiry.json')) continue;
      const files = await bucket.list({ prefix: prefix + 'files/' });
      if (!files.objects.length || files.objects.some(object => now - object.uploaded.getTime() < 24 * 3600 * 1000)) continue;
      await Promise.allSettled(files.objects.map(object => bucket.delete(object.key)));
      removed += files.objects.length;
    }
    if (!list.truncated) break;
    cursor = list.cursor;
  }
  return removed;
}
export async function handleFile(request: Request, env: Env) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  const url = new URL(request.url), key = url.searchParams.get('key') || '', expires = url.searchParams.get('expires') || '', signature = url.searchParams.get('signature') || '';
  if (!env.ENQUIRIES || !env.FILE_LINK_SECRET || !/^enquiries\/[a-f0-9-]{36}\/files\/(?:\d|1\d|2[0-3])-[a-zA-Z0-9._-]+$/.test(key) || !/^\d{10}$/.test(expires) || Number(expires) < Date.now()/1000 || Number(expires) > Date.now()/1000 + 8*86400 || !/^[a-f0-9]{64}$/.test(signature)) return json({ error: 'This download link is invalid or expired.' }, 403);
  if (!(await equal(signature, await sign(env.FILE_LINK_SECRET, key + ':' + expires)))) return json({ error: 'Invalid download link.' }, 403);
  const file = await env.ENQUIRIES.get(key); if (!file) return json({ error: 'File not found.' }, 404);
  return new Response(file.body, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="' + key.split('/').pop() + '"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
}
export async function handleAdmin(request: Request, env: Env) {
  if (!env.ENQUIRY_ADMIN_TOKEN || !(await equal(request.headers.get('authorization') || '', 'Bearer ' + env.ENQUIRY_ADMIN_TOKEN))) return json({ error: 'Unauthorised.' }, 401);
  if (!env.ENQUIRIES) return json({ error: 'Storage unavailable.' }, 503);
  const url = new URL(request.url); const id = url.searchParams.get('id');
  if (id && !/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'Invalid reference.' }, 400);
  if (id) {
    const object = await env.ENQUIRIES.get(keyFor(id)); if (!object) return json({ error: 'Not found.' }, 404);
    const record = await object.json<RecordData>();
    if (request.method === 'POST') return json(await notify(record, env, url.origin));
    if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
    const attachments = await Promise.all(record.attachments.map(async file => ({ ...file, url: env.FILE_LINK_SECRET ? await fileLink(env, url.origin, file.key) : null })));
    return json({ ...record, attachments });
  }
  if (request.method !== 'GET') return json({ error: 'Specify an enquiry reference.' }, 400);
  const list = await env.ENQUIRIES.list({ prefix: 'enquiries/', delimiter: '/', limit: 50, cursor: url.searchParams.get('cursor') || undefined });
  const records = await Promise.all(list.delimitedPrefixes.map(async prefix => {
    const object = await env.ENQUIRIES!.get(prefix + 'enquiry.json'); if (!object) return null;
    const record = await object.json<RecordData>();
    return { id: record.id, receivedAt: record.receivedAt, company: record.contact.company, name: record.contact.name, route: record.route, notification: record.notification, receipt: record.receipt };
  }));
  return json({ items: records.filter(Boolean), cursor: list.truncated ? list.cursor : null });
}
export const onRequestGet: PagesFunction<Env> = ({ request, env }) => handleEnquiry(request, env);
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleEnquiry(request, env);
