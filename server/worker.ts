import { handleEnquiry, handleAdmin, handleFile, json, type Env } from '../functions/api/enquiry.js';
interface WorkerEnv extends Env { ASSETS: { fetch: (request: Request) => Promise<Response> } }
// Embedded from public/_redirects by the deployment build, in first-match order.
const redirectRules: string[][] = /* REDIRECT_RULES */ [];
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      if (path === '/api/enquiry') return await handleEnquiry(request, env);
      if (path === '/api/enquiry/file') return await handleFile(request, env);
      if (path === '/api/admin/enquiries') return await handleAdmin(request, env);
      if (path.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
      for (const [from, to, status] of redirectRules) {
        if (from === path || (from.endsWith('*') && path.startsWith(from.slice(0, -1)))) {
          const target = new URL(to, request.url);
          if (!to.includes('?')) target.search = new URL(request.url).search;
          return Response.redirect(target.href, Number(status));
        }
      }
      return await env.ASSETS.fetch(request);
    } catch { console.error('enquiry_request_failed'); return json({ error: 'The service is temporarily unavailable. Please email info@isculptures.com.au.' }, 503); }
  }
};
