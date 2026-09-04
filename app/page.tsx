'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Lightformer, OrbitControls, Sparkles, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { projects } from '../content/projects';
import { featuredTestimonials } from '../content/testimonials';
import { CATEGORY_LABELS, SOURCE_LABELS, type Category } from '../content/types';

type Decision = 'file' | 'design' | 'bulk' | null;
const materials = ['Matte nylon', 'Recycled PLA', 'Resin detail', 'Aluminium'];
const colours = ['Bone', 'Graphite', 'Clay', 'Sage'];
// Bulk enquiries are qualified by band rather than an exact count: at this stage
// the studio needs to know which production process applies, not a firm number.
const volumeBands = ['25 – 100', '100 – 500', '500 – 2,000', '2,000+'];
const timelines = ['Within 4 weeks', '1 – 3 months', '3 months+', 'Ongoing supply'];
// Start the model fetch when the chunk evaluates, rather than waiting for React
// to reach the Suspense boundary that needs it.
const PRINT_MODEL = '/models/homepage_print.glb';
useGLTF.preload(PRINT_MODEL);
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
    copy.traverse((node) => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true; const mats = Array.isArray(node.material) ? node.material : [node.material]; mats.forEach(mat => { const next = mat.clone(); next.clippingPlanes = [clip]; next.clipShadows = true; next.side = THREE.DoubleSide; node.material = next; }); } }); return copy;
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

function World({ progress, isScrolling }: { progress: number; isScrolling: boolean }) {
  const compact = useCompact();
  return <Canvas dpr={[1, 1.6]} camera={{ position: [3.9, .45, 5.8], fov: 42 }} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }}>
    <color attach="background" args={['#191b1a']} /><ambientLight intensity={.42} /><spotLight position={[3, 5, 4]} intensity={1000} angle={.44} penumbra={1} color="#fff4df" castShadow />
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

function UploadedModel({ url, kind, colour, quantity }: { url: string; kind: string; colour: string; quantity: number }) {
  const asset = (kind === 'obj' ? useLoader(OBJLoader, url) : useLoader(STLLoader, url)) as THREE.Group | THREE.BufferGeometry;
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: colour, roughness: .32, metalness: .38 }), [colour]);
  const source = useMemo(() => {
    const copy: THREE.Object3D = asset instanceof THREE.BufferGeometry ? new THREE.Mesh(asset.clone(), material) : asset.clone(true); copy.traverse((o: THREE.Object3D) => { if (o instanceof THREE.Mesh) o.material = material; });
    const bounds = new THREE.Box3().setFromObject(copy); const size = bounds.getSize(new THREE.Vector3()); const scale = 1.25 / Math.max(size.x, size.y, size.z, .01); copy.scale.setScalar(scale); const centered = new THREE.Box3().setFromObject(copy).getCenter(new THREE.Vector3()); copy.position.sub(centered); return copy;
  }, [asset, material]);
  return <group>{Array.from({ length: Math.min(quantity, 4) }, (_, i) => <primitive key={i} object={source.clone(true)} position={[(i - (Math.min(quantity,4)-1)/2) * .72, 0, (i % 2) * .15]}/>)}</group>;
}
function Preview({ quantity, colour, modelUrl, kind }: { quantity: number; colour: string; modelUrl?: string; kind?: string }) {
  const c: Record<string, string> = { Bone: '#e4dfd0', Graphite: '#333633', Clay: '#a57d61', Sage: '#7d8979' };
  return <div className="model-preview"><Canvas dpr={[1, 1.5]} camera={{ position: [0, .4, 4], fov: 44 }}><ambientLight intensity={1.1}/><spotLight position={[3,4,3]} intensity={500}/><Suspense fallback={<Sculpture compact colour={c[colour]} quantity={Math.min(quantity, 4)} />}>{modelUrl && kind !== '3mf' ? <UploadedModel url={modelUrl} kind={kind || 'stl'} colour={c[colour]} quantity={quantity}/> : <Sculpture compact colour={c[colour]} quantity={Math.min(quantity, 4)} />}</Suspense><OrbitControls enablePan={false} minDistance={2.5} maxDistance={6}/><ContactShadows position={[0,-.7,0]} opacity={.35} scale={4}/></Canvas><span className="live-dot">LIVE PREVIEW</span></div>;
}

