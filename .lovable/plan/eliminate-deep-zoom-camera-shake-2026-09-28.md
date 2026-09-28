# Eliminate deep-zoom camera shake

## Goal
Make the camera genuinely stable on the smallest moving star while preserving cursor-centred wheel/pinch zoom, deliberate-pan release, rocket travel, and Chat Mode framing.

## Changes
- Replace the current direct screen write plus delayed zoom-library write with one authoritative camera writer.
- Track camera ownership explicitly: user gesture, focused-star tracking, transition glide, or Chat Mode. Only the active owner may move the view.
- End wheel and pinch ownership from their real completion events instead of a fixed timer, then smoothly re-centre at the exact scale the user chose.
- Keep the focused star at a stable screen anchor while its nested orbit moves, using the same current-frame position used to draw it.
- Fold Chat Mode framing into the same camera controller so opening, closing, and resizing cannot compete with focused-star tracking.
- Mirror the correction in both galaxy implementations.

## Verification
- Test Speck and Little Berry at 835×665 and 390×844 through long wheel gestures, pinch-equivalent input, idle orbit tracking, zoom buttons, and deliberate panning.
- Measure frame-to-frame screen position to confirm no back-and-forth camera reversals after gestures.
- Verify rocket arrival and Chat Mode lineup remain correctly framed.
- Confirm a clean preview build and no runtime errors.

## Technical note
The current code writes the same transform both directly to the page and through the zoom library, on different frame schedules. At deep magnification, that one-frame disagreement becomes a large visible jump. The replacement uses one transform path and one synchronous camera snapshot for every reader.
