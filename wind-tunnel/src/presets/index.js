// Preset library. Each preset builds a THREE.Group procedurally.
//   real      largest real-world dimension in metres (for Reynolds number and forces)
//   speed     default wind speed, km/h
//   grounded  sits on the tunnel floor instead of floating mid-stream
//   seed      default smoke seeding ('inlet' | 'rake' | 'volume')
//   fit       optional [x, y, z] box (world units) the model is scaled into
import { THREE, mat, glass, box, cyl, sph, torus, extrude, planform, lathe, put, deco, wheel, naca, fan, aim } from './kit.js';

const G = () => new THREE.Group();
const PI = Math.PI;

/* ───────────────────────────── vehicles ───────────────────────────── */

function f1Car() {
  const g = G();
  const body = mat('#d9132b', { roughness: 0.28, metalness: 0.35 });
  const carbon = mat('#17181c', { roughness: 0.45, metalness: 0.4 });
  const accent = mat('#f4f4f6', { roughness: 0.3 });

  // Monocoque, nose and engine cover (side profile).
  put(g, extrude(
    [[-2.62, 0.2], [-2.55, 0.3], [-1.3, 0.52], [-0.75, 0.6], [-0.45, 0.6], [-0.3, 0.72], [0.0, 0.98], [0.45, 0.95],
     [1.3, 0.62], [2.05, 0.42], [2.15, 0.28], [2.15, 0.16], [-1.3, 0.16], [-2.55, 0.17]], 0.44, body, 0.05));
  // Floor and plank.
  put(g, box(3.5, 0.05, 1.5, carbon, 0.02), 0.25, 0.1, 0);
  // Sidepods with undercut and coke-bottle taper.
  for (const s of [-1, 1]) {
    put(g, box(1.7, 0.36, 0.5, body, 0.12), 0.15, 0.42, s * 0.52);
    put(g, box(0.9, 0.26, 0.34, body, 0.1), 1.25, 0.36, s * 0.4, [0, s * 0.22, 0]);
  }
  // Front wing: main plane, flap, endplates.
  put(g, box(0.42, 0.035, 1.9, carbon), -2.5, 0.1, 0, [0, 0, 0.06]);
  put(g, box(0.3, 0.03, 1.8, accent), -2.3, 0.2, 0, [0, 0, 0.32]);
  for (const s of [-1, 1]) put(g, box(0.62, 0.26, 0.03, carbon), -2.42, 0.19, s * 0.95);
  // Rear wing: two elements, endplates, pylon, beam wing.
  put(g, box(0.4, 0.04, 1.02, carbon), 2.35, 0.98, 0, [0, 0, 0.22]);
  put(g, box(0.26, 0.03, 1.02, accent), 2.56, 1.08, 0, [0, 0, 0.55]);
  put(g, box(0.3, 0.03, 1.0, carbon), 2.3, 0.45, 0, [0, 0, 0.2]);
  for (const s of [-1, 1]) put(g, box(0.72, 0.82, 0.03, carbon), 2.42, 0.72, s * 0.52);
  put(g, box(0.3, 0.5, 0.05, carbon), 2.25, 0.65, 0);
  // Diffuser.
  put(g, box(0.75, 0.04, 1.3, carbon), 2.25, 0.2, 0, [0, 0, 0.28]);
  // Wheels.
  for (const s of [-1, 1]) {
    put(g, wheel(0.36, 0.34), -1.7, 0.36, s * 0.83);
    put(g, wheel(0.36, 0.44), 1.75, 0.36, s * 0.8);
    // Suspension arms (decorative: thinner than a voxel).
    for (const [x, len] of [[-1.7, 0.7], [1.75, 0.6]])
      for (const dy of [0.28, 0.48]) put(g, deco(box(0.05, 0.02, len, carbon)), x, dy, s * 0.48, [s * 0.08, s * 0.25, 0]);
  }
  // Driver and halo.
  put(g, sph(0.15, mat('#ffd400', { roughness: 0.3 })), -0.52, 0.7, 0);
  const halo = torus(0.3, 0.025, carbon, PI);
  halo.geometry.rotateX(-PI / 2);
  halo.geometry.rotateY(PI / 2);
  put(g, deco(halo), -0.5, 0.76, 0);
  // Mirrors + T-cam.
  for (const s of [-1, 1]) put(g, box(0.1, 0.06, 0.16, body, 0.02), -0.7, 0.66, s * 0.42);
  put(g, box(0.16, 0.08, 0.05, carbon, 0.02), 0.05, 1.05, 0);
  return g;
}

