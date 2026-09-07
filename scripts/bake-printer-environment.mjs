// Bake the existing studio light into a prefiltered texture. Run this again when
// changing these lights or upgrading Three.js (CubeUV is its internal format).
// Requires Chrome/Chromium; set CHROME_PATH when it is not in a standard location.
import http from 'node:http';
import { readFile, writeFile, mkdtemp, rm, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean);
let executable;
for (const candidate of candidates) { if (await access(candidate).then(() => true, () => false)) { executable = candidate; break; } }
if (!executable) throw new Error('Set CHROME_PATH to a Chrome or Chromium executable.');

const html = `<!doctype html><script type="module">
import * as THREE from '/three.module.js';
try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const studio = new THREE.Scene();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: '#242623', side: THREE.BackSide }));
  sphere.scale.setScalar(30); studio.add(sphere);
  for (const [intensity, position, scale, colour] of [
    [2.6, [0, 4, -6], [10, 6, 1], '#fff4df'],
    [1.2, [-5, 1, 2], [6, 6, 1], '#cdd6e0'],
    [.9, [5, -1, 3], [6, 4, 1], '#c9b48a'],
  ]) {
    const light = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(intensity), toneMapped: false, side: THREE.DoubleSide }));
    light.position.set(...position); light.scale.set(...scale); light.lookAt(0, 0, 0); studio.add(light);
  }
  const cube = new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(1, 1000, cube).update(renderer, studio);
  const generator = new THREE.PMREMGenerator(renderer);
  const atlas = generator.fromCubemap(cube.texture);
  const pixels = new Uint16Array(atlas.width * atlas.height * 4);
  renderer.readRenderTargetPixels(atlas, 0, 0, atlas.width, atlas.height, pixels);
  const data = new ArrayBuffer(12 + pixels.byteLength);
  const header = new DataView(data);
  header.setUint32(0, 0x31505349, true); // ISP1
  header.setUint32(4, atlas.width, true); header.setUint32(8, atlas.height, true);
  new Uint16Array(data, 12).set(pixels);
  await fetch('/result', { method: 'POST', body: data });
  atlas.dispose(); cube.dispose(); generator.dispose(); renderer.dispose();
} catch (error) { await fetch('/error', { method: 'POST', body: String(error.stack || error) }); }
</script>`;

let complete, fail;
const result = new Promise((resolve, reject) => { complete = resolve; fail = reject; });
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && ['/result', '/error'].includes(req.url)) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const data = Buffer.concat(chunks);
      if (req.url === '/error') throw new Error(data.toString());
      const width = data.readUInt32LE(4), height = data.readUInt32LE(8);
      if (data.readUInt32LE(0) !== 0x31505349 || data.length !== 12 + width * height * 8) throw new Error('Invalid texture');
      const compressed = gzipSync(data, { level: 9 });
      await writeFile(path.join(root, 'public/models/printer-studio.bin.gz'), compressed);
      res.end('Saved'); complete({ width, height, bytes: compressed.length });
    } else if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); }
    else if (['/three.module.js', '/three.core.js'].includes(req.url)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(await readFile(path.join(root, 'node_modules/three/build', req.url.slice(1))));
    } else { res.writeHead(404); res.end(); }
  } catch (error) { res.writeHead(500); res.end(String(error)); fail(error); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = await mkdtemp(path.join(tmpdir(), 'printer-lighting-'));
const browser = spawn(executable, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + profile, 'http://127.0.0.1:' + server.address().port], { windowsHide: true, stdio: 'ignore' });
browser.on('error', fail);
const timeout = setTimeout(() => fail(new Error('Texture bake timed out')), 45000);
try { console.log('Baked printer studio:', await result); }
finally {
  clearTimeout(timeout);
  browser.kill(); server.closeAllConnections(); server.close();
  // Only remove the exact temporary profile created by this script.
  if (path.dirname(profile) === path.resolve(tmpdir()) && path.basename(profile).startsWith('printer-lighting-')) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  }
}
