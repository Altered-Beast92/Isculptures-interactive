'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, Sparkles, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
const PRINT_MODEL = '/models/homepage_print.glb';
const PRINT_HEIGHT = 2.24;
const TOOLHEAD_SCALE = 1.25;
// Gantry rest height and the carriage drop below the beam centre together put
// the nozzle tip one visible clearance above the build plate at progress 0.
const GANTRY_REST_Y = .04;
const HEAD_DROP = -.275;
// On narrow viewports the camera aims a little closer to the rig, which nudges
// the printer toward the centre of frame instead of hanging off the right edge.
const COMPACT_AIM = .46;
const SPOOL_X = -1.78, SPOOL_Y = 1.05, SPOOL_Z = -.7, SPOOL_R = .4;
// Filament guide rail, slung under the front edge of the top beam.
const RAIL_Y = 1.72, RAIL_Z = -.55, RAIL_END = -1.31;
// Toolhead inlet: Y is measured from the carriage origin, Z is fixed in rig space.
const INLET_Y = .4125, INLET_Z = 0;

function Sculpture({ compact = false, colour = '#d8d4c9', quantity = 1 }: { compact?: boolean; colour?: string; quantity?: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => { if (group.current) group.current.rotation.y = state.clock.elapsedTime * (compact ? .18 : .08) + state.pointer.x * .18; });
  return <group ref={group} rotation={[.2, -.3, 0]}>{Array.from({ length: quantity }, (_, i) => <mesh key={i} position={[(i - (quantity - 1) / 2) * .72, 0, (i % 2) * .18]} castShadow><icosahedronGeometry args={[compact ? .56 : 1.25, 3]} /><meshStandardMaterial color={colour} roughness={.28} metalness={.5} /></mesh>)}</group>;
}

function makeSectionCap(root: THREE.Object3D, level: number) {
  const hits: THREE.Vector2[] = []; const a = new THREE.Vector3(); const b = new THREE.Vector3(); const c = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((node) => { if (!(node instanceof THREE.Mesh)) return; const pos = node.geometry.getAttribute('position'); if (!pos) return; const index = node.geometry.index; const triangles = index ? index.count / 3 : pos.count / 3;
    for (let i = 0; i < triangles; i++) { const ids = [index ? index.getX(i * 3) : i * 3, index ? index.getX(i * 3 + 1) : i * 3 + 1, index ? index.getX(i * 3 + 2) : i * 3 + 2]; const v = [a.fromBufferAttribute(pos, ids[0]).applyMatrix4(node.matrixWorld), b.fromBufferAttribute(pos, ids[1]).applyMatrix4(node.matrixWorld), c.fromBufferAttribute(pos, ids[2]).applyMatrix4(node.matrixWorld)];
      for (let edge = 0; edge < 3; edge++) { const p = v[edge], q = v[(edge + 1) % 3]; const dp = p.y - level, dq = q.y - level; if ((dp > 0 && dq > 0) || (dp < 0 && dq < 0) || Math.abs(dp - dq) < 1e-6) continue; const t = dp / (dp - dq); hits.push(new THREE.Vector2(p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t)); }
    }
  });
  if (hits.length < 3) return null;
  const centre = hits.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / hits.length); const bins: (THREE.Vector2 | null)[] = Array(48).fill(null);
  hits.forEach(point => { const angle = (Math.atan2(point.y - centre.y, point.x - centre.x) + Math.PI * 2) % (Math.PI * 2); const bin = Math.floor(angle / (Math.PI * 2) * bins.length); if (!bins[bin] || point.distanceToSquared(centre) > bins[bin]!.distanceToSquared(centre)) bins[bin] = point; });
  const outline = bins.filter((point): point is THREE.Vector2 => point !== null); if (outline.length < 3) return null; const shape = new THREE.Shape(outline); const geometry = new THREE.ShapeGeometry(shape); geometry.rotateX(Math.PI / 2); const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#d6d1c6', roughness: .47, metalness: .04, side: THREE.DoubleSide })); mesh.position.y = level + .002; return mesh;
}