function sedan() {
  const g = G();
  const paint = mat('#2d6cdf', { roughness: 0.25, metalness: 0.5 });
  const dark = mat('#11151c', { roughness: 0.12, metalness: 0.6 });
  put(g, extrude(
    [[-2.2, 0.24], [-2.28, 0.5], [-2.15, 0.68], [-1.15, 0.8], [1.45, 0.86], [2.18, 0.8], [2.26, 0.45], [2.18, 0.24]],
    1.62, paint, 0.09));
  put(g, extrude([[-1.05, 0.78], [-0.38, 1.3], [0.72, 1.33], [1.6, 0.84]], 1.42, dark, 0.08));
  for (const x of [-1.38, 1.38]) for (const s of [-1, 1]) put(g, wheel(0.33, 0.24), x, 0.33, s * 0.8);
  for (const s of [-1, 1]) put(g, box(0.12, 0.08, 0.18, paint, 0.03), -0.72, 0.9, s * 0.95);
  for (const s of [-1, 1]) put(g, deco(box(0.05, 0.1, 0.36, mat('#fff7d6', { emissive: '#fff2b0', emissiveIntensity: 0.6 }), 0.02)), -2.33, 0.6, s * 0.6);
  return g;
}

function pickup() {
  const g = G();
  const paint = mat('#c8cdd4', { roughness: 0.3, metalness: 0.6 });
  const dark = mat('#14171c', { roughness: 0.2, metalness: 0.5 });
  put(g, box(5.4, 0.42, 1.9, paint, 0.08), 0, 0.62, 0);
  put(g, box(1.55, 0.5, 1.9, paint, 0.14), -1.9, 0.98, 0);
  put(g, box(1.75, 0.82, 1.84, dark, 0.16), -0.35, 1.42, 0);
  put(g, box(1.8, 0.2, 1.88, paint, 0.08), -0.35, 1.05, 0);
  for (const s of [-1, 1]) put(g, box(2.1, 0.5, 0.08, paint, 0.02), 1.62, 1.06, s * 0.9);
  put(g, box(0.08, 0.5, 1.84, paint, 0.02), 2.66, 1.06, 0);
  for (const x of [-1.75, 1.6]) for (const s of [-1, 1]) put(g, wheel(0.42, 0.3), x, 0.42, s * 0.84);
  put(g, deco(box(0.06, 0.34, 1.3, dark, 0.02)), -2.7, 0.95, 0);
  return g;
}

function semi() {
  const g = G();
  const cab = mat('#e04a1c', { roughness: 0.3, metalness: 0.4 });
  const white = mat('#eef1f5', { roughness: 0.5 });
  const dark = mat('#15171b', { roughness: 0.5 });
  put(g, box(2.1, 2.3, 2.4, cab, 0.22), -5.3, 1.95, 0);
  put(g, extrude([[-6.2, 3.05], [-4.3, 3.05], [-4.3, 3.95], [-5.2, 3.8]], 2.3, cab, 0.04));
  put(g, deco(box(0.06, 0.8, 2.0, mat('#0f1319', { roughness: 0.1, metalness: 0.7 }), 0.02)), -6.36, 2.5, 0);
  put(g, box(10.4, 2.9, 2.5, white, 0.05), 1.3, 2.55, 0);
  put(g, box(11.6, 0.3, 1.0, dark), 0.3, 0.92, 0);
  for (const x of [-5.4, -3.6, -2.6, 4.6, 5.7]) for (const s of [-1, 1]) put(g, wheel(0.52, 0.55, undefined, mat('#8b929c', { metalness: 0.7, roughness: 0.4 })), x, 0.52, s * 0.95);
  return g;
}

function airliner() {
  const g = G();
  const white = mat('#f1f4f8', { roughness: 0.3, metalness: 0.2 });
  const navy = mat('#14306b', { roughness: 0.35, metalness: 0.3 });
  const metal = mat('#9aa3b0', { roughness: 0.3, metalness: 0.8 });
  put(g, lathe([[0, 0], [0.9, 0.9], [1.7, 2.4], [1.95, 4.2], [1.95, 26], [1.6, 30], [0.9, 34], [0.25, 36.5], [0, 36.6]], white), -18.3, 0, 0);
  const wing = (s) => [[-4.5, s * 1.8], [-0.2, s * 17], [1.6, s * 17], [2.2, s * 1.8]];
  for (const s of [-1, 1]) {
    put(g, planform(wing(s), 0.5, white, 0.12), -1.5, -0.5, 0, [s * 0.09, 0, 0]);
    put(g, planform([[-2.2, s * 0.8], [0.3, s * 6.2], [1.5, s * 6.2], [1.2, s * 0.8]], 0.3, white, 0.08), 15.2, 0.6, 0);
    const pod = lathe([[0, 0], [0.75, 0.15], [1.0, 1.0], [0.95, 3.2], [0.55, 4.4], [0, 4.5]], metal);
    put(g, pod, -5.6, -1.75, s * 6.2);
    put(g, box(2.2, 0.9, 0.22, white, 0.08), -3.2, -1.05, s * 6.2);
  }
  put(g, extrude([[12.5, 1.5], [16.6, 8.2], [18.4, 8.2], [17.6, 1.2]], 0.36, navy, 0.1));
  return g;
}

