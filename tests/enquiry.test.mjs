import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
// R2 accepts a stream only with a declared length; this mirrors that contract, including its mismatch errors.
globalThis.FixedLengthStream = class FixedLengthStream {
  constructor(length) {
    let seen = 0;
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) { seen += chunk.byteLength; if (seen > length) throw new Error('longer than declared'); controller.enqueue(chunk); },
      flush() { if (seen !== length) throw new Error('shorter than declared'); }
    });
    this.readable = readable; this.writable = writable;
  }
};
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const compile = file => stripTypeScriptTypes(fs.readFileSync(file, 'utf8'));
const validationUrl = moduleUrl(compile('lib/enquiry.ts'));
const { validateEnquiry, validateFiles, validateSlots, MAX_FILE_BYTES, MAX_FILES } = await import(validationUrl);
const handlerUrl = moduleUrl(compile('functions/api/enquiry.ts').replace('../../lib/enquiry.js', validationUrl));
const { handleEnquiry, handleFile, handleAdmin, handleTicket, handleUpload, notify, sweep } = await import(handlerUrl);
const { default: worker } = await import(moduleUrl(compile('server/enquiry-worker.ts').replace('../functions/api/enquiry.js', handlerUrl)));
const payload = (overrides = {}) => ({ submissionId: crypto.randomUUID(), route: 'supply', consent: true, website: '', contact: { name: 'Test Buyer', email: 'buyer@example.test', company: 'Test Company', phone: '0400000000', customerType: 'Business' }, brief: 'A quarterly production run', quantity: 100, annualQuantity: 400, frequency: 'Quarterly', material: 'Please recommend', budget: '$12 per unit', requiredBy: '2026-11-20', deadlineFixed: true, dimensions: '80 mm', finish: 'Logo', packaging: 'Individual boxes', postcode: '2000', destinations: 'One site', notes: 'PO required', ...overrides });
class Bucket {
  objects = new Map(); fail = false;
  async put(key, body) { if (this.fail) throw new Error('Storage failed'); const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : new Uint8Array(await new Response(body).arrayBuffer()); this.objects.set(key, { bytes, uploaded: new Date() }); }
  async get(key) { const item = this.objects.get(key); return item ? { json: async () => JSON.parse(new TextDecoder().decode(item.bytes)), body: new ReadableStream({ start(c) { c.enqueue(item.bytes); c.close(); } }) } : null; }
  async head(key) { return this.objects.has(key) ? { key } : null; }
  async delete(key) { this.objects.delete(key); }
  async list({ prefix = '', delimiter } = {}) {
    const keys = [...this.objects.keys()].filter(key => key.startsWith(prefix));
    if (delimiter) {
      const prefixes = new Set();
      for (const key of keys) { const at = key.slice(prefix.length).indexOf(delimiter); if (at >= 0) prefixes.add(prefix + key.slice(prefix.length, prefix.length + at + 1)); }
      return { objects: [], delimitedPrefixes: [...prefixes], truncated: false };
    }
    return { objects: keys.map(key => ({ key, size: this.objects.get(key).bytes.length, uploaded: this.objects.get(key).uploaded })), delimitedPrefixes: [], truncated: false };
  }
}
const env = () => ({ ENQUIRIES: new Bucket(), ENQUIRIES_ENABLED: 'true', RESEND_API_KEY: 'test-key', ENQUIRY_TO: 'studio@example.test', ENQUIRY_FROM: 'quotes@example.test', TURNSTILE_SECRET: 'test-secret', TURNSTILE_SITE_KEY: 'test-site-key', FILE_LINK_SECRET: 'test-signing-secret', ENQUIRY_ADMIN_TOKEN: 'test-admin-token' });
const site = 'https://isculptures.com.au';
const request = (value, options = {}) => new Request(site + '/api/enquiry', { method: 'POST', headers: { Origin: site, 'Content-Type': 'application/json', ...options.headers }, body: JSON.stringify(value) });
// One verification buys a ticket, and every upload for that reference presents it.
async function claim(environment, id, { origin = site, base = site } = {}) {
  const response = await handleTicket(new Request(base + '/api/enquiry/ticket', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: id, turnstileToken: 'test-token' }) }), environment);
  return { status: response.status, body: await response.json() };
}
function upload(environment, id, held, slot, name, content, { origin = site, base = site, handler = handleUpload } = {}) {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  const url = new URL(base + '/api/enquiry/upload');
  url.searchParams.set('id', id); url.searchParams.set('slot', String(slot)); url.searchParams.set('name', name);
  url.searchParams.set('ticket', held.ticket); url.searchParams.set('expires', held.expires);
  return handler(new Request(url, { method: 'PUT', headers: { Origin: origin, 'Content-Length': String(bytes.byteLength) }, body: bytes }), environment);
}
const submit = (data, held, slots = [], options = {}) => request({ ...data, ticket: held.ticket, expires: held.expires, attachments: slots }, options);
const responses = [];
function fakeFetch({ emailFails = false, verification = true, hostname = 'isculptures.com.au', action = 'enquiry' } = {}) {
  return async (url, init) => {
    if (String(url).includes('siteverify')) return Response.json({ success: verification, hostname, action });
    assert.equal(url, 'https://api.resend.com/emails'); responses.push(JSON.parse(init.body));
    return Response.json(emailFails ? { error: 'failed' } : { id: 'email-test' }, { status: emailFails ? 503 : 200 });
  };
}
test('rejects malformed data, invalid minimums and missing consent', () => {
  assert.ok(validateEnquiry(null).errors.name);
  assert.ok(validateEnquiry(payload({ quantity: 9 })).errors.quantity);
  assert.ok(validateEnquiry(payload({ quantity: 10.5 })).errors.quantity);
  assert.ok(validateEnquiry(payload({ requiredBy: '2026-02-30' })).errors.requiredBy);
  const day = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  assert.ok(validateEnquiry(payload({ requiredBy: day(-30) })).errors.requiredBy, 'a delivery date in the past is refused');
  assert.equal(validateEnquiry(payload({ requiredBy: day(30) })).errors.requiredBy, undefined);
  // Two days of slack keeps a visitor ahead of, or behind, the Worker's clock from being blocked.
  assert.equal(validateEnquiry(payload({ requiredBy: day(-1) })).errors.requiredBy, undefined);
  assert.ok(validateEnquiry(payload({ consent: false })).errors.consent);
  assert.equal(validateEnquiry(payload({ quantity: '', annualQuantity: '' })).data.quantity, null);
  assert.equal(validateEnquiry(payload({ route: 'file', quantity: 1 })).data.quantity, 1);
});
test('enforces file extension, count, individual and combined size limits', () => {
  assert.ok(validateFiles([{ name: 'model.exe', size: 100 }]));
  assert.ok(validateFiles([{ name: 'model.stl', size: MAX_FILE_BYTES + 1 }]));
  assert.ok(validateFiles(Array.from({ length: MAX_FILES + 1 }, (_, index) => ({ name: index + '.stl', size: 1 }))));
  assert.ok(validateFiles([{ name: 'a.stl', size: MAX_FILE_BYTES }, { name: 'b.stl', size: MAX_FILE_BYTES }, { name: 'c.stl', size: MAX_FILE_BYTES }, { name: 'd.stl', size: 1 }]));
  assert.equal(validateFiles([{ name: 'model.STL', size: 100 }]), null);
  assert.equal(validateFiles([{ name: 'photo.HEIC', size: 100 }]), null);
});
test('accepts only distinct in-range attachment slots', () => {
  assert.deepEqual(validateSlots([]), []);
  assert.deepEqual(validateSlots([0, 3]), [0, 3]);
  assert.equal(validateSlots([0, 0]), null);
  assert.equal(validateSlots([-1]), null);
  assert.equal(validateSlots([24]), null);
  assert.equal(validateSlots(['0']), null);
  assert.equal(validateSlots('0'), null);
});
test('fails closed without storage/email/spam configuration', async () => {
  const result = await handleEnquiry(new Request(site + '/api/enquiry'), {});
  assert.equal((await result.json()).available, false);
  assert.equal((await handleEnquiry(request(payload()), {})).status, 503);
  assert.equal((await handleTicket(request({ submissionId: crypto.randomUUID() }), {})).status, 503);
});
test('rejects cross-origin requests and oversized body before processing', async () => {
  assert.equal((await handleEnquiry(request(payload(), { headers: { Origin: 'https://elsewhere.test' } }), env())).status, 403);
  assert.equal((await handleEnquiry(request(payload({ brief: 'x'.repeat(70000) })), env())).status, 413);
});
test('a ticket requires a passing check, and uploads require a ticket', async () => {
  const original = globalThis.fetch;
  try {
    const environment = env(), id = crypto.randomUUID();
    globalThis.fetch = fakeFetch({ verification: false });
    assert.equal((await claim(environment, id)).status, 403);
    globalThis.fetch = fakeFetch();
    assert.equal((await claim(environment, 'not-a-reference')).status, 400);
    const { status, body: held } = await claim(environment, id);
    assert.equal(status, 200);
    assert.match(held.ticket, /^[a-f0-9]{64}$/);
    // A ticket minted for one reference cannot stage files against another.
    assert.equal((await upload(environment, crypto.randomUUID(), held, 0, 'a.stl', 'solid a\nendsolid a')).status, 403);
    assert.equal((await upload(environment, id, { ticket: 'b'.repeat(64), expires: held.expires }, 0, 'a.stl', 'solid a\nendsolid a')).status, 403);
    assert.equal((await upload(environment, id, held, 0, 'a.stl', 'solid a\nendsolid a')).status, 200);
    assert.equal(environment.ENQUIRIES.objects.size, 1);
  } finally { globalThis.fetch = original; }
});
test('staged uploads stream into storage, reject mismatched formats and stop once sent', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch(); responses.length = 0;
  try {
    const environment = env(), data = payload();
    const { body: held } = await claim(environment, data.submissionId);
    assert.equal((await upload(environment, data.submissionId, held, 0, 'fake.pdf', 'not a pdf')).status, 400);
    assert.equal((await upload(environment, data.submissionId, held, 0, 'model.exe', 'anything')).status, 400);
    assert.equal((await upload(environment, data.submissionId, held, 99, 'model.stl', 'solid x\nendsolid x')).status, 400);
    assert.equal(environment.ENQUIRIES.objects.size, 0, 'a rejected file never reaches storage');
    assert.equal((await upload(environment, data.submissionId, held, 0, 'example.stl', 'solid test\nendsolid test')).status, 200);
    // A file the browser removed before sending is discarded rather than attached.
    assert.equal((await upload(environment, data.submissionId, held, 1, 'dropped.stl', 'solid drop\nendsolid drop')).status, 200);
    const response = await handleEnquiry(submit(data, held, [0]), environment);
    assert.equal(response.status, 200);
    const { id } = await response.json();
    const record = await (await environment.ENQUIRIES.get('enquiries/' + id + '/enquiry.json')).json();
    for (const key of ['quantity','annualQuantity','frequency','material','budget','packaging','finish','dimensions','postcode','destinations','requiredBy','deadlineFixed']) assert.equal(record[key], data[key]);
    assert.equal(record.notification, 'sent'); assert.equal(record.receipt, 'sent');
    assert.deepEqual(record.attachments.map(file => file.name), ['example.stl']);
    assert.equal(environment.ENQUIRIES.objects.has('enquiries/' + id + '/files/1-dropped.stl'), false);
    assert.equal(record.ticket, undefined); assert.equal(responses.length, 2);
    const match = responses[0].text.match(/https:\/\/isculptures\.com\.au\/api\/enquiry\/file\?\S+/); assert.ok(match);
    const download = await handleFile(new Request(match[0]), environment);
    assert.equal(download.status, 200); assert.equal(await download.text(), 'solid test\nendsolid test');
    const bad = new URL(match[0]); bad.searchParams.set('signature', 'a'.repeat(64));
    assert.equal((await handleFile(new Request(bad), environment)).status, 403);
    // A sent enquiry is closed to further uploads, and resending stays idempotent.
    assert.equal((await upload(environment, data.submissionId, held, 2, 'late.stl', 'solid late\nendsolid late')).status, 409);
    assert.equal((await claim(environment, data.submissionId)).status, 409);
    assert.equal((await handleEnquiry(submit(data, held, [0]), environment)).status, 200);
    assert.equal(responses.length, 2);
  } finally { globalThis.fetch = original; }
});
test('a submission without a valid ticket is refused before any record is written', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch();
  try {
    const environment = env(), data = payload();
    assert.equal((await handleEnquiry(submit(data, { ticket: 'c'.repeat(64), expires: String(Math.floor(Date.now() / 1000) + 600) }), environment)).status, 403);
    const { body: held } = await claim(environment, data.submissionId);
    assert.equal((await handleEnquiry(submit(data, { ...held, expires: String(Math.floor(Date.now() / 1000) - 10) }), environment)).status, 403);
    assert.equal((await handleEnquiry(submit(data, held, [0, 0]), environment)).status, 400);
    assert.equal(environment.ENQUIRIES.objects.size, 0);
  } finally { globalThis.fetch = original; }
});
test('storage failure cannot show success and email failure remains recoverable', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch({ emailFails: true });
  try {
    const broken = env(), first = payload();
    const { body: brokenTicket } = await claim(broken, first.submissionId);
    broken.ENQUIRIES.fail = true;
    assert.equal((await handleEnquiry(submit(first, brokenTicket), broken)).status, 502);
    const environment = env(), data = payload();
    const { body: held } = await claim(environment, data.submissionId);
    const response = await handleEnquiry(submit(data, held), environment);
    assert.equal(response.status, 200);
    const record = await (await environment.ENQUIRIES.get('enquiries/' + data.submissionId + '/enquiry.json')).json();
    assert.equal(record.notification, 'pending');
    globalThis.fetch = fakeFetch(); const retried = await notify(record, environment, site);
    assert.equal(retried.notification, 'sent'); assert.equal(retried.receipt, 'sent');
  } finally { globalThis.fetch = original; }
});
test('administration stays authenticated', async () => {
  const environment = env();
  assert.equal((await handleAdmin(new Request(site + '/api/admin/enquiries'), environment)).status, 401);
  const authorised = await handleAdmin(new Request(site + '/api/admin/enquiries', { headers: { Authorization: 'Bearer test-admin-token' } }), environment);
  assert.equal(authorised.status, 200);
});
test('the sweep clears abandoned drafts and leaves sent enquiries alone', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch();
  try {
    const environment = env(), abandoned = crypto.randomUUID(), data = payload();
    const { body: dropped } = await claim(environment, abandoned);
    await upload(environment, abandoned, dropped, 0, 'orphan.stl', 'solid orphan\nendsolid orphan');
    const { body: held } = await claim(environment, data.submissionId);
    await upload(environment, data.submissionId, held, 0, 'kept.stl', 'solid kept\nendsolid kept');
    assert.equal((await handleEnquiry(submit(data, held, [0]), environment)).status, 200);
    assert.equal(await sweep(environment), 0, 'a draft under a day old is still in progress');
    assert.equal(await sweep(environment, Date.now() + 25 * 3600 * 1000), 1);
    assert.equal(environment.ENQUIRIES.objects.has('enquiries/' + abandoned + '/files/0-orphan.stl'), false);
    assert.equal(environment.ENQUIRIES.objects.has('enquiries/' + data.submissionId + '/files/0-kept.stl'), true);
  } finally { globalThis.fetch = original; }
});