// The nav has always linked to #work; this is the section it was pointing at.
// Projects with no imagery yet render a typographic tile rather than a broken
// image, so the layout can be judged before the Shopify export lands.
function WorkSection() {
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const shown = filter === 'all' ? projects : projects.filter(p => p.category === filter);
  return <section className="case work" id="work">
    <p className="section-tag">05 / SELECTED WORK</p>
    <h2>Things we have<br/>actually <i>made.</i></h2>
    <div className="work-filters">
      <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>All</button>
      {/* Only categories with real work get a tab. Offering "Industrial" before
          there is an industrial job to show would lead to an empty grid. */}
      {(Object.keys(CATEGORY_LABELS) as Category[]).filter(key => projects.some(p => p.category === key)).map(key => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{CATEGORY_LABELS[key]}</button>)}
    </div>
    <div className="work-grid">{shown.map(project => <a key={project.slug} className="work-card" href={`/work/${project.slug}`}>
      {project.images[0]
        ? <img src={project.images[0].src} alt={project.images[0].alt || project.title} loading="lazy"/>
        : <div className="work-thumb placeholder"><span>{project.title}</span></div>}
      <div className="work-meta"><small>{CATEGORY_LABELS[project.category]}</small><b>{project.title}</b><p>{project.summary}</p></div>
    </a>)}</div>
  </section>;
}

function TestimonialsSection() {
  const quotes = featuredTestimonials();
  if (!quotes.length) return null;
  return <section className="case testimonials" id="testimonials">
    <p className="section-tag">06 / IN THEIR WORDS</p>
    <h2>Trusted with the<br/>things that <i>matter.</i></h2>
    <div className="quote-grid">{quotes.map(quote => <figure key={quote.id}>
      {quote.rating && <div className="stars" aria-label={`${quote.rating} out of 5`}>{'★'.repeat(quote.rating)}</div>}
      <blockquote>{quote.quote}</blockquote>
      <figcaption>{quote.author}{quote.company ? `, ${quote.company}` : quote.role ? `, ${quote.role}` : ''} <span>{SOURCE_LABELS[quote.source]}</span></figcaption>
    </figure>)}</div>
  </section>;
}