function rocket() {
  const g = G();
  const white = mat('#f3f4f6', { roughness: 0.3, metalness: 0.2 });
  const red = mat('#d22f27', { roughness: 0.35 });
  put(g, lathe([[0, 0], [0.16, 0.2], [0.34, 0.7], [0.45, 1.4], [0.45, 5.3], [0.36, 5.5], [0.5, 6.0], [0, 6.0]], white));
  put(g, deco(cyl(0.455, 0.25, red, 'x')), 1.6, 0, 0);
  put(g, deco(cyl(0.455, 0.25, red, 'x')), 4.6, 0, 0);
  for (let i = 0; i < 4; i++) {
    const fin = extrude([[4.1, 0.4], [5.3, 1.25], [5.9, 1.25], [5.5, 0.4]], 0.07, red, 0.015);
    const pivot = G();
    pivot.rotation.x = (i * PI) / 2 + PI / 4;
    pivot.add(fin);
    put(g, pivot);
  }
  return g;
}

function cyclist() {
  const g = G();
  const frame = mat('#f2f2f2', { roughness: 0.3, metalness: 0.5 });
  const kit = mat('#0fb5a6', { roughness: 0.6 });
  const skin = mat('#e0a988', { roughness: 0.7 });
  const tire = mat('#111216', { roughness: 0.8 });
  for (const x of [-0.5, 0.5]) {
    const t = torus(0.33, 0.022, tire);
    put(g, t, x, 0.35, 0);
    put(g, cyl(0.31, 0.012, mat('#30343b', { transparent: true, opacity: 0.35 }), 'z'), x, 0.35, 0);
  }
  const tube = (x0, y0, x1, y1, r = 0.02, m = frame) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const c = cyl(r, len, m, 'x', r, 12);
    return put(g, c, (x0 + x1) / 2, (y0 + y1) / 2, 0, [0, 0, Math.atan2(y1 - y0, x1 - x0)]);
  };
  tube(0.5, 0.35, 0.02, 0.38); tube(0.02, 0.38, 0.2, 0.92); tube(0.2, 0.92, -0.38, 0.9);
  tube(-0.38, 0.9, 0.02, 0.38); tube(-0.38, 0.9, -0.5, 0.35); tube(0.5, 0.35, 0.2, 0.92);
  // Rider: torso, head, arms, legs.
  const torso = sph(0.19, kit, 1.75, 0.8, 0.95);
  put(g, torso, -0.08, 1.2, 0, [0, 0, 0.5]);
  put(g, sph(0.12, mat('#f4d21f', { roughness: 0.3 }), 1.25, 0.9, 0.9), -0.48, 1.42, 0, [0, 0, 0.35]);
  for (const s of [-1, 1]) {
    put(g, cyl(0.04, 0.5, skin, 'y', 0.035, 12), -0.42, 1.13, s * 0.17, [0, 0, -0.35]);
    put(g, cyl(0.07, 0.5, kit, 'y', 0.055, 12), 0.05, 0.85, s * 0.11, [0, 0, s > 0 ? 0.75 : 0.25]);
    put(g, cyl(0.05, 0.46, skin, 'y', 0.04, 12), s > 0 ? -0.1 : 0.02, 0.5, s * 0.11, [0, 0, s > 0 ? -0.2 : 0.15]);
  }
  put(g, box(0.06, 0.03, 0.44, frame, 0.01), -0.42, 0.93, 0);
  return g;
}

/* ───────────────────────────── PC hardware ───────────────────────────── */

