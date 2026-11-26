(() => {
  const D = window.SD_DATA, KEY = 'stackdrop-v1', PITY = 40, ORDER = ['common','rare','epic','legendary','mythic'];
  const $ = s => document.querySelector(s), el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const fresh = () => ({ coins: 500, bits: 0, owned: {}, stats: { opened: 0, pulls: 0, best: 'common' }, pity: 0,
    lastDaily: 0, streak: 0, vars: {}, limitedUse: {}, ach: {}, history: [], seen: {} });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch { S = fresh(); }
  for (const [id, k] of Object.entries(S.owned)) if (!S.vars[id]) S.vars[id] = { base: k };
  const VORDER = D.variants.map(v => v.id), vmeta = id => D.variants.find(v => v.id === id);
  const rollVariant = () => { let x = rnd() * 100; for (const v of D.variants) { x -= v.odds; if (x <= 0) return v.id; } return 'base'; };
  const bestVar = id => VORDER.slice().reverse().find(v => S.vars[id]?.[v]) || 'base';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const rnd = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  const rank = r => ORDER.indexOf(r);
  const fmt = n => n.toLocaleString('en-US');
  const left = ms => { const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m ${s % 60}s`; };
  const toast = msg => { const t = el('div', 'toast', msg); $('#toasts').append(t); setTimeout(() => t.remove(), 3200); };

  // limited window key: one cap per window, so reopening resets it
  const winKey = (p, w) => `${p.id}:${w.endsAt}`;
  const usesLeft = p => { const w = p.win(Date.now()); return w.open ? p.cap - (S.limitedUse[winKey(p, w)] || 0) : 0; };

  function pull(pack, floor) {
    const pool = pack.pool.map(id => D.byId[id]);
    const ok = pool.filter(c => rank(c.rarity) >= rank(floor || 'common'));
    const weight = c => D.rarity[c.rarity].w * (c.set === 'lim' ? 3 : 1) * (pack.boost && rank(c.rarity) >= 3 ? pack.boost : 1);
    const total = ok.reduce((a, c) => a + weight(c), 0);
    let x = rnd() * total;
    for (const c of ok) { x -= weight(c); if (x <= 0) return c; }
    return ok[ok.length - 1];
  }

  function open(pack) {
    if (S.coins < pack.cost) return toast(`need ${fmt(pack.cost - S.coins)} more coins.`);
    if (pack.limited && usesLeft(pack) <= 0) return toast(pack.win(Date.now()).open ? 'sold out for this window.' : 'this pack is closed right now.');
    S.coins -= pack.cost;
    if (pack.limited) { const k = winKey(pack, pack.win(Date.now())); S.limitedUse[k] = (S.limitedUse[k] || 0) + 1; }
    const cards = [];
    for (let i = 0; i < pack.size; i++) {
      let floor = i === pack.size - 1 ? pack.guarantee : null;
      if (S.pity + 1 >= PITY) floor = 'legendary';
      const c = pull(pack, floor);
      S.pity = rank(c.rarity) >= 3 ? 0 : S.pity + 1;
      const v = rollVariant(), vs = S.vars[c.id] = S.vars[c.id] || {};
      const dupe = !!vs[v]; vs[v] = (vs[v] || 0) + 1;
      S.owned[c.id] = (S.owned[c.id] || 0) + 1;
      if (rank(c.rarity) > rank(S.stats.best)) S.stats.best = c.rarity;
      cards.push({ c, dupe, v });
    }
    S.stats.opened++; S.stats.pulls += cards.length;
    S.history.unshift({ t: Date.now(), pack: pack.name, ids: cards.map(x => x.c.id) }); S.history.length = Math.min(S.history.length, 30);
    save(); checkAch(); render(); reveal(cards, pack);
  }

  const sigPath = name => { // a scrawl drawn from the letters of the name, not anyone's real signature
    let d = 'M8 30', x = 8; for (const ch of name.replace(/\s/g, '')) { const k = ch.charCodeAt(0); x += 9;
      d += ` q ${4 + k % 5} ${-(10 + k % 14)} 9 ${(k % 7) - 2}`; }
    return `<svg class="sig" viewBox="0 0 ${x + 30} 44" aria-hidden="true"><path d="${d} l 18 -6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  const STAT = { lang: ['speed', 'safety', 'joy'], co: ['scale', 'shipping', 'hype'], lim: ['luck', 'timing', 'lore'] };
  const setList = id => D.all.filter(x => x.set === id), num = c => { const l = setList(c.set); return `${String(l.indexOf(c) + 1).padStart(3, '0')}/${String(l.length).padStart(3, '0')}`; };
  function cardEl(c, count, v = 'base') {
    const e = el('div', `card r-${c.rarity} v-${v}${c.set === 'lim' ? ' lim' : ''}`);
    e.style.setProperty('--h', c.hue);
    const gems = '◆'.repeat(rank(c.rarity) + 1) + '◇'.repeat(4 - rank(c.rarity));
    const glyph = c.name.replace(/[^a-z#+]/g, '').slice(0, 4);
    const centre = c.logo ? `<img class="logo" src="img/logos/${c.logo}.svg" alt="" loading="lazy" decoding="async">` : `<span class="glyph">${glyph}</span>`;
    const stats = c.stats.map((n, i) => `<li><span>${STAT[c.set][i]}</span><i style="--n:${n}"></i><b>${n}</b></li>`).join('');
    e.innerHTML = `<div class="frame">
      <header class="cap"><span class="nm">${c.name}</span>${c.year ? `<span class="yr">${c.year}</span>` : ''}</header>
      <div class="art"><div class="bg">${window.SD_ART(c)}</div>${v === 'glitch' ? `<div class="bg ghost">${window.SD_ART(c)}</div>` : ''}${centre}<div class="foil"></div>
        ${v === 'sig' ? sigPath(c.name) : ''}</div>
      <div class="type"><span>${c.kind}</span><span class="gems" title="${c.rarity}">${gems}</span></div>
      <ul class="stats">${stats}</ul>
      <p class="ln">${c.line}</p>
      <footer class="foot"><span>${c.set === 'lim' ? 'limited' : c.set === 'lang' ? 'syntax' : 'startup'} ${num(c)}</span><span>${c.rarity}${v === 'base' ? '' : ' · ' + vmeta(v).label}</span></footer>
    </div>${count > 1 ? `<span class="ct">x${count}</span>` : ''}`;
    return e;
  }

  function reveal(cards, pack) {
    const dlg = $('#reveal'), row = $('#reveal-row'); row.innerHTML = '';
    $('#reveal-title').textContent = pack.name;
    cards.sort((a, b) => rank(a.c.rarity) - rank(b.c.rarity) || VORDER.indexOf(a.v) - VORDER.indexOf(b.v));
    cards.forEach(({ c, dupe, v }, i) => {
      const w = el('button', 'flip'); w.type = 'button'; w.setAttribute('aria-label', 'flip card');
      const back = el('div', 'back', '<span>stackdrop</span>'), front = cardEl(c, 0, v);
      if (dupe) front.append(el('span', 'dupe', 'dupe'));
      if (!dupe) front.append(el('span', 'new', 'new'));
      w.append(back, front);
      w.onclick = () => { w.classList.add('on'); w.setAttribute('aria-label', `${c.rarity} ${vmeta(v).label} ${c.name}`); if (v !== 'base') toast(`${vmeta(v).label} ${c.name}!`); };
      w.style.setProperty('--i', i); row.append(w);
    });
    $('#reveal-all').onclick = () => row.querySelectorAll('.flip').forEach((f, i) => setTimeout(() => f.click(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : i * 140));
    dlg.showModal();
  }

  function daily() {
    const today = new Date().toDateString(), last = S.lastDaily ? new Date(S.lastDaily).toDateString() : '';
    if (today === last) return toast('already claimed today.');
    const yest = new Date(Date.now() - 864e5).toDateString();
    S.streak = last === yest ? S.streak + 1 : 1;
    const amt = 150 + Math.min(S.streak, 7) * 50;
    S.coins += amt; S.lastDaily = Date.now(); save(); checkAch(); render(); toast(`+${amt} coins. streak ${S.streak}.`);
  }

  let commits = 0;
  function commit(e) {
    commits++; S.coins += 2; if (commits % 25 === 0) { S.coins += 20; toast('25 commits. +20 bonus.'); }
    save(); renderTop();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const p = el('span', 'pop', '+2'); p.style.left = (e.offsetX || 40) + 'px'; e.currentTarget.append(p); setTimeout(() => p.remove(), 700);
    }
  }

  function sellDupes() {
    let n = 0, got = 0;
    for (const [id, vs] of Object.entries(S.vars)) {
      for (const [v, k] of Object.entries(vs)) if (k > 1) { got += D.rarity[D.byId[id].rarity].sell * vmeta(v).mult * (k - 1); n += k - 1; vs[v] = 1; }
      S.owned[id] = Object.values(vs).reduce((a, b) => a + b, 0);
    }
    if (!n) return toast('no dupes to recycle.');
    S.bits += got; save(); render(); toast(`recycled ${n} dupes into ${fmt(got)} bits.`);
  }
  function craft(c) {
    const cost = D.rarity[c.rarity].craft;
    if (S.bits < cost) return toast(`need ${fmt(cost - S.bits)} more bits.`);
    S.bits -= cost; S.owned[c.id] = (S.owned[c.id] || 0) + 1; S.vars[c.id] = S.vars[c.id] || {}; S.vars[c.id].base = (S.vars[c.id].base || 0) + 1; save(); checkAch(); render(); toast(`crafted ${c.name}.`);
  }
  function checkAch() {
    for (const a of D.achievements) if (!S.ach[a.id] && a.test(S)) { S.ach[a.id] = Date.now(); S.coins += a.reward; toast(`achievement: ${a.name}. +${a.reward}`); }
    save();
  }

  // render
  const renderTop = () => { $('#coins').textContent = fmt(S.coins); $('#bits').textContent = fmt(S.bits); $('#pity').textContent = `${PITY - S.pity}`; };
  function renderPacks() {
    const list = $('#packs'); list.innerHTML = '';
    for (const p of D.packs) {
      const w = p.limited ? p.win(Date.now()) : null, li = el('li', `pack${p.limited ? ' limited' : ''}${w && !w.open ? ' closed' : ''}`);
      li.style.setProperty('--h', p.hue);
      const odds = ORDER.map(r => { const ws = p.pool.map(id => D.byId[id]).filter(c => c.rarity === r).length; return ws ? r : null; }).filter(Boolean).join(' / ');
      li.innerHTML = `<div class="pk-art"><span>${p.size}</span></div><div class="pk-body"><h3>${p.name}</h3><p>${p.blurb}</p>
        <p class="meta">${p.size} cards · ${odds}${p.guarantee ? ` · ${p.guarantee}+ guaranteed` : ''}${p.boost ? ` · x${p.boost} legendary odds` : ''}</p>
        ${p.limited ? `<p class="timer" data-pack="${p.id}"></p>` : ''}</div>`;
      const b = el('button', 'btn', `open · ${p.cost}`); b.type = 'button'; b.onclick = () => open(p);
      if (w && !w.open) b.disabled = true;
      li.querySelector('.pk-body').append(b); list.append(li);
    }
    tick();
  }
  function tick() {
    document.querySelectorAll('.timer').forEach(t => {
      const p = D.packs.find(x => x.id === t.dataset.pack), w = p.win(Date.now());
      t.textContent = w.open ? `open · ${usesLeft(p)}/${p.cap} left · closes in ${left(w.endsAt - Date.now())}` : `opens in ${left(w.opensAt - Date.now())}`;
      if (w.open !== !t.closest('.pack').classList.contains('closed')) renderPacks();
    });
    const last = S.lastDaily ? new Date(S.lastDaily).toDateString() : '';
    const b = $('#daily'), done = last === new Date().toDateString();
    b.disabled = done;
    if (done) { const m = new Date(); m.setHours(24, 0, 0, 0); b.textContent = `next daily in ${left(m - Date.now())}`; } else b.textContent = 'claim daily';
  }
  function renderCollection() {
    const g = $('#grid'); g.innerHTML = '';
    const fv = $('#f-var').value, set = $('#f-set').value, rar = $('#f-rar').value, own = $('#f-own').value;
    const list = D.all.filter(c => (set === 'all' || c.set === set) && (rar === 'all' || c.rarity === rar) &&
      (own === 'all' || (own === 'have' ? S.owned[c.id] : !S.owned[c.id])) && (fv === 'all' || S.vars[c.id]?.[fv]));
    for (const c of list) {
      const k = S.owned[c.id] || 0, wrap = el('div', 'slot');
      if (k) {
        let cur = fv !== 'all' ? fv : bestVar(c.id); wrap.append(cardEl(c, k, cur));
        const chips = el('div', 'chips');
        for (const v of VORDER) { const has = S.vars[c.id]?.[v]; const b = el('button', `chip${v === cur ? ' on' : ''}`, vmeta(v).label); b.type = 'button';
          b.disabled = !has; b.title = has ? `x${has}` : 'not owned';
          b.onclick = () => { cur = v; wrap.firstChild.replaceWith(cardEl(c, k, v)); chips.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); };
          chips.append(b); }
        wrap.append(chips);
      }
      else { const m = el('div', 'card missing', `<span class="tier">${c.rarity}</span><span class="glyph">?</span><span class="nm">${c.set === 'lim' ? 'limited' : 'not found'}</span>`); wrap.append(m); }
      if (c.set !== 'lim') { const b = el('button', 'btn sm', `craft · ${D.rarity[c.rarity].craft} bits`); b.type = 'button'; b.onclick = () => craft(c); wrap.append(b); }
      g.append(wrap);
    }
    if (!list.length) g.append(el('p', 'empty', 'nothing matches those filters.'));
    const pct = (arr) => Math.round(arr.filter(c => S.owned[c.id]).length / arr.length * 100);
    $('#progress').innerHTML = `<span>languages ${pct(D.langs)}%</span><span>companies ${pct(D.cos)}%</span><span>limited ${pct(D.limited)}%</span>`;
  }
  function renderAch() {
    const ul = $('#ach'); ul.innerHTML = '';
    for (const a of D.achievements) ul.append(el('li', S.ach[a.id] ? 'done' : '', `<b>${a.name}</b><span>${a.desc}</span><em>${S.ach[a.id] ? 'done' : `+${a.reward}`}</em>`));
    const h = $('#hist'); h.innerHTML = S.history.length ? '' : '<li class="empty">no packs opened yet.</li>';
    for (const x of S.history.slice(0, 12)) h.append(el('li', '', `<b>${x.pack}</b><span>${x.ids.map(id => `<i class="r-${D.byId[id].rarity}">${D.byId[id].name}</i>`).join(', ')}</span>`));
    $('#stats').innerHTML = `<span>${fmt(S.stats.opened)} packs</span><span>${fmt(S.stats.pulls)} cards pulled</span><span>best: ${S.stats.best}</span><span>streak ${S.streak}</span>`;
  }
  function render() { renderTop(); renderPacks(); renderCollection(); renderAch(); }

  // tabs
  document.querySelectorAll('[role=tab]').forEach(t => t.onclick = () => {
    document.querySelectorAll('[role=tab]').forEach(x => x.setAttribute('aria-selected', x === t));
    document.querySelectorAll('[role=tabpanel]').forEach(p => p.hidden = p.id !== t.getAttribute('aria-controls'));
  });
  ['#f-set', '#f-rar', '#f-own', '#f-var'].forEach(s => $(s).onchange = renderCollection);
  $('#daily').onclick = daily; $('#commit').onclick = commit; $('#recycle').onclick = sellDupes;
  $('#reveal-close').onclick = () => $('#reveal').close();
  $('#export').onclick = async () => { const code = btoa(JSON.stringify(S));
    try { await navigator.clipboard.writeText(code); toast('save copied.'); } catch { $('#io').value = code; $('#io').select(); toast("couldn't copy, it's selected for you."); } };
  $('#import').onclick = () => { try { const v = JSON.parse(atob($('#io').value.trim())); if (!v.owned) throw 0; S = Object.assign(fresh(), v); save(); render(); toast('save loaded.'); } catch { toast('that save code is broken.'); } };
  $('#reset').onclick = () => { if (confirm('wipe everything?')) { S = fresh(); save(); render(); } };
  const CODES = { helloworld: 200, segfault: 300, rtfm: 150 };
  $('#redeem').onclick = () => { const k = $('#code').value.trim().toLowerCase().replace(/\s/g, '');
    if (!CODES[k]) return toast('unknown code.'); S.seen = S.seen || {}; if (S.seen[k]) return toast('already redeemed.');
    S.seen[k] = 1; S.coins += CODES[k]; save(); renderTop(); toast(`+${CODES[k]} coins.`); };

  // foil follows the pointer on holo, gold, full art and signed cards
  document.addEventListener('pointermove', e => {
    const c = e.target.closest?.('.card:not(.v-base)'); if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const b = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - b.left) / b.width); c.style.setProperty('--my', (e.clientY - b.top) / b.height);
  });
  render(); setInterval(tick, 1000);
})();