type SendState = 'idle' | 'sending' | 'error' | 'sent';
// Read defensively: Turbopack only inlines NEXT_PUBLIC_* when the variable is
// actually defined, and `process` does not exist in the browser bundle, so an
// unset endpoint must degrade to undefined rather than throw on first click.
const ENQUIRY_ENDPOINT = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT : undefined;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProjectFlow({ onClose, initialChoice = null }: { onClose: () => void; initialChoice?: Decision }) {
  const [choice, setChoice] = useState<Decision>(initialChoice); const [step, setStep] = useState(0); const [file, setFile] = useState<File | null>(null); const [modelUrl, setModelUrl] = useState<string>(); const [qty, setQty] = useState(1); const [material, setMaterial] = useState(materials[0]); const [colour, setColour] = useState(colours[0]);
  const [refs, setRefs] = useState<string[]>([]); const [brief, setBrief] = useState(''); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [company, setCompany] = useState(''); const [due, setDue] = useState(''); const [notes, setNotes] = useState('');
  const [volume, setVolume] = useState(volumeBands[0]); const [timeline, setTimeline] = useState(timelines[0]); const [targetPrice, setTargetPrice] = useState(''); const [recurring, setRecurring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); const [state, setState] = useState<SendState>('idle'); const [failure, setFailure] = useState('');
  const trap = useRef('');
  const upload = (f?: File) => { if (!f) return; setFile(f); setModelUrl(f.name === 'concept-model.stl' ? undefined : URL.createObjectURL(f)); setStep(1); };

  const send = async () => {
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = 'Please tell us your name.';
    if (!email.trim()) found.email = 'We need an email address to reply to.';
    else if (!EMAIL.test(email.trim())) found.email = 'That email address doesn’t look right.';
    if ((choice === 'design' || choice === 'bulk') && !brief.trim()) found.brief = 'A short description helps us give you a useful answer.';
    setErrors(found);
    if (Object.keys(found).length) return;
    // A bot that fills every field trips the honeypot. Report success to it
    // rather than an error, so it learns nothing, and send nothing onward.
    if (trap.current.trim()) { setState('sent'); return; }
    const endpoint = ENQUIRY_ENDPOINT;
    if (!endpoint) { setState('error'); setFailure('The enquiry form isn’t connected yet. Please email us directly while we finish setting this up.'); return; }
    setState('sending'); setFailure('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: choice, submittedAt: new Date().toISOString(), sourceUrl: window.location.href,
          contact: { name: name.trim(), email: email.trim(), company: company.trim(), requiredBy: due },
          brief: brief.trim(), notes: notes.trim(),
          model: file ? { name: file.name, sizeBytes: file.size, type: file.type || file.name.split('.').pop() } : null,
          references: refs,
          spec: choice === 'file' ? { quantity: qty, material, colour } : null,
          bulk: choice === 'bulk' ? { volume, timeline, material, targetUnitPrice: targetPrice.trim() || null, recurring } : null,
        }),
      });
      if (!response.ok) throw new Error(`The studio inbox returned ${response.status}.`);
      setState('sent');
    } catch (problem) {
      setState('error');
      setFailure(problem instanceof Error ? problem.message : 'Something went wrong sending your enquiry.');
    }
  };

  const sending = state === 'sending';
  return <section className="project" id="project" aria-label="Start your project"><button className="close" onClick={onClose} aria-label="Close project planner">×</button><div className="project-kicker">PROJECT PLANNER <span>0{step + 1} / 03</span></div>
    {!choice && <><h2>Let’s make the first move.</h2><p className="lede">Most of our work is volume: event favours, corporate runs and trade orders. Choose the route that feels closest — a real person reviews every project before production.</p><div className="decision-grid"><button onClick={() => setChoice('bulk')}><span>01</span><strong>Bulk, Events or Trade</strong><em>Favours · corporate · wholesale</em></button><button onClick={() => setChoice('design')}><span>02</span><strong>I Need Help Designing It</strong><em>Sketches · photos · ideas</em></button><button onClick={() => setChoice('file')}><span>03</span><strong>Upload a 3D File</strong><em>STL · OBJ · 3MF</em></button></div></>}
    {choice === 'file' && step === 0 && <div className="upload-panel"><h2>Your model, in the studio.</h2><label className="drop"><input type="file" accept=".stl,.obj,.3mf" onChange={e => upload(e.target.files?.[0])}/><b>Drop your file here</b><span>or choose STL, OBJ or 3MF · max 250 MB</span></label><button className="text-btn" onClick={() => upload(new File([''], 'concept-model.stl'))}>Try with a sample model →</button></div>}
    {choice === 'file' && step === 1 && <div className="config-grid"><Preview quantity={qty} colour={colour} modelUrl={modelUrl} kind={file?.name.split('.').pop()?.toLowerCase()}/><div className="config"><div><small>MODEL</small><b>{file?.name}</b><p>{file?.name.endsWith('.3mf') ? '3MF received · visual inspection begins after upload' : 'Interactive 3D inspection enabled · orbit to examine'}</p></div><div className="specs"><span><b>Detected</b> geometry</span><span><b>Studio review</b> dimensions</span></div><label>Quantity <input aria-label="Quantity" type="number" min="1" max="20" value={qty} onChange={e => setQty(+e.target.value || 1)}/></label><div className="chips">{materials.map(x => <button className={material === x ? 'selected' : ''} onClick={() => setMaterial(x)} key={x}>{x}</button>)}</div><div className="chips colours">{colours.map(x => <button className={colour === x ? 'selected' : ''} onClick={() => setColour(x)} key={x}>{x}</button>)}</div><button className="primary" onClick={() => setStep(2)}>Continue with this model</button></div></div>}
    {choice === 'design' && step === 0 && <div className="assist"><h2>Tell us what you’re imagining.</h2><p>Reference images, napkin sketches and technical drawings all help. We’ll turn the unknowns into a clear next step.</p><label className="drop"><input type="file" accept="image/*,.pdf" multiple onChange={e => setRefs(Array.from(e.target.files || []).map(f => f.name))}/><b>Add photos, sketches or PDFs</b><span>{refs.length ? `${refs.length} file${refs.length > 1 ? 's' : ''} selected` : 'Drag and drop or browse your files'}</span></label><textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe the object, who it’s for, and what it needs to do."/>{errors.brief && <p className="field-error">{errors.brief}</p>}<button className="primary" onClick={() => { if (!brief.trim()) { setErrors({ brief: 'A short description helps us give you a useful answer.' }); return; } setErrors({}); setStep(2); }}>Continue</button></div>}
    {choice === 'bulk' && step === 0 && <div className="assist"><h2>Volume changes everything.</h2><p>Batch size and deadline decide the process, the tooling and the price. Tell us the shape of the run and we’ll come back with a realistic production path.</p>
      <div className="band-block"><small>ANNUAL OR PER-RUN VOLUME</small><div className="chips">{volumeBands.map(band => <button key={band} className={volume === band ? 'selected' : ''} onClick={() => setVolume(band)}>{band}</button>)}</div></div>
      <div className="band-block"><small>TIMELINE</small><div className="chips">{timelines.map(item => <button key={item} className={timeline === item ? 'selected' : ''} onClick={() => setTimeline(item)}>{item}</button>)}</div></div>
      <div className="band-block"><small>PREFERRED MATERIAL</small><div className="chips">{materials.map(item => <button key={item} className={material === item ? 'selected' : ''} onClick={() => setMaterial(item)}>{item}</button>)}</div></div>
      <label className="band-inline"><span>Target price per unit (optional)</span><input value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="e.g. $12" aria-label="Target price per unit"/></label>
      <label className="band-check"><input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)}/><span>This is a repeat or ongoing supply arrangement</span></label>
      <textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="What are we making, and what does it need to do?"/>{errors.brief && <p className="field-error">{errors.brief}</p>}
      <button className="primary" onClick={() => { if (!brief.trim()) { setErrors({ brief: 'A short description helps us give you a useful answer.' }); return; } setErrors({}); setStep(2); }}>Continue</button></div>}
    {step === 2 && state !== 'sent' && <div className="details"><h2>Almost there.</h2><p>We’ll respond with thoughtful advice, a realistic production path and pricing.</p>
      <div className="form-grid">
        <div><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" aria-label="Your name" aria-invalid={!!errors.name}/>{errors.name && <p className="field-error">{errors.name}</p>}</div>
        <div><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" aria-label="Email address" aria-invalid={!!errors.email}/>{errors.email && <p className="field-error">{errors.email}</p>}</div>
        <div><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company (optional)" aria-label="Company"/></div>
        <div><input value={due} onChange={e => setDue(e.target.value)} placeholder="Required by date" type="date" aria-label="Required by date"/></div>
      </div>
      <input className="trap" tabIndex={-1} autoComplete="off" aria-hidden="true" onChange={e => { trap.current = e.target.value; }} placeholder="Leave this field empty"/>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes, tolerances or finishes we should know about?"/>
      {state === 'error' && <p className="form-error" role="alert">{failure} You can also reach us at <a href="mailto:info@isculptures.com.au">info@isculptures.com.au</a>.</p>}
      <button className="primary" onClick={send} disabled={sending}>{sending ? 'Sending…' : 'Send project enquiry'}</button>
      {file && <p className="fineprint">We’ll reply with a secure link to upload <b>{file.name}</b> — your model isn’t sent with this form.</p>}
    </div>}
    {state === 'sent' && <div className="success"><span>✦</span><h2>It’s on its way.</h2><p>Your brief is with the iSculptures studio and we’ll be in touch shortly{file ? ', including a link to send your model file' : ''}.</p><button className="text-btn" onClick={onClose}>Back to the studio →</button></div>}
    {choice && step > 0 && state !== 'sent' && <button className="back" onClick={() => setStep(choice === 'file' ? step - 1 : 0)}>← Back</button>}
  </section>;
}