function pcCase({ L = 0.46, H = 0.48, W = 0.22, front = 'mesh', frontFans = 3, topFans = 2, rearFan = true, color = '#1b1e25', accent = '#33d6ff' } = {}) {
  const g = G();
  const t = 0.012;
  const y0 = 0.025;
  const panel = mat(color, { roughness: 0.5, metalness: 0.5 });
  const metal = mat('#8f98a6', { roughness: 0.35, metalness: 0.85 });
  const pcb = mat('#143326', { roughness: 0.6 });
  const fr = Math.min(0.06, W / 2 - 0.035);
  const inset = front === 'glass' ? 0.07 : 0;

  for (const [x, z] of [[-1, -1], [-1, 1], [1, -1], [1, 1]])
    put(g, deco(cyl(0.02, y0, mat('#0c0d10'))), x * (L / 2 - 0.04), y0 / 2, z * (W / 2 - 0.03));
  put(g, box(L, t, W, panel), 0, y0 + t / 2, 0);
  // Top: vented between two rails when there are top fans.
  if (topFans) {
    for (const s of [-1, 1]) put(g, box(L, t, 0.028, panel), 0, y0 + H, s * (W / 2 - 0.014));
    put(g, box(0.06, t, W, panel), -L / 2 + 0.03, y0 + H, 0);
    put(g, box(0.05, t, W, panel), L / 2 - 0.025, y0 + H, 0);
    put(g, deco(box(L - 0.1, 0.003, W - 0.05, mat('#0a0b0d', { transparent: true, opacity: 0.45 }))), 0, y0 + H + 0.004, 0);
  } else put(g, box(L, t, W, panel), 0, y0 + H, 0);
  // Back: I/O wall with an exhaust opening near the top.
  put(g, box(t, H - 0.19, W, panel), L / 2, y0 + (H - 0.19) / 2, 0);
  put(g, box(t, 0.035, W, panel), L / 2, y0 + H - 0.018, 0);
  // Sides: steel on the far side, tempered glass on the near side.
  const sideLen = L - inset;
  put(g, box(sideLen, H, t, panel), inset / 2, y0 + H / 2, -W / 2);
  put(g, box(sideLen, H, t, glass('#a8dcff', 0.16)), inset / 2, y0 + H / 2, W / 2);
  // Front.
  if (front === 'mesh') {
    put(g, box(t, 0.03, W, panel), -L / 2, y0 + 0.015, 0);
    put(g, box(t, 0.03, W, panel), -L / 2, y0 + H - 0.015, 0);
    const grille = new THREE.Mesh(
      new THREE.PlaneGeometry(W - 0.01, H - 0.05, 16, 34),
      new THREE.MeshBasicMaterial({ color: '#5a6677', wireframe: true, transparent: true, opacity: 0.55 }),
    );
    grille.rotation.y = -PI / 2;
    put(g, deco(grille), -L / 2 - 0.002, y0 + H / 2, 0);
  } else {
    // Sealed glass front: air has to sneak in through the side gaps.
    put(g, box(t, H, W, glass('#a8dcff', 0.2)), -L / 2, y0 + H / 2, 0);
    put(g, box(inset, t, W, panel), -L / 2 + inset / 2, y0 + H, 0);
  }
  // PSU shroud, motherboard, CPU tower cooler, GPU, RAM.
  put(g, box(L - 0.03, 0.085, W - 2 * t, panel), 0.005, y0 + t + 0.042, 0);
  const mbX = L / 2 - 0.02 - 0.125;
  const mbY = y0 + H - 0.03 - 0.15;
  put(g, box(0.25, 0.3, 0.008, pcb), mbX, mbY, -W / 2 + 0.02);
  const cz = -W / 2 + 0.024 + 0.055;
  put(g, box(0.07, 0.12, 0.11, metal, 0.006), mbX + 0.01, mbY + 0.06, cz);
  put(g, aim(fan(0.05, { strength: 0.8 }), '+x'), mbX - 0.04, mbY + 0.06, cz);
  if (H > 0.34) {
    put(g, box(0.29, 0.045, 0.125, mat('#23272f', { roughness: 0.4, metalness: 0.6 }), 0.008), mbX - 0.04, mbY - 0.075, -W / 2 + 0.024 + 0.066);
    put(g, deco(box(0.27, 0.004, 0.012, mat(accent, { emissive: accent, emissiveIntensity: 1.6 }))), mbX - 0.04, mbY - 0.05, -W / 2 + 0.15);
  }
  for (const dx of [0.075, 0.09]) put(g, deco(box(0.006, 0.13, 0.03, mat(accent, { emissive: accent, emissiveIntensity: 0.9 }))), mbX - dx - 0.01, mbY + 0.07, -W / 2 + 0.04);
  // Fans.
  const usable = H - 0.085 - 0.04;
  for (let i = 0; i < frontFans; i++)
    put(g, aim(fan(fr), '+x'), -L / 2 + 0.035 + inset * 0.6, y0 + 0.1 + (usable * (i + 0.5)) / frontFans, 0);
  if (rearFan) put(g, aim(fan(fr), '+x'), L / 2 - 0.03, y0 + H - 0.105, 0);
  for (let i = 0; i < topFans; i++) put(g, fan(fr), L / 2 - 0.1 - i * (2 * fr + 0.02), y0 + H - 0.03, 0);
  return g;
}

function openBench() {
  const g = G();
  const metal = mat('#8f98a6', { roughness: 0.35, metalness: 0.85 });
  const black = mat('#1a1d23', { roughness: 0.5, metalness: 0.4 });
  put(g, box(0.4, 0.012, 0.36, black), 0, 0.14, 0);
  for (const x of [-0.18, 0.18]) for (const z of [-0.16, 0.16]) put(g, cyl(0.012, 0.14, metal), x, 0.07, z);
  put(g, box(0.305, 0.006, 0.245, mat('#143326')), 0, 0.152, 0.02);
  put(g, box(0.15, 0.086, 0.14, black, 0.006), -0.08, 0.05, 0);
  // Tower cooler with push fan.
  put(g, box(0.06, 0.15, 0.12, metal, 0.005), 0.02, 0.235, 0.05);
  put(g, aim(fan(0.055), '+x'), -0.03, 0.235, 0.05);
  // Vertical GPU.
  put(g, box(0.29, 0.125, 0.045, black, 0.008), 0, 0.225, -0.085);
  for (const x of [-0.09, 0, 0.09]) put(g, aim(fan(0.04, { strength: 0.7 }), '+z'), x, 0.225, -0.125);
  for (const dz of [0, 0.014]) put(g, deco(box(0.006, 0.04, 0.13, mat('#33d6ff', { emissive: '#33d6ff', emissiveIntensity: 0.9 }))), 0.09 + dz, 0.178, 0.05);
  return g;
}

