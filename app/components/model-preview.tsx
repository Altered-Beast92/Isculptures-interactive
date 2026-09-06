'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Component, useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p>Preview is unavailable on this device. You can still send the file for review.</p> : this.props.children; }
}
export default function ModelPreview({ file }: { file: File }) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false; let loaded: THREE.Object3D | null = null;
    const dispose = (root: THREE.Object3D) => root.traverse(node => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); const materials = Array.isArray(node.material) ? node.material : [node.material]; materials.forEach(material => material.dispose()); } });
    file.arrayBuffer().then(buffer => {
      if (file.name.toLowerCase().endsWith('.stl')) {
        const prefix = new TextDecoder().decode(buffer.slice(0, 512));
        if (!/^\s*solid\b/i.test(prefix) && (buffer.byteLength < 84 || new DataView(buffer).getUint32(80, true) * 50 + 84 !== buffer.byteLength)) throw new Error('Invalid STL');
      }
      const material = new THREE.MeshStandardMaterial({ color: '#c9b48a', roughness: .6 });
      loaded = file.name.toLowerCase().endsWith('.obj') ? new OBJLoader().parse(new TextDecoder().decode(buffer)) : new THREE.Mesh(new STLLoader().parse(buffer), material);
      loaded.traverse(node => { if (node instanceof THREE.Mesh) { if (node.material !== material) { const old = Array.isArray(node.material) ? node.material : [node.material]; old.forEach(item => item.dispose()); } node.material = material; } });
      const box = new THREE.Box3().setFromObject(loaded), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      const extent = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(extent) || extent <= 0) throw new Error('Empty geometry');
      const scale = 2.5 / extent; loaded.scale.setScalar(scale); loaded.position.copy(center.multiplyScalar(-scale));
      if (!cancelled) setObject(loaded); else dispose(loaded);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; if (loaded) dispose(loaded); };
  }, [file]);
  if (failed) return <p>This file could not be previewed. You can still send it for studio review.</p>;
  if (!object) return <p role="status">Preparing the preview…</p>;
  return <Boundary><div className="file-preview" role="img" aria-label={'3D preview of ' + file.name}><Canvas camera={{ position: [3,2,4], fov: 45 }} dpr={[1,1.5]} frameloop="demand"><ambientLight intensity={1.5}/><directionalLight position={[4,5,3]} intensity={3}/><primitive object={object}/><OrbitControls enablePan={false}/></Canvas></div><p className="fineprint">Drag to rotate. This preview does not confirm dimensions, printability or the final finish.</p></Boundary>;
}
