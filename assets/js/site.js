/* gk. light through glass. no webgl, no frameworks: dom, svg and a bit of optics. */
(function () {
  'use strict';

  var root = document.documentElement;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionQuery.matches;

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var session = {
    get: function (k) { try { return JSON.parse(window.sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------------------------------------------------------------
     one frame loop that only runs while something is moving
     --------------------------------------------------------------- */
  var steppers = [];
  var rafId = 0;
  function wake() { if (!rafId) rafId = requestAnimationFrame(frame); }
  function frame(now) {
    rafId = 0;
    var busy = false;
    for (var i = 0; i < steppers.length; i++) { if (steppers[i](now)) busy = true; }
    if (busy) wake();
  }

  /* ---------------------------------------------------------------
     the split: pointer is the light source, scroll speed widens it
     --------------------------------------------------------------- */
  var light = { x: 0.82, y: 0.28, tx: 0.82, ty: 0.28, boost: 0 };
  var disp = parseFloat(getComputedStyle(root).getPropertyValue('--disp')) || 1;

  function writeLight() {
    root.style.setProperty('--ca-x', light.x.toFixed(3));
    root.style.setProperty('--ca-y', light.y.toFixed(3));
    root.style.setProperty('--disp-live', (disp * (1 + light.boost)).toFixed(3));
  }

  steppers.push(function () {
    var dx = light.tx - light.x, dy = light.ty - light.y;
    var moving = Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002;
    light.x += dx * 0.16;
    light.y += dy * 0.16;
    if (light.boost > 0.004) light.boost *= 0.86; else light.boost = 0;
    writeLight();
    return moving || light.boost > 0;
  });

  var pointer = { nx: 0.5, ny: 0.42, seen: false };
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    pointer.nx = e.clientX / window.innerWidth;
    pointer.ny = e.clientY / window.innerHeight;
    pointer.seen = true;
    if (reduced) return;
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var vx = (cx - e.clientX) / cx;
    var vy = (cy - e.clientY) / cy;
    var mag = Math.hypot(vx, vy) || 1;
    var len = clamp(mag, 0.4, 1);
    light.tx = (vx / mag) * len;
    light.ty = (vy / mag) * len;
    prism.aim(pointer.nx, pointer.ny);
    wake();
  }, { passive: true });

  var lastScroll = { y: window.scrollY, t: performance.now() };
  window.addEventListener('scroll', function () {
    var now = performance.now();
    var dy = Math.abs(window.scrollY - lastScroll.y);
    var dt = Math.max(8, now - lastScroll.t);
    lastScroll = { y: window.scrollY, t: now };
    if (!reduced) {
      light.boost = clamp(Math.max(light.boost, (dy / dt) * 0.32), 0, 1.4);
      wake();
    }
    dock.spy();
  }, { passive: true });

  /* ---------------------------------------------------------------
     headings come into focus as they arrive
     --------------------------------------------------------------- */
  (function focusIn() {
    var heads = $$('.ca-lg, .ca-focal');
    if (!('IntersectionObserver' in window) || reduced) return;
    heads.forEach(function (h) { h.setAttribute('data-focus', ''); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -18% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  })();

  /* ---------------------------------------------------------------
     prism: a real ray trace. snell's law at both faces, cauchy
     dispersion n(λ) = a + b/λ², exaggerated so you can see it.
     --------------------------------------------------------------- */
  function wavelengthToRgb(nm) {
    var r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else { r = 1; }
    var f = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 690 ? 0.35 + 0.65 * (780 - nm) / 90 : 1;
    function c(v) { return Math.round(255 * Math.pow(clamp(v * f, 0, 1), 0.8)); }
    return 'rgb(' + c(r) + ' ' + c(g) + ' ' + c(b) + ')';
  }

  var prism = (function () {
    var svg = $('.prism');
    var hero = $('.hero');
    if (!svg || !hero) return { aim: function () {}, draw: function () {}, paint: function () {} };

    var NS = 'http://www.w3.org/2000/svg';
    var N = 34;
    var NM = [];
    for (var i = 0; i < N; i++) NM.push(400 + (300 * i) / (N - 1));
    var THERMAL = [[42, 15, 92], [90, 31, 209], [179, 18, 122], [255, 45, 85], [255, 106, 26], [255, 176, 0], [255, 241, 168]];
    function heat(t) {
      var x = clamp(t, 0, 1) * (THERMAL.length - 1), i = Math.min(THERMAL.length - 2, Math.floor(x)), f = x - i;
      var a = THERMAL[i], b = THERMAL[i + 1];
      return 'rgb(' + Math.round(lerp(a[0], b[0], f)) + ' ' + Math.round(lerp(a[1], b[1], f)) + ' ' + Math.round(lerp(a[2], b[2], f)) + ')';
    }
    function palette() {
      return root.getAttribute('data-theme') === 'thermal'
        ? NM.map(function (nm) { return heat(0.12 + 0.88 * (nm - 400) / 300); })
        : NM.map(wavelengthToRgb);
    }
    var COLORS = palette();
    var INV = function (nm) { var l = nm / 1000; return 1 / (l * l); };
    var KMIN = INV(700), KMAX = INV(400);

    var el = {
      beam: $('.beam-in', svg), beamGlow: $('.beam-in-glow', svg), reflect: $('.beam-reflect', svg),
      inside: $('.beam-inside', svg), body: $('.prism-body', svg), inner: $('.prism-inner', svg),
      edges: $$('.prism-edges path', svg), fan: $('.fan', svg), fanGlow: $('.fan-glow', svg)
    };
    function mk(parent, n) {
      var out = [];
      for (var k = 0; k < n; k++) { var p = document.createElementNS(NS, 'path'); parent.appendChild(p); out.push(p); }
      return out;
    }
    var bands = mk(el.fan, N - 1), rays = mk(el.fan, N), glowBands = mk(el.fanGlow, N - 1);
    function paint() {
      COLORS = palette();
      bands.forEach(function (p, k) { p.setAttribute('fill', COLORS[k]); p.setAttribute('fill-opacity', '0.5'); });
      glowBands.forEach(function (p, k) { p.setAttribute('fill', COLORS[k]); });
      rays.forEach(function (p, k) {
        p.setAttribute('stroke', COLORS[k]); p.setAttribute('stroke-width', '2.4');
        p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round');
      });
    }
    paint();

    var W = 0, H = 0;
    var aimT = { ang: 0.5, hit: 0.5 }, aimC = { ang: 0.5, hit: 0.5 };

    function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
    function mul(a, s) { return [a[0] * s, a[1] * s]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
    function norm(a) { var l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; }
    function f2(v) { return v[0].toFixed(1) + ' ' + v[1].toFixed(1); }

    function refract(d, n, eta) {
      // n points against d (toward the side the ray comes from)
      var cosi = -dot(n, d);
      var k = 1 - eta * eta * (1 - cosi * cosi);
      if (k < 0) return null;
      return norm(add(mul(d, eta), mul(n, eta * cosi - Math.sqrt(k))));
    }
    function reflect(d, n) { return sub(d, mul(n, 2 * dot(d, n))); }
    function hitSeg(p, d, a, b) {
      var e = sub(b, a);
      var den = d[0] * e[1] - d[1] * e[0];
      if (Math.abs(den) < 1e-9) return -1;
      var w = sub(a, p);
      var t = (w[0] * e[1] - w[1] * e[0]) / den;
      var u = (w[0] * d[1] - w[1] * d[0]) / den;
      return (t > 1e-6 && u >= 0 && u <= 1) ? t : -1;
    }

    function geometry() {
      var mobile = W < 761;
      var s, cx, cy, rot;
      if (mobile) {
        // keep the prism in the band above the words so the beam never strikes through them
        var copy = $('.hero-copy', hero);
        var head = $('.top');
        var top = (head ? head.offsetHeight : 76) + 8;
        var band = (copy ? copy.offsetTop : H * 0.45) - top - 28;
        var hh = clamp(Math.min(band, W * 0.5), 120, 300);
        s = hh / 0.866;
        cx = W * 0.6; cy = top + hh * 0.62; rot = 16;
      } else {
        s = Math.min(H * 0.64, W * 0.34, 600);
        cx = W * 0.7; cy = H * 0.47; rot = 16;
      }
      var h = s * Math.sqrt(3) / 2;
      var r = rot * Math.PI / 180, cr = Math.cos(r), sr = Math.sin(r);
      function place(x, y) { return [cx + x * cr - y * sr, cy + x * sr + y * cr]; }
      var A = place(0, -2 * h / 3), B = place(-s / 2, h / 3), C = place(s / 2, h / 3);
      return { A: A, B: B, C: C, c: [cx, cy], mobile: mobile, s: s };
    }

    function outward(a, b, c) {
      var e = sub(b, a);
      var n = norm([e[1], -e[0]]);
      var mid = mul(add(a, b), 0.5);
      if (dot(n, sub(mid, c)) < 0) n = mul(n, -1);
      return n;
    }

    function draw() {
      if (!W || !H) return;
      var g = geometry();
      var A = g.A, B = g.B, C = g.C;
      var faces = [[A, B], [B, C], [C, A]];
      var normals = faces.map(function (f) { return outward(f[0], f[1], g.c); });
      var tri = 'M' + f2(A) + 'L' + f2(B) + 'L' + f2(C) + 'Z';
      el.body.setAttribute('d', tri);
      var inset = function (p) { return add(g.c, mul(sub(p, g.c), 0.9)); };
      el.inner.setAttribute('d', 'M' + f2(inset(A)) + 'L' + f2(inset(B)) + 'L' + f2(inset(C)) + 'Z');
      var shift = 1.6 * Math.min(1.4, disp);
      el.edges.forEach(function (p, k) {
        var o = (k - 1) * shift;
        var off = [o * 0.85, o * 0.5];
        p.setAttribute('d', 'M' + f2(add(A, off)) + 'L' + f2(add(B, off)) + 'L' + f2(add(C, off)) + 'Z');
      });

      // incoming white light: angle and hit point follow the pointer
      var incidence = lerp(41, 52, aimC.ang) * Math.PI / 180;
      var nIn = mul(normals[0], -1);
      var base = Math.atan2(nIn[1], nIn[0]);
      var d = [Math.cos(base - incidence), Math.sin(base - incidence)];
      var P = add(A, mul(sub(B, A), lerp(0.4, 0.62, aimC.hit)));
      var far = Math.hypot(W, H) * 1.6;
      var S = sub(P, mul(d, far));
      el.beam.setAttribute('d', 'M' + f2(S) + 'L' + f2(P));
      el.beamGlow.setAttribute('d', 'M' + f2(S) + 'L' + f2(P));
      el.reflect.setAttribute('d', 'M' + f2(P) + 'L' + f2(add(P, mul(reflect(d, normals[0]), g.s * 0.35))));

      var spread = 0.08 * disp;
      var exits = [];
      var firstQ = null, lastQ = null;
      for (var k = 0; k < N; k++) {
        var kk = (INV(NM[k]) - KMIN) / (KMAX - KMIN);
        var n = 1.48 + spread * kk;
        var dir = refract(d, normals[0], 1 / n);
        if (!dir) { exits.push(null); continue; }
        var p = P, from = 0, out = null;
        for (var bounce = 0; bounce < 3 && !out; bounce++) {
          var best = -1, bi = -1;
          for (var fi = 0; fi < 3; fi++) {
            if (fi === from) continue;
            var t = hitSeg(p, dir, faces[fi][0], faces[fi][1]);
            if (t > 0 && (best < 0 || t < best)) { best = t; bi = fi; }
          }
          if (bi < 0) break;
          var Q = add(p, mul(dir, best));
          var e = refract(dir, mul(normals[bi], -1), n);
          if (e) { out = { q: Q, e: e }; }
          else { dir = norm(reflect(dir, mul(normals[bi], -1))); p = Q; from = bi; }
        }
        exits.push(out);
        if (out) { if (!firstQ) firstQ = out.q; lastQ = out.q; }
      }

      el.inside.setAttribute('d', firstQ ? 'M' + f2(P) + 'L' + f2(firstQ) + 'L' + f2(lastQ) + 'Z' : '');
      for (var j = 0; j < N; j++) {
        var x = exits[j];
        rays[j].setAttribute('d', x ? 'M' + f2(x.q) + 'L' + f2(add(x.q, mul(x.e, far))) : '');
        if (j < N - 1) {
          var y = exits[j + 1];
          var dd = (x && y) ? 'M' + f2(x.q) + 'L' + f2(y.q) + 'L' + f2(add(y.q, mul(y.e, far))) + 'L' + f2(add(x.q, mul(x.e, far))) + 'Z' : '';
          bands[j].setAttribute('d', dd);
          glowBands[j].setAttribute('d', dd);
        }
      }
    }

    steppers.push(function () {
      var da = aimT.ang - aimC.ang, dh = aimT.hit - aimC.hit;
      if (Math.abs(da) < 0.003 && Math.abs(dh) < 0.003) return false;
      aimC.ang += da * 0.16;
      aimC.hit += dh * 0.16;
      draw();
      return true;
    });

    function resize() {
      var r = hero.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      draw();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener('resize', resize);
    resize();

    // touch: drag across the hero to tilt the light
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'touch' || reduced) return;
      var r = hero.getBoundingClientRect();
      aim((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }, { passive: true });

    function aim(nx, ny) {
      if (reduced) return;
      aimT.ang = clamp(1 - ny, 0, 1);
      aimT.hit = clamp(nx, 0, 1);
      wake();
    }
    return { aim: aim, draw: draw, paint: paint };
  })();

  /* ---------------------------------------------------------------
     lenses: svg displacement maps that bend r, g and b by different
     amounts. chromium renders these behind glass, others get frost.
     --------------------------------------------------------------- */
  var lens = (function () {
    var defs = $('#lens-defs');
    var brands = navigator.userAgentData && navigator.userAgentData.brands;
    var chromium = !!(brands && brands.some(function (b) { return /chromium/i.test(b.brand); }));
    if (!defs || !chromium) return { build: function () {} };
    root.classList.add('refract');

    var cache = {};
    function mapFor(w, h) {
      var key = w + 'x' + h;
      if (cache[key]) return cache[key];
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var ctx = cv.getContext('2d');
      var img = ctx.createImageData(w, h);
      var r = h / 2, hw = w / 2, hh = h / 2;
      var bevel = Math.min(w, h) * 0.36;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var px = x + 0.5 - hw, py = y + 0.5 - hh;
          // signed distance to a pill, and its outward gradient
          var qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
          var mx = Math.max(qx, 0), my = Math.max(qy, 0);
          var dist = Math.hypot(mx, my) + Math.min(Math.max(qx, qy), 0) - r;
          var gx, gy;
          if (qx > 0 || qy > 0) {
            var l = Math.hypot(mx, my) || 1;
            gx = (mx / l) * Math.sign(px); gy = (my / l) * Math.sign(py);
          } else if (qx > qy) { gx = Math.sign(px); gy = 0; }
          else { gx = 0; gy = Math.sign(py); }
          var vx = 0, vy = 0;
          if (dist < 0) {
            var depth = -dist;
            var f = depth < bevel ? Math.pow(1 - depth / bevel, 2) : 0;
            vx = -gx * f - (px / hw) * 0.14;
            vy = -gy * f - (py / hh) * 0.14;
          }
          var i = (y * w + x) * 4;
          img.data[i] = Math.round(128 + 127 * clamp(vx, -1, 1));
          img.data[i + 1] = Math.round(128 + 127 * clamp(vy, -1, 1));
          img.data[i + 2] = 128;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      cache[key] = cv.toDataURL();
      return cache[key];
    }

    function channel(i) {
      var m = ['0 0 0 0 0', '0 0 0 0 0', '0 0 0 0 0'];
      m[i] = i === 0 ? '1 0 0 0 0' : i === 1 ? '0 1 0 0 0' : '0 0 1 0 0';
      return m.join(' ') + ' 0 0 0 1 0';
    }

    function build(id, w, h, scale) {
      w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h));
      var old = document.getElementById(id);
      if (old && old.getAttribute('data-size') === w + 'x' + h) return;
      var href = mapFor(w, h);
      var s = [scale, scale * 0.86, scale * 0.72];
      var html =
        '<filter id="' + id + '" data-size="' + w + 'x' + h + '" x="0" y="0" width="' + w + '" height="' + h + '" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
        '<feImage href="' + href + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="map"/>' +
        // flatten translucent glass first so the split channels recombine cleanly
        '<feFlood class="lens-flood" result="base"/>' +
        '<feComposite in="SourceGraphic" in2="base" operator="over" result="src"/>' +
        [0, 1, 2].map(function (c) {
          return '<feDisplacementMap in="src" in2="map" scale="' + s[c].toFixed(1) + '" xChannelSelector="R" yChannelSelector="G" result="d' + c + '"/>' +
                 '<feColorMatrix in="d' + c + '" type="matrix" values="' + channel(c) + '" result="c' + c + '"/>';
        }).join('') +
        '<feBlend in="c0" in2="c1" mode="screen" result="c01"/>' +
        '<feBlend in="c01" in2="c2" mode="screen"/>' +
        '</filter>';
      var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      tmp.innerHTML = html;
      var node = tmp.firstChild;
      if (old) defs.replaceChild(node, old); else defs.appendChild(node);
    }
    return { build: build };
  })();

  function buildLenses() {
    var d = $('.dock-lens'), r = $('.range-lens'), t = $('.theme-lens');
    if (d) lens.build('lens-dock', d.offsetWidth, d.offsetHeight, 26);
    if (r) lens.build('lens-range', r.offsetWidth, r.offsetHeight, 22);
    if (t) lens.build('lens-theme', t.offsetWidth, t.offsetHeight, 22);
  }

  /* ---------------------------------------------------------------
     dock: scroll spy, plus a lens you can grab and drop on a section
     --------------------------------------------------------------- */
  var dock = (function () {
    var nav = $('.dock');
    if (!nav) return { spy: function () {} };
    var tabs = $$('a', nav);
    var targets = tabs.map(function (a) { return document.getElementById(a.hash.slice(1)); });
    var lensEl = $('.dock-lens', nav);
    var current = -1, spyQueued = false;

    function tabW() { return tabs[0].offsetWidth; }
    function place(x) { lensEl.style.setProperty('--lx', x.toFixed(1) + 'px'); }

    function setCurrent(i) {
      if (i === current) return;
      current = i;
      tabs.forEach(function (t, k) {
        if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      nav.classList.toggle('has-current', i >= 0);
      if (i >= 0 && !drag.on) place(i * tabW());
    }

    function spy() {
      if (spyQueued) return;
      spyQueued = true;
      requestAnimationFrame(function () {
        spyQueued = false;
        var line = window.innerHeight * 0.45, idx = -1;
        targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top <= line) idx = k; });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = targets.length - 1;
        setCurrent(idx);
      });
    }

    function go(i, push) {
      var t = targets[i];
      if (!t) return;
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      t.focus({ preventScroll: true });
      if (push && history.pushState) history.pushState(null, '', '#' + t.id);
    }

    tabs.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (drag.suppress) { e.preventDefault(); drag.suppress = false; return; }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(i, true);
      });
    });

    var drag = { on: false, armed: false, x0: 0, id: null, suppress: false, left: 0 };
    nav.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag.armed = true; drag.x0 = e.clientX; drag.id = e.pointerId;
      drag.left = nav.getBoundingClientRect().left + tabs[0].offsetLeft;
      if (!reduced) nav.classList.add('pressing');
    });
    nav.addEventListener('pointermove', function (e) {
      if (!drag.armed || e.pointerId !== drag.id) return;
      if (!drag.on && Math.abs(e.clientX - drag.x0) > 6) {
        drag.on = true;
        try { nav.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        nav.classList.add('dragging', 'has-current');
      }
      if (drag.on) {
        var w = tabW();
        place(clamp(e.clientX - drag.left - w / 2, 0, (tabs.length - 1) * w));
      }
    });
    function end(e) {
      if (!drag.armed || (e && e.pointerId !== drag.id)) return;
      drag.armed = false;
      nav.classList.remove('pressing');
      if (!drag.on) return;
      drag.on = false;
      nav.classList.remove('dragging');
      var w = tabW();
      var i = clamp(Math.round((e.clientX - drag.left - w / 2) / w), 0, tabs.length - 1);
      drag.suppress = true;
      setTimeout(function () { drag.suppress = false; }, 50);
      current = -1;
      setCurrent(i);
      go(i, true);
    }
    nav.addEventListener('pointerup', end);
    nav.addEventListener('pointercancel', function (e) {
      drag.armed = false; drag.on = false;
      nav.classList.remove('dragging', 'pressing');
      if (e.pointerId === drag.id) { var c = current; current = -1; setCurrent(c); }
    });
    nav.addEventListener('dragstart', function (e) { e.preventDefault(); });

    window.addEventListener('resize', function () {
      if (current >= 0) place(current * tabW());
      buildLenses();
    });
    spy();
    return { spy: spy };
  })();

  // same smooth hop for the header mark
  var home = $('.home');
  if (home) home.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (history.pushState) history.pushState(null, '', location.pathname + location.search);
  });

  /* ---------------------------------------------------------------
     split slider
     --------------------------------------------------------------- */
  (function slider() {
    var input = $('#split');
    var wrap = $('.range');
    if (!input || !wrap) return;
    function show(v) {
      wrap.style.setProperty('--val', (v / 2).toFixed(3));
      input.setAttribute('aria-valuetext', v === 0 ? 'off' : v.toFixed(2) + ' times');
    }
    input.value = String(disp);
    show(disp);
    input.addEventListener('input', function () {
      disp = clamp(parseFloat(input.value) || 0, 0, 2);
      root.style.setProperty('--disp', String(disp));
      show(disp);
      writeLight();
      prism.draw();
      store.set('gk-split', String(disp));
    });
  })();

  /* ---------------------------------------------------------------
     chromatic themes: prism (rgb), print (cmy), thermal (heat)
     --------------------------------------------------------------- */
  (function themes() {
    var radios = $$('.themes input[name="theme"]');
    var lensEl = $('.theme-lens');
    var nameEl = $('.theme-name');
    var metas = $$('meta[name="theme-color"]');
    var BG = { prism: '#0b0b0d', print: '#f4f1ea', thermal: '#0e0a09' };
    if (!radios.length) return;
    function show(name) {
      var i = 0;
      radios.forEach(function (r, k) { r.checked = r.value === name; if (r.checked) i = k; });
      if (lensEl) lensEl.style.setProperty('--tx', (i * 44) + 'px');
      if (nameEl) nameEl.textContent = name;
      metas.forEach(function (m) { m.setAttribute('content', BG[name] || BG.prism); });
    }
    show(root.getAttribute('data-theme') || 'prism');
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        root.setAttribute('data-theme', r.value);
        store.set('gk-theme', r.value);
        show(r.value);
        prism.paint();
        document.dispatchEvent(new CustomEvent('gk:theme', { detail: r.value }));
      });
    });
  })();

  (function motionToggle() {
    var btn = $('.motion');
    if (!btn) return;
    function set(paused, announce) {
      root.setAttribute('data-motion', paused ? 'paused' : 'on');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (announce) document.dispatchEvent(new CustomEvent('gk:motion', { detail: paused }));
    }
    set(store.get('gk-motion') === 'paused', false);
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('aria-pressed') !== 'true';
      store.set('gk-motion', paused ? 'paused' : 'on');
      set(paused, true);
    });
  })();

  /* ---------------------------------------------------------------
     copy the clone command
     --------------------------------------------------------------- */
  (function copy() {
    var btn = $('.copy'), code = $('#cmd-text'), status = $('.copy-status');
    if (!btn || !code || !status) return;
    var timer = 0;
    function say(msg, bad) {
      status.textContent = msg;
      status.classList.toggle('err', !!bad);
      clearTimeout(timer);
      timer = setTimeout(function () { status.textContent = ''; status.classList.remove('err'); }, bad ? 6000 : 2200);
    }
    function selectIt() {
      var range = document.createRange();
      range.selectNodeContents(code);
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
    }
    btn.addEventListener('click', function () {
      var text = code.textContent.trim();
      if (!navigator.clipboard || !window.isSecureContext) { selectIt(); say("couldn't copy, it's selected for you", true); return; }
      navigator.clipboard.writeText(text).then(function () { say('copied'); }, function () {
        selectIt(); say("couldn't copy, it's selected for you", true);
      });
    });
  })();

  /* ---------------------------------------------------------------
     lately on github: live, with loading / empty / error / success
     --------------------------------------------------------------- */
  (function feed() {
    var body = $('.feed-body');
    if (!body) return;
    var API = 'https://api.github.com/users/gkson-lab/repos?sort=pushed&direction=desc&per_page=8&type=owner';
    var KEY = 'gk-feed-v1';
    var TTL = 10 * 60 * 1000;
    var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) : null;
    var checkedAt = 0, ageTimer = 0;

    function ago(date) {
      var s = (date.getTime() - Date.now()) / 1000;
      var units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
      for (var i = 0; i < units.length; i++) {
        if (Math.abs(s) >= units[i][1] || units[i][0] === 'minute') {
          var v = Math.round(s / units[i][1]);
          if (units[i][0] === 'minute' && Math.abs(v) < 1) return 'just now';
          return rtf ? rtf.format(v, units[i][0]) : Math.abs(v) + ' ' + units[i][0] + 's ago';
        }
      }
      return 'just now';
    }
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    function loading() {
      body.setAttribute('aria-busy', 'true');
      body.innerHTML = '';
      var wrap = el('div', 'skel-wrap');
      wrap.appendChild(el('p', 'sr', 'loading what gk pushed lately'));
      for (var i = 0; i < 3; i++) {
        var row = el('div', 'skel-row');
        row.setAttribute('aria-hidden', 'true');
        row.appendChild(el('span', 'skel skel-a'));
        row.appendChild(el('span', 'skel skel-b'));
        wrap.appendChild(row);
      }
      body.appendChild(wrap);
    }

    function message(text, kind, withRetry) {
      body.removeAttribute('aria-busy');
      body.innerHTML = '';
      var box = el('div', 'feed-msg' + (kind ? ' ' + kind : ''));
      box.appendChild(el('p', null, text));
      if (withRetry) {
        var b = el('button', 'pill', 'try again');
        b.type = 'button';
        b.addEventListener('click', function () { load(true); });
        box.appendChild(b);
      }
      var more = el('p');
      var a = el('a', null, 'or see the repos on github');
      a.href = 'https://github.com/gkson-lab?tab=repositories';
      more.appendChild(a);
      box.appendChild(more);
      body.appendChild(box);
    }

    function render(repos) {
      body.removeAttribute('aria-busy');
      body.innerHTML = '';
      if (!repos.length) { message('nothing pushed lately. probably messing around offline.', 'empty', false); return; }
      var list = el('ol', 'feed-list');
      repos.slice(0, 5).forEach(function (r) {
        var li = el('li', 'feed-row');
        var name = String(r.name || '').toLowerCase();
        var title = el('p', 'ca ca-feed');
        title.setAttribute('data-text', name);
        var link = el('a', null, name);
        link.href = r.html_url;
        title.appendChild(link);
        li.appendChild(title);
        var when = el('p', 'feed-when');
        var time = el('time', null, 'pushed ' + ago(new Date(r.pushed_at)));
        time.setAttribute('datetime', r.pushed_at);
        when.appendChild(time);
        li.appendChild(when);
        var bits = [];
        if (r.description) bits.push(String(r.description).toLowerCase().trim());
        if (r.language) bits.push(String(r.language).toLowerCase());
        if (r.fork) bits.push('fork');
        if (bits.length) {
          var desc = el('p', 'feed-desc');
          bits.forEach(function (b, i) {
            if (i) { var dot = el('span', 'dot', '·'); dot.setAttribute('aria-hidden', 'true'); desc.appendChild(dot); }
            desc.appendChild(document.createTextNode(b));
          });
          li.appendChild(desc);
        }
        list.appendChild(li);
      });
      body.appendChild(list);
      var checked = el('p', 'feed-checked');
      body.appendChild(checked);
      function age() { checked.textContent = 'checked ' + ago(new Date(checkedAt)); }
      age();
      clearInterval(ageTimer);
      ageTimer = setInterval(age, 30000);
    }

    function load(force) {
      var cached = session.get(KEY);
      if (!force && cached && Date.now() - cached.t < TTL && Array.isArray(cached.repos)) {
        checkedAt = cached.t; render(cached.repos); return;
      }
      loading();
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timeout = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
      fetch(API, { headers: { Accept: 'application/vnd.github+json' }, signal: ctrl ? ctrl.signal : undefined })
        .then(function (res) {
          clearTimeout(timeout);
          if (res.status === 403 || res.status === 429) {
            var left = res.headers.get('x-ratelimit-remaining');
            var err = new Error(left === '0' || res.status === 429 ? 'rate' : 'http');
            throw err;
          }
          if (!res.ok) throw new Error('http');
          return res.json();
        })
        .then(function (data) {
          var repos = (Array.isArray(data) ? data : []).map(function (r) {
            return { name: r.name, html_url: r.html_url, pushed_at: r.pushed_at, description: r.description, language: r.language, fork: r.fork };
          });
          checkedAt = Date.now();
          session.set(KEY, { t: checkedAt, repos: repos });
          render(repos);
        })
        .catch(function (err) {
          clearTimeout(timeout);
          if (err && err.message === 'rate') message("github's rate limit says slow down. give it a few minutes, then try again.", 'err', true);
          else if (err && err.name === 'AbortError') message("github took too long to answer. try again in a sec.", 'err', true);
          else message("couldn't reach github just now. check your connection and try again.", 'err', true);
        });
    }

    load(false);
  })();

  /* ---------------------------------------------------------------
     boot
     --------------------------------------------------------------- */
  function onMotionChange(e) {
    reduced = e.matches;
    if (reduced) {
      light.tx = 0.82; light.ty = 0.28; light.boost = 0;
      $$('.ca[data-focus]').forEach(function (h) { h.classList.add('in'); });
      wake();
    }
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

  writeLight();
  buildLenses();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { buildLenses(); prism.draw(); });
})();
