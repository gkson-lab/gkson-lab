// Smoke streaks: massless tracer particles advected through the live velocity
// field, drawn as fading additive line trails coloured by speed or pressure.
import * as THREE from 'three';
import { lutTextures } from './colormaps.js';

const MAX = 24000;
const K = 18; // trail points per particle

export class Streaks {
  constructor() {
    this.count = 6000;
    this.mode = 'inlet'; // 'inlet' | 'rake' | 'volume'
    this.colorBy = 'speed';
    this.speed = 1;
    this.bounds = { inlet: null, volume: null };
    this.rake = [];

    this.pos = new Float32Array(MAX * K * 3);
    this.scalar = new Float32Array(MAX * K);
    this.age = new Float32Array(MAX);
    this.life = new Float32Array(MAX);
    this.head = new Float32Array(MAX * 3);

    const fade = new Float32Array(MAX * K);
    const index = new Uint32Array(MAX * (K - 1) * 2);
    for (let p = 0, n = 0; p < MAX; p++)
      for (let j = 0; j < K; j++) {
        fade[p * K + j] = Math.pow(1 - j / (K - 1), 1.4);
        if (j < K - 1) {
          index[n++] = p * K + j;
          index[n++] = p * K + j + 1;
        }
      }

    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.scalarAttr = new THREE.BufferAttribute(this.scalar, 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('scalar', this.scalarAttr);
    geo.setAttribute('fade', new THREE.BufferAttribute(fade, 1));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        lut: { value: lutTextures.speed },
        opacity: { value: 0.26 },
        speedFade: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float scalar;
        attribute float fade;
        varying float vS;
        varying float vA;
        void main() {
          vS = scalar;
          vA = fade;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D lut;
        uniform float opacity;
        uniform float speedFade;
        varying float vS;
        varying float vA;
        void main() {
          float s = clamp(abs(vS), 0.0, 1.0);
          vec3 col = texture2D(lut, vec2(s, 0.5)).rgb;
          float a = vA * opacity * mix(1.0, smoothstep(0.02, 0.22, s), speedFade);
          gl_FragColor = vec4(col * (0.5 + 0.5 * s), a);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.object = new THREE.LineSegments(geo, this.material);
    this.object.frustumCulled = false;
    this.object.renderOrder = 3;
    this.setCount(this.count);
    this._v = new Float32Array(4);
    this._v2 = new Float32Array(4);
  }

  setCount(n) {
    this.count = Math.min(MAX, n);
    this.object.geometry.setDrawRange(0, this.count * (K - 1) * 2);
  }

  setColorBy(name) {
    this.colorBy = name === 'pressure' ? 'pressure' : 'speed';
    this.material.uniforms.lut.value = lutTextures[this.colorBy];
  }

  /** inlet: {x, y0, y1, z0, z1}; volume: Box3 */
  setBounds(inlet, volume) {
    this.bounds = { inlet, volume };
    const cols = 15;
    const rows = 11;
    this.rake = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        this.rake.push(
          inlet.y0 + ((j + 0.5) / rows) * (inlet.y1 - inlet.y0),
          inlet.z0 + ((i + 0.5) / cols) * (inlet.z1 - inlet.z0),
        );
    this.respawnAll();
  }

  respawnAll() {
    const { inlet } = this.bounds;
    for (let p = 0; p < MAX; p++) {
      this._spawn(p);
      this.age[p] = Math.random() * this.life[p];
      if (this.mode === 'volume' || !inlet) continue;
      // Pre-fill the test section so the smoke does not arrive as one front.
      const x = inlet.x + Math.random() * (inlet.x1 - inlet.x);
      this.head[p * 3] = x;
      for (let j = 0; j < K; j++) this.pos[(p * K + j) * 3] = x;
    }
  }

  _spawn(p) {
    const { inlet, volume } = this.bounds;
    if (!inlet) return;
    let x, y, z;
    if (this.mode === 'volume') {
      x = volume.min.x + Math.random() * (volume.max.x - volume.min.x);
      y = volume.min.y + Math.random() * (volume.max.y - volume.min.y);
      z = volume.min.z + Math.random() * (volume.max.z - volume.min.z);
      this.life[p] = 2.5 + Math.random() * 3.5;
    } else if (this.mode === 'rake') {
      const r = ((Math.random() * this.rake.length) >> 1) << 1;
      x = inlet.x;
      y = this.rake[r] + (Math.random() - 0.5) * 0.004;
      z = this.rake[r + 1] + (Math.random() - 0.5) * 0.004;
      this.life[p] = 14;
    } else {
      x = inlet.x;
      y = inlet.y0 + Math.random() * (inlet.y1 - inlet.y0);
      z = inlet.z0 + Math.random() * (inlet.z1 - inlet.z0);
      this.life[p] = 14;
    }
    this.age[p] = 0;
    this.head[p * 3] = x;
    this.head[p * 3 + 1] = y;
    this.head[p * 3 + 2] = z;
    const b = p * K * 3;
    for (let j = 0; j < K; j++) {
      this.pos[b + j * 3] = x;
      this.pos[b + j * 3 + 1] = y;
      this.pos[b + j * 3 + 2] = z;
      this.scalar[p * K + j] = 0;
    }
  }

  /**
   * @param field   Field with live data
   * @param dt      frame time (s)
   * @param uScale  lattice velocity that maps to "free stream" for colour + speed
   */
  update(field, dt, uScale) {
    if (!field.ready || !this.bounds.inlet) return;
    const n = this.count;
    const { pos, scalar, head, age, life } = this;
    const v = this._v;
    const v2 = this._v2;
    // Shift every trail back by one point in a single memmove.
    pos.copyWithin(3, 0, n * K * 3 - 3);
    scalar.copyWithin(1, 0, n * K - 1);

    // World units per second for a particle moving at the free-stream speed.
    const k = (1.7 * this.speed) / uScale;
    const step = Math.min(dt, 1 / 30);
    const xMax = field.origin.x + (field.nx - 1.2) * field.h;
    const byPressure = this.colorBy === 'pressure';
    const sNorm = 1 / (1.7 * uScale);

    for (let p = 0; p < n; p++) {
      const h3 = p * 3;
      let x = head[h3], y = head[h3 + 1], z = head[h3 + 2];
      age[p] += step;
      let alive = age[p] < life[p] && field.sample(x, y, z, v);
      if (alive) {
        // Midpoint (RK2) integration.
        const hx = x + v[0] * k * step * 0.5;
        const hy = y + v[1] * k * step * 0.5;
        const hz = z + v[2] * k * step * 0.5;
        if (field.sample(hx, hy, hz, v2)) {
          v[0] = v2[0]; v[1] = v2[1]; v[2] = v2[2];
        }
        x += v[0] * k * step;
        y += v[1] * k * step;
        z += v[2] * k * step;
        alive = x < xMax;
      }
      if (!alive) {
        this._spawn(p);
        continue;
      }
      head[h3] = x; head[h3 + 1] = y; head[h3 + 2] = z;
      const b = p * K * 3;
      pos[b] = x; pos[b + 1] = y; pos[b + 2] = z;
      scalar[p * K] = byPressure
        ? 0.5 + 0.4 * field.cp(v[3], uScale)
        : Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) * sNorm;
    }
    this.posAttr.clearUpdateRanges();
    this.posAttr.addUpdateRange(0, n * K * 3);
    this.posAttr.needsUpdate = true;
    this.scalarAttr.clearUpdateRanges();
    this.scalarAttr.addUpdateRange(0, n * K);
    this.scalarAttr.needsUpdate = true;
  }
}
