// Private operational access. Supply secrets through the environment, never URLs.
const origin = process.env.ENQUIRY_SITE_URL;
const secret = process.env.ENQUIRY_ADMIN_TOKEN;
if (!origin || !secret) throw new Error('Set ENQUIRY_SITE_URL and ENQUIRY_ADMIN_TOKEN.');
const [command = 'list', id] = process.argv.slice(2);
if (!['list', 'read', 'retry'].includes(command)) throw new Error('Use list, read <reference>, or retry <reference>.');
if (command !== 'list' && !id) throw new Error('An enquiry reference is required.');
const url = new URL('/api/admin/enquiries', origin);
if (id) url.searchParams.set('id', id);
let cursor;
do {
  if (cursor) url.searchParams.set('cursor', cursor);
  const response = await fetch(url, { method: command === 'retry' ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + secret } });
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
  cursor = command === 'list' ? result.cursor : null;
} while (cursor);
