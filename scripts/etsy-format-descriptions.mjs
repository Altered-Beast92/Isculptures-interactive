// Add readable paragraph breaks to the active Etsy descriptions without changing copy.
// Preview by default; pass --apply to publish the whitespace-only changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readEnv, apiHeaders } from './etsy-env.mjs';

const env = readEnv();
const headers = apiHeaders(env);
const api = 'https://api.etsy.com/v3/application';
const apply = process.argv.includes('--apply');
const groups = new Map([
  [4579364231, [2, 2, 1, 1]], // Saint Elias favour
  [4579360791, [2, 2, 2, 1]], // Rose favour
  [4579376840, [2, 2, 1, 1]], // Pantocrator favour
  [4579373618, [1, 2, 1]], // First-tooth tag
  [4579361528, [2, 2, 1]], // Christmas tree
  [4544225986, [2, 2, 1, 1]], // Saint Gabriel favour
  [4311901365, [2, 2, 1]], // Coaster, already spaced
  [4579363684, [1, 2, 1]], // Saint Arnold
  [4579346739, [1, 2, 1]], // Saint Anthony
  [1887372006, [1, 2, 1]], // Saint Dominic
]);
const leaveAlone = new Set([4579344605]); // Short cross-hanger description

function format(id, description) {
  const sentences = description.trim().split(/(?<=\.)\s+(?=[A-Z0-9])/u);
  const widths = groups.get(id) ?? (leaveAlone.has(id) ? [sentences.length] : Array(sentences.length).fill(1));
  if (widths.reduce((sum, width) => sum + width, 0) !== sentences.length) {
    throw new Error(`${id}: expected ${widths.join('+')} sentences, found ${sentences.length}`);
  }
  const paragraphs = [];
  let offset = 0;
  for (const width of widths) {
    paragraphs.push(sentences.slice(offset, offset + width).join(' '));
    offset += width;
  }
  const after = paragraphs.join('\n\n');
  if (description.replace(/\s+/g, ' ').trim() !== after.replace(/\s+/g, ' ').trim()) {
    throw new Error(`${id}: text would change`);
  }
  return after;
}

const response = await fetch(`${api}/shops/${env.ETSY_SHOP_ID}/listings?state=active&limit=100`, { headers });
if (!response.ok) throw new Error(`List: ${response.status} ${(await response.text()).slice(0, 200)}`);
const listings = (await response.json()).results;
for (const listing of listings) {
  const id = listing.listing_id;
  const before = listing.description ?? '';
  const after = format(id, before);
  if (before === after) continue;
  console.log(`${id} ${listing.title}\n${after}\n`);
  if (!apply) continue;
  const backup = path.join(os.tmpdir(), `etsy-description-${id}-${Date.now()}.txt`);
  fs.writeFileSync(backup, before);
  const body = new URLSearchParams({ description: after });
  const savedResponse = await fetch(`${api}/shops/${env.ETSY_SHOP_ID}/listings/${id}`, {
    method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  if (!savedResponse.ok) throw new Error(`${id}: ${savedResponse.status} ${(await savedResponse.text()).slice(0, 300)}; backup ${backup}`);
  const saved = await savedResponse.json();
  if (saved.description !== after) throw new Error(`${id}: verification failed; backup ${backup}`);
}