function PrintedGlb({ progress }: { progress: number }) {
  const { scene } = useGLTF(PRINT_MODEL);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), -.9), []);
  const model = useMemo(() => {
    const copy = scene.clone(true); const box = new THREE.Box3().setFromObject(copy); const size = box.getSize(new THREE.Vector3());
    const scale = PRINT_HEIGHT / Math.max(size.y, .001); copy.scale.setScalar(scale); copy.position.set(-(box.min.x + size.x / 2) * scale, -.91 - box.min.y * scale, -(box.min.z + size.z / 2) * scale);
    copy.traverse((node) => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true; node.material = new THREE.MeshStandardMaterial({ color: '#8f918d', roughness: .65, metalness: .05, clippingPlanes: [clip], clipShadows: true, side: THREE.DoubleSide }); } }); return copy;
  }, [scene, clip]);
  useFrame(() => { clip.constant = -.91 + Math.max(.01, Math.min(1, progress)) * PRINT_HEIGHT; });
  return <primitive object={model}/>;
}

// The feed is guided rather than free-hanging: filament leaves the spool, rises
// into a rail slung under the top beam, runs along it to a carrier that tracks
// the carriage, and only then drops into the toolhead.
function FilamentFeed({ gantry, head }: { gantry: React.RefObject<THREE.Group | null>; head: React.RefObject<THREE.Group | null> }) {
  const mesh = useRef<THREE.Mesh>(null); const carrier = useRef<THREE.Group>(null); const last = useRef(new THREE.Vector3(1e3, 1e3, 1e3));
  const [geometry] = useState(() => new THREE.BufferGeometry());
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfc7b2', roughness: .42, metalness: .04 }), []);
  useFrame(() => {
    if (!mesh.current || !gantry.current || !head.current) return;
    const inlet = new THREE.Vector3(head.current.position.x, gantry.current.position.y + HEAD_DROP + INLET_Y, INLET_Z);
    if (carrier.current) carrier.current.position.x = inlet.x;
    if (inlet.distanceToSquared(last.current) < 4e-5) return;
    last.current.copy(inlet);
    const points = [
      new THREE.Vector3(SPOOL_X, SPOOL_Y + SPOOL_R, SPOOL_Z),
      new THREE.Vector3(SPOOL_X + .07, SPOOL_Y + SPOOL_R + .4, SPOOL_Z + .06),
      new THREE.Vector3(RAIL_END, RAIL_Y + .04, RAIL_Z),
      new THREE.Vector3(RAIL_END + .22, RAIL_Y, RAIL_Z),
      new THREE.Vector3(inlet.x - .12, RAIL_Y, RAIL_Z),
      new THREE.Vector3(inlet.x, RAIL_Y - .06, RAIL_Z + .03),
      new THREE.Vector3(inlet.x, inlet.y + .34, inlet.z - .05),
      inlet,
    ];
    const next = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 46, .021, 6, false);
    mesh.current.geometry.dispose(); mesh.current.geometry = next;
  });
  return <>
    <mesh position={[0,RAIL_Y,RAIL_Z]}><boxGeometry args={[2.78,.05,.07]}/><meshStandardMaterial color="#6e706a" metalness={.86} roughness={.24}/></mesh>
    <mesh position={[0,RAIL_Y+.05,RAIL_Z]}><boxGeometry args={[2.78,.05,.03]}/><meshStandardMaterial color="#42433e" metalness={.7} roughness={.34}/></mesh>
    {[RAIL_END,-RAIL_END].map(x => <mesh key={x} position={[x,RAIL_Y+.09,RAIL_Z-.06]}><boxGeometry args={[.1,.22,.13]}/><meshStandardMaterial color="#4b4c47" metalness={.72} roughness={.32}/></mesh>)}
    <group ref={carrier} position={[0,RAIL_Y,RAIL_Z]}>
      <mesh position={[0,0,.04]} castShadow><boxGeometry args={[.16,.13,.12]}/><meshStandardMaterial color="#33342f" metalness={.6} roughness={.38}/></mesh>
      <mesh position={[0,-.06,.06]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.035,.012,6,16]}/><meshStandardMaterial color="#8d8f88" metalness={.82} roughness={.26}/></mesh>
    </group>
    <mesh ref={mesh} geometry={geometry} material={material}/>
  </>;
}

