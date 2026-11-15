// D3Q19 lattice-Boltzmann solver with a Smagorinsky LES subgrid model.
//
// Layout: structure-of-arrays, F[i * N + cell]. Streaming uses the "pull"
// scheme and is fused with collision into one generated, fully unrolled loop.
//
// Boundaries:
//   x = 0        velocity inlet (equilibrium at the tunnel speed)
//   x = nx-1     zero-gradient outlet
//   y, z walls   free-slip (mirror ghost layers) - behaves like a moving ground
//   solids       halfway bounce-back, with momentum-exchange force measurement
//   fans         body-force zones (actuator discs)

export const Q = 19;
export const CX = [0, 1, -1, 0, 0, 0, 0, 1, -1, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0];
export const CY = [0, 0, 0, 1, -1, 0, 0, 1, -1, -1, 1, 0, 0, 0, 0, 1, -1, 1, -1];
export const CZ = [0, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, 1, -1, -1, 1, 1, -1, -1, 1];
export const OPP = [0, 2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16, 15, 18, 17];
export const W = [1 / 3, ...Array(6).fill(1 / 18), ...Array(12).fill(1 / 36)];

const findDir = (x, y, z) => {
  for (let i = 0; i < Q; i++) if (CX[i] === x && CY[i] === y && CZ[i] === z) return i;
  return -1;
};
const MIRROR_Y = CX.map((_, i) => findDir(CX[i], -CY[i], CZ[i]));
const MIRROR_Z = CX.map((_, i) => findDir(CX[i], CY[i], -CZ[i]));

export const FLUID = 0;
export const SOLID = 1;
export const FAN = 2;

const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);
const sumTerms = (coef, name) =>
  coef
    .map((c, i) => (c === 0 ? '' : `${c > 0 ? '+' : '-'}${name}${i}`))
    .join('') || '0';

function generateStep(nx, ny, nz) {
  const N = nx * ny * nz;
  const nxy = nx * ny;
  const L = [];
  L.push('"use strict";');
  L.push('const F=S.F,G=S.G,flag=S.flag,RHO=S.rho,UX=S.ux,UY=S.uy,UZ=S.uz,GX=S.gx,GY=S.gy,GZ=S.gz;');
  L.push(`for(let z=1;z<${nz - 1};z++){for(let y=1;y<${ny - 1};y++){let idx=1+y*${nx}+z*${nxy};`);
  L.push(`for(let x=1;x<${nx - 1};x++,idx++){`);
  L.push('const fl=flag[idx];if(fl===1)continue;');
  for (let i = 0; i < Q; i++) {
    const off = -(CX[i] + CY[i] * nx + CZ[i] * nxy);
    L.push(`const f${i}=F[idx${signed(i * N + off)}];`);
  }
  L.push(`let rho=${Array.from({ length: Q }, (_, i) => `f${i}`).join('+')};`);
  L.push('const bad=!(rho>0.5&&rho<2.0);if(bad)rho=1;');
  L.push('const ir=1/rho;');
  L.push(`let ux=(${sumTerms(CX, 'f')})*ir,uy=(${sumTerms(CY, 'f')})*ir,uz=(${sumTerms(CZ, 'f')})*ir;`);
  L.push('if(bad){ux=U;uy=0;uz=0;}');
  L.push('if(fl===2){const k=tau0*fanK;ux+=k*GX[idx];uy+=k*GY[idx];uz+=k*GZ[idx];}');
  L.push('let usq=ux*ux+uy*uy+uz*uz;');
  L.push('if(usq>0.0625){const k=0.25/Math.sqrt(usq);ux*=k;uy*=k;uz*=k;usq=0.0625;}');
  L.push('RHO[idx]=rho;UX[idx]=ux;UY[idx]=uy;UZ[idx]=uz;');
  L.push('const u15=1-1.5*usq;');
  L.push(`const e0=${W[0]}*rho*u15;`);
  for (let i = 1; i < Q; i++) {
    const terms = [
      CX[i] ? `${CX[i] > 0 ? '+' : '-'}ux` : '',
      CY[i] ? `${CY[i] > 0 ? '+' : '-'}uy` : '',
      CZ[i] ? `${CZ[i] > 0 ? '+' : '-'}uz` : '',
    ].join('');
    L.push(`const c${i}=3*(${terms});const e${i}=${W[i]}*rho*(u15+c${i}+0.5*c${i}*c${i});`);
  }
  L.push('if(bad){');
  for (let i = 0; i < Q; i++) L.push(`G[idx${signed(i * N)}]=e${i};`);
  L.push('}else{');
  for (let i = 0; i < Q; i++) L.push(`const n${i}=f${i}-e${i};`);
  const prod = (a, b) => a.map((v, i) => v * b[i]);
  L.push(`const pxx=${sumTerms(prod(CX, CX), 'n')},pyy=${sumTerms(prod(CY, CY), 'n')},pzz=${sumTerms(prod(CZ, CZ), 'n')};`);
  L.push(`const pxy=${sumTerms(prod(CX, CY), 'n')},pxz=${sumTerms(prod(CX, CZ), 'n')},pyz=${sumTerms(prod(CY, CZ), 'n')};`);
  L.push('const qn=Math.sqrt(pxx*pxx+pyy*pyy+pzz*pzz+2*(pxy*pxy+pxz*pxz+pyz*pyz));');
  L.push('const om=2/(tau0+Math.sqrt(tau0*tau0+CS*qn*ir));');
  for (let i = 0; i < Q; i++) L.push(`G[idx${signed(i * N)}]=f${i}-om*n${i};`);
  L.push('}}}}');
  return new Function('S', 'U', 'tau0', 'fanK', 'CS', L.join('\n'));
}

