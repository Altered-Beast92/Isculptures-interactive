// The printer's binaries are fetched from the page's own bundle rather than
// from inside the scene, so they download alongside the scene's Three.js chunk
// instead of waiting for it to arrive and run. Nothing here may import Three.js.
export const PRINTER_MESH = '/models/homepage-print.bin.gz';
export const PRINTER_STUDIO = '/models/printer-studio.bin.gz';
export const PRINTER_SHADOW = '/models/printer-ground-shadow.png';

const requests = new Map<string, Promise<ArrayBuffer>>();

async function download(url: string) {
  // Low priority so these never take bandwidth from the scene's own chunk,
  // which has to arrive and run before any of this can be used.
  const response = await fetch(url, { priority: 'low' });
  if (!response.ok) throw new Error(`Printer asset ${url} responded ${response.status}`);
  const buffer = await response.arrayBuffer();
  const head = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
  // Also accept a response the host has already decompressed for us.
  if (head[0] !== 0x1f || head[1] !== 0x8b) return buffer;
  return new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}

export function printerAsset(url: string) {
  let request = requests.get(url);
  if (!request) { request = download(url); requests.set(url, request); }
  return request;
}

// Call as early as the scene is known to be wanted. Rejections are reported
// where the scene awaits the same promise, so they are only silenced here.
export function preloadPrinterAssets() {
  for (const url of [PRINTER_MESH, PRINTER_STUDIO, PRINTER_SHADOW]) void printerAsset(url).catch(() => {});
}
