# stackdrop

pack-opening game for programming languages and made-up tech companies. static files, no build step, lives at `/stackdrop/` on the gk-labs pages site.

- `data.js` holds every card, rarity weight, pack and achievement. add content there, not in `app.js`.
- limited packs: each has `win(now)` returning `{open, endsAt}` or `{open, opensAt}` on the viewer's local clock, and `cap` opens per window. the cap is keyed by `endsAt`, so it resets each window.
- pity: 40 pulls without a legendary+ forces one.
- state lives in `localStorage` key `stackdrop-v1`, always wrapped in try/catch. save codes are base64 json.
- follow `stackdrop/DESIGN.md` and the repo `DESIGN.md` (antislop): lowercase copy, no em dashes, no hype words, 44px targets, measured contrast, reduced motion kills animation.
- card glyphs are text initials. never ship real company logos. company cards are fictional.
- card art comes from `art.js`: seeded svg per card id (code lines for languages, skylines for companies, clock rings for limited). no external or scraped images.
- variants (`D.variants`): base, holo, full art, gold, misprint, signed. rolled per pull, stored in `S.vars[id][variant]`. dupes are per variant; recycling pays `sell * mult`. signatures are scrawls generated from the card name, never a real person's signature.
