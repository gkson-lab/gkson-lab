// Small modelling kit used by the procedural presets.
// Conventions: +x is downstream (noses point to -x), +y is up, units are metres.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const mat = (color, o = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1, ...o });

export const glass = (color = '#9fd8ff', opacity = 0.22) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

const hidden = new THREE.MeshBasicMaterial({ visible: false });

export function box(w, h, d, m, r = 0) {
  const rr = Math.min(r, w * 0.49, h * 0.49, d * 0.49);
  return new THREE.Mesh(rr > 0 ? new RoundedBoxGeometry(w, h, d, 3, rr) : new THREE.BoxGeometry(w, h, d), m);
}

export function cyl(r, len, m, axis = 'y', rTop = r, seg = 40) {
  const g = new THREE.CylinderGeometry(rTop, r, len, seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return new THREE.Mesh(g, m);
}

export function sph(r, m, sx = 1, sy = 1, sz = 1) {
  const g = new THREE.SphereGeometry(r, 40, 28);
  g.scale(sx, sy, sz);
  return new THREE.Mesh(g, m);
}

export function torus(R, r, m, arc = Math.PI * 2) {
  return new THREE.Mesh(new THREE.TorusGeometry(R, r, 20, 56, arc), m);
}

/** Extrude an (x, y) outline along z, centred on z = 0. */
export function extrude(pts, depth, m, bevel = 0) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 16,
  });
  g.translate(0, 0, -depth / 2);
  return new THREE.Mesh(g, m);
}

/** Extrude an (x, z) planform along y (for wings and plates), centred on y = 0. */
export function planform(pts, thick, m, bevel = 0) {
  const mesh = extrude(pts, thick, m, bevel);
  mesh.geometry.rotateX(Math.PI / 2);
  return mesh;
}

/** Revolve an (r, s) profile around the x axis; s runs downstream. */
export function lathe(pts, m, axis = 'x') {
  const g = new THREE.LatheGeometry(pts.map(([r, s]) => new THREE.Vector2(r, s)), 56);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  return new THREE.Mesh(g, m);
}

export function put(parent, mesh, x = 0, y = 0, z = 0, rot = null) {
  mesh.position.set(x, y, z);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.traverse((o) => {
    if (o.isMesh && o.material !== hidden) o.castShadow = o.receiveShadow = true;
  });
  parent.add(mesh);
  return mesh;
}

/** Mark a mesh (or subtree) as decoration only: drawn, but invisible to the solver. */
export function deco(obj) {
  obj.traverse((o) => (o.userData.noVoxel = true));
  return obj;
}

export function wheel(r, width, tire = mat('#15161a', { roughness: 0.85 }), rim = mat('#b9c0cc', { metalness: 0.8, roughness: 0.25 })) {
  const g = new THREE.Group();
  g.add(cyl(r, width, tire, 'z'));
  g.add(deco(cyl(r * 0.58, width * 1.04, rim, 'z')));
  return g;
}

export function naca(chord, m = 0.02, p = 0.4, t = 0.12, n = 40) {
  const upper = [];
  const lower = [];
  for (let i = 0; i <= n; i++) {
    const x = 0.5 * (1 - Math.cos((Math.PI * i) / n));
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const yc = m === 0 ? 0 : x < p ? (m / p ** 2) * (2 * p * x - x * x) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x * x);
    upper.push([(x - 0.5) * chord, (yc + yt) * chord]);
    lower.push([(x - 0.5) * chord, (yc - yt) * chord]);
  }
  return [...upper, ...lower.reverse().slice(1, -1)];
}

/**
 * Axial fan. Air is pushed along the group's local +y axis; rotate the group
 * to aim it. The invisible disc is the actuator zone the solver sees.
 */
export function fan(r, { strength = 1, thick = 0.028, color = '#20242c' } = {}) {
  const g = new THREE.Group();
  const zone = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, thick, 24), hidden);
  zone.userData.fan = { strength };
  g.add(zone);

  const body = mat(color, { roughness: 0.6 });
  const ring = torus(r, r * 0.07, body);
  ring.geometry.rotateX(Math.PI / 2);
  g.add(deco(ring));
  const spin = new THREE.Group();
  spin.userData.spin = strength;
  spin.add(cyl(r * 0.28, thick, body));
  const bladeMat = mat('#aeb9c9', { roughness: 0.35, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 7; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 7) * Math.PI * 2;
    const blade = box(r * 0.66, thick * 0.12, r * 0.34, bladeMat);
    blade.position.x = r * 0.58;
    blade.rotation.x = 0.5;
    pivot.add(blade);
    spin.add(pivot);
  }
  g.add(deco(spin));
  return g;
}

/** Aim a fan (built blowing +y) along a principal direction. */
export function aim(fanGroup, dir) {
  if (dir === '+x') fanGroup.rotation.z = -Math.PI / 2;
  else if (dir === '-x') fanGroup.rotation.z = Math.PI / 2;
  else if (dir === '-y') fanGroup.rotation.z = Math.PI;
  else if (dir === '+z') fanGroup.rotation.x = Math.PI / 2;
  else if (dir === '-z') fanGroup.rotation.x = -Math.PI / 2;
  return fanGroup;
}

export { THREE };
