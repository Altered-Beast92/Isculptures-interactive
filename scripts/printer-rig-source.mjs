// Build-time source for the original printer. Only these five sections move independently.
import * as T from 'three';
export const RIG_PARTS = ['frame', 'gantry', 'head', 'spool', 'carrier'];
export function printerRigSource() {
  const parts = Object.fromEntries(RIG_PARTS.map(name => [name, []]));
  function add(part, kind, args, colour, roughness, metalness, position = [0,0,0], rotation = [0,0,0], parent) {
    const geometry = new T[kind](...args);
    const matrix = new T.Matrix4().compose(new T.Vector3(...position), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(1,1,1));
    if (parent) matrix.premultiply(parent);
    geometry.applyMatrix4(matrix);
    // Material parameters become vertex attributes, allowing one draw per section
    // without changing the original colours, roughness or metallic surfaces.
    const count = geometry.attributes.position.count;
    const color = new T.Color(colour);
    const colors = new Float32Array(count * 3), surface = new Float32Array(count * 2);
    for (let i=0;i<count;i++) { colors.set([color.r,color.g,color.b],i*3); surface.set([roughness,metalness],i*2); }
    geometry.setAttribute('color', new T.BufferAttribute(colors,3));
    geometry.setAttribute('surface', new T.BufferAttribute(surface,2));
    geometry.deleteAttribute('uv'); geometry.clearGroups();
    parts[part].push(geometry);
  }
  const box=(part,size,c,r,m,p,rotation,parent)=>add(part,'BoxGeometry',size,c,r,m,p,rotation,parent);
  const cyl=(part,size,c,r,m,p,rotation,parent)=>add(part,'CylinderGeometry',size,c,r,m,p,rotation,parent);
  box('frame',[3.55,.22,2.7],'#353632',.33,.82,[0,-1.12,0]);
  for(const x of [-.62,.62]) cyl('frame',[.035,.035,2.35,16],'#8d8f88',.22,.86,[x,-1.07,0],[Math.PI/2,0,0]);
  box('frame',[2.5,.07,1.7],'#2b2c28',.5,.45,[0,-1.035,0]);
  box('frame',[2.75,.08,1.9],'#a99e89',.24,.92,[0,-.96,0]);
  for(const x of [-1.36,1.36]) box('frame',[.13,2.95,.15],'#585a54',.25,.8,[x,.55,-.7]);
  box('frame',[2.85,.16,.2],'#4b4c47',.23,.85,[0,1.86,-.7]);
  const spool = new T.Matrix4().makeTranslation(-1.78,1.05,-.7);
  cyl('frame',[.05,.05,.42,14],'#6f716a',.3,.8,[.21,0,0],[0,0,Math.PI/2],spool);
  box('frame',[.44,.13,.11],'#4b4c47',.35,.7,[.42,0,0],undefined,spool);
  box('frame',[.1,.26,.1],'#4b4c47',.35,.7,[.42,-.13,0],undefined,spool);
  box('frame',[.06,.34,.24],'#3f403b',.4,.66,[.63,0,0],undefined,spool);
  cyl('spool',[.4,.4,.19,36],'#cfc7b2',.62,.03,[0,0,0],[0,0,Math.PI/2]);
  for(const x of [-.11,.11]) cyl('spool',[.45,.45,.014,36],'#242522',.55,.12,[x,0,0],[0,0,Math.PI/2]);
  cyl('spool',[.17,.17,.23,20],'#1c1d1a',.6,.1,[0,0,0],[0,0,Math.PI/2]);
  box('frame',[2.78,.05,.07],'#6e706a',.24,.86,[0,1.72,-.55]);
  box('frame',[2.78,.05,.03],'#42433e',.34,.7,[0,1.77,-.55]);
  for(const x of [-1.31,1.31]) box('frame',[.1,.22,.13],'#4b4c47',.32,.72,[x,1.81,-.61]);
  box('carrier',[.16,.13,.12],'#33342f',.38,.6,[0,0,.04]);
  add('carrier','TorusGeometry',[.035,.012,6,16],'#8d8f88',.26,.82,[0,-.06,.06],[Math.PI/2,0,0]);
  box('gantry',[2.72,.1,.13],'#4b4c47',.22,.86);
  box('gantry',[2.6,.05,.04],'#7f817a',.18,.9,[0,0,.09]);
  box('gantry',[2.6,.012,.01],'#141512',.85,.1,[0,-.05,.1]);
  box('head',[.42,.44,.1],'#3a3b36',.36,.62,[0,.275,.1]);
  box('head',[.24,.3,.188],'#33342f',.4,.55,[0,.215,.244]);
  const tool = new T.Matrix4().compose(new T.Vector3(0,0,.775),new T.Quaternion(),new T.Vector3(1.25,1.25,1.25));
  box('head',[.36,.52,.31],'#2c2d29',.44,.5,[0,.02,-.06],undefined,tool);
  box('head',[.3,.34,.02],'#3b3c36',.36,.56,[0,.06,.1],undefined,tool);
  cyl('head',[.11,.055,.14,4],'#262723',.46,.48,[0,-.29,-.06],undefined,tool);
  add('head','ConeGeometry',[.03,.08,16],'#b9903f',.24,.85,[0,-.4,-.06],[Math.PI,0,0],tool);
  cyl('head',[.042,.042,.09,14],'#4e4f49',.3,.7,[0,.29,-.06],undefined,tool);
  return parts;
}
