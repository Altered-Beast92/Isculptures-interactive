import fs from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
const root = process.cwd();
const output = path.join(root, 'dist');
// Only remove this project's generated dist directory.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Unsafe build directory');
fs.rmSync(output, { recursive: true, force: true });
for (const file of ['lib/enquiry.ts', 'functions/api/enquiry.ts', 'server/worker.ts']) {
  let code = stripTypeScriptTypes(fs.readFileSync(file, 'utf8'));
  if (file === 'server/worker.ts') {
    const rules = fs.readFileSync('public/_redirects', 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => line.split(/\s+/));
    if (rules.some(rule => rule.length !== 3 || !['301', '302', '307', '308'].includes(rule[2]))) throw new Error('Invalid redirect rule');
    if (!code.includes('/* REDIRECT_RULES */ []')) throw new Error('Redirect build marker is missing');
    code = code.replace('/* REDIRECT_RULES */ []', JSON.stringify(rules));
  }
  const dest = path.join(output, 'server', file.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, code);
}
fs.writeFileSync(path.join(output, 'server/index.js'), "export { default } from './server/worker.js';\n");
fs.cpSync('out', path.join(output, 'client'), { recursive: true });
fs.mkdirSync(path.join(output, '.openai'), { recursive: true });
fs.copyFileSync('.openai/hosting.json', path.join(output, '.openai/hosting.json'));
console.log('Worker and static pages prepared in dist.');
