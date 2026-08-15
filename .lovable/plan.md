Final polish: mobile responsive + touch interaction pass

## Goal
Make the Galaxy Generator feel native and usable on phones and tablets without changing the desktop layout the user is happy with.

## What to do

1. Responsive Navigator
   - On narrow viewports (< 768 CSS px), collapse the navigator into a bottom sheet or a horizontally scrollable bar at the bottom.
   - Keep the quoted avatar + name pattern, but shrink avatars and use shorter preview text.

2. Responsive BodyInfoPanel
   - Make the panel bottom-anchored on mobile, full-width up to a max height, with a drag handle to dismiss.
   - Reduce padding and child-list tile size so it does not obscure the world.

3. Generator controls
   - Move the bottom-left "planets" and "New system" buttons onto a floating bottom-center toolbar on mobile.
   - Keep the bottom-right zoom buttons as a compact vertical stack, but increase tap targets to at least 44×44px.

4. Touch interactions
   - Ensure the rocket drag and body double-tap behave correctly on touch: prevent accidental panning, use touch-action none on the rocket, and make the double-tap window slightly longer for touch.
   - Add a subtle haptic/vibration cue on landing if supported.

5. Safe areas + viewport
   - Respect `env(safe-area-inset-*)` for iOS notches and home indicators.
   - Set the viewport meta tag to prevent browser zoom on double-tap.

## What to avoid
- No new features (no new bodies, no new generator options).
- No visual redesign of the desktop UI.
- No changes to the art style or sprites.

## Definition of done
- The generator is usable on a 375px-wide phone in portrait: all controls reachable, panel readable, rocket draggable, navigator accessible.
- Desktop layout remains unchanged.
- No console errors or TypeScript failures.