function gpuCard() {
  const g = G();
  const shroud = mat('#22262e', { roughness: 0.4, metalness: 0.6 });
  const fins = mat('#aab2bf', { roughness: 0.3, metalness: 0.9 });
  put(g, box(0.3, 0.004, 0.125, mat('#143326')), 0, 0.03, 0);
  put(g, box(0.29, 0.026, 0.115, fins), 0, 0.015, 0);
  put(g, box(0.305, 0.012, 0.13, shroud, 0.004), 0, 0.037, 0);
  for (const s of [-1, 1]) put(g, box(0.3, 0.02, 0.008, shroud), 0, -0.005, s * 0.062);
  put(g, box(0.004, 0.11, 0.125, fins), -0.152, 0.0, 0);
  for (const x of [-0.095, 0, 0.095]) put(g, fan(0.042, { strength: 0.9 }), x, -0.012, 0);
  return g;
}

/* ───────────────────────────── food & fun ───────────────────────────── */

function sandwich() {
  const g = G();
  const crust = mat('#b9783a', { roughness: 0.85 });
  const crumb = mat('#f1dcae', { roughness: 0.95 });
  const slice = (y) => {
    const s = G();
    // Bread outline (top view): square loaf with a domed top edge.
    const pts = [];
    pts.push([0.5, -0.5], [0.5, 0.36]);
    for (let i = 0; i <= 16; i++) {
      const a = (PI * i) / 16;
      pts.push([0.5 * Math.cos(a) * 1.06, 0.36 + 0.2 * Math.sin(a)]);
    }
    pts.push([-0.5, 0.36], [-0.5, -0.5]);
    const loaf = extrude(pts, 0.11, crust, 0.035);
    loaf.geometry.rotateX(-PI / 2);
    s.add(loaf);
    const face = extrude(pts.map(([x, z]) => [x * 0.93, z * 0.93 + 0.0]), 0.19, crumb);
    face.geometry.rotateX(-PI / 2);
    s.add(deco(face));
    return put(g, s, 0, y, 0);
  };
  slice(0.09);
  // Ham, cheese (corners poking out), tomato, lettuce.
  put(g, box(1.08, 0.05, 1.0, mat('#e58a8f', { roughness: 0.7 }), 0.02), 0.01, 0.2, 0.05, [0, 0.12, 0]);
  put(g, box(0.98, 0.03, 0.98, mat('#ffc629', { roughness: 0.5 })), 0, 0.245, 0.05, [0, PI / 4, 0]);
  for (const [x, z] of [[-0.24, -0.14], [0.26, -0.1], [0.02, 0.32]])
    put(g, cyl(0.24, 0.05, mat('#e23b2e', { roughness: 0.4 })), x, 0.29, z);
  const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.045, 28, 1), mat('#6fbf3b', { roughness: 0.7, side: THREE.DoubleSide }));
  const lp = lettuce.geometry.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const a = Math.atan2(lp.getZ(i), lp.getX(i));
    const r = Math.hypot(lp.getX(i), lp.getZ(i));
    if (r > 0.1) lp.setY(i, lp.getY(i) + 0.035 * Math.sin(a * 7) * (r / 0.72));
  }
  lettuce.geometry.computeVertexNormals();
  put(g, lettuce, 0, 0.345, 0.04);
  slice(0.46);
  // Cocktail stick with an olive.
  put(g, cyl(0.012, 0.5, mat('#d9b98a')), 0.05, 0.62, 0.05);
  put(g, sph(0.07, mat('#6b8e23', { roughness: 0.35 }), 1, 1.2, 1), 0.05, 0.86, 0.05);
  return g;
}

