# Infinite Semantic Zoom

This extends the existing galaxy view only. Zooming will never create, delete, or alter stars; it only changes which existing bodies, orbit lines, labels, and decorations are shown.

## Recommended visual rule

Use **three readable generations** as the normal view, with a fourth generation appearing only during the crossfade between levels.

- **Two generations** is clean but loses too much family context and makes the galaxy feel empty.
- **Three generations** preserves the story: the local body, its immediate family, and one surrounding level for orientation.
- **Four fully visible generations** becomes crowded, especially on phones, and brings back the interference problem this design has already solved.
- During a zoom transition, the outgoing and incoming levels briefly overlap. This can momentarily show four generations, but only as a smooth handoff—not as permanent clutter.

The exact three-level window follows apparent size rather than changing the data. As users zoom in, oversized ancestors and their orbit lines softly leave the scene; descendants become readable and appear. As users zoom out, tiny descendants lose labels first, then rings and sprites, while larger ancestors return.

## What will change

### 1. Add a scale-aware visibility model
- Build a reusable body index containing every existing body's parent, children, depth, size, and live position.
- Calculate visibility from each body's projected on-screen size and its relationship to the currently focused body.
- Use staged detail levels:
  1. full sprite, orbit, label, and interaction;
  2. sprite and simplified orbit, quieter label;
  3. faint context sprite/ring without interaction;
  4. fully omitted from rendering and hit-testing.
- Keep the focused body, the rocket host/destination, and the active chat subject protected from accidental disappearance.

### 2. Make zoom effectively unbounded without numerical instability
- Track zoom as a logical scale rather than allowing one transform number to grow or shrink indefinitely.
- Rebase the visible scene around the current local body when crossing large scale boundaries, preserving the point under the cursor or pinch midpoint.
- Apply the same behavior to wheel, trackpad pinch, touch pinch, and the zoom buttons.
- Preserve current drag-to-pan, navigator focus, parent zoom-out, and camera-follow behavior.

### 3. Animate level changes in the existing art language
- Fade labels before their bodies disappear.
- Shrink/fade orbit dashes and sprites with soft, slightly elastic timing matching the current birth, goodbye, and navigator animations.
- Avoid hard popping at thresholds by using overlapping enter/exit ranges and hysteresis.
- Reduce background objects as the view goes deeper so the focused local family remains clear.

### 4. Keep every interaction coherent
- Hidden bodies remain unchanged and stay available in the Navigator.
- Navigator selection reveals and frames the selected body's local three-generation view.
- Rocket flights keep both the live rocket and destination visible until arrival, even if they cross visibility levels.
- Drag targeting ignores fully hidden bodies.
- Parent zoom-out reveals the next larger family before completing the camera move.
- Chat Mode keeps its current vertical family arrangement, while its galaxy strip uses the same visibility rules for non-lineup bodies.
- Add, delete, rename, regenerate, palette, hints, and undo continue to work without changing their data behavior.

## Verification

- Test wheel zoom and trackpad-style deltas without sudden jumps.
- Test touch pinch and pan at a phone viewport.
- Repeatedly zoom deeply in and out, confirming no blank-frame flashes, stale hit targets, overlaps, or camera drift.
- Verify Navigator, parent zoom-out, rocket summon/drag/arrival/chat invitation, Chat Mode, add/delete/rename, and system regeneration.
- Compare screenshots using permanent 2-, 3-, and 4-generation settings; retain the three-generation default unless the rendered comparison contradicts the expected clarity advantage.

## Technical notes

- The first implementation target is the generated system at `/generator`, where recursive moon families already exist.
- Visibility should be derived and memoized rather than stored in the generated system, so zoom remains purely presentational.
- The fixed classic solar-system page will keep its current behavior unless the shared camera work can be adopted without changing its presentation.
- Record the final camera/visibility architecture in `AGENTS.md` once implemented.
