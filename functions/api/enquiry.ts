import { MAX_UPLOAD_BYTES, validateEnquiry, validateFiles, type Enquiry } from '../../lib/enquiry.js';

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
const keyFor = (id: string) => 'enquiries/' + id + '/enquiry.json';
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
  const lines = [
    'Reference: ' + record.id, 'Received: ' + record.receivedAt, 'Enquiry type: ' + record.route,
    'Name: ' + record.contact.name, 'Email: ' + record.contact.email, 'Company: ' + record.contact.company,
    'Phone: ' + record.contact.phone, 'Customer type: ' + record.contact.customerType, '',
    'Brief: ' + record.brief, 'Quantity per order: ' + (record.quantity ?? 'Not sure'),
    'Annual quantity: ' + (record.annualQuantity ?? 'Not specified'), 'Frequency: ' + record.frequency,
    'Material: ' + record.material, 'Dimensions: ' + record.dimensions, 'Finish / branding: ' + record.finish,
    'Packaging: ' + record.packaging, 'Budget (AUD): ' + record.budget,
    'Required delivery: ' + record.requiredBy, 'Fixed deadline: ' + record.deadlineFixed,
    'Postcode / suburb: ' + record.postcode, 'Delivery notes: ' + record.destinations, 'Other notes: ' + record.notes, '',
    'Campaign: ' + JSON.stringify(record.campaign), 'Referrer host: ' + record.referrerHost,
    'Private attachments (links expire in 7 days):'
  ];
  for (const file of record.attachments) lines.push(file.name + ' (' + file.size + ' bytes): ' + await fileLink(env, origin, file.key));
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
async function plausibleFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const bytes = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  const prefix = new TextDecoder().decode(bytes);
  if (ext === 'pdf') return prefix.startsWith('%PDF-');
  if (ext === 'png') return bytes.slice(0,8).join(',') === '137,80,78,71,13,10,26,10';
  if (ext === 'jpg' || ext === 'jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (ext === '3mf') return bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
  if (ext === 'stl') return /^\s*solid\b/i.test(prefix) || (file.size >= 84 && new DataView(bytes.buffer).getUint32(80, true) * 50 + 84 === file.size);
  if (ext === 'obj') return !prefix.includes('\0') && !/<(?:html|script|svg)\b/i.test(prefix);
  return false;
}
export async function handleEnquiry(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') return json({ available: configured(env), uploads: configured(env), turnstileSiteKey: configured(env) ? env.TURNSTILE_SITE_KEY : undefined });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST' } });
  const origin = request.headers.get('origin');
  if (!origin || !enquiryOrigins(request, env).includes(origin)) return json({ error: 'Please submit from this website.' }, 403);
  if (!configured(env)) return json({ error: 'Online enquiries are not available. Please email info@isculptures.com.au.' }, 503);
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('multipart/form-data') && !contentType.startsWith('application/json')) return json({ error: 'Unsupported submission format.' }, 415);
  let input: unknown; let files: File[] = [];
  try {
    const body = await limitedBody(request, contentType.startsWith('multipart') ? MAX_UPLOAD_BYTES + 128 * 1024 : 64 * 1024);
    if (contentType.startsWith('multipart')) {
      const form = await new Response(body, { headers: { 'Content-Type': contentType } }).formData();
      const payload = form.get('payload');
      if (typeof payload !== 'string' || payload.length > 64000) throw new Error('body');
      input = JSON.parse(payload);
      const items = form.getAll('files');
      if (items.some(item => typeof item === 'string')) throw new Error('body');
      files = items as File[];
    } else input = JSON.parse(new TextDecoder().decode(body));
  } catch (error) { return json({ error: error instanceof Error && error.message === 'size' ? 'Submission is too large.' : 'Could not read this submission.' }, error instanceof Error && error.message === 'size' ? 413 : 400); }
  const checked = validateEnquiry(input);
  if (!checked.data) return json({ error: 'Please check the required fields.', errors: checked.errors }, 400);
  if (checked.data.website) return json({ error: 'Could not verify the submission.' }, 400);
  const issue = validateFiles(files); if (issue) return json({ error: issue }, 400);
  const data = checked.data;
  const token = (input as Record<string, unknown>).turnstileToken;
  if (typeof token !== 'string' || !token || token.length > 2048) return json({ error: 'Please complete the verification.' }, 403);
  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get('CF-Connecting-IP') || undefined })
    });
    const result = await verification.json() as { success?: boolean; hostname?: string; action?: string };
    if (!result.success || result.hostname !== new URL(origin).hostname || result.action !== 'enquiry') return json({ error: 'Verification expired or failed. Please retry.' }, 403);
  } catch { return json({ error: 'Verification is unavailable. Please retry shortly.' }, 503); }
  const id = data.submissionId;
  const bucket = env.ENQUIRIES!;
  const existing = await bucket.get(keyFor(id));
  if (existing) {
    const record = await existing.json<RecordData>();
    if (record.contact.email !== data.contact.email) return json({ error: 'Please start a new enquiry.' }, 409);
    return json({ ok: true, id });
  }
  for (const file of files) if (!(await plausibleFile(file))) return json({ error: 'A file does not match its format. Please check ' + file.name + '.' }, 400);
  const attachments: Attachment[] = [];
  try {
    for (const [index, file] of files.entries()) {
      const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
      const key = 'enquiries/' + id + '/files/' + index + '-' + filename;
      await bucket.put(key, file.stream(), { httpMetadata: { contentType: 'application/octet-stream', contentDisposition: 'attachment; filename="' + filename + '"' } });
      attachments.push({ name: filename, size: file.size, key });
    }
    const record: RecordData = { ...data, website: '', id, receivedAt: new Date().toISOString(), attachments, notification: 'pending', receipt: 'pending' };
    await bucket.put(keyFor(id), JSON.stringify(record), { httpMetadata: { contentType: 'application/json' } });
    try { await notify(record, env, new URL(request.url).origin); } catch { console.error('enquiry_notification_pending', id); }
    return json({ ok: true, id });
  } catch {
    // Do not claim receipt unless the durable enquiry record was written.
    await Promise.allSettled(attachments.map(file => bucket.delete(file.key)));
    return json({ error: 'Could not save your enquiry. Please retry or email the studio.' }, 502);
  }
}
export async function handleFile(request: Request, env: Env) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  const url = new URL(request.url), key = url.searchParams.get('key') || '', expires = url.searchParams.get('expires') || '', signature = url.searchParams.get('signature') || '';
  if (!env.ENQUIRIES || !env.FILE_LINK_SECRET || !/^enquiries\/[a-f0-9-]{36}\/files\/[0-4]-[a-zA-Z0-9._-]+$/.test(key) || !/^\d{10}$/.test(expires) || Number(expires) < Date.now()/1000 || Number(expires) > Date.now()/1000 + 8*86400 || !/^[a-f0-9]{64}$/.test(signature)) return json({ error: 'This download link is invalid or expired.' }, 403);
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