function burger() {
  const g = G();
  const bun = mat('#c98a3c', { roughness: 0.7 });
  put(g, lathe([[0, 0], [0.46, 0.0], [0.5, 0.06], [0.5, 0.14], [0, 0.14]], bun, 'y'));
  put(g, cyl(0.52, 0.11, mat('#4a2a17', { roughness: 0.9 })), 0, 0.2, 0);
  put(g, box(0.92, 0.025, 0.92, mat('#ffc629', { roughness: 0.5 })), 0, 0.27, 0, [0, 0.5, 0]);
  put(g, cyl(0.47, 0.04, mat('#e23b2e', { roughness: 0.4 })), 0, 0.305, 0);
  put(g, cyl(0.55, 0.03, mat('#6fbf3b', { roughness: 0.7 })), 0, 0.34, 0);
  put(g, lathe([[0, 0], [0.5, 0], [0.52, 0.08], [0.46, 0.22], [0.3, 0.32], [0, 0.36]], bun, 'y'), 0, 0.36, 0);
  const seed = mat('#f6e8c3');
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4;
    const r = 0.06 + 0.36 * Math.sqrt((i + 0.5) / 26);
    const y = 0.36 + 0.355 * Math.sqrt(Math.max(0, 1 - (r / 0.56) ** 2)) - 0.01;
    put(g, deco(sph(0.016, seed, 1.6, 0.6, 1)), r * Math.cos(a), y, r * Math.sin(a), [0, a, 0]);
  }
  return g;
}

function duck() {
  const g = G();
  const y = mat('#ffd21f', { roughness: 0.35 });
  put(g, sph(0.5, y, 1.25, 0.85, 1), 0.08, 0.42, 0);
  put(g, sph(0.3, y), -0.38, 0.95, 0);
  const tail = cyl(0.2, 0.36, y, 'x', 0.02);
  put(g, tail, 0.72, 0.62, 0, [0, 0, 0.6]);
  put(g, box(0.26, 0.07, 0.24, mat('#ff7a1a', { roughness: 0.4 }), 0.03), -0.7, 0.9, 0);
  for (const s of [-1, 1]) {
    put(g, deco(sph(0.045, mat('#111'))), -0.58, 1.05, s * 0.16);
    put(g, sph(0.26, y, 1.5, 0.5, 0.35), 0.15, 0.5, s * 0.47, [0, 0, -0.15]);
  }
  return g;
}

function donut() {
  const g = G();
  const d = torus(0.42, 0.21, mat('#d9a05b', { roughness: 0.75 }));
  put(g, d, 0, 0, 0);
  const ice = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.215, 20, 56), mat('#ff7eb6', { roughness: 0.3 }));
  ice.scale.set(1.0, 1.0, 0.72);
  put(g, deco(ice), 0, 0, 0.065);
  const cols = ['#ffffff', '#ffe14d', '#57d1ff', '#8cff8a', '#ff5a5a'];
  for (let i = 0; i < 70; i++) {
    const a = i * 2.399;
    const r = 0.3 + 0.24 * ((i * 0.618) % 1);
    const sp = cyl(0.012, 0.06, mat(cols[i % 5]), 'x', 0.012, 8);
    const zz = 0.065 + 0.155 * Math.sqrt(Math.max(0, 1 - ((r - 0.42) / 0.215) ** 2));
    put(g, deco(sp), r * Math.cos(a), r * Math.sin(a), zz, [0, 0, i * 1.7]);
  }
  g.rotation.y = PI / 2; // face the hole into the wind
  const wrap = G();
  wrap.add(g);
  return wrap;
}

function mug() {
  const g = G();
  const cer = mat('#f4f1ea', { roughness: 0.25 });
  put(g, lathe([[0, 0], [0.36, 0], [0.4, 0.04], [0.42, 0.9], [0.39, 0.92], [0.36, 0.9], [0.34, 0.08], [0, 0.08]], cer, 'y'));
  put(g, deco(cyl(0.35, 0.02, mat('#3a1f10', { roughness: 0.2 }))), 0, 0.78, 0);
  const handle = torus(0.24, 0.05, cer, PI);
  handle.geometry.rotateZ(-PI / 2);
  put(g, handle, 0.4, 0.47, 0);
  return g;
}

function sphericalCow() {
  const g = G();
  const white = mat('#f6f4ef', { roughness: 0.7 });
  const black = mat('#1b1b1d', { roughness: 0.7 });
  const pink = mat('#f4a6b7', { roughness: 0.6 });
  put(g, sph(0.6, white), 0, 0.95, 0);
  for (const [a, b, r] of [[0.6, 0.5, 0.2], [2.2, -0.3, 0.26], [4.0, 0.7, 0.18], [5.2, -0.5, 0.22], [1.2, 1.1, 0.16]]) {
    const p = new THREE.Vector3().setFromSphericalCoords(0.56, PI / 2 - b, a);
    put(g, deco(sph(r, black, 1, 1, 1)), p.x, 0.95 + p.y, p.z).scale.setScalar(0.5);
  }
  put(g, sph(0.24, white, 1.2, 1, 0.95), -0.72, 1.25, 0);
  put(g, sph(0.13, pink, 0.9, 0.8, 1.1), -0.95, 1.18, 0);
  for (const s of [-1, 1]) {
    put(g, cyl(0.05, 0.16, mat('#e9dfc8'), 'y', 0.01, 12), -0.7, 1.5, s * 0.14, [s * 0.3, 0, 0.2]);
    put(g, sph(0.07, black, 0.5, 1, 1.4), -0.66, 1.36, s * 0.26);
    put(g, deco(sph(0.03, black)), -0.9, 1.33, s * 0.11);
    for (const x of [-0.26, 0.26]) put(g, cyl(0.07, 0.5, white, 'y', 0.08, 14), x, 0.25, s * 0.24);
  }
  put(g, sph(0.14, pink, 1, 0.7, 1), 0.1, 0.4, 0);
  put(g, cyl(0.02, 0.4, white, 'x', 0.012, 10), 0.72, 0.9, 0, [0, 0, -0.9]);
  return g;
}

