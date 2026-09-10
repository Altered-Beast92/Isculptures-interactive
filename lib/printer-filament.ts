import * as THREE from 'three';
const SEGMENTS = 46, SIDES = 6, RADIUS = .021;
// A single index/vertex allocation survives every carriage movement.
export function createPrinterFilament() {
  const points = [
    new THREE.Vector3(-1.78, 1.45, -.7), new THREE.Vector3(-1.71, 1.85, -.64),
    new THREE.Vector3(-1.31, 1.76, -.55), new THREE.Vector3(-1.09, 1.72, -.55),
    new THREE.Vector3(-.12, 1.72, -.55), new THREE.Vector3(0, 1.66, -.52),
    new THREE.Vector3(0, .5175, -.05), new THREE.Vector3(0, .1775, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, SEGMENTS, RADIUS, SIDES, false);
  geometry.deleteAttribute('uv');
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
  position.setUsage(THREE.DynamicDrawUsage); normal.setUsage(THREE.DynamicDrawUsage);
  const point = new THREE.Vector3(), direction = new THREE.Vector3();
  const sin = Array.from({ length: SIDES + 1 }, (_, i) => Math.sin(i / SIDES * Math.PI * 2));
  const cos = Array.from({ length: SIDES + 1 }, (_, i) => -Math.cos(i / SIDES * Math.PI * 2));
  return {
    geometry,
    update(x: number, y: number) {
      points[4].x = x - .12; points[5].x = x;
      points[6].set(x, y + .34, -.05); points[7].set(x, y, 0);
      curve.updateArcLengths();
      const frames = curve.computeFrenetFrames(SEGMENTS, false);
      for (let i = 0; i <= SEGMENTS; i++) {
        curve.getPointAt(i / SEGMENTS, point);
        const n = frames.normals[i], b = frames.binormals[i];
        for (let j = 0; j <= SIDES; j++) {
          direction.set(cos[j] * n.x + sin[j] * b.x, cos[j] * n.y + sin[j] * b.y, cos[j] * n.z + sin[j] * b.z).normalize();
          const vertex = i * (SIDES + 1) + j;
          normal.setXYZ(vertex, direction.x, direction.y, direction.z);
          position.setXYZ(vertex, point.x + RADIUS * direction.x, point.y + RADIUS * direction.y, point.z + RADIUS * direction.z);
        }
      }
      position.needsUpdate = true; normal.needsUpdate = true;
    },
  };
}
