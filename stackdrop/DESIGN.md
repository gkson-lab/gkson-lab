# stackdrop design contract

inherits the gk-labs contract (`../DESIGN.md`, antislop template). overrides below.

Mode: GAME & INTERACTIVE
Dial: ENERGY 6 / RHYTHM 5 / MOTION 4 (`prefers-reduced-motion` drops to MOTION 1: no deal, flip, sheen or pop.)

## context
people opening packs for fun. one page, four tabs: packs, collection, progress, save.

## what we are not
not a casino. no fake scarcity timers that reset on reload, no paid currency, no flashing. timers are real local clock windows.

## technique purposes (r-31)
| technique | why |
|---|---|
| card flip | the reveal is the game; you choose when each card turns. |
| rarity border color | reads tier at a glance without the label. |
| mythic sheen | the one continuous loop, only on the rarest tier. |
| gold ring on limited packs | marks time-gated stock. grayscale when closed. |

## color
palette tokens match the parent contract (prism dark, print light). rarity colors: common = muted, rare = accent, epic `#c9a2ff` / `#6a2fb8`, legendary `#ffcf6b` / `#8a5a00`, mythic = err. all >= 4.5:1 on their canvas. card faces are always dark so card text uses fixed light values.

## type
instrument serif display, recursive body (CASL 1), mono axis for numbers. lowercase everywhere.

## states
- pack: affordable, too expensive (toast with the shortfall), limited closed (disabled, opens-in timer), sold out for window.
- collection: owned (count), missing (dashed outline), empty filter ("nothing matches those filters.").
- save copy: "save copied" or "couldn't copy, it's selected for you".
