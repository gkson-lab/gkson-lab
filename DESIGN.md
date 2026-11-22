# gk design contract

local design contract for gk's about page (`index.html`, `404.html`, `assets/`). it follows the antislop
template and overrides the global baseline `DESIGN.md` from the antislop harness. everything below is
design data: identity, palette, type, motion, states.

Mode: EDITORIAL
Dial: ENERGY 4 / RHYTHM 5 / MOTION 3
(`prefers-reduced-motion: reduce` collapses motion to MOTION 1 in css and in js via `matchMedia`.)

## 1. context (audience, environment, purpose)

- **who it's for:** people who land on gk's github profile and want to know who gk is and what gk makes.
- **where it lives:** github pages, served from the `gkson-lab/gkson-lab` profile repository. static files, no build step.
- **what it has to do:** say who gk is in gk's own relaxed voice, point at the real projects, show what's being
  pushed right now, and be a little bit of a toy while doing it.

## 2. personality & "what we are not"

- **idea:** light through glass. the page is a prism. white light comes in, splits into its parts, and every
  piece of type carries that split. this comes from two short videos gk picked: a liquid-glass refraction ui
  (lens tabs, a glass slider and switch you lift into lenses) and a prism splitting a beam into a spectrum
  under a lowercase serif wordmark.
- **voice:** all lowercase, relaxed, first person, short sentences. no hype words, no em dashes.
- **not:** a saas landing page, a bento grid, a card wall, a "trusted by" bar, a fake stat row, a webgl
  simulation, a cloud scene. no webgl at all: everything is svg, css and plain dom. the only canvas is an
  offscreen 2d one that draws the lens displacement maps once.

### purpose of every technique (antislop r-31)

| technique | why it's here |
|---|---|
| rgb split on display type (3 layers, screen / multiply) | the identity. it's the prism split applied to letters. |
| 1px fringe on body text (`text-shadow`) | carries the split into the small type so the whole page reads as one optic. `split` slider at 0 removes it. |
| prism + spectrum svg in the hero | the core image of the idea; it's computed with snell's law and cauchy dispersion, so it reacts honestly to the light angle and the split amount. |
| liquid-glass dock with a refraction lens | the dock is an overlay; seeing the page through it keeps your place. the lens marks the current section and can be dragged between sections. |
| glass lens on the slider thumb and switch thumb | same lens component, so the controls feel like one set of glass. |
| spectrum gradient | only where the spectrum is the content: the prism output, the slider fill (how much light is split), the tools band, link underlines on hover. never as a section background. |
| liquid-metal "gk" mark in the footer | a sign-off. reacts to the pointer like a reflective surface; static under reduced motion. |
| pointer-driven fringe direction | the cursor is the light source; fringes point away from it. |
| scroll-driven fringe boost | the split widens with scroll speed and settles in under 300ms, like a lens moving. |
| heading "focus-in" on entry | headings arrive slightly out of focus and settle. nothing is ever hidden, opacity never goes to 0. |

## 3. color palette & measured contrast ratios

one brand color (white light / ink), one accent (sea-glass blue), neutrals, plus the **dispersion family**
(rgb channels in dark, cmy channels in light). dispersion colors are only ever used for fringes, the prism
and the spectrum, never for body text or control fills. this is the declared exception to the 1+1 palette cap:
the spectrum is the brand.

### dark (default when the system is dark)

| role | token | value |
|---|---|---|
| canvas | `--bg` | `#0b0b0d` |
| dock glass tint | `--glass` | `#1a1a1f` at 62% |
| text | `--fg` | `#f3f1ec` |
| muted text | `--muted` | `#a6a3ab` |
| divider (decorative) | `--line` | `#3a3a42` |
| control edge | `--edge` | `#7a7782` |
| accent (links, focus, active tab) | `--accent` | `#8fd3ff` |
| error text | `--err` | `#ff8fa3` |
| split channels (screen) | `--ch-1/2/3` | `#ff3355` / `#33ff88` / `#3366ff` |

### light (default when the system is light)

| role | token | value |
|---|---|---|
| canvas | `--bg` | `#f4f1ea` |
| dock glass tint | `--glass` | `#e9e5db` at 70% |
| text | `--fg` | `#141317` |
| muted text | `--muted` | `#57534c` |
| divider (decorative) | `--line` | `#d8d2c4` |
| control edge | `--edge` | `#7d776b` |
| accent | `--accent` | `#005f8f` |
| error text | `--err` | `#b3261e` |
| split channels (multiply) | `--ch-1/2/3` | `#00c8eb` / `#f0008c` / `#ffcd00` |

