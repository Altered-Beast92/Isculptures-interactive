import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const compile = file => stripTypeScriptTypes(fs.readFileSync(file, 'utf8'));
const validationUrl = moduleUrl(compile('lib/enquiry.ts'));
const { validateEnquiry, validateFiles, MAX_FILE_BYTES } = await import(validationUrl);
const handlerUrl = moduleUrl(compile('functions/api/enquiry.ts').replace('../../lib/enquiry.js', validationUrl));
const { handleEnquiry, handleFile, handleAdmin, notify } = await import(handlerUrl);
const { default: worker } = await import(moduleUrl(compile('server/enquiry-worker.ts').replace('../functions/api/enquiry.js', handlerUrl)));
const payload = (overrides = {}) => ({ submissionId: crypto.randomUUID(), route: 'supply', consent: true, website: '', contact: { name: 'Test Buyer', email: 'buyer@example.test', company: 'Test Company', phone: '0400000000', customerType: 'Business' }, brief: 'A quarterly production run', quantity: 100, annualQuantity: 400, frequency: 'Quarterly', material: 'Please recommend', budget: '$12 per unit', requiredBy: '2026-11-20', deadlineFixed: true, dimensions: '80 mm', finish: 'Logo', packaging: 'Individual boxes', postcode: '2000', destinations: 'One site', notes: 'PO required', turnstileToken: 'test-token', ...overrides });
class Bucket {
  objects = new Map(); fail = false;
  async put(key, body) { if (this.fail) throw new Error('Storage failed'); const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : new Uint8Array(await new Response(body).arrayBuffer()); this.objects.set(key, bytes); }
  async get(key) { const bytes = this.objects.get(key); return bytes ? { json: async () => JSON.parse(new TextDecoder().decode(bytes)), body: new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } }) } : null; }
  async delete(key) { this.objects.delete(key); }
  async list() { return { delimitedPrefixes: [...new Set([...this.objects.keys()].map(key => key.split('/').slice(0,2).join('/') + '/'))], truncated: false }; }
}
const env = () => ({ ENQUIRIES: new Bucket(), ENQUIRIES_ENABLED: 'true', RESEND_API_KEY: 'test-key', ENQUIRY_TO: 'studio@example.test', ENQUIRY_FROM: 'quotes@example.test', TURNSTILE_SECRET: 'test-secret', TURNSTILE_SITE_KEY: 'test-site-key', FILE_LINK_SECRET: 'test-signing-secret', ENQUIRY_ADMIN_TOKEN: 'test-admin-token' });
const request = (value, options = {}) => new Request('https://isculptures.com.au/api/enquiry', { method: 'POST', headers: { Origin: 'https://isculptures.com.au', 'Content-Type': 'application/json', ...options.headers }, body: JSON.stringify(value) });
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
  assert.ok(validateEnquiry(payload({ consent: false })).errors.consent);
  assert.equal(validateEnquiry(payload({ quantity: '', annualQuantity: '' })).data.quantity, null);
  assert.equal(validateEnquiry(payload({ route: 'file', quantity: 1 })).data.quantity, 1);
});
test('enforces file extension, individual and combined size limits', () => {
  assert.ok(validateFiles([{ name: 'model.exe', size: 100 }]));
  assert.ok(validateFiles([{ name: 'model.stl', size: MAX_FILE_BYTES + 1 }]));
  assert.ok(validateFiles([{ name: 'a.stl', size: MAX_FILE_BYTES }, { name: 'b.stl', size: MAX_FILE_BYTES }, { name: 'c.stl', size: 1 }]));
  assert.equal(validateFiles([{ name: 'model.STL', size: 100 }]), null);
});
test('fails closed without storage/email/spam configuration', async () => {
  const result = await handleEnquiry(new Request('https://isculptures.com.au/api/enquiry'), {});
  assert.equal((await result.json()).available, false);
  assert.equal((await handleEnquiry(request(payload()), {})).status, 503);
});
test('rejects cross-origin requests and oversized body before processing', async () => {
  assert.equal((await handleEnquiry(request(payload(), { headers: { Origin: 'https://elsewhere.test' } }), env())).status, 403);
  assert.equal((await handleEnquiry(request(payload({ brief: 'x'.repeat(70000) })), env())).status, 413);
});
test('preserves complete bulk brief, stores STL bytes, emails signed private link, prevents duplicate receipt', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch(); responses.length = 0;
  try {
    const environment = env(), data = payload();
    const form = new FormData(); form.set('payload', JSON.stringify(data)); form.append('files', new File(['solid test\nendsolid test'], 'example.stl'));
    const req = new Request('https://isculptures.com.au/api/enquiry', { method: 'POST', headers: { Origin: 'https://isculptures.com.au' }, body: form });
    const response = await handleEnquiry(req, environment); assert.equal(response.status, 200);
    const { id } = await response.json(); const record = await (await environment.ENQUIRIES.get('enquiries/' + id + '/enquiry.json')).json();
    for (const key of ['quantity','annualQuantity','frequency','material','budget','packaging','finish','dimensions','postcode','destinations','requiredBy','deadlineFixed']) assert.equal(record[key], data[key]);
    assert.equal(record.notification, 'sent'); assert.equal(record.receipt, 'sent'); assert.equal(record.attachments.length, 1);
    assert.equal(record.turnstileToken, undefined); assert.equal(responses.length, 2);
    const match = responses[0].text.match(/https:\/\/isculptures\.com\.au\/api\/enquiry\/file\?\S+/); assert.ok(match);
    const download = await handleFile(new Request(match[0]), environment); assert.equal(download.status, 200); assert.equal(await download.text(), 'solid test\nendsolid test');
    const bad = new URL(match[0]); bad.searchParams.set('signature', 'a'.repeat(64)); assert.equal((await handleFile(new Request(bad), environment)).status, 403);
    assert.equal((await handleEnquiry(request(data), environment)).status, 200); assert.equal(responses.length, 2);
  } finally { globalThis.fetch = original; }
});
test('storage failure cannot show success and email failure remains recoverable', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch({ emailFails: true });
  try {
    const broken = env(); broken.ENQUIRIES.fail = true;
    assert.equal((await handleEnquiry(request(payload()), broken)).status, 502);
    const environment = env(), data = payload(); const response = await handleEnquiry(request(data), environment);
    assert.equal(response.status, 200); const record = await (await environment.ENQUIRIES.get('enquiries/' + data.submissionId + '/enquiry.json')).json();
    assert.equal(record.notification, 'pending');
    globalThis.fetch = fakeFetch(); const retried = await notify(record, environment, 'https://isculptures.com.au');
    assert.equal(retried.notification, 'sent'); assert.equal(retried.receipt, 'sent');
  } finally { globalThis.fetch = original; }
});
test('blocks failed verification, bad file signatures and unprotected admin access', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch({ verification: false });
  try {
    const environment = env();
    assert.equal((await handleEnquiry(request(payload()), environment)).status, 403);
    globalThis.fetch = fakeFetch();
    const form = new FormData(); form.set('payload', JSON.stringify(payload())); form.append('files', new File(['not a pdf'], 'fake.pdf'));
    assert.equal((await handleEnquiry(new Request('https://isculptures.com.au/api/enquiry', { method: 'POST', headers: { Origin: 'https://isculptures.com.au' }, body: form }), environment)).status, 400);
    assert.equal((await handleAdmin(new Request('https://isculptures.com.au/api/admin/enquiries'), environment)).status, 401);
    const authorised = await handleAdmin(new Request('https://isculptures.com.au/api/admin/enquiries', { headers: { Authorization: 'Bearer test-admin-token' } }), environment);
    assert.equal(authorised.status, 200);
  } finally { globalThis.fetch = original; }
});

