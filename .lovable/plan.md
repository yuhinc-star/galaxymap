# Interactive Cartoon Solar System

A playful, touch-friendly galaxy map at `/` inspired by your reference: a deep-purple cartoon solar system where planets drift along dashed orbits, you drag and pinch to explore, and tapping a planet makes it react.

## What gets built

**One screen: the galaxy map**
- Deep purple space scene filling the whole viewport, with twinkling stars, occasional shooting comets, and dashed white orbit rings around a big smiling Sun in the corner — matching the reference's look.
- Sun, Moon, and 9 planets (Mercury → Pluto, since the reference includes it) as cute cartoon characters with faces.
- Small hand-drawn-style name labels next to each planet, like the reference.

**Artwork**
- Generate ~11 custom transparent PNG illustrations (Sun, Moon, Mercury, Venus, Earth, Mars, Jupiter, Saturn with ring, Uranus with ring, Neptune, Pluto) in the same flat cartoon style: bold colors, simple smiling faces, no watermark.
- Starfield and comets drawn in code (canvas/CSS) so they stay crisp and animatable.

**Interactions**
- **Pan & zoom**: drag to move around, scroll wheel or pinch to zoom (via `react-zoom-pan-pinch`, which handles trackpad, wheel, and touch pinch correctly).
- **Animated orbits**: each planet slowly travels along its dashed orbit at its own speed using a requestAnimationFrame loop; the Moon circles Earth.
- **Tap reactions**: tapping a planet triggers a squash-and-bounce wiggle plus a speech bubble with a short silly line ("Brrr, it's cold out here!" — Neptune). Bubbles dismiss on their own or on the next tap.
- A tiny hint chip on first load ("Drag to explore · tap a planet") that fades away.

**Mobile-first**: works great on phones (your viewport) with pinch zoom and big tap targets, and equally well on desktop.

## Technical notes

- Rewrite `src/routes/index.tsx` (currently the template placeholder) as the map screen; add unique head metadata (title/description/og) for the route.
- Components: `SolarSystem.tsx` (scene + orbit math), `Planet.tsx` (image, label, tap reaction), `Starfield.tsx` (twinkle + comets), `SpeechBubble.tsx`.
- Orbit positions computed in JS with `requestAnimationFrame`; planets rendered as absolutely positioned elements inside the zoom/pinch transform container. Tap vs. drag distinguished by pointer movement threshold so dragging never triggers reactions.
- Install `react-zoom-pan-pinch`; no backend or database needed.
- New color tokens (space purple, star yellow, label teal) added to `src/styles.css` in oklch; playful display font loaded via `<link>` in `__root.tsx`.
- The uploaded image is a watermarked stock illustration — used as style reference only, never embedded.
