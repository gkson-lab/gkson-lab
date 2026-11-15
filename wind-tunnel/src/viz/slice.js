// Cut-plane through the flow field, coloured by speed, pressure or vorticity.
import * as THREE from 'three';
import { LUTS } from './colormaps.js';
import { SOLID } from '../sim/kernel.js';

export class Slice {
  constructor() {
    this.axis = 'z';
    this.t = 0.5; // 0..1 position along the axis
    this.quantity = 'speed';
    this.material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
    this.object = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.object.renderOrder = 1;
    this.object.visible = false;
    this._key = '';
  }

  _ensure(field) {
    const { nx, ny, nz } = field;
    const [w, h] = this.axis === 'x' ? [nz - 2, ny - 2] : this.axis === 'y' ? [nx - 2, nz - 2] : [nx - 2, ny - 2];
    const key = `${this.axis}:${w}x${h}`;
    if (key === this._key) return;
    this._key = key;
    this.w = w;
    this.h = h;
    this.pixels = new Uint8Array(w * h * 4);
    this.material.map?.dispose();
    const tex = new THREE.DataTexture(this.pixels, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    this.material.map = tex;
    this.material.needsUpdate = true;
  }

  update(field, uScale) {
    if (!this.object.visible || !field.ready) return;
    this._ensure(field);
    const { nx, ny, nz, N, data, flag, h: cell, origin, size } = field;
    const { axis, w, h, pixels } = this;
    const lut = LUTS[this.quantity];
    const nxy = nx * ny;
    const dimN = axis === 'x' ? nx : axis === 'y' ? ny : nz;
    const k = Math.min(dimN - 2, Math.max(1, Math.round(1 + this.t * (dimN - 3))));
    // Strides of the two in-plane directions (u = texture x, v = texture y).
    const su = axis === 'x' ? nxy : 1;
    const sv = axis === 'y' ? nxy : nx;
    const base = (axis === 'x' ? k : axis === 'y' ? k * nx : k * nxy) + su + sv;
    const strides = [1, nx, nxy];
    const inv = 1 / uScale;

    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const c = base + i * su + j * sv;
        const o = (j * w + i) * 4;
        if (flag[c] === SOLID) {
          pixels[o] = pixels[o + 1] = pixels[o + 2] = 10;
          pixels[o + 3] = 0;
          continue;
        }
        let s;
        if (this.quantity === 'pressure') {
          s = 0.5 + 0.4 * field.cp(data[3 * N + c], uScale);
        } else if (this.quantity === 'vorticity') {
          // Central differences; curl magnitude in lattice units.
          const d = (comp, dir) => data[comp * N + c + strides[dir]] - data[comp * N + c - strides[dir]];
          const wx = d(2, 1) - d(1, 2);
          const wy = d(0, 2) - d(2, 0);
          const wz = d(1, 0) - d(0, 1);
          s = Math.sqrt(wx * wx + wy * wy + wz * wz) * 0.5 * inv * 2.2;
        } else {
          const ux = data[c], uy = data[N + c], uz = data[2 * N + c];
          s = (Math.sqrt(ux * ux + uy * uy + uz * uz) * inv) / 1.7;
        }
        const li = (s <= 0 ? 0 : s >= 1 ? 255 : (s * 255) | 0) * 4;
        pixels[o] = lut[li];
        pixels[o + 1] = lut[li + 1];
        pixels[o + 2] = lut[li + 2];
        pixels[o + 3] = 255;
      }
    this.material.map.needsUpdate = true;

    // Place the quad in world space.
    const m = this.object;
    const cx = origin.x + cell + size.x / 2;
    const cy = size.y / 2;
    const cz = origin.z + cell + size.z / 2;
    const at = (o, n) => o + (k + 0.5) * cell;
    m.rotation.set(0, 0, 0);
    if (axis === 'z') {
      m.scale.set(size.x, size.y, 1);
      m.position.set(cx, cy, at(origin.z));
    } else if (axis === 'x') {
      m.scale.set(size.z, size.y, 1);
      m.rotation.y = -Math.PI / 2;
      m.position.set(at(origin.x), cy, cz);
    } else {
      m.scale.set(size.x, size.z, 1);
      m.rotation.x = Math.PI / 2;
      m.position.set(cx, at(origin.y), cz);
    }
  }
}
