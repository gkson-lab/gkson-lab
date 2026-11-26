# stackdrop

pack-opening game for programming languages and tech companies. static files, no build step, lives at `/stackdrop/` on the gk-labs pages site.

- `data.js` holds every card, rarity weight, pack and achievement. add content there, not in `app.js`.
- limited packs: each has `win(now)` returning `{open, endsAt}` or `{open, opensAt}` on the viewer's local clock, and `cap` opens per window. the cap is keyed by `endsAt`, so it resets each window.
- pity: 40 pulls without a legendary+ forces one.
- state lives in `localStorage` key `stackdrop-v1`, always wrapped in try/catch. save codes are base64 json.
- follow `stackdrop/DESIGN.md` and the repo `DESIGN.md` (antislop): lowercase copy, no em dashes, no hype words, 44px targets, measured contrast, reduced motion kills animation.
- logos in `img/logos/` come from devicon 2.16.0 (mit, license alongside), pulled with `npm pack devicon`. logos are trademarks of their owners; this build is for private use. cards without a logo (lisp, assembly, cobol, limited) show a text glyph.
- card layout: rarity-colored frame, name + year, art window (generated background + logo tile), type line with rarity gems, three stat bars, flavor text, set number footer. sizes use `cqw` so cards scale.
- card backgrounds come from `art.js`: seeded svg per card id (code lines for languages, skylines for companies, clock rings for limited). no external or scraped images.
- variants (`D.variants`): base, holo, full art, gold, misprint, signed. rolled per pull, stored in `S.vars[id][variant]`. dupes are per variant; recycling pays `sell * mult`. signatures are scrawls generated from the card name, never a real person's signature.
