import { handleEnquiry, handleAdmin, handleFile, json, type Env } from '../functions/api/enquiry.js';
interface WorkerEnv extends Env { ASSETS: { fetch: (request: Request) => Promise<Response> } }
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      if (path === '/api/enquiry') return await handleEnquiry(request, env);
      if (path === '/api/enquiry/file') return await handleFile(request, env);
      if (path === '/api/admin/enquiries') return await handleAdmin(request, env);
      if (path.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
      return await env.ASSETS.fetch(request);
    } catch { console.error('enquiry_request_failed'); return json({ error: 'The service is temporarily unavailable. Please email info@isculptures.com.au.' }, 503); }
  }
};
