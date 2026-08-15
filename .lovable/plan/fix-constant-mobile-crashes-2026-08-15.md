# Fix constant mobile crashes

The phone browser kills the tab from resource pressure at load — not a code bug. No JS errors exist anywhere (runtime, console, network, server logs all clean; desktop phone-emulation runs fine). The crash is the app's memory/CPU footprint on real mobile hardware.

## What happens at load on a phone today

- `warmSpritePool()` force-decodes **all 46 sprites + all 4 sky backgrounds** in the first ~2 seconds: ~170 MB of decoded bitmaps, most never shown (a generated system uses ~20 sprites and 1 sky).
- The sky is a 2048×2048 JPEG (16 MB decoded) even on a 390px screen.
- The starfield canvas runs a 2048×2048 backing store (16 MB) redrawn at 60fps with ~490 draw calls per frame.
- The orbit clock re-renders the entire world tree in React at 60fps.

Desktop shrugs this off; phones don't — the tab dies right after load, "constantly".

## Changes (all gated to small screens — desktop stays pixel-identical)

**1. Skip the full sprite-pool warm on phones** (`SolarSystem.tsx`, `GeneratorSystem.tsx`)
- Only call `warmSpritePool()` when `window.innerWidth >= 640`.
- On phones, sprites load naturally via the `<img>` tags already in the DOM, and the "New system" warp still pre-decodes exactly the next system's sprites via the existing `ensureSpritesReady()` — swaps stay smooth.
- Cuts ~150 MB of decodes at load.

**2. Phone-sized sky backgrounds** (`backgrounds.ts`, both system components)
- Generate 1280×1280 variants of the 4 skies (covers dpr-3 phones at 390px) with ImageMagick.
- Serve via `srcSet`/`sizes="100vw"` on the existing sky `<img>`: phones decode 6.5 MB instead of 16 MB; desktop keeps the 2048 original.
- Palette switching unchanged (same URLs, browser picks per device).

**3. Starfield diet on coarse pointers** (`Starfield.tsx`)
- Cap the backing store at 1024² on coarse pointers (4 MB vs 16 MB).
- Roughly halve object counts (dots 420→240, sparkles 32→20, spirals 8→5, comet rate halved). Density still reads rich on a small screen.

**4. 30fps orbit clock on phones** (`SolarSystem.tsx`, `GeneratorSystem.tsx`)
- In the existing rAF loop, skip the `setT` state update until ≥33ms have elapsed on small screens.
- Orbits are already ultra-slow by design, so 30fps is visually indistinguishable; halves the main-thread React work. Camera chase-cam and drag stay responsive (they read `t`, which still updates at 30fps).

## Verification

- Playwright at 390×844 on both routes: no errors, world renders, warp still pre-paints sprites, pinch/drag/double-tap work.
- Confirm via instrumented run that phones no longer decode the full pool at load.
- Desktop screenshot spot-check: zero visual change.
- Final check needs your actual phone — if it still crashes after this, the follow-up is downscaled sprite variants via `srcSet` (bigger diff, only if needed).

## Non-goals

- No visual or behavior changes on desktop.
- No feature changes; the mobile layout work from the last pass stays as-is.
