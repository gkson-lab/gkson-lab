// card pool. glyphs are text initials, never logos.
window.SD_DATA = (() => {
  const R = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
  const c = (id, name, set, rarity, hue, stat, line) => ({ id, name, set, rarity, hue, stat, line, kind: 'limited · ' + stat, year: null, stats: [99, 99, 99], logo: null });
  // c(id, name, set, rarity, hue, year, kind, [stat1, stat2, stat3], flavor, logo file in img/logos)
  // language stats: speed / safety / joy. company stats: scale / shipping / hype.
  const k = (id, name, set, rarity, hue, year, kind, stats, line, logo) => ({ id, name, set, rarity, hue, year, kind, stats, line, logo, stat: kind });
  const L = (...a) => k(a[0], a[1], 'lang', ...a.slice(2));
  const C = (...a) => k(a[0], a[1], 'co', ...a.slice(2));
  const langs = [
    L('py','python','common',210,1991,'interpreted · general',[42,70,95],'indentation is a lifestyle.','python'),
    L('js','javascript','common',50,1995,'interpreted · web',[68,30,70],'"1" + 1 is "11". deal with it.','javascript'),
    L('java','java','common',20,1995,'compiled · jvm',[78,72,48],'factory factory factory.','java'),
    L('c','c','common',220,1972,'compiled · systems',[98,18,55],'segfault is a feeling.','c'),
    L('php','php','common',240,1995,'interpreted · web',[55,40,52],'still runs half the web.','php'),
    L('rb','ruby','common',0,1995,'interpreted · general',[40,60,96],'made to make you happy.','ruby'),
    L('bash','bash','common',120,1989,'shell · scripting',[50,12,40],'quote your variables.','bash'),
    L('lua','lua','common',235,1993,'embedded · scripting',[75,50,78],'arrays start at 1, fight me.','lua'),
    L('perl','perl','common',215,1987,'interpreted · text',[60,30,62],'write once, read never.','perl'),
    L('r','r','common',210,1993,'statistical',[45,50,60],'everything is a vector.','r'),
    L('ps','powershell','common',205,2006,'shell · objects',[48,55,50],'verb-noun all the way.','powershell'),
    L('vb','visual basic','common',260,1991,'compiled · rad',[50,45,40],'on error resume next.','visualbasic'),
    L('cs','c#','rare',270,2000,'compiled · .net',[85,82,74],'java, but it went to therapy.','csharp'),
    L('go','go','rare',190,2009,'compiled · systems',[88,75,70],'if err != nil, forever.','go'),
    L('ts','typescript','rare',205,2012,'transpiled · web',[68,80,82],'javascript with a seatbelt.','typescript'),
    L('kt','kotlin','rare',280,2011,'compiled · jvm',[80,85,86],'java minus the boilerplate.','kotlin'),
    L('swift','swift','rare',15,2014,'compiled · apple',[86,84,80],'optional chaining all the way down.','swift'),
    L('cpp','c++','rare',215,1985,'compiled · systems',[99,25,45],'you only pay for what you use. and then some.','cplusplus'),
    L('dart','dart','rare',195,2011,'compiled · ui',[78,78,76],'hot reload hits different.','dart'),
    L('scala','scala','rare',0,2004,'compiled · jvm',[80,82,64],'implicits, everywhere, implicitly.','scala'),
    L('objc','objective-c','rare',210,1984,'compiled · apple',[84,40,35],'[[[brackets alloc] init] autorelease].','objectivec'),
    L('jl','julia','rare',285,2012,'jit · scientific',[94,70,80],'looks like python, runs like c.','julia'),
    L('rs','rust','epic',25,2015,'compiled · systems',[98,99,84],'the borrow checker loves you.','rust'),
    L('hs','haskell','epic',265,1990,'pure · functional',[80,98,70],'a monad is just a monoid in the category of...','haskell'),
    L('ex','elixir','epic',285,2012,'beam · functional',[70,85,92],'let it crash.','elixir'),
    L('zig','zig','epic',35,2016,'compiled · systems',[97,80,82],'no hidden control flow.','zig'),
    L('erl','erlang','epic',345,1986,'beam · telecom',[68,90,60],'nine nines of uptime.','erlang'),
    L('ocaml','ocaml','epic',25,1996,'compiled · functional',[86,94,74],'types so good they infer themselves.','ocaml'),
    L('fs','f#','epic',200,2005,'compiled · functional',[82,92,78],'pipes all the way |>.','fsharp'),
    L('clj','clojure','epic',140,2007,'jvm · lisp',[72,80,86],'data is the api.','clojure'),
    L('elm','elm','epic',200,2012,'transpiled · web',[66,99,85],'no runtime exceptions. none.','elm'),
    L('nim','nim','epic',45,2008,'compiled · general',[92,78,84],'python looks, c speed.','nim'),
    L('sol','solidity','epic',230,2014,'compiled · chain',[40,20,50],'every bug has a price tag.','solidity'),
    L('lisp','lisp','legendary',120,1958,'interpreted · lisp',[60,70,99],'(((((enlightenment)))))',null),
    L('asm','assembly','legendary',0,1949,'machine · metal',[100,5,30],'mov eax, everything.',null),
    L('fortran','fortran','legendary',270,1957,'compiled · numeric',[96,50,40],'still crunching your weather forecast.','fortran'),
    L('crystal','crystal','legendary',0,2014,'compiled · general',[90,82,94],'ruby syntax, native speed.','crystal'),
    L('apl','apl','legendary',180,1966,'array · symbolic',[85,60,70],'⍝ one line, one universe.','apl'),
    L('prolog','prolog','legendary',30,1972,'logic',[40,70,74],'ask and it shall unify.','prolog'),
    L('cobol','cobol','mythic',45,1959,'compiled · business',[70,80,20],'your paycheck runs on this.',null),
  ];
  const cos = [
    C('ubuntu','canonical','common',20,2004,'company · linux',[70,72,60],'linux for human beings.','ubuntu'),
    C('heroku','heroku','common',265,2007,'company · paas',[55,60,58],'git push heroku main.','heroku'),
    C('do','digitalocean','common',210,2011,'company · cloud',[60,70,62],'droplets for everyone.','digitalocean'),
    C('netlify','netlify','common',175,2014,'company · hosting',[58,80,70],'drag a folder, get a site.','netlify'),
    C('slack','slack','common',300,2013,'company · chat',[80,65,72],'this meeting could have been a thread.','slack'),
    C('rpi','raspberry pi','common',340,2012,'foundation · hardware',[66,70,88],'a whole computer for pocket money.','raspberrypi'),
    C('redhat','red hat','common',0,1993,'company · enterprise',[78,70,50],'open source, with a support contract.','redhat'),
    C('gitlab','gitlab','common',20,2011,'company · devops',[70,78,62],'the whole pipeline in one place.','gitlab'),
    C('docker','docker','rare',205,2013,'company · containers',[86,75,82],'works on my machine, now ships the machine.','docker'),
    C('figma','figma','rare',15,2012,'company · design',[80,86,90],'multiplayer for the design file.','figma'),
    C('vercel','vercel','rare',0,2015,'company · frontend',[72,92,88],'develop, preview, ship.','vercel'),
    C('cf','cloudflare','rare',28,2009,'company · network',[96,84,74],'sits in front of a lot of the internet.','cloudflare'),
    C('jb','jetbrains','rare',300,2000,'company · tools',[74,82,80],'an ide for every language you own.','jetbrains'),
    C('unity','unity','rare',0,2004,'company · engine',[84,70,62],'build once, ship to everything.','unity'),
    C('mozilla','mozilla','rare',20,1998,'foundation · web',[70,66,76],'keeps the web open.','firefox'),
    C('oracle','oracle','epic',0,1977,'company · database',[94,55,40],'the database under the database.','oracle'),
    C('sf','salesforce','epic',200,1999,'company · crm',[90,70,66],'no software, they said.','salesforce'),
    C('epic','epic games','epic',0,1991,'company · engine',[88,78,90],'unreal by name.','unrealengine'),
    C('gh','github','epic',260,2008,'company · code',[96,88,92],'where the commits live.','github'),
    C('meta','meta','epic',215,2004,'company · social',[99,80,70],'move fast.','facebook'),
    C('aws','amazon web services','legendary',32,2006,'company · cloud',[100,92,80],'us-east-1 is the internet.','amazonwebservices'),
    C('ms','microsoft','legendary',200,1975,'company · platform',[100,88,78],'developers, developers, developers.','windows11'),
    C('google','google','legendary',140,1998,'company · search',[100,90,86],'started as a research project.','google'),
    C('apple','apple','mythic',0,1976,'company · hardware',[98,84,99],'one more thing.','apple'),
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
      pool: ['y2k', 'leapsec', 'cobol', 'asm', 'lisp', 'fortran', 'apple'], guarantee: 'legendary', hue: 50 },
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
    { id: 'holo', name: 'shiny', desc: 'pull a holo.', test: s => Object.values(s.vars || {}).some(v => v.holo), reward: 100 },
    { id: 'sig', name: 'autograph', desc: 'pull a signed card.', test: s => Object.values(s.vars || {}).some(v => v.sig), reward: 800 },
    { id: 'master', name: 'master set', desc: 'own every variant of one card.', test: s => Object.values(s.vars || {}).some(v => variants.every(x => v[x.id])), reward: 3000 },
    { id: 'streak7', name: 'green squares', desc: 'claim the daily 7 days in a row.', test: s => s.streak >= 7, reward: 700 },
  ];
  // variants roll on top of every pull. odds in percent, mult scales recycle value.
  const variants = [
    { id: 'base', label: 'base', odds: 78, mult: 1 },
    { id: 'holo', label: 'holo', odds: 12, mult: 2 },
    { id: 'full', label: 'full art', odds: 5, mult: 3 },
    { id: 'gold', label: 'gold', odds: 2.5, mult: 5 },
    { id: 'glitch', label: 'misprint', odds: 1.5, mult: 6 },
    { id: 'sig', label: 'signed', odds: 1, mult: 10 },
  ];
  return { variants, R, rarity, langs, cos, limited, all, byId, packs, achievements };
})();
