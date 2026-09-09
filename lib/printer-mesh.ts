// ISM2 is generated from the original GLB by scripts/prepare-printer-model.mjs.
// Positions are 16-bit fractions of the mesh's own bounding box; the matrix
// carries the node transform with that dequantisation already folded in.
// Typed-array views avoid duplicating the decompressed vertex/index buffers.
export function parsePrinterMesh(buffer: ArrayBuffer) {
  if (buffer.byteLength < 76) throw new Error('Incomplete printer mesh');
  const header = new DataView(buffer);
  const vertices = header.getUint32(4, true), indices = header.getUint32(8, true);
  if (header.getUint32(0, true) !== 0x324d5349 || vertices === 0 || vertices > 65535 || indices === 0 || indices % 3 !== 0 || buffer.byteLength !== 76 + vertices * 6 + indices * 2) {
    throw new Error('Invalid printer mesh');
  }
  return {
    matrix: new Float32Array(buffer, 12, 16),
    positions: new Uint16Array(buffer, 76, vertices * 3),
    indices: new Uint16Array(buffer, 76 + vertices * 6, indices),
  };
}
