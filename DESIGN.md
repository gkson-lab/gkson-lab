# gk design contract

local design contract for the gk-labs site, with a section about gk (`index.html`, `404.html`, `assets/`). it follows the antislop
template and overrides the global baseline `DESIGN.md` from the antislop harness. everything below is
design data: identity, palette, type, motion, states.

Mode: EDITORIAL (shader canvases follow the GAME & INTERACTIVE canvas rules for motion, see section 5)
Dial: ENERGY 4 / RHYTHM 5 / MOTION 3
(`prefers-reduced-motion: reduce` collapses motion to MOTION 1 in css and in js via `matchMedia`.)

## 1. context (audience, environment, purpose)

- **who it's for:** people who land on gk's github profile and want to see gk-labs (what gk makes) and who gk is.
- **where it lives:** github pages, served from the `gkson-lab/gkson-lab` profile repository. static files, no build step.
- **what it has to do:** open on gk-labs, then say who gk is in gk's own relaxed voice (no tagline under the
  name), point at the real projects, show what's being pushed right now, and be a little bit of a toy.

## 2. personality & "what we are not"

- **idea:** light through glass. the page is a prism. white light comes in, splits into its parts, and every
  piece of type carries that split. the parts come from the "unslop your ai designs" library videos gk picked:
  shader libraries (paper shaders' liquid metal logo, the vgpu prism), liquid glass (lens tabs, a glass slider
  and switch you lift into lenses), and chromatic splitting.
- **voice:** all lowercase, relaxed, first person, short sentences. no hype words, no em dashes.
- **not:** a saas landing page, a bento grid, a card wall, a "trusted by" bar, a fake stat row. no fluid or
  physics simulations, no cloud scenes. webgl only through paper shaders, always as decoration over real html.

### purpose of every technique (antislop r-31)

| technique | why it's here |
|---|---|
| rgb split on display type (3 layers, screen / multiply) | the identity. it's the prism split applied to letters. |
| 1px fringe on body text (`text-shadow`) | carries the split into the small type so the whole page reads as one optic. `split` slider at 0 removes it. |
| prism + spectrum svg in the hero | the core image; computed with snell's law and cauchy dispersion, so it reacts honestly to the light angle and the split amount. |
| three chromatic themes | the same light split three ways: additive (prism), subtractive (print), heat (thermal). each one changes the split channels, the spectrum and every shader. |
| liquid-glass dock, slider, theme picker | glass is for controls only. the lens marks the current section / value / theme and refracts what's under it. |
| liquid metal "gk-labs" (paper shaders) | the sign-off, straight from the liquid logo library. its red/blue channel shift is the split again. |
| cmyk halftone "gk-labs" (paper shaders, print theme) | in print the sign-off is screened into dots from three misregistered plates. |
| gem smoke "onyx" (paper shaders) | onyx is a stone, so the word becomes one, with the spectrum moving inside it. |
| fluted glass over the spectrum (paper shaders) | the tools band is white light seen through ribbed glass: glass and split in one piece. |
| paper texture (paper shaders, print theme) | print is ink on paper, so there is paper under it. tones stay between `#e6e1d5` and `#f4f1ea`. |
| lens distortion "404" (paper shaders) | the missing page, pulled apart by a stack of lenses. |
| pointer-driven fringe direction | the cursor is the light source; fringes point away from it. |
| scroll-driven fringe boost | the split widens with scroll speed and settles in under 300ms, like a lens moving. |
| heading "focus-in" on entry | headings arrive slightly out of focus and settle. nothing is ever hidden, opacity never goes to 0. |

## 3. color palette & measured contrast ratios

one brand color (white light / ink), one accent, neutrals, plus the **dispersion family** for each theme.
dispersion colors are only ever used for fringes, the prism, the spectrum and shaders, never for body text or
control fills. this is the declared exception to the 1+1 palette cap: the spectrum is the brand.

### prism (default when the system is dark) · additive

