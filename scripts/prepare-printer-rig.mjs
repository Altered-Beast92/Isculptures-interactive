import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RIG_PARTS, printerRigSource } from './printer-rig-source.mjs';
const parts = printerRigSource();
// IRG1: count, then for each section vertex/index counts, packed Float32
// position/normal/linear colour/surface attributes, Uint16 indices, 4-byte padding.
const chunks = []; const header=Buffer.alloc(8);header.write('IRG1');header.writeUInt32LE(RIG_PARTS.length,4);chunks.push(header);
for(const name of RIG_PARTS) {
 const geometry=mergeGeometries(parts[name],false);
 const count=geometry.attributes.position.count,indexCount=geometry.index.count;
 if(count>65535)throw new Error('Printer section exceeds Uint16 indices');
 const info=Buffer.alloc(8);info.writeUInt32LE(count);info.writeUInt32LE(indexCount,4);chunks.push(info);
 for(const attribute of ['position','normal','color','surface']) {
  const data=geometry.attributes[attribute].array;chunks.push(Buffer.from(data.buffer,data.byteOffset,data.byteLength));
 }
 const indices=new Uint16Array(geometry.index.array);chunks.push(Buffer.from(indices.buffer));
 if(indices.byteLength%4)chunks.push(Buffer.alloc(2));
 console.log(`${name}: ${parts[name].length} meshes -> 1, ${count} vertices, ${indexCount/3} triangles`);
 geometry.dispose();parts[name].forEach(g=>g.dispose());
}
const raw=Buffer.concat(chunks),compressed=gzipSync(raw,{level:9});
fs.writeFileSync('public/models/printer-rig.bin.gz',compressed);
console.log(`Printer rig: ${raw.length} prepared bytes, ${compressed.length} compressed bytes`);
