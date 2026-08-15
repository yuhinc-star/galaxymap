# Mobile compatibility for Pocket Galaxy / Galaxy Generator

Make both pages fully usable at phone sizes (~390px wide) with touch gestures, while keeping the desktop layout pixel-identical. No feature changes — this is layout, sizing, and touch polish only.

## What's already touch-ready (verified, no work needed)

- Viewport meta tag, pinch zoom, and pan all work via react-zoom-pan-pinch
- Rocket drag uses pointer events (touch-ready); bodies have custom double-tap detection
- Hint copy already says "double-tap"

## What breaks at 390px (verified in code)

1. **Navigator** starts open at `w-60` (62% of screen width); with the info panel open (`w-72`, 74%), the screen becomes all panels.
2. **BodyInfoPanel** docks right — on a phone it covers the world you're inspecting.
3. **Hint bubble** (`bottom-5 left-1/2`, 26rem wide) collides with the generator's bottom-left controls.
4. **Tap targets** are desktop-sized: 28px close buttons and rocket chip, tight nav rows.
5. **No safe-area padding** — corner chrome sits under phone notches/rounded corners.
6. **Initial framing** (`initialScale 0.36`) shows only a fraction of the world on a narrow screen.

## Changes

**Navigator (`Navigator.tsx`)**
- Auto-collapse to the round list button on small screens, decided after mount via `matchMedia` in an effect (hydration-safe — no server/client mismatch).
- Cap open width on phones: `w-[min(15rem,calc(100vw-5rem))]`.

**Info panel as bottom sheet (`BodyInfoPanel.tsx`)**
- Below `sm:`: full-width sheet docked bottom (`inset-x-3 bottom-3`, `max-h-[52vh]`), slide-up entrance; `sm:` and up keeps today's right-side card exactly as-is.
- Scroll region gets `touch-action: pan-y` + `overscroll-behavior: contain` so panel scrolling never fights canvas panning.

**Touch targets (Navigator, BodyInfoPanel, HintGuide)**
- Close buttons, rocket chip, and nav rows bump to 40–44px on coarse pointers; `sm:` restores the compact desktop sizing.

**Hint bubble (`HintGuide.tsx`)**
- On phones, float it above the bottom chrome (`bottom-24`) instead of overlapping it.

**Corner chrome + safe areas (`SolarSystem.tsx`, `GeneratorSystem.tsx`, `styles.css`)**
- Add `env(safe-area-inset-*)` offsets to the four corner clusters via a small CSS utility; shrink the header title on phones.

**Rocket size cap (`HeroRocket.tsx`)**
- The zoom-compensated rocket (~96px on desktop) caps at ~72px on small screens so it doesn't dominate a 390px viewport.

**Initial framing (both system components)**
- After mount on narrow screens, fit the world width to the viewport with one `setTransform` call (post-mount effect, so SSR stays clean).

## Verification

Playwright at 390×844 on both routes: navigator collapse/open, info sheet open/scroll/close, rocket touch-drag onto a moon, pinch zoom, add/delete flows, and no horizontal page scroll. Desktop screenshot spot-check to confirm zero visual change.

## Non-goals

- No desktop layout or visual changes
- No new features, no behavior changes beyond what's listed
