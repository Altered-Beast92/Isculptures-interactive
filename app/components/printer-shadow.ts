'use client';

import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { PRINTER_SHADOW, printerAsset } from '../../lib/printer-assets';

// Three's TextureLoader would fetch this over the network once the scene
// mounts, and the whole scene suspends on it. Decoding bytes the page already
// holds keeps it off the critical path. TextureLoader is only a Texture around
// an HTMLImageElement, so decoding through one keeps flipping and colour space
// identical to what it produced.
class PrinterShadowLoader extends THREE.Loader<THREE.Texture> {
  load(url: string, onLoad: (texture: THREE.Texture) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: unknown) => void) {
    printerAsset(url).then(buffer => {
      const source = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(source);
        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        onLoad(texture);
      };
      image.onerror = () => {
        URL.revokeObjectURL(source);
        onError?.(new Error('Printer ground shadow could not be decoded'));
      };
      image.src = source;
    }).catch(error => onError?.(error));
  }
}

export function usePrinterShadow() {
  return useLoader(PrinterShadowLoader, PRINTER_SHADOW);
}
