export const PRINTER_PARTS = ['frame', 'gantry', 'head', 'spool', 'carrier'] as const;
export type PrinterPart = typeof PRINTER_PARTS[number];
// Decode build-time geometry using views into one decompressed allocation.
export function parsePrinterRig(buffer: ArrayBuffer) {
  const header = new DataView(buffer);
  if (buffer.byteLength < 8 || header.getUint32(0, true) !== 0x31475249 || header.getUint32(4, true) !== PRINTER_PARTS.length) throw new Error('Invalid printer rig');
  let offset = 8;
  const parts = {} as Record<PrinterPart, { position: Float32Array; normal: Float32Array; color: Float32Array; surface: Float32Array; index: Uint16Array }>;
  for (const name of PRINTER_PARTS) {
    if (offset + 8 > buffer.byteLength) throw new Error('Incomplete printer rig');
    const vertices = header.getUint32(offset, true), indices = header.getUint32(offset + 4, true);
    offset += 8;
    const end = offset + vertices * 44 + indices * 2;
    if (!vertices || vertices > 65535 || !indices || indices % 3 || end > buffer.byteLength) throw new Error('Invalid printer section');
    const floats = (size: number) => { const view = new Float32Array(buffer, offset, vertices * size); offset += view.byteLength; return view; };
    const position = floats(3), normal = floats(3), color = floats(3), surface = floats(2);
    const index = new Uint16Array(buffer, offset, indices);
    offset = (end + 3) & ~3;
    parts[name] = { position, normal, color, surface, index };
  }
  if (offset !== buffer.byteLength) throw new Error('Invalid printer rig length');
  return parts;
}
