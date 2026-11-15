// Mesh -> voxel conversion.
//
// Every mesh is voxelised on its own by casting axis-aligned rays along all
// three axes. A cell is solid when at least two axes agree it is inside
// (even/odd parity), or when a surface passes through it. The surface rule
// keeps thin panels and non-watertight uploads from leaking.
import * as THREE from 'three';
import { FLUID, SOLID, FAN } from './kernel.js';

// Sample points are nudged off-centre so rays never graze shared triangle edges.
const JITTER_U = 0.5 + 1.3e-4;
const JITTER_V = 0.5 + 2.7e-4;

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

function meshTriangles(mesh, toGrid) {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const index = geo.index;
  _m.multiplyMatrices(toGrid, mesh.matrixWorld);
  const verts = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    _v.fromBufferAttribute(pos, i).applyMatrix4(_m);
    verts[i * 3] = _v.x;
    verts[i * 3 + 1] = _v.y;
    verts[i * 3 + 2] = _v.z;
  }
  const count = index ? index.count : pos.count;
  const tris = new Float32Array(Math.floor(count / 3) * 9);
  for (let i = 0; i < tris.length / 3; i++) {
    const vi = index ? index.getX(i) : i;
    tris[i * 3] = verts[vi * 3];
    tris[i * 3 + 1] = verts[vi * 3 + 1];
    tris[i * 3 + 2] = verts[vi * 3 + 2];
  }
  return tris;
}

function castAxis(tris, a, dims, votes, surf) {
  const u = (a + 1) % 3;
  const v = (a + 2) % 3;
  const du = dims[u];
  const dv = dims[v];
  const da = dims[a];
  const stride = [1, dims[0], dims[0] * dims[1]];
  const heads = new Int32Array(du * dv).fill(-1);
  const next = [];
  const hitT = [];

  for (let t = 0; t < tris.length; t += 9) {
    const u0 = tris[t + u], v0 = tris[t + v], a0 = tris[t + a];
    const u1 = tris[t + 3 + u], v1 = tris[t + 3 + v], a1 = tris[t + 3 + a];
    const u2 = tris[t + 6 + u], v2 = tris[t + 6 + v], a2 = tris[t + 6 + a];
    const area = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
    if (Math.abs(area) < 1e-12) continue;
    const iu0 = Math.max(0, Math.ceil(Math.min(u0, u1, u2) - JITTER_U));
    const iu1 = Math.min(du - 1, Math.floor(Math.max(u0, u1, u2) - JITTER_U));
    const iv0 = Math.max(0, Math.ceil(Math.min(v0, v1, v2) - JITTER_V));
    const iv1 = Math.min(dv - 1, Math.floor(Math.max(v0, v1, v2) - JITTER_V));
    for (let iv = iv0; iv <= iv1; iv++) {
      const pv = iv + JITTER_V;
      for (let iu = iu0; iu <= iu1; iu++) {
        const pu = iu + JITTER_U;
        const w0 = (u1 - pu) * (v2 - pv) - (u2 - pu) * (v1 - pv);
        const w1 = (u2 - pu) * (v0 - pv) - (u0 - pu) * (v2 - pv);
        const w2 = (u0 - pu) * (v1 - pv) - (u1 - pu) * (v0 - pv);
        if (!((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0))) continue;
        const col = iu + iv * du;
        hitT.push((w0 * a0 + w1 * a1 + w2 * a2) / area);
        next.push(heads[col]);
        heads[col] = hitT.length - 1;
      }
    }
  }

  const ts = [];
  for (let iv = 0; iv < dv; iv++)
    for (let iu = 0; iu < du; iu++) {
      let k = heads[iu + iv * du];
      if (k < 0) continue;
      ts.length = 0;
      for (; k >= 0; k = next[k]) ts.push(hitT[k]);
      ts.sort((p, q) => p - q);
      const base = iu * stride[u] + iv * stride[v];
      for (const t of ts) {
        const c = Math.floor(t);
        if (c >= 0 && c < da) surf[base + c * stride[a]] = 1;
      }
      if (ts.length % 2) continue; // open surface along this ray: no parity fill
      for (let p = 0; p < ts.length; p += 2) {
        const c0 = Math.max(0, Math.ceil(ts[p] - 0.5));
        const c1 = Math.min(da - 1, Math.floor(ts[p + 1] - 0.5));
        for (let c = c0; c <= c1; c++) votes[base + c * stride[a]]++;
      }
    }
}

/**
 * @param root  Object3D whose meshes are voxelised (skips userData.noVoxel).
 * @param grid  { nx, ny, nz, h, origin: Vector3 } - origin is the world position of grid (0,0,0).
 * @returns { flag, fanIdx, fanVec, solidCount }
 */
export function voxelize(root, grid) {
  const { nx, ny, nz, h, origin } = grid;
  const N = nx * ny * nz;
  const dims = [nx, ny, nz];
  const flag = new Uint8Array(N);
  const votes = new Uint8Array(N);
  const surf = new Uint8Array(N);
  const toGrid = new THREE.Matrix4()
    .makeScale(1 / h, 1 / h, 1 / h)
    .multiply(new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z));
  const fans = [];

  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.noVoxel) return;
    if (!o.geometry || !o.geometry.attributes.position) return;
    const tris = meshTriangles(o, toGrid);
    if (!tris.length) return;
    votes.fill(0);
    surf.fill(0);
    for (let a = 0; a < 3; a++) castAxis(tris, a, dims, votes, surf);
    const fan = o.userData.fan;
    if (fan) {
      const dir = new THREE.Vector3(0, 1, 0).transformDirection(o.matrixWorld).multiplyScalar(fan.strength ?? 1);
      const cells = [];
      for (let c = 0; c < N; c++) if (votes[c] >= 2 || surf[c]) cells.push(c);
      fans.push({ cells, dir });
    } else {
      for (let c = 0; c < N; c++) if (votes[c] >= 2 || surf[c]) flag[c] = SOLID;
    }
  });

  const fanIdx = [];
  const fanVec = [];
  for (const { cells, dir } of fans)
    for (const c of cells) {
      if (flag[c] !== FLUID) continue;
      flag[c] = FAN;
      fanIdx.push(c);
      fanVec.push(dir.x, dir.y, dir.z);
    }

  let solidCount = 0;
  for (let c = 0; c < N; c++) if (flag[c] === SOLID) solidCount++;
  return { flag, fanIdx: Int32Array.from(fanIdx), fanVec: Float32Array.from(fanVec), solidCount };
}

/** Frontal area (in cells) seen by the wind, plus the streamwise extent. */
export function measureSolid(flag, nx, ny, nz) {
  let area = 0;
  let xMin = nx;
  let xMax = -1;
  for (let z = 1; z < nz - 1; z++)
    for (let y = 1; y < ny - 1; y++) {
      const b = nx * (y + ny * z);
      let hit = false;
      for (let x = 1; x < nx - 1; x++)
        if (flag[b + x] === SOLID) {
          hit = true;
          if (x < xMin) xMin = x;
          if (x > xMax) xMax = x;
        }
      if (hit) area++;
    }
  return { area, length: xMax >= xMin ? xMax - xMin + 1 : 0 };
}
