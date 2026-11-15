import * as THREE from 'three';

const STOPS = {
  speed: [
    [0.0, '#0a1440'],
    [0.18, '#1b4fd0'],
    [0.38, '#1fc4ea'],
    [0.58, '#74f08a'],
    [0.76, '#ffd640'],
    [0.9, '#ff6b2b'],
    [1.0, '#ff2457'],
  ],
  pressure: [
    [0.0, '#1238d8'],
    [0.3, '#57a6ff'],
    [0.5, '#e9eef4'],
    [0.7, '#ff9d6b'],
    [1.0, '#e0202c'],
  ],
  vorticity: [
    [0.0, '#05030f'],
    [0.25, '#3b0f70'],
    [0.5, '#b5367a'],
    [0.75, '#fb8861'],
    [1.0, '#fcfdbf'],
  ],
};

function buildLut(stops) {
  const lut = new Uint8Array(256 * 4);
  const cols = stops.map(([t, hex]) => [t, new THREE.Color(hex)]);
  const c = new THREE.Color();
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < cols.length - 2 && t > cols[k + 1][0]) k++;
    const [t0, c0] = cols[k];
    const [t1, c1] = cols[k + 1];
    c.copy(c0).lerp(c1, Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
    // Stops are authored in sRGB; keep LUT bytes in sRGB.
    lut[i * 4] = Math.round(THREE.MathUtils.clamp(linearToSrgb(c.r), 0, 1) * 255);
    lut[i * 4 + 1] = Math.round(THREE.MathUtils.clamp(linearToSrgb(c.g), 0, 1) * 255);
    lut[i * 4 + 2] = Math.round(THREE.MathUtils.clamp(linearToSrgb(c.b), 0, 1) * 255);
    lut[i * 4 + 3] = 255;
  }
  return lut;
}

function linearToSrgb(v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

export const LUTS = Object.fromEntries(Object.entries(STOPS).map(([k, s]) => [k, buildLut(s)]));

export const lutTextures = Object.fromEntries(
  Object.entries(LUTS).map(([k, lut]) => {
    const tex = new THREE.DataTexture(lut, 256, 1, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return [k, tex];
  }),
);

export function lutCss(name) {
  return `linear-gradient(90deg, ${STOPS[name].map(([t, c]) => `${c} ${t * 100}%`).join(', ')})`;
}