/* ───────────────────────────── shapes ───────────────────────────── */

const steel = () => mat('#c3cad6', { roughness: 0.25, metalness: 0.85 });

const shape = (fn) => () => {
  const g = G();
  put(g, fn());
  return g;
};

function golfBall() {
  const g = G();
  const geo = new THREE.IcosahedronGeometry(0.5, 14);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  // Dimples from a Fibonacci lattice of centres.
  const centres = [];
  const n = 180;
  for (let i = 0; i < n; i++) {
    const yy = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - yy * yy);
    const a = i * 2.39996;
    centres.push(new THREE.Vector3(r * Math.cos(a), yy, r * Math.sin(a)));
  }
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let best = -1;
    for (const c of centres) best = Math.max(best, v.dot(c));
    const d = Math.acos(Math.min(1, best)) / 0.11;
    const depth = d < 1 ? 0.02 * (1 - d * d) : 0;
    v.multiplyScalar(0.5 - depth);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  put(g, new THREE.Mesh(geo, mat('#fafafa', { roughness: 0.3 })));
  return g;
}

function skyline() {
  const g = G();
  const cols = ['#9fb3c8', '#6f8296', '#c9d3de', '#51657a', '#8a9db1'];
  const towers = [[-1.4, -0.6, 0.7, 3.2, 0.7], [-0.3, 0.5, 0.9, 4.6, 0.8], [0.9, -0.5, 0.8, 2.4, 0.9], [1.9, 0.6, 0.7, 3.6, 0.7],
    [-1.3, 0.75, 0.6, 1.6, 0.6], [0.6, 0.9, 0.5, 1.2, 0.6], [-0.2, -0.9, 0.7, 1.9, 0.6], [2.2, -0.6, 0.6, 1.4, 0.7]];
  towers.forEach(([x, z, w, h, d], i) => put(g, box(w, h, d, mat(cols[i % cols.length], { roughness: 0.35, metalness: 0.5 }), 0.03), x, h / 2, z));
  put(g, cyl(0.03, 0.9, steel()), -0.3, 5.05, 0.5);
  return g;
}

/* ───────────────────────────── catalogue ───────────────────────────── */

export const CATEGORIES = ['All', 'Vehicles', 'PC hardware', 'Food & fun', 'Shapes'];