function Spool({ isScrolling }: { isScrolling: boolean }) {
  const reel = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (reel.current && isScrolling) reel.current.rotation.x -= delta * .55; });
  return <group position={[SPOOL_X, SPOOL_Y, SPOOL_Z]}>
    <mesh position={[.21,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.05,.05,.42,14]}/><meshStandardMaterial color="#6f716a" metalness={.8} roughness={.3}/></mesh>
    <mesh position={[.42,0,0]}><boxGeometry args={[.44,.13,.11]}/><meshStandardMaterial color="#4b4c47" metalness={.7} roughness={.35}/></mesh>
    <mesh position={[.42,-.13,0]}><boxGeometry args={[.1,.26,.1]}/><meshStandardMaterial color="#4b4c47" metalness={.7} roughness={.35}/></mesh>
    <mesh position={[.63,0,0]}><boxGeometry args={[.06,.34,.24]}/><meshStandardMaterial color="#3f403b" metalness={.66} roughness={.4}/></mesh>
    <group ref={reel}>
      <mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[SPOOL_R,SPOOL_R,.19,36]}/><meshStandardMaterial color="#cfc7b2" roughness={.62} metalness={.03}/></mesh>
      {[-.11,.11].map(x => <mesh key={x} position={[x,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.45,.45,.014,36]}/><meshStandardMaterial color="#242522" roughness={.55} metalness={.12}/></mesh>)}
      <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.17,.17,.23,20]}/><meshStandardMaterial color="#1c1d1a" roughness={.6} metalness={.1}/></mesh>
    </group>
  </group>;
}

function PrinterWorld({ progress, isScrolling, compact }: { progress: number; isScrolling: boolean; compact: boolean }) {
  const rig = useRef<THREE.Group>(null); const gantry = useRef<THREE.Group>(null); const head = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const p = Math.min(1, Math.max(0, progress));
    if (rig.current) rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, -.38 + p * .52 + state.pointer.x * .08, 4, delta);
    // The bed is fixed: the gantry owns height and the carriage owns X. The
    // toolhead is a child of the gantry, so its height is structural rather
    // than a second copy of the same maths.
    if (gantry.current) gantry.current.position.y = GANTRY_REST_Y + p * PRINT_HEIGHT;
    if (isScrolling && head.current) {
      const layer = Math.floor(p * 44); const xTarget = -.38 + (layer % 11) * .076;
      head.current.position.x = THREE.MathUtils.damp(head.current.position.x, xTarget, 22, delta);
    }
    const cameraTarget = new THREE.Vector3(3.9 - p * 2.15, .45 + p * .25, 5.8 - p * 1.8);
    state.camera.position.lerp(cameraTarget, 1 - Math.exp(-delta * 2.1)); state.camera.lookAt(.15 + p * .28 + (compact ? COMPACT_AIM : 0), -.1 + p * .3, 0);
  });
  return <group ref={rig} position={[1.35, -.15, 0]}>
    <mesh position={[0,-1.12,0]} receiveShadow><boxGeometry args={[3.55,.22,2.7]}/><meshStandardMaterial color="#353632" roughness={.33} metalness={.82}/></mesh>
    {[-.62,.62].map(x => <mesh key={x} position={[x,-1.07,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.035,.035,2.35,16]}/><meshStandardMaterial color="#8d8f88" metalness={.86} roughness={.22}/></mesh>)}
    <group>
      <mesh position={[0,-1.035,0]} castShadow><boxGeometry args={[2.5,.07,1.7]}/><meshStandardMaterial color="#2b2c28" metalness={.45} roughness={.5}/></mesh>
      <mesh position={[0,-.96,0]} receiveShadow><boxGeometry args={[2.75,.08,1.9]}/><meshStandardMaterial color="#a99e89" roughness={.24} metalness={.92}/></mesh>
      <Suspense fallback={null}><PrintedGlb progress={progress}/></Suspense>
    </group>
    {[-1.36,1.36].map(x => <mesh key={x} position={[x,.55,-.7]}><boxGeometry args={[.13,2.95,.15]}/><meshStandardMaterial color="#585a54" metalness={.8} roughness={.25}/></mesh>)}
    <mesh position={[0,1.86,-.7]}><boxGeometry args={[2.85,.16,.2]}/><meshStandardMaterial color="#4b4c47" metalness={.85} roughness={.23}/></mesh>
    <Spool isScrolling={isScrolling}/>
    <FilamentFeed gantry={gantry} head={head}/>
    <group ref={gantry} position={[0,GANTRY_REST_Y,-.7]}>
      <mesh><boxGeometry args={[2.72,.1,.13]}/><meshStandardMaterial color="#4b4c47" metalness={.86} roughness={.22}/></mesh>
      <mesh position={[0,0,.09]}><boxGeometry args={[2.6,.05,.04]}/><meshStandardMaterial color="#7f817a" metalness={.9} roughness={.18}/></mesh>
      <mesh position={[0,-.05,.1]}><boxGeometry args={[2.6,.012,.01]}/><meshStandardMaterial color="#141512" roughness={.85} metalness={.1}/></mesh>
      <group ref={head} position={[0,HEAD_DROP,0]}>
        <mesh position={[0,-HEAD_DROP,.1]} castShadow><boxGeometry args={[.42,.44,.1]}/><meshStandardMaterial color="#3a3b36" metalness={.62} roughness={.36}/></mesh>
        <mesh position={[0,-HEAD_DROP-.06,.244]}><boxGeometry args={[.24,.3,.188]}/><meshStandardMaterial color="#33342f" metalness={.55} roughness={.4}/></mesh>
        <group position={[0,0,.775]} scale={TOOLHEAD_SCALE}>
          <mesh position={[0,.02,-.06]} castShadow><boxGeometry args={[.36,.52,.31]}/><meshStandardMaterial color="#2c2d29" metalness={.5} roughness={.44}/></mesh>
          <mesh position={[0,.06,.1]}><boxGeometry args={[.3,.34,.02]}/><meshStandardMaterial color="#3b3c36" metalness={.56} roughness={.36}/></mesh>
          <mesh position={[0,-.29,-.06]}><cylinderGeometry args={[.11,.055,.14,4]}/><meshStandardMaterial color="#262723" metalness={.48} roughness={.46}/></mesh>
          <mesh position={[0,-.4,-.06]} rotation={[Math.PI,0,0]}><coneGeometry args={[.03,.08,16]}/><meshStandardMaterial color="#b9903f" metalness={.85} roughness={.24}/></mesh>
          <mesh position={[0,.29,-.06]}><cylinderGeometry args={[.042,.042,.09,14]}/><meshStandardMaterial color="#4e4f49" metalness={.7} roughness={.3}/></mesh>
        </group>
      </group>
    </group>
  </group>;
}