const apiUrl = 'https://enquiry.example.workers.dev/api/enquiry';
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
  for (const origin of [websiteOrigin + '.evil.test', 'https://another.vercel.app', 'null', new URL(apiUrl).origin]) {
    const rejected = await worker.fetch(apiRequest(payload(), origin), environment);
    assert.equal(rejected.status, 403);
    assert.equal(rejected.headers.get('Access-Control-Allow-Origin'), null);
  }
  const preflight = (method, headers = 'content-type', origin = websiteOrigin) => new Request(apiUrl, {
    method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': headers }
  });
  const accepted = await worker.fetch(preflight('POST'), environment);
  assert.equal(accepted.status, 204);
  assert.equal(accepted.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
  assert.equal(accepted.headers.get('Access-Control-Allow-Methods'), 'GET, POST');
  assert.equal((await worker.fetch(preflight('DELETE'), environment)).status, 403);
  assert.equal((await worker.fetch(preflight('POST', 'authorization'), environment)).status, 403);
  assert.equal((await worker.fetch(preflight('POST', 'content-type', 'https://evil.test'), environment)).status, 403);
  assert.equal((await worker.fetch(new Request(apiUrl, { method: 'POST', body: '{}' }), environment)).status, 403);
});

test('Vercel multipart submission verifies the website hostname and returns working Worker download links', async () => {
  const original = globalThis.fetch; globalThis.fetch = fakeFetch({ hostname: new URL(websiteOrigin).hostname }); responses.length = 0;
  try {
    const environment = splitEnv();
    const form = new FormData(); form.set('payload', JSON.stringify(payload()));
    form.append('files', new File(['solid cross-origin\nendsolid cross-origin'], 'model.stl'));
    const response = await worker.fetch(new Request(apiUrl, { method: 'POST', headers: { Origin: websiteOrigin }, body: form }), environment);
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
      const response = await worker.fetch(apiRequest(payload()), environment);
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
    environment.ENQUIRIES.get = async () => { throw new Error('R2 unavailable'); };
    const failure = await worker.fetch(apiRequest(payload()), environment);
    assert.equal(failure.status, 503);
    assert.equal(failure.headers.get('Access-Control-Allow-Origin'), websiteOrigin);
    assert.ok((await failure.json()).error);
  } finally { globalThis.fetch = original; }
});
