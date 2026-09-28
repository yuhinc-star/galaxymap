# Proportional deep-system views

## Goal
Make every focused family view feel intentionally composed, especially around tiny deep moons, while preserving infinite semantic zoom and the rocket’s readable, screen-stable role.

## Approach
- Replace the deep demo’s fixed minimum orbit radius with a proportional family-spacing rule based on parent diameter, child diameter, and a small visual breathing margin. Side moons will occupy a distinct but nearby ring rather than inheriting an oversized fixed offset.
- Frame a selected body using the visible local family: include the parent as context, the selected body, its direct children, labels, and the parked rocket when relevant. Do not frame hidden distant descendants.
- Choose camera scale from two constraints together:
  - the family should occupy a balanced portion of the viewport;
  - the selected body must remain large enough relative to the rocket to read as a destination, without making the rocket shrink into irrelevance.
- Keep the rocket screen-stable when zoomed in, but use its footprint as a layout constraint for parking distance and camera framing so it never overwhelms a tiny moon.
- Preserve semantic zoom as presentation-only. No bodies are created, deleted, resized, or regenerated when zoom changes.

## Visual behavior
- A tiny moon’s local orbit tightens with it instead of becoming a giant empty circle.
- The focused body remains the visual anchor; its immediate parent appears as partial epic context only when that composition helps.
- One child generation is clear, the next is quieter, and distant generations continue using the existing smooth fade.
- Orbit dashes and labels remain readable at high zoom without becoming visually heavier than the bodies.

## Verification
- Test all seven deep generations by selecting each through the Navigator at desktop and mobile sizes.
- Compare body, orbit, label, and rocket proportions at each stop.
- Test the deepest moon, a middle moon with children, the root planet, and rocket arrival/parking.
- Confirm zooming does not mutate the generated family and that chat mode still composes correctly.
