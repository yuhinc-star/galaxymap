# Restore true genealogy in Chat Mode

## Goal
Make the Chat Mode strip read immediately as a family tree. In a deep chain, Wisp → Petal → Pebble → Mote → Pip must appear as five successive parent-to-child generations, never as siblings on one level.

## Changes
- Replace the current one-level fan input with a five-generation family layout centered on the star being viewed.
- Build a visible lineage spine from ancestors through the selected star, then attach each generation’s direct side-children to its own parent.
- Give every generation its own vertical band, decreasing body size and prominence as depth increases.
- Keep the selected/chatting star visually dominant near the bottom, while preserving enough ancestry above it to explain where it came from.
- Draw each child’s orbit around its actual parent position in the strip, so orbit geometry itself communicates genealogy.
- Stagger side branches locally around their parent without placing them on the main lineage or making them look like another generation.
- Keep the five-generation limit presentation-only: no stars are added, removed, or re-parented.
- Recalculate the camera framing from the complete five-level composition so the strip is filled without clipping names, faces, the rocket, or orbit lines.
- Preserve smooth entry, re-focus, zoom-out-to-parent, rocket travel, and return-to-orbit animations.

## Verification
- Use the seven-generation demo to inspect every focus from Wisp through Speck.
- Confirm the visible chain has five distinct vertical levels and each side moon remains visually attached to its correct parent.
- Check desktop at the current 835×665 viewport and mobile at 390×844.
- Test opening Chat Mode, stepping to a child, zooming out to a parent, and landing the rocket on another generation without jumps or shaking.
- Confirm Galaxy Mode still uses its existing three-generation semantic window.

## Technical approach
- Extend the Chat layout model with generation depth and parent identity for each positioned body.
- Gather a bounded five-level lineage/subtree around the current fan focus rather than passing only direct children.
- Solve positions generation-by-generation in screen space, then convert them to world coordinates for the existing chase and orbit-morph animation system.
- Make Chat visibility follow the layout’s explicit membership and depth; keep the existing semantic visibility logic for all bodies outside the composed family.
