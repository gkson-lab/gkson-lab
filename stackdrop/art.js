// original generated card art. one seeded svg per card id, no external images.
window.SD_ART = (() => {
  const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = seed => () => (seed = Math.imul(seed ^ seed >>> 15, 1 | seed) + 0x6d2b79f5 >>> 0, ((seed ^ seed >>> 14) >>> 0) / 2 ** 32);
  const code = (r, h) => { // languages: drifting lines of code and brackets
    let s = '';
    for (let y = 18; y < 200; y += 14) { let x = 10 + Math.floor(r() * 3) * 12;
      while (x < 130) { const w = 8 + r() * 34; s += `<rect x="${x}" y="${y}" width="${w}" height="5" rx="2.5" fill="hsl(${h + (r() * 80 - 40)} 70% ${45 + r() * 30}%)" opacity="${.35 + r() * .5}"/>`; x += w + 6; } }
    const b = ['{ }', '( )', '[ ]', '< >', '=>', '::'][Math.floor(r() * 6)];
    return s + `<text x="70" y="128" text-anchor="middle" font-family="instrument, serif" font-size="64" fill="hsl(${h} 90% 80%)" opacity=".9">${b}</text>`;
  };
  const city = (r, h) => { // companies: a skyline at dusk
    let s = `<circle cx="${30 + r() * 80}" cy="${50 + r() * 30}" r="${14 + r() * 12}" fill="hsl(${h + 30} 90% 70%)" opacity=".85"/>`;
    for (let x = -4; x < 144;) { const w = 12 + r() * 22, ht = 40 + r() * 110;
      s += `<rect x="${x}" y="${200 - ht}" width="${w}" height="${ht}" fill="hsl(${h} 30% ${10 + r() * 14}%)"/>`;
      for (let wy = 210 - ht; wy < 196; wy += 9) for (let wx = x + 3; wx < x + w - 4; wx += 6) if (r() > .55) s += `<rect x="${wx}" y="${wy}" width="3" height="4" fill="hsl(${h + 40} 90% 75%)" opacity=".8"/>`;
      x += w + 2; }
    return s;
  };
  const clock = (r, h) => { // limited: rings and a clock hand frozen at drop time
    let s = '';
    for (let i = 0; i < 7; i++) s += `<circle cx="70" cy="100" r="${16 + i * 12}" fill="none" stroke="hsl(${h + i * 18} 80% 65%)" stroke-width="${1 + r() * 3}" stroke-dasharray="${2 + r() * 14} ${3 + r() * 9}" opacity=".8"/>`;
    const a = r() * 6.28, b = r() * 6.28;
    return s + `<line x1="70" y1="100" x2="${70 + Math.cos(a) * 46}" y2="${100 + Math.sin(a) * 46}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <line x1="70" y1="100" x2="${70 + Math.cos(b) * 30}" y2="${100 + Math.sin(b) * 30}" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="100" r="5" fill="#fff"/>`;
  };
  const cache = {};
  return c => cache[c.id] || (cache[c.id] = (() => {
    const r = rng(hash(c.id)), h = c.hue, f = c.set === 'lang' ? code : c.set === 'co' ? city : clock;
    return `<svg viewBox="0 0 140 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="g${c.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${h} 55% 30%)"/><stop offset="1" stop-color="hsl(${h + 50} 45% 8%)"/></linearGradient></defs>
      <rect width="140" height="200" fill="url(#g${c.id})"/>${f(r, h)}</svg>`;
  })());
})();
