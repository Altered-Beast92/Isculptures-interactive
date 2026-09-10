import * as THREE from 'three';
import { PRINTER_RIG, PRINTER_MESH, PRINTER_STUDIO, PRINTER_SHADOW, printerAsset } from './printer-assets';
import { parsePrinterRig, PRINTER_PARTS, type PrinterPart } from './printer-rig';
import { parsePrinterMesh } from './printer-mesh';
export type PrinterRig = { parts: Record<PrinterPart, THREE.BufferGeometry>; material: THREE.MeshStandardMaterial };
function buildRig(buffer: ArrayBuffer): PrinterRig {
  const source = parsePrinterRig(buffer);
  const parts = {} as PrinterRig['parts'];
  for (const name of PRINTER_PARTS) {
    const geometry = new THREE.BufferGeometry();
    const data = source[name];
    for (const attribute of ['position', 'normal', 'color', 'surface'] as const) geometry.setAttribute(attribute, new THREE.BufferAttribute(data[attribute], attribute === 'surface' ? 2 : 3));
    geometry.setIndex(new THREE.BufferAttribute(data.index, 1));
    parts[name] = geometry;
  }
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 1 });
  // The original per-piece PBR settings are retained as vertex attributes.
  // Each rigid section now shares a material and needs just one draw call.
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 surface;\nvarying vec2 vPrinterSurface;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPrinterSurface = surface;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPrinterSurface;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= vPrinterSurface.x;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= vPrinterSurface.y;');
  };
  material.customProgramCacheKey = () => 'printer-surface-v1';
  return { parts, material };
}
function buildEnvironment(buffer: ArrayBuffer) {
  const header = new DataView(buffer);
  const width = header.getUint32(4, true), height = header.getUint32(8, true);
  if (header.getUint32(0, true) !== 0x31505349 || buffer.byteLength !== 12 + width * height * 8) {
    throw new Error('Invalid printer studio texture');
  }
  const texture = new THREE.DataTexture(new Uint16Array(buffer, 12), width, height, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.mapping = THREE.CubeUVReflectionMapping;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

async function shadowImage(buffer: ArrayBuffer) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(new Blob([buffer], { type: 'image/png' }), { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
  const source = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Printer ground shadow could not be decoded'));
      image.src = source;
    });
    return image;
  } finally { URL.revokeObjectURL(source); }
}
export type PrinterBuffers = { rig: ArrayBuffer; model: ArrayBuffer; environment: ArrayBuffer; shadow: ArrayBuffer };
export async function loadPrinterResources(buffers?: PrinterBuffers) {
  const [rigBuffer, modelBuffer, environmentBuffer, image] = await Promise.all([
    buffers?.rig ?? printerAsset(PRINTER_RIG), buffers?.model ?? printerAsset(PRINTER_MESH), buffers?.environment ?? printerAsset(PRINTER_STUDIO),
    (buffers ? Promise.resolve(buffers.shadow) : printerAsset(PRINTER_SHADOW)).then(shadowImage),
  ]);
  const rig = buildRig(rigBuffer);
  const model = parsePrinterMesh(modelBuffer);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(model.positions, 3, true));
  geometry.setIndex(new THREE.BufferAttribute(model.indices, 1));
  const shadow = new THREE.Texture(image); shadow.needsUpdate = true;
  return { ...rig, geometry, matrix: new THREE.Matrix4().fromArray(model.matrix), environment: buildEnvironment(environmentBuffer), shadow };
}