export const PRESETS = [
  { id: 'f1', name: 'F1 car', cat: 'Vehicles', desc: 'Open-wheel racer with front + rear wings and diffuser', real: 5.4, speed: 280, grounded: true, seed: 'inlet', build: f1Car },
  { id: 'sedan', name: 'Sedan', cat: 'Vehicles', desc: 'Three-box family car', real: 4.6, speed: 120, grounded: true, build: sedan },
  { id: 'pickup', name: 'Pickup truck', cat: 'Vehicles', desc: 'Open bed makes a big recirculation bubble', real: 5.5, speed: 110, grounded: true, build: pickup },
  { id: 'semi', name: 'Semi truck', cat: 'Vehicles', desc: 'Cab-over tractor and box trailer', real: 13, speed: 90, grounded: true, build: semi },
  { id: 'airliner', name: 'Airliner', cat: 'Vehicles', desc: 'Twin-engine jet in cruise', real: 37, speed: 320, grounded: false, pitch: 3, fit: [1.9, 0.9, 1.6], build: airliner },
  { id: 'rocket', name: 'Rocket', cat: 'Vehicles', desc: 'Ogive nose, four fins', real: 6, speed: 350, grounded: false, build: rocket },
  { id: 'cyclist', name: 'Cyclist', cat: 'Vehicles', desc: 'Rider in the drops on a road bike', real: 1.75, speed: 45, grounded: true, fit: [1.2, 1.0, 0.8], build: cyclist },

  { id: 'pc-mesh', name: 'Mesh-front tower', cat: 'PC hardware', desc: 'Three intakes, rear + top exhaust. Free-breathing.', real: 0.5, speed: 0, grounded: true, seed: 'volume', fit: [1.4, 1.15, 0.9], fans: true, build: () => pcCase({ front: 'mesh' }) },
  { id: 'pc-glass', name: 'Glass-front tower', cat: 'PC hardware', desc: 'Sealed front panel: intakes starve through side gaps', real: 0.5, speed: 0, grounded: true, seed: 'volume', fit: [1.4, 1.15, 0.9], fans: true, build: () => pcCase({ front: 'glass', color: '#f1f2f4', accent: '#ff5fd2' }) },
  { id: 'pc-sff', name: 'Small form factor', cat: 'PC hardware', desc: 'Compact cube, one intake and one top exhaust', real: 0.33, speed: 0, grounded: true, seed: 'volume', fit: [1.3, 0.95, 0.9], fans: true, build: () => pcCase({ L: 0.34, H: 0.3, W: 0.2, frontFans: 1, topFans: 1, color: '#2a2f3a', accent: '#8cff8a' }) },
  { id: 'pc-bench', name: 'Open test bench', cat: 'PC hardware', desc: 'No panels: tower cooler and vertical GPU', real: 0.4, speed: 0, grounded: true, seed: 'volume', fit: [1.3, 1.0, 1.1], fans: true, build: openBench },
  { id: 'gpu', name: 'Graphics card', cat: 'PC hardware', desc: 'Triple-fan cooler blowing into the heatsink', real: 0.3, speed: 0, grounded: false, seed: 'volume', fit: [1.4, 0.9, 0.7], fans: true, build: gpuCard },

  { id: 'sandwich', name: 'Sandwich', cat: 'Food & fun', desc: 'Club sandwich. Surprisingly bluff.', real: 0.14, speed: 30, grounded: false, pitch: -6, build: sandwich },
  { id: 'burger', name: 'Burger', cat: 'Food & fun', desc: 'Sesame bun, single patty', real: 0.11, speed: 30, grounded: true, fit: [1.2, 0.8, 0.85], build: burger },
  { id: 'donut', name: 'Donut', cat: 'Food & fun', desc: 'Air threads straight through the hole', real: 0.1, speed: 25, grounded: false, build: donut },
  { id: 'mug', name: 'Coffee mug', cat: 'Food & fun', desc: 'Open cavity with a handle in the wake', real: 0.1, speed: 20, grounded: true, fit: [1.2, 0.9, 0.85], build: mug },
  { id: 'duck', name: 'Rubber duck', cat: 'Food & fun', desc: 'The classic debugging companion', real: 0.09, speed: 20, grounded: true, fit: [1.2, 0.9, 0.85], build: duck },
  { id: 'cow', name: 'Spherical cow', cat: 'Food & fun', desc: 'Assume a spherical cow in a wind tunnel', real: 2.2, speed: 40, grounded: true, fit: [1.2, 0.95, 0.85], build: sphericalCow },

  { id: 'sphere', name: 'Sphere', cat: 'Shapes', desc: 'The reference bluff body', real: 0.2, speed: 80, grounded: false, fit: [0.7, 0.7, 0.7], build: shape(() => sph(0.5, steel())) },
  { id: 'golf', name: 'Golf ball', cat: 'Shapes', desc: 'Dimpled sphere', real: 0.043, speed: 250, grounded: false, fit: [0.7, 0.7, 0.7], build: golfBall },
  { id: 'cube', name: 'Cube', cat: 'Shapes', desc: 'Sharp edges, fixed separation', real: 0.2, speed: 80, grounded: false, fit: [0.6, 0.6, 0.6], build: shape(() => box(1, 1, 1, steel())) },
  { id: 'cylinder', name: 'Cylinder', cat: 'Shapes', desc: 'Crossflow cylinder: von Kármán vortex street', real: 0.3, speed: 60, grounded: false, fit: [0.42, 0.42, 1.8], slice: true, build: shape(() => cyl(0.25, 2.2, steel(), 'z')) },
  { id: 'airfoil', name: 'Airfoil', cat: 'Shapes', desc: 'NACA 2412 wing section at 8° angle of attack', real: 1.5, speed: 200, grounded: false, pitch: 8, fit: [1.2, 0.6, 1.3], slice: true, build: shape(() => extrude(naca(1.5), 1.9, steel())) },
  { id: 'plate', name: 'Flat plate', cat: 'Shapes', desc: 'Plate normal to the flow: maximum drag', real: 0.5, speed: 80, grounded: false, fit: [0.6, 0.75, 0.75], build: shape(() => box(0.06, 1, 1, steel())) },
  { id: 'teardrop', name: 'Teardrop', cat: 'Shapes', desc: 'Streamlined body of revolution', real: 1.0, speed: 200, grounded: false, fit: [1.5, 0.6, 0.6],
    build: shape(() => lathe(Array.from({ length: 33 }, (_, i) => { const x = i / 32; return [4.5 * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4) * (i === 32 ? 0 : 1), x * 3]; }), steel())) },
  { id: 'skyline', name: 'City block', cat: 'Shapes', desc: 'Urban canyon wind between towers', real: 180, speed: 60, grounded: true, fit: [1.5, 1.2, 1.1], build: skyline },
];
