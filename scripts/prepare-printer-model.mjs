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

const positions = new Float32Array(position.count * 3);
for (let i = 0; i < positions.length; i++) positions[i] = binary.readFloatLE(position.offset + i * 4);

// Float32 coordinates barely compress. Sixteen bits across the model's own box
// leaves detail far below a pixel at the size the printer renders, and the box
// transform folds into the node matrix so the runtime dequantises for free.
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < position.count; i++) {
  for (let axis = 0; axis < 3; axis++) {
    const value = positions[i * 3 + axis];
    if (value < min[axis]) min[axis] = value;
    if (value > max[axis]) max[axis] = value;
  }
}
const size = max.map((high, axis) => high - min[axis] || 1);
const quantised = new Uint16Array(position.count * 3);
for (let i = 0; i < position.count; i++) {
  for (let axis = 0; axis < 3; axis++) {
    quantised[i * 3 + axis] = Math.round((positions[i * 3 + axis] - min[axis]) / size[axis] * 65535);
  }
}

// glTF node matrices are column-major, so each column is scaled by its axis and
// the translation column absorbs the box offset: node * translate(min) * scale(size).
const matrix = node.matrix.slice();
for (let column = 0; column < 3; column++) {
  for (let row = 0; row < 4; row++) matrix[12 + row] += node.matrix[column * 4 + row] * min[column];
  for (let row = 0; row < 4; row++) matrix[column * 4 + row] *= size[column];
}

// ISM2: counts, dequantising node matrix, Uint16 positions, Uint16 indices.
// Vertex colours are unused by the printer's own material. No simplification.
const output = Buffer.alloc(76 + position.count * 6 + index.count * 2);
output.writeUInt32LE(0x324d5349, 0);
output.writeUInt32LE(position.count, 4);
output.writeUInt32LE(index.count, 8);
matrix.forEach((value, i) => output.writeFloatLE(value, 12 + i * 4));
for (let i = 0; i < quantised.length; i++) output.writeUInt16LE(quantised[i], 76 + i * 2);
for (let i = 0; i < index.count; i++) {
  const vertex = binary.readUInt32LE(index.offset + i * 4);
  if (vertex >= position.count) throw new Error('Print index outside vertex buffer');
  output.writeUInt16LE(vertex, 76 + position.count * 6 + i * 2);
}
const compressed = gzipSync(output, { level: 9 });
fs.writeFileSync('public/models/homepage-print.bin.gz', compressed);
console.log(`${position.count} vertices, ${index.count / 3} triangles; ${source.length} -> ${compressed.length} bytes`);
