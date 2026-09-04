/**
 * POST /api/enquiry — receives a submission from the project planner.
 *
 * The site is a static export, so this Pages Function is the only place that
 * can hold a secret. It persists the enquiry to R2 first and emails second:
 * the stored object is the record of the enquiry, and the email is a
 * notification pointing at it. That ordering matters — see the note on the
 * response below.
 */

interface Env {
  RESEND_API_KEY: string;
  ENQUIRY_TO: string;
  ENQUIRY_FROM: string;
  ENQUIRIES?: R2Bucket;
  TURNSTILE_SECRET?: string;
}

interface Contact { name?: unknown; email?: unknown; company?: unknown; requiredBy?: unknown }
interface Payload {
  route?: unknown; submittedAt?: unknown; sourceUrl?: unknown; contact?: Contact;
  brief?: unknown; notes?: unknown; model?: unknown; references?: unknown; spec?: unknown;
  turnstileToken?: unknown;
}

const MAX_BODY = 64 * 1024;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown, limit: number) => (typeof value === 'string' ? value.trim().slice(0, limit) : '');
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function verifyTurnstile(secret: string, token: string, ip: string | null) {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const outcome = await result.json<{ success: boolean }>();
  return outcome.success === true;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Expected application/json.' }, 415);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'Enquiry too large.' }, 413);

  let payload: Payload;
  try { payload = JSON.parse(raw) as Payload; } catch { return json({ error: 'Malformed JSON.' }, 400); }

  // The browser validates for the visitor's benefit; anyone can POST here
  // directly, so everything is re-checked before it is trusted or stored.
  const name = text(payload.contact?.name, 200);
  const email = text(payload.contact?.email, 320);
  if (!name) return json({ error: 'A name is required.' }, 400);
  if (!EMAIL.test(email)) return json({ error: 'A valid email address is required.' }, 400);

  if (env.TURNSTILE_SECRET) {
    const token = text(payload.turnstileToken, 2048);
    if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET, token, request.headers.get('CF-Connecting-IP')))) {
      return json({ error: 'Could not verify this submission.' }, 403);
    }
  }

  const received = new Date();
  const id = `${received.toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
  const record = {
    id,
    receivedAt: received.toISOString(),
    route: text(payload.route, 20) || 'unknown',
    contact: { name, email, company: text(payload.contact?.company, 200), requiredBy: text(payload.contact?.requiredBy, 40) },
    brief: text(payload.brief, 5000),
    notes: text(payload.notes, 5000),
    model: payload.model ?? null,
    references: Array.isArray(payload.references) ? payload.references.slice(0, 20).map(r => text(r, 260)) : [],
    spec: payload.spec ?? null,
    sourceUrl: text(payload.sourceUrl, 500),
    clientSubmittedAt: text(payload.submittedAt, 40),
    ip: request.headers.get('CF-Connecting-IP') ?? null,
  };

  // Persist first. Everything under this prefix belongs to one enquiry, so an
  // uploaded model can later sit beside the details it arrived with.
  let stored = false;
  if (env.ENQUIRIES) {
    try {
      await env.ENQUIRIES.put(`enquiries/${id}/enquiry.json`, JSON.stringify(record, null, 2), {
        httpMetadata: { contentType: 'application/json' },
      });
      stored = true;
    } catch (problem) {
      console.error(`[enquiry ${id}] could not be stored`, problem);
    }
  }

  const summary = [
    `Route: ${record.route}`,
    `Name: ${record.contact.name}`,
    `Email: ${record.contact.email}`,
    record.contact.company && `Company: ${record.contact.company}`,
    record.contact.requiredBy && `Required by: ${record.contact.requiredBy}`,
    record.spec && `Spec: ${JSON.stringify(record.spec)}`,
    record.model && `Model: ${JSON.stringify(record.model)}`,
    record.references.length ? `References: ${record.references.join(', ')}` : '',
    '',
    record.brief && `Brief:\n${record.brief}`,
    record.notes && `Notes:\n${record.notes}`,
    '',
    `Reference: ${id}`,
    `From: ${record.sourceUrl}`,
  ].filter(Boolean).join('\n');

  let emailed = false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.ENQUIRY_FROM,
        to: [env.ENQUIRY_TO],
        reply_to: record.contact.email,
        subject: `Enquiry — ${record.contact.name}${record.contact.company ? ` (${record.contact.company})` : ''}`,
        text: summary,
        html: `<pre style="font:14px/1.6 ui-monospace,monospace;white-space:pre-wrap">${escape(summary)}</pre>`,
      }),
    });
    if (!response.ok) throw new Error(`Resend returned ${response.status}: ${await response.text()}`);
    emailed = true;
  } catch (problem) {
    console.error(`[enquiry ${id}] could not be emailed`, problem);
  }

  // If the enquiry is safely in R2, a failed notification is our problem, not
  // the visitor's — reporting failure would only prompt a duplicate submission.
  // With no bucket bound the email is the only copy, so its failure is fatal.
  if (!stored && !emailed) return json({ error: 'Could not record this enquiry.' }, 502);

  return json({ ok: true, id, stored, emailed }, 200);
};
