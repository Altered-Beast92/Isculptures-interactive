import fs from 'node:fs';

// Vercel does not consume Cloudflare's public/_redirects file. Keep the shared
// migration map and the checked-in Vercel configuration in sync before deployment.
const redirects = fs.readFileSync('public/_redirects', 'utf8').split(/\r?\n/)
  .map(line => line.trim()).filter(line => line && !line.startsWith('#'))
  .map(line => {
    const [from, destination, status, extra] = line.split(/\s+/);
    if (extra || !from.startsWith('/') || !destination || !['301', '302', '307', '308'].includes(status)) throw new Error(`Invalid redirect: ${line}`);
    if (from.includes('*')) throw new Error('Use reviewed, exact migration destinations instead of blanket redirects.');
    return { source: from.replace(/\/$/, '') || '/', destination, statusCode: Number(status) };
  });
if (new Set(redirects.map(rule => rule.source)).size !== redirects.length) throw new Error('Duplicate redirect source');
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
if (process.argv.includes('--check')) {
  if (JSON.stringify(config.redirects) !== JSON.stringify(redirects)) throw new Error('Vercel redirects are stale. Run node scripts/sync-redirects.mjs.');
  console.log(`${redirects.length} migration redirects match the Vercel configuration.`);
} else {
  fs.writeFileSync('vercel.json', JSON.stringify({ ...config, redirects }, null, 2) + '\n');
  console.log(`Updated ${redirects.length} Vercel redirect rules.`);
}
