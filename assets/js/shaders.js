/* gk. the shader layer: paper shaders (apache-2.0, vendored in assets/vendor).
   liquid metal, gem smoke, fluted glass, cmyk halftone, paper texture, lens dispersion.
   no simulations, no clouds. everything here is decoration over real html,
   so if webgl2 is missing the page simply keeps its css version. */
import {
  ShaderMount,
  getShaderColorFromString as color,
  getShaderNoiseTexture,
  ShaderFitOptions,
  liquidMetalFragmentShader,
  toProcessedLiquidMetal,
  gemSmokeFragmentShader,
  toProcessedGemSmoke,
  flutedGlassFragmentShader,
  GlassGridShapes,
  GlassDistortionShapes,
  halftoneCmykFragmentShader,
  paperTextureFragmentShader,
  lensDistortionFragmentShader,
  emptyPixel
} from '../vendor/paper-shaders-0.0.80/index.js';

const root = document.documentElement;
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const theme = () => root.getAttribute('data-theme') || 'prism';
const still = () => reduceQuery.matches || root.getAttribute('data-motion') === 'paused';

const probe = document.createElement('canvas');
const gl2 = probe.getContext('webgl2');
const hosts = Array.prototype.slice.call(document.querySelectorAll('[data-shader]'));

if (gl2 && hosts.length) start();