the split channels are chosen so that all three overlap to exactly white (screen) or exactly black (multiply):
each channel owns one full rgb component. the letter core is always full-contrast; only the edges are colored.

### measured pairs (wcag 2.x relative luminance)

| pair | fg | bg | ratio | min |
|---|---|---|---|---|
| dark · text on canvas | `#f3f1ec` | `#0b0b0d` | 17.42:1 | 4.5:1 |
| dark · muted on canvas | `#a6a3ab` | `#0b0b0d` | 7.91:1 | 4.5:1 |
| dark · accent on canvas | `#8fd3ff` | `#0b0b0d` | 12.11:1 | 4.5:1 |
| dark · text on dock | `#f3f1ec` | `#1a1a1f` | 15.36:1 | 4.5:1 |
| dark · muted on dock | `#a6a3ab` | `#1a1a1f` | 6.97:1 | 4.5:1 |
| dark · accent on dock | `#8fd3ff` | `#1a1a1f` | 10.67:1 | 4.5:1 |
| dark · control edge on dock | `#7a7782` | `#1a1a1f` | 3.95:1 | 3:1 |
| dark · error on canvas | `#ff8fa3` | `#0b0b0d` | 9.09:1 | 4.5:1 |
| light · text on canvas | `#141317` | `#f4f1ea` | 16.40:1 | 4.5:1 |
| light · muted on canvas | `#57534c` | `#f4f1ea` | 6.78:1 | 4.5:1 |
| light · accent on canvas | `#005f8f` | `#f4f1ea` | 6.14:1 | 4.5:1 |
| light · text on dock | `#141317` | `#e9e5db` | 14.71:1 | 4.5:1 |
| light · muted on dock | `#57534c` | `#e9e5db` | 6.08:1 | 4.5:1 |
| light · accent on dock | `#005f8f` | `#e9e5db` | 5.50:1 | 4.5:1 |
| light · control edge on dock | `#7d776b` | `#e9e5db` | 3.53:1 | 3:1 |
| light · error on canvas | `#b3261e` | `#f4f1ea` | 5.79:1 | 4.5:1 |

## 4. typography & touch targets

- **display:** instrument serif, regular and italic, lowercase only. self-hosted woff2, `font-display: swap`.
- **body + code:** recursive (variable), one file. body uses `CASL 1` (casual, the relaxed part) at `wght 400`.
  code lines use the same family at `MONO 1`. two families total.
- **scale:** hero wordmark `clamp(7rem, 26vw, 19rem)` over body `1.0625rem` (ratio > 6.5:1). section titles
  `clamp(2.75rem, 8vw, 6rem)`. smallest text `0.8125rem`.
- **case:** every word on the page is lowercase in the source. `text-transform: lowercase` is a backstop for
  live data from the github api.
- **touch:** every control is at least 44x44px. dock tabs are 44px tall with at least 44px width.
- **radius:** two values. `999px` for every control (dock, tabs, lens, slider, switch, buttons). `0` for content.
  there are no content cards.
- **spacing:** 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.

## 5. project-specific workflows, canvas rules & states

- **the split knob:** `--disp` (0 to 2, default 1) is set by the `split` slider and saved in `localStorage`
  (wrapped in try/catch). `--disp-live` is `--disp` times the scroll boost. all fringes, the prism's
  dispersion and the slider fill read from these.
- **refraction:** the lens uses `backdrop-filter: url(#lens-...)` with an svg displacement map that splits
  r, g and b by different amounts. only chromium renders svg backdrop filters, so other browsers get a plain
  frosted lens. nothing depends on the refraction to work.
- **motion:** every animation is driven by input (pointer, scroll, press) and stops when the input stops.
  no infinite loops. under reduced motion: no pointer-driven fringes, no scroll boost, no focus-in, no liquid
  ripple, no lens lift, prism fixed at its default angle. the split slider still works.
- **live feed states ("lately on github"):**
  1. loading: three static skeleton rows, `aria-busy="true"`.
  2. empty: "nothing pushed lately. probably messing around offline."
  3. error: says what failed (network or github's rate limit) with a "try again" button.
  4. success: the list, plus "checked just now" that ages in place.
  5. default: the curated "things i've made" list is static html and never depends on the api.
- **copy button:** success says "copied", failure says "couldn't copy, it's selected for you" and selects the text.
- **themes:** both ship and both pass the table above. the choice is saved; the system setting is the default.
