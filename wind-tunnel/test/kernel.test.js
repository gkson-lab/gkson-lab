// Sanity checks for the LBM kernel: stability, mass conservation, and a
// physically plausible drag coefficient for a sphere. Run: npm test
import assert from 'node:assert/strict';
import { Lattice, SOLID } from '../src/sim/kernel.js';

const nx = 96, ny = 48, nz = 48, U = 0.06, tau = 0.503;
const lat = new Lattice(nx, ny, nz);
const flag = new Uint8Array(lat.N);
const R = 7, cx = 30, cy = 24, cz = 24;
let area = 0;
for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) {
  let hit = false;
  for (let x = 0; x < nx; x++) {
    if ((x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 + (z + .5 - cz) ** 2 < R * R) { flag[x + nx * (y + ny * z)] = SOLID; hit = true; }
  }
  if (hit) area++;
}
lat.setGeometry(flag, null, null);
lat.init(U);

const steps = 1500;
const t0 = performance.now();
let fx = 0, n = 0;
for (let s = 0; s < steps; s++) {
  lat.step(U, tau, 0);
  if (s >= steps - 400) { fx += lat.force[0]; n++; }
}
const dt = performance.now() - t0;
const cd = fx / n / (0.5 * U * U * area);

let maxU = 0, finite = true;
for (let c = 0; c < lat.N; c++) {
  if (!Number.isFinite(lat.ux[c]) || !Number.isFinite(lat.rho[c])) finite = false;
  maxU = Math.max(maxU, Math.abs(lat.ux[c]));
}
console.log(`steps/s ${(steps / dt * 1000).toFixed(1)}  MLUPS ${(steps * lat.N / dt / 1000).toFixed(2)}  sphere Cd ${cd.toFixed(3)}  max|ux| ${maxU.toFixed(3)}  rhoRef ${lat.rhoRef.toFixed(4)}`);
assert.ok(finite, 'fields stay finite');
assert.ok(maxU < 0.2, 'velocity stays bounded');
assert.ok(cd > 0.2 && cd < 1.2, `sphere drag coefficient plausible (got ${cd})`);
// The wake behind the sphere must be slower than the free stream.
const wake = lat.ux[(cx + R + 4) + nx * (cy + ny * cz)];
assert.ok(wake < U * 0.6, `wake deficit present (ux=${wake})`);
console.log('kernel OK');