export class Lattice {
  constructor(nx, ny, nz) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    const N = (this.N = nx * ny * nz);
    this.F = new Float32Array(Q * N);
    this.G = new Float32Array(Q * N);
    this.rho = new Float32Array(N).fill(1);
    this.ux = new Float32Array(N);
    this.uy = new Float32Array(N);
    this.uz = new Float32Array(N);
    this.gx = new Float32Array(N);
    this.gy = new Float32Array(N);
    this.gz = new Float32Array(N);
    this.flag = new Uint8Array(N);
    this.linkDst = new Int32Array(0);
    this.linkSrc = new Int32Array(0);
    this.linkDir = new Uint8Array(0);
    this.force = [0, 0, 0];
    this.rhoRef = 1;
    this.steps = 0;
    this.smagorinsky = 0.17;
    this._step = generateStep(nx, ny, nz);
  }

  // Fill the whole domain with equilibrium flow at speed U along +x.
  init(U) {
    const { N, F, G } = this;
    for (let i = 0; i < Q; i++) {
      const cu = 3 * CX[i] * U;
      const e = W[i] * (1 - 1.5 * U * U + cu + 0.5 * cu * cu);
      F.fill(e, i * N, (i + 1) * N);
      G.fill(e, i * N, (i + 1) * N);
    }
    this.rho.fill(1);
    this.uy.fill(0);
    this.uz.fill(0);
    for (let c = 0; c < N; c++) this.ux[c] = this.flag[c] === SOLID ? 0 : U;
    // A faint large-scale swirl breaks the perfect symmetry of the start-up so
    // wakes can begin to shed (as they would from any real-world disturbance).
    if (U > 0) {
      const { nx, ny, nz } = this;
      const a = 0.03 * U;
      for (let z = 1; z < nz - 1; z++)
        for (let y = 1; y < ny - 1; y++)
          for (let x = 1; x < nx - 1; x++) {
            const c = x + nx * (y + ny * z);
            const vy = a * Math.sin((6 * Math.PI * x) / nx + 1.3) * Math.cos((2 * Math.PI * z) / nz);
            const vz = a * Math.sin((4 * Math.PI * x) / nx) * Math.sin((2 * Math.PI * y) / ny);
            for (let i = 1; i < Q; i++) F[i * N + c] += W[i] * 3 * (CY[i] * vy + CZ[i] * vz);
          }
    }
    this.rhoRef = 1;
    this.steps = 0;
  }

  // flag: Uint8Array(N) of FLUID / SOLID / FAN. fanIdx/fanVec: sparse body forces.
  setGeometry(flag, fanIdx, fanVec) {
    const { nx, ny, nz, N, F } = this;
    const nxy = nx * ny;
    const old = this.flag;
    const f = (this.flag = new Uint8Array(flag));

    // Inlet/outlet planes are never solid; wall ghost layers mirror their neighbours.
    for (let z = 0; z < nz; z++)
      for (let y = 0; y < ny; y++) {
        const b = y * nx + z * nxy;
        f[b] = FLUID;
        f[b + nx - 1] = FLUID;
      }
    for (let z = 0; z < nz; z++)
      for (let x = 0; x < nx; x++) {
        const b = x + z * nxy;
        f[b] = f[b + nx] === SOLID ? SOLID : FLUID;
        f[b + (ny - 1) * nx] = f[b + (ny - 2) * nx] === SOLID ? SOLID : FLUID;
      }
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const b = x + y * nx;
        f[b] = f[b + nxy] === SOLID ? SOLID : FLUID;
        f[b + (nz - 1) * nxy] = f[b + (nz - 2) * nxy] === SOLID ? SOLID : FLUID;
      }

    // Cells that just turned from solid to fluid start at rest; solids read as still.
    for (let c = 0; c < N; c++) {
      if (f[c] === SOLID) {
        this.ux[c] = this.uy[c] = this.uz[c] = 0;
        this.rho[c] = 1;
      } else if (old[c] === SOLID) {
        for (let i = 0; i < Q; i++) F[i * N + c] = W[i] * this.rhoRef;
      }
    }

    this.gx.fill(0);
    this.gy.fill(0);
    this.gz.fill(0);
    if (fanIdx) {
      for (let k = 0; k < fanIdx.length; k++) {
        const c = fanIdx[k];
        if (f[c] !== FAN) continue;
        this.gx[c] = fanVec[k * 3];
        this.gy[c] = fanVec[k * 3 + 1];
        this.gz[c] = fanVec[k * 3 + 2];
      }
    }

    // Bounce-back links: fluid cell `c` pulling direction i from a solid neighbour.
    const dst = [];
    const src = [];
    const dir = [];
    for (let z = 1; z < nz - 1; z++)
      for (let y = 1; y < ny - 1; y++)
        for (let x = 1; x < nx - 1; x++) {
          const c = x + y * nx + z * nxy;
          if (f[c] === SOLID) continue;
          for (let i = 1; i < Q; i++) {
            const s = c - (CX[i] + CY[i] * nx + CZ[i] * nxy);
            if (f[s] !== SOLID) continue;
            dst.push(i * N + s);
            src.push(OPP[i] * N + c);
            dir.push(OPP[i]);
          }
        }
    this.linkDst = Int32Array.from(dst);
    this.linkSrc = Int32Array.from(src);
    this.linkDir = Uint8Array.from(dir);
  }

  step(U, tau0, fanK) {
    const { nx, ny, nz, N } = this;
    const nxy = nx * ny;
    const F = this.F;

    // Bounce-back: stash reflected populations in the solid cells so the fused
    // loop can pull them branch-free. Accumulate gauge momentum exchange.
    const { linkDst, linkSrc, linkDir } = this;
    const ref = this.rhoRef;
    let fx = 0;
    let fy = 0;
    let fz = 0;
    for (let k = 0, n = linkDst.length; k < n; k++) {
      const v = F[linkSrc[k]];
      F[linkDst[k]] = v;
      const d = linkDir[k];
      const m = 2 * (v - W[d] * ref);
      fx += m * CX[d];
      fy += m * CY[d];
      fz += m * CZ[d];
    }
    this.force[0] = fx;
    this.force[1] = fy;
    this.force[2] = fz;

    const cs = this.smagorinsky;
    this._step(this, U, tau0, fanK, 18 * Math.SQRT2 * cs * cs);

    const G = this.G;
    // Inlet (equilibrium) and outlet (zero gradient).
    for (let i = 0; i < Q; i++) {
      const cu = 3 * CX[i] * U;
      const e = W[i] * (1 - 1.5 * U * U + cu + 0.5 * cu * cu);
      const o = i * N;
      for (let z = 0; z < nz; z++)
        for (let y = 0; y < ny; y++) {
          const b = o + y * nx + z * nxy;
          G[b] = e;
          G[b + nx - 1] = G[b + nx - 2];
        }
    }
    // Free-slip floor / ceiling.
    for (let i = 0; i < Q; i++) {
      const o = i * N;
      const m = MIRROR_Y[i] * N;
      const top = (ny - 1) * nx;
      for (let z = 0; z < nz; z++) {
        const zb = z * nxy;
        for (let x = 0; x < nx; x++) {
          const b = x + zb;
          G[o + b] = G[m + b + nx];
          G[o + b + top] = G[m + b + top - nx];
        }
      }
    }
    // Free-slip side walls.
    for (let i = 0; i < Q; i++) {
      const o = i * N;
      const m = MIRROR_Z[i] * N;
      const far = (nz - 1) * nxy;
      for (let b = 0; b < nxy; b++) {
        G[o + b] = G[m + b + nxy];
        G[o + b + far] = G[m + b + far - nxy];
      }
    }

    this.F = G;
    this.G = F;
    this.steps++;

    // Track the free-stream reference density on a plane just behind the inlet.
    if ((this.steps & 15) === 0) {
      let sum = 0;
      let n = 0;
      for (let z = 1; z < nz - 1; z++)
        for (let y = 1; y < ny - 1; y++) {
          sum += this.rho[2 + y * nx + z * nxy];
          n++;
        }
      const r = sum / n;
      if (r > 0.5 && r < 2) this.rhoRef += (r - this.rhoRef) * 0.2;
    }
  }
}