| role | token | value |
|---|---|---|
| canvas | `--bg` | `#0b0b0d` |
| glass | `--glass-solid` | `#1a1a1f` (62% on the dock) |
| text / muted | `--fg` / `--muted` | `#f3f1ec` / `#a6a3ab` |
| divider / control edge | `--line` / `--edge` | `#3a3a42` / `#7a7782` |
| accent / error | `--accent` / `--err` | `#8fd3ff` / `#ff8fa3` |
| split channels (screen) | `--ch-1/2/3` | `#ff3355` / `#33ff88` / `#3366ff` |

### print (default when the system is light) · subtractive

| role | token | value |
|---|---|---|
| canvas | `--bg` | `#f4f1ea`, paper texture down to `#e6e1d5` |
| glass | `--glass-solid` | `#e9e5db` (70% on the dock) |
| text / muted | `--fg` / `--muted` | `#141317` / `#57534c` |
| divider / control edge | `--line` / `--edge` | `#d8d2c4` / `#7d776b` |
| accent / error | `--accent` / `--err` | `#005f8f` / `#b3261e` |
| split channels (multiply) | `--ch-1/2/3` | `#00c8eb` / `#f0008c` / `#ffcd00` |

### thermal · the page through an infrared camera

| role | token | value |
|---|---|---|
| canvas | `--bg` | `#0e0a09` |
| glass | `--glass-solid` | `#1e1614` (62% on the dock) |
| text / muted | `--fg` / `--muted` | `#fff3e8` / `#c4a89b` |
| divider / control edge | `--line` / `--edge` | `#3d2e29` / `#8a7369` |
| accent / error | `--accent` / `--err` | `#ffb454` / `#ff8f8f` |
| split channels (screen) | `--ch-1/2/3` | `#ff1f5a` / `#ffe14d` / `#6b4dff` |
| spectrum | `--spectrum` | heat ramp `#2a0f5c` → `#5a1fd1` → `#b3127a` → `#ff2d55` → `#ff6a1a` → `#ffb000` → `#fff1a8` |

the prism and print channels overlap to exactly white (screen) or black (multiply): each channel owns one full
rgb component. thermal's core lands on a warm white. the letter core is always full contrast; only edges are colored.

### measured pairs (wcag 2.x relative luminance)

| pair | fg | bg | ratio | min |
|---|---|---|---|---|
| prism · text on canvas | `#f3f1ec` | `#0b0b0d` | 17.42:1 | 4.5:1 |
| prism · muted on canvas | `#a6a3ab` | `#0b0b0d` | 7.91:1 | 4.5:1 |
| prism · accent on canvas | `#8fd3ff` | `#0b0b0d` | 12.11:1 | 4.5:1 |
| prism · text on dock | `#f3f1ec` | `#1a1a1f` | 15.36:1 | 4.5:1 |
| prism · muted on dock | `#a6a3ab` | `#1a1a1f` | 6.97:1 | 4.5:1 |
| prism · accent on dock | `#8fd3ff` | `#1a1a1f` | 10.67:1 | 4.5:1 |
| prism · control edge on dock | `#7a7782` | `#1a1a1f` | 3.95:1 | 3:1 |
| prism · error on canvas | `#ff8fa3` | `#0b0b0d` | 9.09:1 | 4.5:1 |
| print · text on canvas | `#141317` | `#f4f1ea` | 16.40:1 | 4.5:1 |
| print · muted on canvas | `#57534c` | `#f4f1ea` | 6.78:1 | 4.5:1 |
| print · accent on canvas | `#005f8f` | `#f4f1ea` | 6.14:1 | 4.5:1 |
| print · text on darkest paper | `#141317` | `#e6e1d5` | 14.18:1 | 4.5:1 |
| print · muted on darkest paper | `#57534c` | `#e6e1d5` | 5.86:1 | 4.5:1 |
| print · accent on darkest paper | `#005f8f` | `#e6e1d5` | 5.31:1 | 4.5:1 |
| print · text on dock | `#141317` | `#e9e5db` | 14.71:1 | 4.5:1 |
| print · muted on dock | `#57534c` | `#e9e5db` | 6.08:1 | 4.5:1 |
| print · accent on dock | `#005f8f` | `#e9e5db` | 5.50:1 | 4.5:1 |
| print · control edge on dock | `#7d776b` | `#e9e5db` | 3.53:1 | 3:1 |
| print · error on canvas | `#b3261e` | `#f4f1ea` | 5.79:1 | 4.5:1 |
| thermal · text on canvas | `#fff3e8` | `#0e0a09` | 18.05:1 | 4.5:1 |
| thermal · muted on canvas | `#c4a89b` | `#0e0a09` | 8.84:1 | 4.5:1 |
| thermal · accent on canvas | `#ffb454` | `#0e0a09` | 11.17:1 | 4.5:1 |
| thermal · text on dock | `#fff3e8` | `#1e1614` | 16.30:1 | 4.5:1 |
| thermal · muted on dock | `#c4a89b` | `#1e1614` | 7.98:1 | 4.5:1 |
| thermal · accent on dock | `#ffb454` | `#1e1614` | 10.09:1 | 4.5:1 |
| thermal · control edge on dock | `#8a7369` | `#1e1614` | 4.01:1 | 3:1 |
| thermal · error on canvas | `#ff8f8f` | `#0e0a09` | 8.98:1 | 4.5:1 |

