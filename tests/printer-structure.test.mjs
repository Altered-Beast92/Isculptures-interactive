import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { stripTypeScriptTypes } from 'node:module';
import * as THREE from 'three';
import { printerRigSource } from '../scripts/printer-rig-source.mjs';
async function moduleFrom(file) {
 const source=stripTypeScriptTypes(fs.readFileSync(file,'utf8')).replace("from 'three'",`from '${import.meta.resolve('three')}'`);
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const {parsePrinterRig,PRINTER_PARTS}=await moduleFrom('lib/printer-rig.ts');
const {createPrinterFilament}=await moduleFrom('lib/printer-filament.ts');
const data=gunzipSync(fs.readFileSync('public/models/printer-rig.bin.gz'));
const buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
test('prepared printer retains every source triangle, normal and PBR surface value in its moving section',()=>{
 const parsed=parsePrinterRig(buffer),source=printerRigSource();
 assert.equal(PRINTER_PARTS.length,5);
 for(const part of PRINTER_PARTS) {
  const expected={position:[],normal:[],color:[],surface:[],index:[]};let vertices=0;
  for(const geometry of source[part]) {
   for(const attribute of ['position','normal','color','surface'])expected[attribute].push(...geometry.attributes[attribute].array);
   expected.index.push(...Array.from(geometry.index.array,i=>i+vertices));
   vertices+=geometry.attributes.position.count;geometry.dispose();
  }
  for(const attribute of ['position','normal','color','surface','index']) assert.deepEqual(Array.from(parsed[part][attribute]),expected[attribute],part+' '+attribute);
  assert.ok(parsed[part].index.every(index=>index<vertices));
 }
});
test('prepared printer rejects wrong versions, missing data and invalid section sizes',()=>{
 for(const length of [0,7,20,buffer.byteLength-2])assert.throws(()=>parsePrinterRig(buffer.slice(0,length)));
 const corrupt=buffer.slice(0);new DataView(corrupt).setUint32(0,0,true);assert.throws(()=>parsePrinterRig(corrupt));
 const oversized=buffer.slice(0);new DataView(oversized).setUint32(8,65536,true);assert.throws(()=>parsePrinterRig(oversized));
});
test('filament matches Three TubeGeometry while keeping the same vertex and index buffers across motion',()=>{
 const filament=createPrinterFilament(),geometry=filament.geometry;
 const position=geometry.attributes.position.array,normal=geometry.attributes.normal.array,index=geometry.index.array;
 for(const [x,y] of [[-.38,.1775],[.076,1.22],[.38,2.4175],[-.228,.6]]) {
  filament.update(x,y);
  const points=[[-1.78,1.45,-.7],[-1.71,1.85,-.64],[-1.31,1.76,-.55],[-1.09,1.72,-.55],[x-.12,1.72,-.55],[x,1.66,-.52],[x,y+.34,-.05],[x,y,0]].map(p=>new THREE.Vector3(...p));
  const expected=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),46,.021,6,false);
  assert.equal(geometry.attributes.position.array,position);assert.equal(geometry.attributes.normal.array,normal);assert.equal(geometry.index.array,index);
  for(const attribute of ['position','normal']) {
   const actual=geometry.attributes[attribute].array,reference=expected.attributes[attribute].array;
   for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-reference[i])<1e-6,`${attribute} ${i}`);
  }
  assert.deepEqual(index,expected.index.array);expected.dispose();
 }
 geometry.dispose();
});
