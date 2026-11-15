// "Solver view": the voxelised body exactly as the fluid solver sees it,
// with every surface cell coloured by the local pressure coefficient.
import * as THREE from 'three';
import { LUTS } from './colormaps.js';
import { SOLID } from '../sim/kernel.js';

const _m = new THREE.Matrix4();
const _c = new THREE.Color();

export class VoxelView {
  constructor() {
    this.object = new THREE.Group();
    this.object.visible = false;
    this.mesh = null;
    this.cells = null; // surface solid cells
    this.probe = null; // a fluid neighbour for each surface cell
  }

  rebuild(field) {
    if (this.mesh) {
      this.object.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    const { nx, ny, nz, h, origin, flag } = field;
    const nxy = nx * ny;
    const offs = [1, -1, nx, -nx, nxy, -nxy];
    const cells = [];
    const probe = [];
    for (let z = 1; z < nz - 1; z++)
      for (let y = 1; y < ny - 1; y++)
        for (let x = 1; x < nx - 1; x++) {
          const c = x + nx * (y + ny * z);
          if (flag[c] !== SOLID) continue;
          for (const o of offs)
            if (flag[c + o] !== SOLID) {
              cells.push(c);
              probe.push(c + o);
              break;
            }
        }
    this.cells = cells;
    this.probe = probe;
    if (!cells.length) return;
    const geo = new THREE.BoxGeometry(h * 0.94, h * 0.94, h * 0.94);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
    const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
    cells.forEach((c, i) => {
      const x = c % nx;
      const y = Math.floor(c / nx) % ny;
      const z = Math.floor(c / nxy);
      _m.makeTranslation(origin.x + (x + 0.5) * h, origin.y + (y + 0.5) * h, origin.z + (z + 0.5) * h);
      mesh.setMatrixAt(i, _m);
      mesh.setColorAt(i, _c.set('#8892a0'));
    });
    mesh.castShadow = true;
    this.mesh = mesh;
    this.object.add(mesh);
  }

  update(field, uScale) {
    if (!this.object.visible || !this.mesh || !field.ready) return;
    const { N, data, flag } = field;
    const nx = field.nx;
    const nxy = nx * field.ny;
    const offs = [1, -1, nx, -nx, nxy, -nxy];
    const lut = LUTS.pressure;
    const col = this.mesh.instanceColor.array;
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      let sum = 0;
      let n = 0;
      for (const o of offs)
        if (flag[c + o] !== SOLID) {
          sum += data[3 * N + c + o];
          n++;
        }
      const s = 0.5 + 0.4 * field.cp(n ? sum / n : field.rhoRef, uScale);
      const li = (s <= 0 ? 0 : s >= 1 ? 255 : (s * 255) | 0) * 4;
      _c.setRGB(lut[li] / 255, lut[li + 1] / 255, lut[li + 2] / 255, THREE.SRGBColorSpace);
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
    this.mesh.instanceColor.needsUpdate = true;
  }
}
