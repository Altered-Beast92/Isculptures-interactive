// Etsy OAuth 2.0 with PKCE. Run `node scripts/etsy-auth.mjs` once to authorise, then
// `node scripts/etsy-auth.mjs --refresh` whenever the access token has expired.
//
// Etsy issues a 1-hour access token and a 90-day refresh token. Nothing here prints a
// credential: the tokens go straight into .env, which is gitignored.
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { readEnv, writeEnv, required } from './etsy-env.mjs';

const REDIRECT_URI = 'http://localhost:3003/oauth/redirect';
const SCOPES = ['listings_r', 'listings_w', 'shops_r'];
const TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
const base64url = buffer => buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

async function exchange(body) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Etsy rejected the token request (${response.status}): ${text}`);
  return JSON.parse(text);
}

function store(tokens) {
  writeEnv({ ETSY_ACCESS_TOKEN: tokens.access_token, ETSY_REFRESH_TOKEN: tokens.refresh_token });
  const expires = new Date(Date.now() + tokens.expires_in * 1000).toLocaleTimeString('en-AU');
  console.log(`Tokens written to .env. Access token valid until about ${expires}.`);
}

async function refresh() {
  const env = readEnv();
  const [keystring, token] = required(env, 'ETSY_KEYSTRING', 'ETSY_REFRESH_TOKEN');
  store(await exchange({ grant_type: 'refresh_token', client_id: keystring, refresh_token: token }));
}

async function authorise() {
  const env = readEnv();
  const [keystring] = required(env, 'ETSY_KEYSTRING');
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(16));

  // Built by hand rather than with URLSearchParams: that encodes a space as '+', and
  // Etsy's connect endpoint only accepts '%20' between scopes, rejecting the request otherwise.
  const query = {
    response_type: 'code', client_id: keystring, redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '), state, code_challenge: challenge, code_challenge_method: 'S256',
  };
  const url = 'https://www.etsy.com/oauth/connect?' + Object.entries(query)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');

  const tokens = await new Promise((resolve, reject) => {
    const server = http.createServer(async (request, response) => {
      const incoming = new URL(request.url, 'http://localhost:3003');
      if (incoming.pathname !== '/oauth/redirect') return response.writeHead(404).end();
      const finish = (status, message) => {
        response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(`<!doctype html><meta charset="utf-8"><title>Etsy</title><body style="font:16px system-ui;padding:3rem;max-width:32rem"><p>${message}</p></body>`);
        server.close();
      };
      // Etsy reflects `state` back; a mismatch means the response is not the one we started.
      if (incoming.searchParams.get('state') !== state) {
        finish(400, 'State mismatch — nothing was saved. Run the script again.');
        return reject(new Error('OAuth state mismatch'));
      }
      const error = incoming.searchParams.get('error');
      if (error) {
        finish(400, `Etsy returned an error: ${error}. Nothing was saved.`);
        return reject(new Error(`Etsy returned ${error}`));
      }
      try {
        const result = await exchange({
          grant_type: 'authorization_code', client_id: keystring, redirect_uri: REDIRECT_URI,
          code: incoming.searchParams.get('code'), code_verifier: verifier,
        });
        finish(200, 'Authorised. You can close this tab and return to the terminal.');
        resolve(result);
      } catch (failure) {
        finish(500, 'Token exchange failed. Check the terminal.');
        reject(failure);
      }
    });
    server.listen(3003, () => {
      console.log('Waiting for Etsy approval on http://localhost:3003 ...');
      console.log('If your browser does not open, paste this into it:\n' + url + '\n');
      // Best effort; the printed URL above is the fallback on any platform.
      const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
        : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
      try { spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref(); } catch {}
    });
    server.on('error', reject);
  });
  store(tokens);
}

const run = process.argv.includes('--refresh') ? refresh : authorise;
run().catch(error => { console.error(error.message); process.exit(1); });