function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width:760px)');
    const update = () => setCompact(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return compact;
}

export default function PrinterScene({ progress, isScrolling }: { progress: number; isScrolling: boolean }) {
  const compact = useCompact();
  return <Canvas dpr={[1, 1.6]} camera={{ position: [3.9, .45, 5.8], fov: 42 }} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
    <color attach="background" args={['#191b1a']} />
    {/* Broad, balanced studio lighting lowers the contrast between the GLB's existing facets. */}
    <ambientLight intensity={.65} />
    <spotLight position={[-3, 5, 4]} intensity={290} angle={.72} penumbra={1} color="#fff4df" />
    <spotLight position={[3, 3, 4]} intensity={110} angle={.78} penumbra={1} color="#e8efff" />
    {/* The studio light is built in-scene rather than with drei's `preset`,
        which downloads a multi-megabyte HDR from a third-party CDN before the
        first frame can draw. One cube render (frames={1}) replaces it. */}
    <Environment resolution={128} frames={1}>
      <mesh scale={30}><sphereGeometry args={[1, 16, 16]}/><meshBasicMaterial color="#242623" side={THREE.BackSide}/></mesh>
      <Lightformer intensity={2.6} position={[0, 4, -6]} scale={[10, 6, 1]} color="#fff4df" />
      <Lightformer intensity={1.2} position={[-5, 1, 2]} scale={[6, 6, 1]} color="#cdd6e0" />
      <Lightformer intensity={.9} position={[5, -1, 3]} scale={[6, 4, 1]} color="#c9b48a" />
    </Environment>
    <Sparkles count={32} scale={7} size={1.4} speed={.15} color="#d6bf91" />
    <ContactShadows position={[1.35,-1.26,0]} opacity={.5} scale={7} blur={2.5} />
    {/* The rig is all procedural geometry, so it paints on the first frame;
        only the printed GLB inside it suspends. */}
    <PrinterWorld progress={progress} isScrolling={isScrolling} compact={compact}/>
  </Canvas>;
}

