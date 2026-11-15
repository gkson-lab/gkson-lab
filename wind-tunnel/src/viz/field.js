// Main-thread view of the latest solver output, with world-space sampling.
import { SOLID } from '../sim/kernel.js';

export class Field {
  constructor(grid) {
    Object.assign(this, grid); // nx, ny, nz, h, origin, size
    this.N = this.nx * this.ny * this.nz;
    this.data = null; // [ux | uy | uz | rho], each N floats
    this.flag = new Uint8Array(this.N);
    this.rhoRef = 1;
    this.U = 0;
  }

  get ready() {
    return this.data !== null;
  }

  cellAt(wx, wy, wz) {
    const { nx, ny, nz, h, origin } = this;
    const x = Math.floor((wx - origin.x) / h);
    const y = Math.floor((wy - origin.y) / h);
    const z = Math.floor((wz - origin.z) / h);
    if (x < 1 || y < 1 || z < 1 || x > nx - 2 || y > ny - 2 || z > nz - 2) return -1;
    return x + nx * (y + ny * z);
  }

  /** Trilinear velocity (lattice units) at a world position. Returns false outside the fluid. */
  sample(wx, wy, wz, out) {
    const { nx, ny, nz, h, origin, N, data } = this;
    const c = this.cellAt(wx, wy, wz);
    if (c < 0 || this.flag[c] === SOLID) return false;
    let gx = (wx - origin.x) / h - 0.5;
    let gy = (wy - origin.y) / h - 0.5;
    let gz = (wz - origin.z) / h - 0.5;
    let x0 = Math.floor(gx);
    let y0 = Math.floor(gy);
    let z0 = Math.floor(gz);
    if (x0 < 0) x0 = 0; else if (x0 > nx - 2) x0 = nx - 2;
    if (y0 < 0) y0 = 0; else if (y0 > ny - 2) y0 = ny - 2;
    if (z0 < 0) z0 = 0; else if (z0 > nz - 2) z0 = nz - 2;
    const tx = gx - x0, ty = gy - y0, tz = gz - z0;
    const i000 = x0 + nx * (y0 + ny * z0);
    const i010 = i000 + nx;
    const i001 = i000 + nx * ny;
    const i011 = i001 + nx;
    const w000 = (1 - tx) * (1 - ty) * (1 - tz), w100 = tx * (1 - ty) * (1 - tz);
    const w010 = (1 - tx) * ty * (1 - tz), w110 = tx * ty * (1 - tz);
    const w001 = (1 - tx) * (1 - ty) * tz, w101 = tx * (1 - ty) * tz;
    const w011 = (1 - tx) * ty * tz, w111 = tx * ty * tz;
    for (let k = 0; k < 3; k++) {
      const o = k * N;
      out[k] =
        data[o + i000] * w000 + data[o + i000 + 1] * w100 +
        data[o + i010] * w010 + data[o + i010 + 1] * w110 +
        data[o + i001] * w001 + data[o + i001 + 1] * w101 +
        data[o + i011] * w011 + data[o + i011 + 1] * w111;
    }
    out[3] = data[3 * N + c];
    return true;
  }

  /** Pressure coefficient from a density value. */
  cp(rho, uScale) {
    return ((rho - this.rhoRef) * (2 / 3)) / (uScale * uScale);
  }
}
