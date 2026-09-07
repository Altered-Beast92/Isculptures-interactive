'use client';

import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { parsePrinterMesh } from '../../lib/printer-mesh';

type PrinterMesh = { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 };

class PrinterMeshLoader extends THREE.Loader<PrinterMesh> {
  load(url: string, onLoad: (model: PrinterMesh) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: unknown) => void) {
    const loader = new THREE.FileLoader(this.manager);
    loader.setResponseType('arraybuffer');
    loader.load(url, async data => {
      try {
        const source = data as ArrayBuffer;
        const bytes = new Uint8Array(source);
        const buffer = bytes[0] === 0x1f && bytes[1] === 0x8b
          ? await new Response(new Blob([source]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
          : source;
        const mesh = parsePrinterMesh(buffer);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
        onLoad({ geometry, matrix: new THREE.Matrix4().fromArray(mesh.matrix) });
      } catch (error) { onError?.(error); }
    }, onProgress, onError);
  }
}

export function usePrinterMesh() {
  return useLoader(PrinterMeshLoader, '/models/homepage-print.bin.gz');
}
