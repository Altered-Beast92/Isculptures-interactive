import fs from 'node:fs';
import { gzipSync } from 'node:zlib';

const source = fs.readFileSync('public/models/homepage_print.glb');
const jsonLength = source.readUInt32LE(12);
const document = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
const binary = source.subarray(28 + jsonLength);
const primitive = document.meshes?.[0]?.primitives?.[0];
const node = document.nodes?.[0];
if (document.meshes?.length !== 1 || document.nodes?.length !== 1 || node?.mesh !== 0 || node.matrix?.length !== 16 || document.meshes[0].primitives.length !== 1 || document.animations?.length || document.skins?.length || primitive?.targets || primitive?.mode !== 4 || Object.keys(primitive.attributes).some(key => !['POSITION', 'COLOR_0'].includes(key))) {
  throw new Error('The print asset must be one static triangle mesh. Review preparation for the new model.');
}
function accessor(index) {
  const a = document.accessors[index], view = document.bufferViews[a.bufferView];
  if (a.sparse || view.buffer !== 0) throw new Error('Unsupported print accessor');
  return { ...a, offset: (view.byteOffset || 0) + (a.byteOffset || 0), stride: view.byteStride };
}
const position = accessor(primitive.attributes.POSITION), index = accessor(primitive.indices);
if (position.type !== 'VEC3' || position.componentType !== 5126 || (position.stride && position.stride !== 12) || position.count > 65535 || index.type !== 'SCALAR' || index.componentType !== 5125 || index.count % 3) {
  throw new Error('Unexpected print geometry format');
}
// ISM1: counts, original node matrix, unchanged Float32 positions, Uint16 indices.
// Vertex colours are unused by the printer's own material. No simplification.
const output = Buffer.alloc(76 + position.count * 12 + index.count * 2);
output.writeUInt32LE(0x314d5349, 0);
output.writeUInt32LE(position.count, 4);
output.writeUInt32LE(index.count, 8);
node.matrix.forEach((value, i) => output.writeFloatLE(value, 12 + i * 4));
binary.copy(output, 76, position.offset, position.offset + position.count * 12);
for (let i = 0; i < index.count; i++) {
  const vertex = binary.readUInt32LE(index.offset + i * 4);
  if (vertex >= position.count) throw new Error('Print index outside vertex buffer');
  output.writeUInt16LE(vertex, 76 + position.count * 12 + i * 2);
}
const compressed = gzipSync(output, { level: 9 });
fs.writeFileSync('public/models/homepage-print.bin.gz', compressed);
console.log(`${position.count} vertices, ${index.count / 3} triangles; ${source.length} -> ${compressed.length} bytes`);
