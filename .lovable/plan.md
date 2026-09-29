# Fix Minimalist Mode framing and chat

## Changes
- Add a true whole-system fit for Minimalist Mode so switching modes and recentering clears deep focus and frames the outer contour.
- Make Minimalist Chat use the same nested contour geometry as the main Minimalist view, showing only the active five-generation lineup instead of stray oversized ancestor rings.
- Render awake nodes as white outlined beads, sleeping nodes as solid black beads, and keep the rocket-host node as the current blue dot with blue ring.
- Preserve the existing storybook mode behavior.

## Verification
- Check the complete contour fits at desktop and the current compact viewport.
- Open Chat Mode from a deep node, verify the lineup stays visible and controls work.
- Toggle sleep/wake and move the rocket to confirm all three node states.
