'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ContactShadows, Environment, Float, OrbitControls, Sparkles } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

type Decision = 'file' | 'design' | null;
const materials = ['Matte nylon', 'Recycled PLA', 'Resin detail', 'Aluminium'];
const colours = ['Bone', 'Graphite', 'Clay', 'Sage'];

function Sculpture({ compact = false, colour = '#d8d4c9', quantity = 1 }: { compact?: boolean; colour?: string; quantity?: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => { if (group.current) group.current.rotation.y = state.clock.elapsedTime * (compact ? .18 : .08) + state.pointer.x * .18; });
  return <group ref={group} rotation={[.2, -.3, 0]}>{Array.from({ length: quantity }, (_, i) => <mesh key={i} position={[(i - (quantity - 1) / 2) * .72, 0, (i % 2) * .18]} castShadow><icosahedronGeometry args={[compact ? .56 : 1.25, 3]} /><meshStandardMaterial color={colour} roughness={.28} metalness={.5} /></mesh>)}</group>;
}

function World() {
  return <Canvas dpr={[1, 1.6]} camera={{ position: [0, .2, 5.8], fov: 42 }} gl={{ antialias: true, alpha: true }}>
    <color attach="background" args={['#191b1a']} /><ambientLight intensity={.45} /><spotLight position={[4, 5, 4]} intensity={900} angle={.46} penumbra={1} color="#fff4df" castShadow />
    <Suspense fallback={null}><Float speed={1.2} rotationIntensity={.12} floatIntensity={.35}><Sculpture /></Float><Sparkles count={40} scale={7} size={1.8} speed={.2} color="#d6bf91" /><Environment preset="studio" /><ContactShadows position={[0,-1.45,0]} opacity={.45} scale={8} blur={2.5} /></Suspense>
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

function ProjectFlow({ onClose }: { onClose: () => void }) {
  const [choice, setChoice] = useState<Decision>(null); const [step, setStep] = useState(0); const [file, setFile] = useState<File | null>(null); const [modelUrl, setModelUrl] = useState<string>(); const [qty, setQty] = useState(1); const [material, setMaterial] = useState(materials[0]); const [colour, setColour] = useState(colours[0]); const [sent, setSent] = useState(false);
  const upload = (f?: File) => { if (!f) return; setFile(f); setModelUrl(f.name === 'concept-model.stl' ? undefined : URL.createObjectURL(f)); setStep(1); };
  return <section className="project" id="project" aria-label="Start your project"><button className="close" onClick={onClose} aria-label="Close project planner">×</button><div className="project-kicker">PROJECT PLANNER <span>0{step + 1} / 03</span></div>
    {!choice && <><h2>Let’s make the first move.</h2><p className="lede">Choose the route that feels closest. A real person reviews every project before production.</p><div className="decision-grid"><button onClick={() => setChoice('file')}><span>01</span><strong>Upload a 3D File</strong><em>STL · OBJ · 3MF</em></button><button onClick={() => setChoice('design')}><span>02</span><strong>I Need Help Designing It</strong><em>Sketches · photos · ideas</em></button></div></>}
    {choice === 'file' && step === 0 && <div className="upload-panel"><h2>Your model, in the studio.</h2><label className="drop"><input type="file" accept=".stl,.obj,.3mf" onChange={e => upload(e.target.files?.[0])}/><b>Drop your file here</b><span>or choose STL, OBJ or 3MF · max 250 MB</span></label><button className="text-btn" onClick={() => upload(new File([''], 'concept-model.stl'))}>Try with a sample model →</button></div>}
    {choice === 'file' && step === 1 && <div className="config-grid"><Preview quantity={qty} colour={colour} modelUrl={modelUrl} kind={file?.name.split('.').pop()?.toLowerCase()}/><div className="config"><div><small>MODEL</small><b>{file?.name}</b><p>{file?.name.endsWith('.3mf') ? '3MF received · visual inspection begins after upload' : 'Interactive 3D inspection enabled · orbit to examine'}</p></div><div className="specs"><span><b>Detected</b> geometry</span><span><b>Studio review</b> dimensions</span></div><label>Quantity <input aria-label="Quantity" type="number" min="1" max="20" value={qty} onChange={e => setQty(+e.target.value || 1)}/></label><div className="chips">{materials.map(x => <button className={material === x ? 'selected' : ''} onClick={() => setMaterial(x)} key={x}>{x}</button>)}</div><div className="chips colours">{colours.map(x => <button className={colour === x ? 'selected' : ''} onClick={() => setColour(x)} key={x}>{x}</button>)}</div><button className="primary" onClick={() => setStep(2)}>Continue with this model</button></div></div>}
    {choice === 'design' && step === 0 && <div className="assist"><h2>Tell us what you’re imagining.</h2><p>Reference images, napkin sketches and technical drawings all help. We’ll turn the unknowns into a clear next step.</p><label className="drop"><input type="file" accept="image/*,.pdf" multiple onChange={() => setStep(1)}/><b>Add photos, sketches or PDFs</b><span>Drag and drop or browse your files</span></label><textarea placeholder="Describe the object, who it’s for, and what it needs to do."/><button className="primary" onClick={() => setStep(1)}>Continue</button></div>}
    {step === 2 && !sent && <div className="details"><h2>Almost there.</h2><p>We’ll respond with thoughtful advice, a realistic production path and pricing.</p><div className="form-grid"><input placeholder="Your name"/><input placeholder="Email address" type="email"/><input placeholder="Company (optional)"/><input placeholder="Required by date" type="date"/></div><textarea placeholder="Any notes, tolerances or finishes we should know about?"/><button className="primary" onClick={() => setSent(true)}>Send project enquiry</button></div>}
    {sent && <div className="success"><span>✦</span><h2>It’s on its way.</h2><p>Your brief has been prepared for the iSculptures studio. We’ll be in touch shortly.</p><button className="text-btn" onClick={onClose}>Back to the studio →</button></div>}
    {choice && step === 1 && <button className="back" onClick={() => setStep(0)}>← Back</button>}
  </section>;
}

export default function Page() { const [planner, setPlanner] = useState(false); useEffect(() => { document.body.style.overflow = planner ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [planner]); return <main><div className="world"><World/></div><nav><a className="logo" href="#top">i<span>sculptures</span></a><div className="navlinks"><a href="#printing">3D Printing</a><a href="#industrial">Industrial</a><a href="#events">Events</a><a href="#work">Our Work</a><a href="#about">About</a><a href="https://www.etsy.com/au/shop/iSculptures" target="_blank">Shop ↗</a></div><button className="nav-cta" onClick={() => setPlanner(true)}>Start a project</button></nav><section className="hero" id="top"><div className="eyebrow">SYDNEY · EST. 2008</div><h1>Ideas Made<br/><i>Tangible.</i></h1><p>Custom 3D printing, design and production in Sydney.</p><div className="actions"><button className="primary" onClick={() => setPlanner(true)}>Start Your Project <span>↗</span></button><a href="#printing" className="secondary">Explore What We Make <span>↓</span></a></div><div className="scroll-note">SCROLL TO INSPECT <b>↓</b></div></section><section className="case" id="printing"><p className="section-tag">01 / CAPABILITY</p><h2>From a single detail<br/>to a whole <i>system.</i></h2><div className="case-copy"><p>Industrial-grade thinking, delivered with the care of a small Sydney studio. We bridge design intent and physical reality.</p><a href="#industrial">See our production approach →</a></div></section><section className="case light" id="industrial"><p className="section-tag">02 / INDUSTRIAL</p><h2>Built for the<br/><i>real world.</i></h2><p>Functional prototypes, jigs, fixtures and small-batch parts engineered to be used, tested and repeated.</p></section><section className="case" id="events"><p className="section-tag">03 / EVENTS & SPATIAL</p><h2>Objects that make<br/>a room <i>pause.</i></h2><p>Large-format sculptures, branded environments and immersive moments that take the digital off-screen.</p></section><footer id="about"><span>MAKE SOMETHING REAL</span><h2>Have an idea?</h2><button className="primary" onClick={() => setPlanner(true)}>Start Your Project <span>↗</span></button><small>© 2026 iSculptures / Sydney, Australia</small></footer>{planner && <ProjectFlow onClose={() => setPlanner(false)}/>}</main>; }
