import fs from 'node:fs';

const FILE = '.env';

/** Reads .env without pulling in a dependency. Values are never logged by callers. */
export function readEnv() {
  if (!fs.existsSync(FILE)) throw new Error('.env not found. Copy the names from .env.example and fill in your Etsy values.');
  const env = {};
  for (const line of fs.readFileSync(FILE, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

/** Updates keys in place and appends any that are new, so hand-written comments survive. */
export function writeEnv(updates) {
  const lines = fs.readFileSync(FILE, 'utf8').split(/\r?\n/);
  const remaining = new Map(Object.entries(updates));
  const next = lines.map(line => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!match || !remaining.has(match[1])) return line;
    const key = match[1];
    const value = remaining.get(key);
    remaining.delete(key);
    return `${key}=${value}`;
  });
  for (const [key, value] of remaining) next.push(`${key}=${value}`);
  fs.writeFileSync(FILE, next.join('\n'));
}

export function required(env, ...keys) {
  const missing = keys.filter(key => !env[key]);
  if (missing.length) throw new Error(`Missing in .env: ${missing.join(', ')}`);
  return keys.map(key => env[key]);
}

/** Etsy expects `keystring:shared_secret` in x-api-key for apps of this vintage; the
 *  keystring alone returns 403 "Shared secret is required in x-api-key header."
 *  Verified against /v3/application/openapi-ping. */
export function apiHeaders(env, { auth = true } = {}) {
  const [keystring, secret] = required(env, 'ETSY_KEYSTRING', 'ETSY_SHARED_SECRET');
  const headers = { 'x-api-key': `${keystring}:${secret}` };
  if (auth) {
    const [token] = required(env, 'ETSY_ACCESS_TOKEN');
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
