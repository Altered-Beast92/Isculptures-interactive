// Etsy OAuth 2.0 with PKCE. Run `node scripts/etsy-auth.mjs` once to authorise, then
// `node scripts/etsy-auth.mjs --refresh` whenever the access token has expired.
//
// Etsy issues a 1-hour access token and a 90-day refresh token. Nothing here prints a
// credential: the tokens go straight into .env, which is gitignored.
import https from 'node:https';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readEnv, writeEnv, required } from './etsy-env.mjs';

// Two Etsy constraints shape this callback. The OAuth request requires an https URL, so
// the listener below terminates TLS with a certificate generated on the spot. And the app
// settings reject a bare host or an IP: "Host must be a domain name." lvh.me is a real
// registered domain whose DNS resolves to 127.0.0.1, so it satisfies Etsy while still
// reaching this machine. Nothing leaves the loopback interface.
const CALLBACK_HOST = 'lvh.me';
const REDIRECT_URI = `https://${CALLBACK_HOST}:3003/oauth/redirect`;
// Overridable so a failing consent screen can be narrowed down one scope at a time:
//   npm run etsy:auth -- --scopes shops_r
const scopeArg = process.argv.indexOf('--scopes');
const SCOPES = scopeArg > -1 ? process.argv[scopeArg + 1].split(/[ ,]+/) : ['listings_r', 'listings_w', 'shops_r'];
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
    const server = https.createServer(selfSigned(), async (request, response) => {
      const incoming = new URL(request.url, REDIRECT_URI);
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
      console.log(`Waiting for Etsy approval on https://${CALLBACK_HOST}:3003 ...`);
      console.log('Scopes requested: ' + SCOPES.join(' '));
      // Safe to paste into a chat or an issue: the key is the only secret in the URL.
      console.log('Shareable (key redacted):');
      console.log(url.replace(keystring, 'REDACTED'));
      console.log('The certificate is self-signed, so accept the browser warning once.');
      console.log('If your browser does not open, paste this into it:\n' + url + '\n');
      // Best effort; the printed URL above is the fallback on any platform.
      const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
        : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
      try { spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref(); } catch {}
    });
    // A previous run that was never approved leaves its listener behind holding the port.
    server.on('error', error => reject(error.code === 'EADDRINUSE'
      ? new Error('Port 3003 is already in use, most likely by an earlier run of this script that is still waiting for approval. Close it and try again.')
      : error));
  });
  store(tokens);
}

/** A throwaway certificate for localhost, valid for this run only. Node can generate an
 *  X.509 key pair but cannot sign a certificate, so this shells out to OpenSSL. On Windows
 *  OpenSSL ships with Git but is not on PATH outside Git Bash, so look there before giving up. */
function openssl() {
  const candidates = ['openssl',
    'C:/Program Files/Git/usr/bin/openssl.exe',
    'C:/Program Files/Git/mingw64/bin/openssl.exe',
    'C:/Program Files (x86)/Git/usr/bin/openssl.exe'];
  for (const candidate of candidates) {
    try { execFileSync(candidate, ['version'], { stdio: 'ignore' }); return candidate; } catch {}
  }
  throw new Error('OpenSSL was not found. It is needed to create the local certificate Etsy requires for the callback. On Windows it ships with Git for Windows; otherwise install OpenSSL and re-run.');
}

function selfSigned() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'etsy-oauth-'));
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  execFileSync(openssl(), ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key,
    '-out', cert, '-days', '1', '-subj', `/CN=${CALLBACK_HOST}`,
    '-addext', `subjectAltName=DNS:${CALLBACK_HOST},DNS:localhost,IP:127.0.0.1`], { stdio: 'ignore' });
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

const run = process.argv.includes('--refresh') ? refresh : authorise;
run().catch(error => { console.error(error.message); process.exit(1); });