const apiUrl = 'https://enquiry.example.workers.dev/api/enquiry';
const apiBase = new URL(apiUrl).origin;
const websiteOrigin = 'https://sculptures-preview.vercel.app';
const splitEnv = () => ({ ...env(), ENQUIRY_ALLOWED_ORIGINS: websiteOrigin });
const apiRequest = (value, origin = websiteOrigin) => new Request(apiUrl, {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(value)
});

test('standalone API stays unavailable without valid explicit website origins', async () => {
  for (const origins of [undefined, '', '*', 'https://*.vercel.app', websiteOrigin + '/enquiry', 'https://user:pass@example.test', 'null']) {
    const environment = { ...env(), ENQUIRY_ALLOWED_ORIGINS: origins };
    const config = await worker.fetch(new Request(apiUrl), environment);
    assert.equal((await config.json()).available, false, String(origins));
    assert.equal((await worker.fetch(apiRequest(payload()), environment)).status, 403);
  }
});

test('CORS permits only exact approved origins and supported preflight requests', async () => {
  const environment = splitEnv();
  const config = await worker.fetch(new Request(apiUrl, { headers: { Origin: websiteOrigin } }), environment);
  assert.equal((await config.json()).available, true);
  assert.equal(config.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
  assert.equal(config.headers.get('Vary'), 'Origin');
  assert.equal(config.headers.get('Cache-Control'), 'no-store');
  assert.equal(config.headers.get('Access-Control-Allow-Credentials'), null);
  for (const origin of [websiteOrigin + '.evil.test', 'https://another.vercel.app', 'null', apiBase]) {
    const rejected = await worker.fetch(apiRequest(payload(), origin), environment);
    assert.equal(rejected.status, 403);
    assert.equal(rejected.headers.get('Access-Control-Allow-Origin'), null);
  }
  const preflight = (path, method, headers = 'content-type', origin = websiteOrigin) => new Request(apiBase + path, {
    method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': headers }
  });
  const accepted = await worker.fetch(preflight('/api/enquiry', 'POST'), environment);
  assert.equal(accepted.status, 204);
  assert.equal(accepted.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
  assert.equal(accepted.headers.get('Access-Control-Allow-Methods'), 'GET, POST');
  const upload = await worker.fetch(preflight('/api/enquiry/upload', 'PUT'), environment);
  assert.equal(upload.status, 204);
  assert.equal(upload.headers.get('Access-Control-Allow-Methods'), 'PUT');
  assert.equal((await worker.fetch(preflight('/api/enquiry/upload', 'POST'), environment)).status, 403);
  assert.equal((await worker.fetch(preflight('/api/enquiry/ticket', 'POST'), environment)).headers.get('Access-Control-Allow-Methods'), 'POST');
  assert.equal((await worker.fetch(preflight('/api/enquiry', 'DELETE'), environment)).status, 403);
  assert.equal((await worker.fetch(preflight('/api/enquiry', 'POST', 'authorization'), environment)).status, 403);
  assert.equal((await worker.fetch(preflight('/api/enquiry', 'POST', 'content-type', 'https://evil.test'), environment)).status, 403);
  assert.equal((await worker.fetch(new Request(apiUrl, { method: 'POST', body: '{}' }), environment)).status, 403);
  // Signed download links are opened directly by the studio, so that route stays outside CORS entirely.
  const download = await worker.fetch(preflight('/api/enquiry/file', 'GET'), environment);
  assert.equal(download.status, 405);
  assert.equal(download.headers.get('Access-Control-Allow-Origin'), null);
});

test('cross-origin hosting stages files on the Worker and returns working download links', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch({ hostname: new URL(websiteOrigin).hostname }); responses.length = 0;
  try {
    const environment = splitEnv(), data = payload();
    const ticketResponse = await worker.fetch(new Request(apiBase + '/api/enquiry/ticket', { method: 'POST', headers: { Origin: websiteOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: data.submissionId, turnstileToken: 'test-token' }) }), environment);
    assert.equal(ticketResponse.status, 200);
    assert.equal(ticketResponse.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
    const held = await ticketResponse.json();
    const staged = await upload(environment, data.submissionId, held, 0, 'model.stl', 'solid cross-origin\nendsolid cross-origin', { origin: websiteOrigin, base: apiBase, handler: (request, env) => worker.fetch(request, env) });
    assert.equal(staged.status, 200);
    assert.equal(staged.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
    const response = await worker.fetch(new Request(apiUrl, { method: 'POST', headers: { Origin: websiteOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, ticket: held.ticket, expires: held.expires, attachments: [0] }) }), environment);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
    assert.equal(responses.length, 2);
    const link = responses[0].text.match(/https:\/\/enquiry\.example\.workers\.dev\/api\/enquiry\/file\?\S+/);
    assert.ok(link);
    const file = await worker.fetch(new Request(link[0]), environment);
    assert.equal(file.status, 200);
    assert.equal(await file.text(), 'solid cross-origin\nendsolid cross-origin');
    const reference = (await response.json()).id;
    const adminUrl = new URL('/api/admin/enquiries?id=' + reference, apiUrl);
    assert.equal((await worker.fetch(new Request(adminUrl), environment)).status, 401);
    const record = await worker.fetch(new Request(adminUrl, { headers: { Authorization: 'Bearer test-admin-token', Origin: websiteOrigin } }), environment);
    assert.equal(record.status, 200);
    assert.equal(record.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal((await record.json()).id, reference);
  } finally { globalThis.fetch = original; }
});

test('split hosting rejects Turnstile tokens for the API host, another site, or another action', async () => {
  const original = globalThis.fetch;
  try {
    for (const options of [{ hostname: new URL(apiUrl).hostname }, { hostname: 'evil.test' }, { hostname: new URL(websiteOrigin).hostname, action: 'login' }]) {
      globalThis.fetch = fakeFetch(options);
      const environment = splitEnv();
      const response = await worker.fetch(new Request(apiBase + '/api/enquiry/ticket', { method: 'POST', headers: { Origin: websiteOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: crypto.randomUUID(), turnstileToken: 'test-token' }) }), environment);
      assert.equal(response.status, 403);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
      assert.equal(environment.ENQUIRIES.objects.size, 0);
    }
  } finally { globalThis.fetch = original; }
});

test('API-only Worker exposes no website and preserves readable failure responses', async () => {
  const environment = splitEnv();
  assert.equal((await worker.fetch(new Request(new URL('/', apiUrl)), environment)).status, 404);
  assert.equal((await worker.fetch(new Request(new URL('/unknown', apiUrl)), environment)).status, 404);
  const disabled = await worker.fetch(apiRequest(payload()), { ...environment, ENQUIRIES_ENABLED: 'false' });
  assert.equal(disabled.status, 503);
  assert.equal(disabled.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
  const original = globalThis.fetch; globalThis.fetch = fakeFetch({ hostname: new URL(websiteOrigin).hostname });
  try {
    const data = payload();
    const held = await (await worker.fetch(new Request(apiBase + '/api/enquiry/ticket', { method: 'POST', headers: { Origin: websiteOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: data.submissionId, turnstileToken: 'test-token' }) }), environment)).json();
    environment.ENQUIRIES.get = async () => { throw new Error('R2 unavailable'); };
    const failure = await worker.fetch(apiRequest({ ...data, ticket: held.ticket, expires: held.expires, attachments: [] }), environment);
    assert.equal(failure.status, 503);
    assert.equal(failure.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
    assert.ok((await failure.json()).error);
  } finally { globalThis.fetch = original; }
});