function start() {
  const SPECTRUM = ['#7c3cff', '#3d5bff', '#12b5ff', '#19e0b0', '#8ce03c', '#ffd23d', '#ff8a2b', '#ff3b4a'];
  const HEAT = ['#2a0f5c', '#5a1fd1', '#b3127a', '#ff2d55', '#ff6a1a', '#ffb000', '#fff1a8'];
  const BG = { prism: '#0b0b0d', print: '#f4f1ea', thermal: '#0e0a09' };

  let noise = null;
  async function noiseTexture() {
    if (!noise) { noise = getShaderNoiseTexture(); await noise.decode(); }
    return noise;
  }
  async function load(src) {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  }
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('400 200px instrument'), document.fonts.ready]).catch(() => null)
    : Promise.resolve();

  function sizing(o) {
    o = o || {};
    return {
      u_fit: ShaderFitOptions[o.fit || 'contain'],
      u_scale: o.scale == null ? 1 : o.scale,
      u_rotation: o.rotation || 0,
      u_offsetX: o.offsetX || 0,
      u_offsetY: o.offsetY || 0,
      u_originX: 0.5,
      u_originY: 0.5,
      u_worldWidth: 0,
      u_worldHeight: 0
    };
  }

  // draw a word into a canvas at the exact spot its html twin sits, so the shader lines up
  function wordCanvas(box, word, opts) {
    const k = opts.res || 2;
    const cv = document.createElement('canvas');
    cv.width = Math.max(8, Math.round(box.width * k));
    cv.height = Math.max(8, Math.round(box.height * k));
    const x = cv.getContext('2d');
    if (opts.bg) { x.fillStyle = opts.bg; x.fillRect(0, 0, cv.width, cv.height); }
    x.font = '400 ' + (opts.size * k) + 'px instrument';
    x.textBaseline = 'alphabetic';
    x.textAlign = opts.align || 'left';
    if (opts.gradient) {
      const g = x.createLinearGradient(0, 0, cv.width, 0);
      opts.gradient.forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
      x.fillStyle = g;
    } else {
      x.fillStyle = opts.fill || '#ffffff';
    }
    if (opts.letterSpacing && 'letterSpacing' in x) x.letterSpacing = (opts.letterSpacing * k) + 'px';
    x.fillText(word, opts.x * k, opts.y * k);
    return cv;
  }

  // ---------- each piece ----------

  const specs = {
    // footer sign-off: liquid metal "gk-labs" (the liquid logo idea), cmyk halftone in print
    mark: {
      async build(host, t) {
        await fontsReady;
        const box = host.getBoundingClientRect();
        const size = Math.min(box.height * 0.7, box.width / 3.8);
        const base = box.height * 0.5 + size * 0.28;
        if (t === 'print') {
          // three plates, slightly out of register, then screened into dots
          const k = 2;
          const cv = document.createElement('canvas');
          cv.width = Math.round(box.width * k); cv.height = Math.round(box.height * k);
          const x = cv.getContext('2d');
          x.fillStyle = '#ffffff'; x.fillRect(0, 0, cv.width, cv.height);
          x.globalCompositeOperation = 'multiply';
          x.font = '400 ' + (size * k) + 'px instrument';
          x.textAlign = 'center';
          if ('letterSpacing' in x) x.letterSpacing = (-size * 0.04 * k) + 'px';
          const off = size * 0.035 * k;
          [['#00b4ff', -off, -off * 0.4], ['#fc519f', 0, 0], ['#ffd800', off, off * 0.4]].forEach(([c, dx, dy]) => {
            x.fillStyle = c;
            x.fillText('gk-labs', cv.width / 2 + dx, base * k + dy);
          });
          return {
            key: 'mark-halftone',
            frag: halftoneCmykFragmentShader,
            speed: 0,
            frame: 0,
            uniforms: Object.assign({
              u_image: await load(cv.toDataURL('image/png')),
              u_noiseTexture: await noiseTexture(),
              u_colorBack: color('#00000000'), u_colorC: color('#00b4ff'), u_colorM: color('#fc519f'), u_colorY: color('#ffd800'), u_colorK: color('#141317'),
              u_size: 0.16, u_contrast: 1.1, u_softness: 0.6, u_grainSize: 0.5, u_grainMixer: 0, u_grainOverlay: 0, u_gridNoise: 0.25,
              u_floodC: 0, u_floodM: 0, u_floodY: 0, u_floodK: 0, u_gainC: 0.3, u_gainM: 0.2, u_gainY: 0.2, u_gainK: 0, u_type: 0
            }, sizing({ fit: 'cover' }))
          };
        }
        const cv = wordCanvas(box, 'gk-labs', { size: size, x: box.width / 2, y: base, align: 'center', fill: '#000000', letterSpacing: -size * 0.04 });
        if (!host._metal) host._metal = load(URL.createObjectURL((await toProcessedLiquidMetal(cv.toDataURL('image/png'))).pngBlob));
        const warm = t === 'thermal';
        return {
          key: 'mark-metal',
          frag: liquidMetalFragmentShader,
          speed: 0.8,
          frame: 2400,
          mipmaps: ['u_image'],
          uniforms: Object.assign({
            u_image: await host._metal,
            u_isImage: true,
            u_shape: 0,
            u_colorBack: color('#00000000'),
            u_colorTint: color(warm ? '#ffb454' : '#ffffff'),
            u_repetition: warm ? 3 : 2,
            u_shiftRed: warm ? 0.7 : 0.45,
            u_shiftBlue: warm ? 0.15 : 0.45,
            u_contour: 0.4,
            u_softness: 0.12,
            u_distortion: 0.08,
            u_angle: 70
          }, sizing({ fit: 'contain', scale: 1 }))
        };
      }
    },

    // onyx is a stone, so the word becomes one: smoke trapped inside the letters
    gem: {
      async build(host, t) {
        await fontsReady;
        const h3 = host.querySelector('h3');
        const gl = host.querySelector('.gl');
        const box = gl.getBoundingClientRect();
        const cs = getComputedStyle(h3);
        const size = parseFloat(cs.fontSize);
        // the text's own box, then its baseline from the font's real descent
        const range = document.createRange();
        range.selectNodeContents(h3);
        const tr = range.getBoundingClientRect();
        const m = document.createElement('canvas').getContext('2d');
        m.font = '400 ' + size + 'px instrument';
        const descent = m.measureText('onyx').fontBoundingBoxDescent || size * 0.25;
        const baseline = tr.bottom - box.top - descent;
        const cv = wordCanvas(box, 'onyx', { size: size, x: tr.left - box.left, y: baseline, fill: '#000000', letterSpacing: parseFloat(cs.letterSpacing) || 0 });
        const key = Math.round(box.width) + 'x' + Math.round(box.height);
        if (!host._gem || host._gemKey !== key) {
          host._gemKey = key;
          host._gem = load(URL.createObjectURL((await toProcessedGemSmoke(cv.toDataURL('image/png'))).pngBlob));
        }
        const pal = t === 'thermal' ? ['#5a1fd1', '#ff2d55', '#ff6a1a', '#ffb000', '#fff1a8']
          : t === 'print' ? ['#00c8eb', '#f0008c', '#ffcd00', '#00c8eb']
          : ['#12b5ff', '#19e0b0', '#ffd23d', '#ff3b4a', '#7c3cff'];
        return {
          key: 'gem',
          frag: gemSmokeFragmentShader,
          speed: 0.6,
          frame: 5200,
          mipmaps: ['u_image'],
          uniforms: Object.assign({
            u_image: await host._gem,
            u_isImage: true,
            u_shape: 0,
            u_colorBack: color('#00000000'),
            u_colors: pal.map(color),
            u_colorsCount: pal.length,
            u_colorInner: color(t === 'print' ? '#141317' : t === 'thermal' ? '#fff3e8' : '#f3f1ec'),
            u_innerDistortion: 0.8,
            u_outerDistortion: 0.5,
            u_outerGlow: t === 'print' ? 0.2 : 0.32,
            u_innerGlow: 1,
            u_offset: 0,
            u_angle: 0,
            u_size: 0.8
          }, sizing({ fit: 'contain', scale: 1 }))
        };
      }
    },

    // the tools spectrum, seen through ribbed glass
    fluted: {
      async build(host, t) {
        const box = host.getBoundingClientRect();
        const k = 2;
        const cv = document.createElement('canvas');
        cv.width = Math.max(8, Math.round(box.width * k));
        cv.height = Math.max(8, Math.round(box.height * k));
        const x = cv.getContext('2d');
        const ramp = t === 'thermal' ? HEAT : SPECTRUM;
        const g = x.createLinearGradient(0, 0, cv.width, 0);
        ramp.forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
        const mid = cv.height / 2, band = cv.height * 0.32;
        x.fillStyle = g;
        x.globalAlpha = 0.35;
        x.fillRect(0, mid - band, cv.width, band * 2);
        x.globalAlpha = 1;
        x.fillRect(0, mid - band * 0.45, cv.width, band * 0.9);
        const fade = x.createLinearGradient(0, 0, cv.width, 0);
        fade.addColorStop(0, BG[t]); fade.addColorStop(0.05, BG[t] + '00'); fade.addColorStop(0.95, BG[t] + '00'); fade.addColorStop(1, BG[t]);
        x.fillStyle = fade;
        x.fillRect(0, 0, cv.width, cv.height);
        return {
          key: 'fluted',
          frag: flutedGlassFragmentShader,
          speed: 0,
          frame: 0,
          mipmaps: ['u_image'],
          uniforms: Object.assign({
            u_image: await load(cv.toDataURL('image/png')),
            u_colorBack: color('#00000000'),
            u_colorShadow: color(t === 'print' ? '#141317' : '#000000'),
            u_colorHighlight: color('#ffffff'),
            u_shadows: 0.25, u_size: 0.32, u_angle: 0, u_distortion: 0.6, u_shift: 0, u_blur: 0.05, u_edges: 0.3,
            u_marginLeft: 0, u_marginRight: 0, u_marginTop: 0, u_marginBottom: 0, u_stretch: 0,
            u_distortionShape: GlassDistortionShapes.prism, u_highlights: 0.15, u_shape: GlassGridShapes.lines,
            u_grainMixer: 0, u_grainOverlay: 0
          }, sizing({ fit: 'cover' }))
        };
      }
    },

    // print theme only: real paper fibres under the ink
    paper: {
      when: (t) => t === 'print',
      async build() {
        return {
          key: 'paper',
          frag: paperTextureFragmentShader,
          speed: 0,
          frame: 0,
          maxPixelCount: 1600 * 1000,
          uniforms: Object.assign({
            u_image: await load(emptyPixel),
            u_colorFront: color('#e6e1d5'),
            u_colorBack: color('#f4f1ea'),
            u_contrast: 0.22, u_roughness: 0.35, u_fiber: 0.3, u_fiberSize: 0.2, u_crumples: 0.25, u_crumpleSize: 0.4,
            u_folds: 0.45, u_foldCount: 4, u_fade: 0, u_drops: 0.12, u_seed: 5.8
          }, sizing({ fit: 'cover', scale: 0.6 }))
        };
      }
    },

    // 404: the number pulled apart by a stack of lenses
    lens: {
      async build(host, t) {
        await fontsReady;
        const box = host.getBoundingClientRect();
        const size = Math.min(box.height * 0.8, box.width * 0.42);
        const cv = wordCanvas(box, host.getAttribute('data-word') || '404', { size: size, x: box.width / 2, y: box.height * 0.72, align: 'center', bg: BG[t], fill: t === 'print' ? '#141317' : '#f3f1ec' });
        return {
          key: 'lens',
          frag: lensDistortionFragmentShader,
          speed: 0,
          frame: 0,
          mipmaps: ['u_image'],
          uniforms: Object.assign({
            u_image: await load(cv.toDataURL('image/png')),
            u_spread: 0.6, u_bias: 1, u_angle: 0, u_perspective: 0.1, u_count: 28,
            u_dispersion: 1, u_dispersionShift: 0, u_dispersionColor: 0.7, u_focusCenter: 0.8, u_focusEdges: 1,
            u_swirl: 0.25, u_noise: 0, u_noiseFrequency: 0.25, u_noiseOffset: 0, u_lensBulge: 0, u_lensCircle: 0,
            u_grainMixer: 0, u_grainOverlay: 0, u_imageX: 0, u_imageY: 0
          }, sizing({ fit: 'contain' }))
        };
      }
    }
  };

  // ---------- mounting, pausing, theming ----------

  const state = new Map();

  function applySpeed(st) {
    if (!st.mount) return;
    st.mount.setSpeed(st.visible && !still() ? st.speed : 0);
  }

  async function mount(host) {
    const spec = specs[host.getAttribute('data-shader')];
    if (!spec) return;
    const t = theme();
    let st = state.get(host);
    if (!st) { st = { busy: false, visible: true }; state.set(host, st); }
    if (spec.when && !spec.when(t)) { teardown(host); return; }
    if (st.busy) { st.again = true; return; }
    st.busy = true;
    try {
      const out = await spec.build(host, t);
      const target = host.querySelector('.gl');
      if (st.mount && st.key === out.key) {
        st.mount.setUniforms(out.uniforms);
      } else {
        if (st.mount) { st.mount.dispose(); target.innerHTML = ''; }
        st.mount = new ShaderMount(target, out.frag, out.uniforms, { premultipliedAlpha: true, alpha: true, antialias: false }, 0, out.frame, 2, out.maxPixelCount || 1920 * 1080 * 2, out.mipmaps);
        st.key = out.key;
      }
      st.speed = out.speed;
      applySpeed(st);
      host.classList.add('gl-on');
    } catch (err) {
      teardown(host);
    } finally {
      st.busy = false;
      if (st.again) { st.again = false; mount(host); }
    }
  }

  function teardown(host) {
    const st = state.get(host);
    host.classList.remove('gl-on');
    if (st && st.mount) {
      st.mount.dispose();
      st.mount = null;
      st.key = null;
      const target = host.querySelector('.gl');
      if (target) target.innerHTML = '';
    }
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const host = en.target;
      let st = state.get(host);
      if (!st) { st = { busy: false, visible: false }; state.set(host, st); }
      st.visible = en.isIntersecting;
      if (en.isIntersecting && !st.mount && !st.busy) mount(host);
      else applySpeed(st);
    });
  }, { rootMargin: '300px 0px' }) : null;

  hosts.forEach((host) => {
    if (host.getAttribute('data-shader') === 'paper') { mount(host); return; }
    if (io) io.observe(host); else mount(host);
  });

  document.addEventListener('gk:theme', () => {
    hosts.forEach((host) => {
      const st = state.get(host);
      if (host.getAttribute('data-shader') === 'paper' || (st && st.mount)) mount(host);
    });
  });

  const resync = () => state.forEach(applySpeed);
  document.addEventListener('gk:motion', resync);
  if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', resync);

  // word positions depend on layout, so rebuild those on a real resize
  let lastW = window.innerWidth, timer = 0;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastW) < 2) return;
    lastW = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(() => {
      hosts.forEach((host) => {
        const st = state.get(host);
        const kind = host.getAttribute('data-shader');
        if (st && st.mount && kind !== 'paper') { host._metal = null; mount(host); }
      });
    }, 250);
  });
}