export default function Page() { const [planner, setPlanner] = useState<{ route: Decision } | null>(null); const openPlanner = (route: Decision = null) => setPlanner({ route }); const [progress, setProgress] = useState(0); const [isScrolling, setIsScrolling] = useState(false); const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null); useEffect(() => { const update = () => { setProgress(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)); setIsScrolling(true); if (scrollTimer.current) clearTimeout(scrollTimer.current); scrollTimer.current = setTimeout(() => setIsScrolling(false), 110); }; update(); window.addEventListener('scroll', update, { passive: true }); return () => { window.removeEventListener('scroll', update); if (scrollTimer.current) clearTimeout(scrollTimer.current); }; }, []); useEffect(() => { document.body.style.overflow = planner ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [planner]); return <main><div className="world"><World progress={progress} isScrolling={isScrolling}/></div><nav><a className="logo" href="#top">i<span>sculptures</span></a><div className="navlinks"><a href="#events">Events</a><a href="#b2b">Trade &amp; B2B</a><a href="#work">Our Work</a><a href="#printing">Capability</a><a href="#about">About</a><a href="https://www.etsy.com/au/shop/iSculptures" target="_blank">Shop ↗</a></div><button className="nav-cta" onClick={() => openPlanner()}>Start a project</button></nav><section className="hero" id="top"><div className="eyebrow">SYDNEY · EST. 2008</div><h1>Ideas Made<br/><i>Tangible.</i></h1><p>Custom 3D printing, design and production in Sydney.</p><div className="actions"><button className="primary" onClick={() => openPlanner()}>Start Your Project <span>↗</span></button><a href="#printing" className="secondary">Explore What We Make <span>↓</span></a></div><div className="scroll-note">SCROLL TO PRINT <b>↓</b></div></section><section className="case" id="events"><p className="section-tag">01 / EVENTS AT VOLUME</p><h2>Hundreds of pieces.<br/>One <i>deadline.</i></h2><div className="case-copy"><p>Bonbonnières, christening and wedding favours, and corporate keepsakes — designed, produced and finished in Sydney, at the quantities an event actually needs.</p><a href="#b2b">How a volume run works →</a></div></section>
      <section className="case light" id="b2b"><p className="section-tag">02 / TRADE &amp; WHOLESALE</p><h2>Built for venues,<br/>planners and <i>parishes.</i></h2><div className="b2b-copy"><p>If you order on behalf of other people, we work to trade terms.</p><ul className="b2b-points"><li>Volume pricing from 100 units</li><li>Repeatable specs across separate runs</li><li>Lead times you can commit to your own clients</li><li>A direct line to the studio, not a ticket queue</li></ul><button className="primary" onClick={() => openPlanner('bulk')}>Start a trade enquiry <span>↗</span></button></div></section>
      <section className="case" id="printing"><p className="section-tag">03 / CAPABILITY</p><h2>From a single detail<br/>to a whole <i>system.</i></h2><div className="case-copy"><p>Design, production and finishing under one roof. We take a sketch, a photo or a CAD file and turn it into something repeatable.</p><a href="#work">See what we have made →</a></div></section>
      {/* Deliberately modest: the studio has not taken an industrial job yet, so
          this is a capability statement rather than a portfolio claim. */}
      <section className="case" id="industrial"><p className="section-tag">04 / INDUSTRIAL</p><h2>Industrial work,<br/>as it <i>comes.</i></h2><p>Functional prototypes, jigs and fixtures sit well within our process, and we take that work on. We would rather show you the event runs we have actually delivered than stock photography of someone else’s factory.</p></section><WorkSection/><TestimonialsSection/><footer id="about"><span>MAKE SOMETHING REAL</span><h2>Have an idea?</h2><button className="primary" onClick={() => openPlanner()}>Start Your Project <span>↗</span></button><small>© 2026 iSculptures / Sydney, Australia</small></footer>{planner && <ProjectFlow initialChoice={planner.route} onClose={() => setPlanner(null)}/>}</main>; }
