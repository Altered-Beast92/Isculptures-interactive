'use client';

import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { PRINTER_MESH, printerAsset } from '../../lib/printer-assets';
import { parsePrinterMesh } from '../../lib/printer-mesh';

type PrinterMesh = { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 };

function build(buffer: ArrayBuffer): PrinterMesh {
  const mesh = parsePrinterMesh(buffer);
  const geometry = new THREE.BufferGeometry();
  // Positions are 16-bit fractions of the mesh's own box. The prepared matrix
  // carries the offset and scale that put them back in model space.
  geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3, true));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  return { geometry, matrix: new THREE.Matrix4().fromArray(mesh.matrix) };
}

class PrinterMeshLoader extends THREE.Loader<PrinterMesh> {
  load(url: string, onLoad: (model: PrinterMesh) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: unknown) => void) {
    // The download is already in flight from the page's own bundle.
    printerAsset(url).then(buffer => onLoad(build(buffer))).catch(error => onError?.(error));
  }
}

export function usePrinterMesh() {
  return useLoader(PrinterMeshLoader, PRINTER_MESH);
}
