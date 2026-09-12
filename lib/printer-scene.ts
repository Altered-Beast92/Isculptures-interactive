import * as THREE from 'three';
import { createPrinterFrameDriver } from './printer-frame-driver';
import { createPrinterFilament } from './printer-filament';
import { loadPrinterResources, type PrinterBuffers } from './printer-resources';
export type PrinterState = { progress: number; isScrolling: boolean; active: boolean };
export type PrinterViewState = PrinterState & { width: number; height: number; dpr: number };
const PRINT_HEIGHT = 2.24, HEAD_DROP = -.275;

// DOM-free renderer shared by the worker and the compatibility fallback.
export function createPrinterRenderer(canvas: HTMLCanvasElement | OffscreenCanvas, read: () => PrinterViewState, fail: (error: Error) => void, present: () => void, buffers?: PrinterBuffers) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#191b1a');
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 1000);
  camera.position.set(3.9,.45,5.8);
  const rig = new THREE.Group(); rig.name = 'printer'; rig.position.set(1.35,-.15,0); scene.add(rig);
  const gantry = new THREE.Group(); gantry.name = 'gantry'; gantry.position.set(0,.04,-.7); rig.add(gantry);
  const head = new THREE.Group(); head.name = 'head'; head.position.set(0,HEAD_DROP,0); gantry.add(head);
  const spool = new THREE.Group(); spool.name = 'spool'; spool.position.set(-1.78,1.05,-.7); rig.add(spool);
  const carrier = new THREE.Group(); carrier.name = 'carrier'; carrier.position.set(0,1.72,-.55); rig.add(carrier);
  const clip = new THREE.Plane(new THREE.Vector3(0,-1,0),-.9);
  const modelMaterial = new THREE.MeshStandardMaterial({ color: '#8f918d', roughness: .65, metalness: .05, clippingPlanes: [clip], side: THREE.DoubleSide });
  const filament = createPrinterFilament();
  const filamentMaterial = new THREE.MeshStandardMaterial({ color: '#cfc7b2', roughness: .42, metalness: .04 });
  const feed = new THREE.Mesh(filament.geometry, filamentMaterial); feed.frustumCulled = false; feed.name = 'filament'; rig.add(feed);
  scene.add(new THREE.AmbientLight(0xffffff,.65));
  const key = new THREE.SpotLight('#fff4df',290,0,.72,1); key.position.set(-3,5,4); scene.add(key);
  const fill = new THREE.SpotLight('#e8efff',110,0,.78,1); fill.position.set(3,3,4); scene.add(fill);
  const target = new THREE.Vector3(), inlet = new THREE.Vector3(), lastInlet = new THREE.Vector3(1e3,1e3,1e3);
  let disposed = false, ready = false, lost = false, initial = true, compact = false, renderScale = 1;
  let elapsedBefore = 0, headTarget = 0, sampleStart = 0, sampleFrames = 0, sampleCpu = 0;
  let viewWidth = 0, viewHeight = 0, viewDpr = 0, presented = false;
  let resources: Awaited<ReturnType<typeof loadPrinterResources>> | undefined;
  let shadowMaterial: THREE.MeshBasicMaterial | undefined, shadowGeometry: THREE.PlaneGeometry | undefined;
  const resize = () => {
    const { width, height, dpr } = read();
    viewWidth = width; viewHeight = height; viewDpr = dpr;
    if (!width || !height || disposed) return;
    compact = width <= 760;
    renderer.setPixelRatio(Math.max(.5, Math.min(dpr, compact ? 1 : 1.5) * renderScale));
    renderer.setSize(width,height,false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    driver.wake();
  };
  const driver = createPrinterFrameDriver({
    request: requestAnimationFrame.bind(globalThis), cancel: cancelAnimationFrame.bind(globalThis),
    fps: () => read().isScrolling && !compact ? 60 : 30,
    draw: (elapsed, now, first) => {
      const { progress, isScrolling } = read();
      const delta = Math.min(.1, elapsed - elapsedBefore); elapsedBefore = elapsed;
      if (first) { sampleStart = now; sampleFrames = 0; sampleCpu = 0; }
      const started = performance.now();
      const p = Math.max(0,Math.min(1,progress)), rotation = -.38 + p * .52;
      let moving = isScrolling;
      target.set(3.9-p*2.15,.45+p*.25,5.8-p*1.8);
      if (initial || isScrolling) headTarget = -.38 + (Math.floor(p*44)%11)*.076;
      // Ease into the opening pose on load as well as after scrolling.
      rig.rotation.y = THREE.MathUtils.damp(rig.rotation.y,rotation,4,delta);
      if (Math.abs(rig.rotation.y-rotation)<.001) rig.rotation.y=rotation; else moving=true;
      gantry.position.y=.04+p*PRINT_HEIGHT;
      head.position.x=THREE.MathUtils.damp(head.position.x,headTarget,22,delta);
      if(Math.abs(head.position.x-headTarget)<.001)head.position.x=headTarget;else moving=true;
      camera.position.lerp(target,1-Math.exp(-delta*2.1));
      if(camera.position.distanceToSquared(target)<1e-6)camera.position.copy(target);else moving=true;
      camera.lookAt(.15+p*.28+(compact ? .46 : 0),-.1+p*.3,0);
      clip.constant=-.91+Math.max(.01,p)*PRINT_HEIGHT;
      if(isScrolling)spool.rotation.x-=delta*.55;
      inlet.set(head.position.x,gantry.position.y+HEAD_DROP+.4125,0);
      carrier.position.x=inlet.x;
      if(inlet.distanceToSquared(lastInlet)>=4e-5){lastInlet.copy(inlet);filament.update(inlet.x,inlet.y);}
      initial=false;
      renderer.render(scene,camera);
      if (!presented) { presented = true; present(); }
      sampleFrames++;sampleCpu+=performance.now()-started;
      const duration=now-sampleStart;
      if(duration>=1500&&sampleFrames>=6){
        if(((sampleFrames-1)*1000/duration<18||sampleCpu/sampleFrames>20)&&renderer.getPixelRatio()>.5){renderScale=Math.max(1/3,renderScale*.75);resize();}
        sampleStart=now;sampleFrames=0;sampleCpu=0;
      }
      return moving;
    },
  });
  const update = () => {
    const view = read();
    if (view.width !== viewWidth || view.height !== viewHeight || view.dpr !== viewDpr) resize();
    if (!ready || lost || disposed || !read().active) driver.suspend(); else driver.resume(); };
  const compile = async () => {
    await renderer.compileAsync(scene,camera);
    if (!disposed) { ready=true; update(); }
  };
  const onLost = (event: Event) => { event.preventDefault(); lost=true; driver.suspend(); };
  const onRestored = () => { lost=false; ready=false; void compile().catch(error=>{if(!disposed)fail(error);}); };
  canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);
  resize();
  const disposeResources = (value: Awaited<ReturnType<typeof loadPrinterResources>>) => {
    Object.values(value.parts).forEach(geometry=>geometry.dispose());value.material.dispose();value.geometry.dispose();value.environment.dispose();value.shadow.dispose();
    if (typeof ImageBitmap !== 'undefined' && value.shadow.image instanceof ImageBitmap) value.shadow.image.close();
  };
  void loadPrinterResources(buffers).then(value=>{
    if(disposed){disposeResources(value);return;}
    resources=value;
    scene.environment=value.environment;
    for(const [name,parent] of [['frame',rig],['gantry',gantry],['head',head],['spool',spool],['carrier',carrier]] as const){
      const mesh=new THREE.Mesh(value.parts[name],value.material);mesh.name=name+'-mesh';parent.add(mesh);
    }
    const model=new THREE.Mesh(value.geometry,modelMaterial);model.name='printed-model';model.applyMatrix4(value.matrix);
    const print=new THREE.Group();print.add(model);
    const box=new THREE.Box3().setFromObject(print),size=box.getSize(new THREE.Vector3());
    const scale=PRINT_HEIGHT/Math.max(size.y,.001);print.scale.setScalar(scale);
    print.position.set(-(box.min.x+size.x/2)*scale,-.91-box.min.y*scale,-(box.min.z+size.z/2)*scale);rig.add(print);
    shadowGeometry=new THREE.PlaneGeometry(7,7);shadowMaterial=new THREE.MeshBasicMaterial({map:value.shadow,transparent:true,opacity:.5,depthWrite:false});
    const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.position.set(0,-1.24,0);shadow.rotation.x=-Math.PI/2;rig.add(shadow);
    return compile();
  }).catch(error=>{if(!disposed)fail(error instanceof Error?error:new Error(String(error)));});
  return {
    update,
    dispose() {
      disposed=true;driver.dispose();
      canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);
      if(resources)disposeResources(resources);filament.geometry.dispose();filamentMaterial.dispose();modelMaterial.dispose();shadowGeometry?.dispose();shadowMaterial?.dispose();
      renderer.dispose();renderer.forceContextLoss();
    },
  };
}
