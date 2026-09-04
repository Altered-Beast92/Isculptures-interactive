'use client';

// Split out of the homepage: the STL and OBJ loaders are only ever needed once
// someone opens the planner and drops a file in, so they load with this chunk
// rather than sitting in the first-load bundle.
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

function Sculpture({ compact = false, colour = '#d8d4c9', quantity = 1 }: { compact?: boolean; colour?: string; quantity?: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => { if (group.current) group.current.rotation.y = state.clock.elapsedTime * (compact ? .18 : .08) + state.pointer.x * .18; });
  return <group ref={group} rotation={[.2, -.3, 0]}>{Array.from({ length: quantity }, (_, i) => <mesh key={i} position={[(i - (quantity - 1) / 2) * .72, 0, (i % 2) * .18]} castShadow><icosahedronGeometry args={[compact ? .56 : 1.25, 3]} /><meshStandardMaterial color={colour} roughness={.28} metalness={.5} /></mesh>)}</group>;
}

function UploadedModel({ url, kind, colour, quantity }: { url: string; kind: string; colour: string; quantity: number }) {
  const asset = (kind === 'obj' ? useLoader(OBJLoader, url) : useLoader(STLLoader, url)) as THREE.Group | THREE.BufferGeometry;
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: colour, roughness: .32, metalness: .38 }), [colour]);
  const source = useMemo(() => {
    const copy: THREE.Object3D = asset instanceof THREE.BufferGeometry ? new THREE.Mesh(asset.clone(), material) : asset.clone(true); copy.traverse((o: THREE.Object3D) => { if (o instanceof THREE.Mesh) o.material = material; });
    const bounds = new THREE.Box3().setFromObject(copy); const size = bounds.getSize(new THREE.Vector3()); const scale = 1.25 / Math.max(size.x, size.y, size.z, .01); copy.scale.setScalar(scale); const centered = new THREE.Box3().setFromObject(copy).getCenter(new THREE.Vector3()); copy.position.sub(centered); return copy;
  }, [asset, material]);
  return <group>{Array.from({ length: Math.min(quantity, 4) }, (_, i) => <primitive key={i} object={source.clone(true)} position={[(i - (Math.min(quantity,4)-1)/2) * .72, 0, (i % 2) * .15]}/>)}</group>;
}
export default function Preview({ quantity, colour, modelUrl, kind }: { quantity: number; colour: string; modelUrl?: string; kind?: string }) {
  const c: Record<string, string> = { Bone: '#e4dfd0', Graphite: '#333633', Clay: '#a57d61', Sage: '#7d8979' };
  return <div className="model-preview"><Canvas dpr={[1, 1.5]} camera={{ position: [0, .4, 4], fov: 44 }}><ambientLight intensity={1.1}/><spotLight position={[3,4,3]} intensity={500}/><Suspense fallback={<Sculpture compact colour={c[colour]} quantity={Math.min(quantity, 4)} />}>{modelUrl && kind !== '3mf' ? <UploadedModel url={modelUrl} kind={kind || 'stl'} colour={c[colour]} quantity={quantity}/> : <Sculpture compact colour={c[colour]} quantity={Math.min(quantity, 4)} />}</Suspense><OrbitControls enablePan={false} minDistance={2.5} maxDistance={6}/><ContactShadows position={[0,-.7,0]} opacity={.35} scale={4}/></Canvas><span className="live-dot">LIVE PREVIEW</span></div>;
}
