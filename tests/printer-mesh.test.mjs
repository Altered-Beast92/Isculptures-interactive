import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(fs.readFileSync('lib/printer-mesh.ts', 'utf8'));
const { parsePrinterMesh } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const bytes = gunzipSync(fs.readFileSync('public/models/homepage-print.bin.gz'));
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

function glb() {
  const file = fs.readFileSync('assets/models/homepage_print.glb');
  const jsonLength = file.readUInt32LE(12);
  const document = JSON.parse(file.subarray(20, 20 + jsonLength));
  const binary = file.subarray(28 + jsonLength);
  const primitive = document.meshes[0].primitives[0];
  const positions = document.accessors[primitive.attributes.POSITION];
  const indices = document.accessors[primitive.indices];
  return {
    matrix: document.nodes[0].matrix, binary,
    positionOffset: document.bufferViews[positions.bufferView].byteOffset + positions.byteOffset,
    indexOffset: document.bufferViews[indices.bufferView].byteOffset + indices.byteOffset,
  };
}

// Column-major, as glTF and Three.js both store node transforms.
function transform(matrix, x, y, z) {
  return [0, 1, 2].map(row => matrix[row] * x + matrix[4 + row] * y + matrix[8 + row] * z + matrix[12 + row]);
}

test('prepared print places every source vertex within a quantisation step', () => {
  const mesh = parsePrinterMesh(buffer);
  const { matrix, binary, positionOffset } = glb();
  assert.equal(mesh.positions.length / 3, 17999);
  // A step is the model box divided across 16 bits, so the error this allows is
  // far below a pixel at the size the printer renders.
  const step = [0, 1, 2].map(axis => Math.hypot(mesh.matrix[axis * 4], mesh.matrix[axis * 4 + 1], mesh.matrix[axis * 4 + 2]) / 65535);
  const tolerance = Math.hypot(...step) / 2 + 1e-6;
  for (let i = 0; i < mesh.positions.length / 3; i++) {
    const expected = transform(matrix, ...[0, 1, 2].map(axis => binary.readFloatLE(positionOffset + (i * 3 + axis) * 4)));
    const actual = transform(mesh.matrix, mesh.positions[i * 3] / 65535, mesh.positions[i * 3 + 1] / 65535, mesh.positions[i * 3 + 2] / 65535);
    assert.ok(Math.hypot(...expected.map((value, axis) => value - actual[axis])) <= tolerance, `vertex ${i} moved too far`);
  }
});

test('prepared print preserves every triangle', () => {
  const mesh = parsePrinterMesh(buffer);
  const { binary, indexOffset } = glb();
  assert.equal(mesh.indices.length / 3, 36564);
  for (let i = 0; i < mesh.indices.length; i++) assert.equal(mesh.indices[i], binary.readUInt32LE(indexOffset + i * 4));
  assert.equal(mesh.positions.buffer, buffer);
  assert.equal(mesh.indices.buffer, buffer);
});

test('rejects truncated, wrong-version and inconsistent prepared mesh data', () => {
  assert.throws(() => parsePrinterMesh(buffer.slice(0, 20)), /Incomplete/);
  assert.throws(() => parsePrinterMesh(buffer.slice(0, buffer.byteLength - 2)), /Invalid/);
  for (const [offset, value] of [[0, 0], [4, 0], [4, 65536], [8, 1]]) {
    const bad = buffer.slice(0);
    new DataView(bad).setUint32(offset, value, true);
    assert.throws(() => parsePrinterMesh(bad), /Invalid/);
  }
});