## 4. typography & touch targets

- **display:** instrument serif, regular and italic, lowercase only. self-hosted woff2, `font-display: swap`.
- **body + code:** recursive (variable), one file. body uses `CASL 1` (casual, the relaxed part) at `wght 400`.
  code lines use the same family at `MONO 1`. two families total. shaders draw their words in instrument serif
  too, so the shader type matches the html type.
- **scale:** hero wordmark "gk-labs" `clamp(4.25rem, 12.5vw, 13rem)` over body `1.0625rem` (ratio >= 4:1). section titles
  `clamp(2.75rem, 8vw, 6rem)`. smallest text `0.8125rem`.
- **case:** every word on the page is lowercase in the source. `text-transform: lowercase` is a backstop for
  live data from the github api.
- **touch:** every control is at least 44x44px (theme options 44x38 inside a 44px row).
- **radius:** two values. `999px` for every control (dock, tabs, lens, slider, theme picker, buttons). `0` for
  content. there are no content cards.
- **spacing:** 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.

## 5. project-specific workflows, canvas rules & states

- **the split knob:** `--disp` (0 to 2, default 1) is set by the `split` slider and saved in `localStorage`
  (wrapped in try/catch). `--disp-live` is `--disp` times the scroll boost. all fringes, the prism's
  dispersion and the slider fill read from these.
- **themes:** `data-theme` is `prism`, `print` or `thermal`, saved as `gk-theme`. the system setting picks
  prism or print the first time. changing it fires `gk:theme`, which repaints the prism and rebuilds the shaders.
- **shaders:** paper shaders `0.0.80` (apache-2.0) is vendored in `assets/vendor/` with its license and
  notice. every shader sits over real html: the onyx heading, the 404 heading and the tools list stay in the
  dom for readers and search, and each shader host keeps a css version that shows when webgl2 is missing or
  a shader fails. shaders mount lazily near the viewport and stop when off screen.
- **motion:** html motion is input driven and stops when the input stops. continuous loops exist only inside
  shader canvases (liquid metal, gem smoke). the header `pause` button stops them and is saved as
  `gk-motion`; `prefers-reduced-motion` stops them too, along with pointer-driven fringes, the scroll boost,
  focus-in and lens lift. static shaders (fluted glass, halftone, paper, lens) render once.
- **refraction:** lenses use `backdrop-filter: url(#lens-...)` with an svg displacement map that splits
  r, g and b by different amounts. only chromium renders svg backdrop filters, so other browsers get a plain
  frosted lens. nothing depends on the refraction to work.
- **live feed states ("lately on github"):**
  1. loading: three static skeleton rows, `aria-busy="true"`.
  2. empty: "nothing pushed lately. probably messing around offline."
  3. error: says what failed (network, timeout or github's rate limit) with a "try again" button.
  4. success: the list, plus "checked just now" that ages in place.
  5. default: the curated "in the lab" list is static html and never depends on the api.
- **copy button:** success says "copied", failure says "couldn't copy, it's selected for you" and selects the text.
