// Simulation worker: owns the lattice, steps it as fast as it can and streams
// macroscopic fields (velocity + density) back to the main thread.
import { Lattice } from './kernel.js';

let lat = null;
let gen = 0;
let hasGeometry = false;
const params = { U: 0.06, tau0: 0.503, fanK: 0, running: true };
let uCur = 0;

let pool = [];
let lastPost = 0;
let stepsSincePost = 0;
let forceSum = [0, 0, 0];
let rateT = performance.now();
let rateSteps = 0;
let sps = 0;
let looping = false;

const chan = new MessageChannel();
chan.port1.onmessage = loop;
const schedule = () => chan.port2.postMessage(0);

function ensureLoop() {
  if (!looping) {
    looping = true;
    schedule();
  }
}

function postField() {
  const N = lat.N;
  let buf = pool.pop();
  if (!buf || buf.length !== 4 * N) buf = new Float32Array(4 * N);
  buf.set(lat.ux, 0);
  buf.set(lat.uy, N);
  buf.set(lat.uz, 2 * N);
  buf.set(lat.rho, 3 * N);
  const n = Math.max(1, stepsSincePost);
  self.postMessage(
    {
      type: 'field',
      gen,
      data: buf,
      force: [forceSum[0] / n, forceSum[1] / n, forceSum[2] / n],
      rhoRef: lat.rhoRef,
      U: uCur,
      steps: lat.steps,
      sps,
    },
    [buf.buffer],
  );
  forceSum = [0, 0, 0];
  stepsSincePost = 0;
}

function loop() {
  if (!lat || !hasGeometry || !params.running) {
    looping = false;
    return;
  }
  const t0 = performance.now();
  do {
    uCur += (params.U - uCur) * 0.004;
    lat.step(uCur, params.tau0, params.fanK);
    forceSum[0] += lat.force[0];
    forceSum[1] += lat.force[1];
    forceSum[2] += lat.force[2];
    stepsSincePost++;
    rateSteps++;
  } while (performance.now() - t0 < 12);

  const now = performance.now();
  if (now - rateT > 500) {
    sps = (rateSteps * 1000) / (now - rateT);
    rateT = now;
    rateSteps = 0;
  }
  if (now - lastPost > 40) {
    lastPost = now;
    postField();
  }
  schedule();
}

self.onmessage = (e) => {
  const m = e.data;
  switch (m.type) {
    case 'init':
      lat = new Lattice(m.nx, m.ny, m.nz);
      gen = m.gen;
      hasGeometry = false;
      pool = [];
      break;
    case 'geometry':
      if (!lat || m.gen !== gen) break;
      lat.setGeometry(m.flag, m.fanIdx, m.fanVec);
      if (m.reset || !hasGeometry) {
        uCur = params.U;
        lat.init(uCur);
      }
      hasGeometry = true;
      ensureLoop();
      break;
    case 'params':
      Object.assign(params, m.params);
      if (params.running) ensureLoop();
      break;
    case 'reset':
      if (lat && hasGeometry) {
        uCur = params.U;
        lat.init(uCur);
        if (!params.running) postField();
      }
      break;
    case 'recycle':
      if (lat && m.data.length === 4 * lat.N && pool.length < 3) pool.push(m.data);
      break;
  }
};
