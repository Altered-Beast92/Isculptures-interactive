import { enquiryOrigins, handleEnquiry, handleAdmin, handleFile, json, type Env } from '../functions/api/enquiry.js';

// API-only deployment: Vercel serves the website; Cloudflare receives uploads.
export default {
  async fetch(request: Request, bindings: Env): Promise<Response> {
    // This standalone API requires an explicit allowlist, including in previews.
    const env = { ...bindings, ENQUIRY_ALLOWED_ORIGINS: bindings.ENQUIRY_ALLOWED_ORIGINS ?? '' };
    const path = new URL(request.url).pathname;
    const origin = request.headers.get('origin');
    const allowed = !!origin && enquiryOrigins(request, env).includes(origin);
    const cors = (response: Response) => {
      const headers = new Headers(response.headers);
      headers.set('Vary', 'Origin');
      if (allowed) headers.set('Access-Control-Allow-Origin', origin!);
      return new Response(response.body, { status: response.status, headers });
    };
    try {
      if (path === '/api/enquiry') {
        if (origin && !allowed) return cors(json({ error: 'Please submit from this website.' }, 403));
        if (request.method === 'OPTIONS') {
          const method = request.headers.get('Access-Control-Request-Method');
          const headers = (request.headers.get('Access-Control-Request-Headers') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
          if (!allowed || !['GET', 'POST'].includes(method || '') || headers.some(header => header !== 'content-type')) return cors(json({ error: 'Request not allowed.' }, 403));
          return cors(new Response(null, { status: 204, headers: {
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '600',
            'Cache-Control': 'no-store'
          } }));
        }
        return cors(await handleEnquiry(request, env));
      }
      if (path === '/api/enquiry/file') return await handleFile(request, env);
      // Administration stays token-authenticated and has no browser CORS access.
      if (path === '/api/admin/enquiries') return await handleAdmin(request, env);
      return json({ error: 'Not found.' }, 404);
    } catch {
      console.error('enquiry_request_failed');
      const response = json({ error: 'The service is temporarily unavailable. Please email info@isculptures.com.au.' }, 503);
      return path === '/api/enquiry' ? cors(response) : response;
    }
  }
};
