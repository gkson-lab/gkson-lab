// card pool. glyphs are text initials, never logos.
window.SD_DATA = (() => {
  const R = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
  const c = (id, name, set, rarity, hue, stat, line) => ({ id, name, set, rarity, hue, stat, line });
  const langs = [
    c('py','python','lang','common',210,'readability 92','indentation is a lifestyle.'),
    c('js','javascript','lang','common',50,'chaos 88','"1" + 1 is "11", deal with it.'),
    c('java','java','lang','common',20,'verbosity 95','factory factory factory.'),
    c('c','c','lang','common',220,'speed 97','segfault is a feeling.'),
    c('php','php','lang','common',240,'uptime 80','still runs half the web.'),
    c('rb','ruby','lang','common',0,'joy 90','made to make you happy.'),
    c('cs','c#','lang','rare',270,'tooling 91','java, but it went to therapy.'),
    c('go','go','lang','rare',190,'simplicity 94','if err != nil, forever.'),
    c('ts','typescript','lang','rare',205,'safety 89','javascript with a seatbelt.'),
    c('kt','kotlin','lang','rare',280,'nullsafety 92','java without the boilerplate.'),
    c('swift','swift','lang','rare',15,'polish 88','optional chaining all the way down.'),
    c('rs','rust','lang','epic',25,'memory 99','the borrow checker loves you.'),
    c('hs','haskell','lang','epic',265,'purity 100','a monad is just a monoid in...'),
    c('ex','elixir','lang','epic',285,'fault tol. 96','let it crash.'),
    c('zig','zig','lang','epic',35,'control 95','no hidden control flow.'),
    c('lisp','lisp','lang','legendary',120,'parens 100','(((((enlightenment)))))'),
    c('asm','assembly','lang','legendary',0,'metal 100','mov eax, everything.'),
    c('cobol','cobol','lang','mythic',45,'banks 100','your paycheck runs on this.'),
  ];
  const cos = [
    c('acme-cloud','nimbus cloud','co','common',200,'regions 34','it scales, eventually.'),
    c('bitbarn','bitbarn','co','common',140,'repos 9k','a home for your side projects.'),
    c('pixelmart','pixelmart','co','common',330,'skus 2m','sells everything, ships tuesday.'),
    c('ductape','ductape inc','co','common',30,'hotfixes 400','held together on purpose.'),
    c('loopback','loopback labs','co','common',170,'meetings 12/day','the standup never ends.'),
    c('kernelco','kernel & co','co','rare',100,'patches 77k','maintains the thing under the thing.'),
    c('quanta','quanta systems','co','rare',250,'qubits 64','both shipped and not shipped.'),
    c('vectorly','vectorly','co','rare',300,'embeddings 1b','everything is a vector now.'),
    c('hyperion','hyperion ai','co','epic',275,'params 2t','trained on your old blog.'),
    c('stackforge','stackforge','co','epic',15,'uptime 99.99','never deploys on fridays.'),
    c('monolith','monolith corp','co','legendary',0,'loc 40m','one repo to rule them all.'),
    c('garage','the garage','co','mythic',40,'founders 2','where it all started.'),
  ];
  // limited cards only drop from timed packs
  const limited = [
    c('nightowl','night owl dev','lim','epic',260,'commits 3am','ships while you sleep.'),
    c('nullptr','null pointer','lim','legendary',300,'crashes ∞','the billion dollar mistake.'),
    c('fridaydeploy','friday deploy','lim','legendary',10,'courage 100','what could go wrong.'),
    c('weekendhack','weekend hackathon','lim','epic',160,'pizza 14','built a startup in 48h.'),
    c('y2k','y2k bug','lim','mythic',50,'panic 1999','two digits were enough.'),
    c('lunchbreak','lunch break','lim','rare',90,'snacks 6','tabs vs spaces, over noodles.'),
    c('leapsec','leap second','lim','mythic',200,'drift 1s','time is a social construct.'),
  ];
  const all = [...langs, ...cos, ...limited];
  const byId = Object.fromEntries(all.map(x => [x.id, x]));
  const rarity = {
    common:    { w: 62,  sell: 5,   craft: 20,   label: 'common' },
    rare:      { w: 26,  sell: 15,  craft: 60,   label: 'rare' },
    epic:      { w: 9,   sell: 50,  craft: 200,  label: 'epic' },
    legendary: { w: 2.6, sell: 150, craft: 600,  label: 'legendary' },
    mythic:    { w: 0.4, sell: 500, craft: 2000, label: 'mythic' },
  };
  const H = 3600e3;
  // window(now) returns {open, endsAt|opensAt}. times are the viewer's local clock.
  const hours = (a, b) => now => {
    const d = new Date(now), h = d.getHours();
    const open = a < b ? h >= a && h < b : h >= a || h < b;
    const t = new Date(now); t.setMinutes(0, 0, 0);
    const step = x => { const r = new Date(t); while (r.getHours() !== x || r <= now) r.setTime(r.getTime() + H); return r.getTime(); };
    return open ? { open, endsAt: step(b) } : { open, opensAt: step(a) };
  };
  const days = (set, label) => now => {
    const d = new Date(now), open = set.includes(d.getDay());
    const r = new Date(now); r.setHours(0, 0, 0, 0);
    do r.setDate(r.getDate() + 1); while (set.includes(r.getDay()) === open);
    return open ? { open, endsAt: r.getTime() } : { open, opensAt: r.getTime() };
  };
  const month = (m, d1, d2) => now => {
    const d = new Date(now), y = d.getFullYear();
    const s = new Date(y, m, d1).getTime(), e = new Date(y, m, d2 + 1).getTime();
    if (now >= s && now < e) return { open: true, endsAt: e };
    return { open: false, opensAt: now < s ? s : new Date(y + 1, m, d1).getTime() };
  };
  const packs = [
    { id: 'lang', name: 'syntax pack', blurb: 'programming languages.', cost: 100, size: 5, pool: langs.map(x => x.id), hue: 210 },
    { id: 'co', name: 'startup pack', blurb: 'companies, big and small.', cost: 100, size: 5, pool: cos.map(x => x.id), hue: 25 },
    { id: 'mix', name: 'full stack pack', blurb: 'both sets. one guaranteed rare+.', cost: 220, size: 6, pool: [...langs, ...cos].map(x => x.id), guarantee: 'rare', hue: 290 },
    { id: 'night', name: 'night shift', blurb: 'only open 00:00 to 04:00.', cost: 150, size: 4, limited: true, cap: 5, win: hours(0, 4),
      pool: [...langs.map(x => x.id), 'nightowl', 'nullptr'], boost: 2, hue: 255 },
    { id: 'lunch', name: 'lunch rush', blurb: 'only open 12:00 to 14:00.', cost: 120, size: 4, limited: true, cap: 4, win: hours(12, 14),
      pool: [...cos.map(x => x.id), 'lunchbreak'], hue: 90 },
    { id: 'friday', name: 'yolo deploy', blurb: 'fridays only. bigger mythic odds.', cost: 300, size: 5, limited: true, cap: 3, win: days([5]),
      pool: [...langs, ...cos].map(x => x.id).concat(['fridaydeploy', 'nullptr']), boost: 3, hue: 10 },
    { id: 'weekend', name: 'hackathon crate', blurb: 'saturday and sunday.', cost: 200, size: 5, limited: true, cap: 6, win: days([0, 6]),
      pool: [...langs, ...cos].map(x => x.id).concat(['weekendhack']), guarantee: 'rare', hue: 160 },
    { id: 'y2k', name: 'millennium vault', blurb: 'dec 28 to jan 3. holds y2k and leap second.', cost: 500, size: 3, limited: true, cap: 2,
      win: now => { const a = month(11, 28, 31)(now); if (a.open) return a; const d = new Date(now);
        if (d.getMonth() === 0 && d.getDate() <= 3) return { open: true, endsAt: new Date(d.getFullYear(), 0, 4).getTime() }; return a; },
      pool: ['y2k', 'leapsec', 'cobol', 'asm', 'lisp', 'monolith', 'garage'], guarantee: 'legendary', hue: 50 },
  ];
  const achievements = [
    { id: 'first', name: 'hello world', desc: 'open your first pack.', test: s => s.stats.opened >= 1, reward: 50 },
    { id: 'ten', name: 'for loop', desc: 'open 10 packs.', test: s => s.stats.opened >= 10, reward: 150 },
    { id: 'fifty', name: 'while true', desc: 'open 50 packs.', test: s => s.stats.opened >= 50, reward: 500 },
    { id: 'leg', name: 'senior engineer', desc: 'pull a legendary.', test: s => all.some(x => x.rarity === 'legendary' && s.owned[x.id]), reward: 200 },
    { id: 'myth', name: 'principal', desc: 'pull a mythic.', test: s => all.some(x => x.rarity === 'mythic' && s.owned[x.id]), reward: 500 },
    { id: 'langset', name: 'polyglot', desc: 'own every language.', test: s => langs.every(x => s.owned[x.id]), reward: 1500 },
    { id: 'coset', name: 'conglomerate', desc: 'own every company.', test: s => cos.every(x => s.owned[x.id]), reward: 1500 },
    { id: 'limited', name: 'right place, right time', desc: 'own a limited card.', test: s => limited.some(x => s.owned[x.id]), reward: 300 },
    { id: 'streak7', name: 'green squares', desc: 'claim the daily 7 days in a row.', test: s => s.streak >= 7, reward: 700 },
  ];
  return { R, rarity, langs, cos, limited, all, byId, packs, achievements };
})();
