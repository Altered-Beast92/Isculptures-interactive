import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(fs.readFileSync('lib/printer-mesh.ts', 'utf8'));
const { parsePrinterMesh } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const bytes = gunzipSync(fs.readFileSync('public/models/homepage-print.bin.gz'));
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

test('prepared print preserves every source vertex, triangle and node transform', () => {
  const mesh = parsePrinterMesh(buffer);
  const glb = fs.readFileSync('public/models/homepage_print.glb');
  const jsonLength = glb.readUInt32LE(12);
  const document = JSON.parse(glb.subarray(20, 20 + jsonLength));
  const binary = glb.subarray(28 + jsonLength);
  const primitive = document.meshes[0].primitives[0];
  const positions = document.accessors[primitive.attributes.POSITION];
  const indices = document.accessors[primitive.indices];
  const positionOffset = document.bufferViews[positions.bufferView].byteOffset + positions.byteOffset;
  const indexOffset = document.bufferViews[indices.bufferView].byteOffset + indices.byteOffset;
  assert.equal(mesh.positions.length / 3, 17999);
  assert.equal(mesh.indices.length / 3, 36564);
  for (let i = 0; i < mesh.positions.length; i++) assert.equal(mesh.positions[i], binary.readFloatLE(positionOffset + i * 4));
  for (let i = 0; i < mesh.indices.length; i++) assert.equal(mesh.indices[i], binary.readUInt32LE(indexOffset + i * 4));
  assert.deepEqual([...mesh.matrix], document.nodes[0].matrix);
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
