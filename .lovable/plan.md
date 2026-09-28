# Repair the Navigator for deep systems

## What will change
- Replace endlessly nested indentation with a flat, capped-depth family list, so seventh-generation names and controls still fit.
- Fold moon branches by default. Automatically open only the chain leading to the focused star or rocket, plus that star’s immediate children.
- Add a small storybook continuation row for folded descendants, showing how many stars are hidden and expanding that branch on demand.
- Keep all planets reachable, preserve current highlights and rocket controls, and retain scrolling as a fallback rather than the main solution.
- In Chat Mode, keep the same behavior but scope it to the family currently shown.

## Verification
- Test the seven-generation demo at the current compact viewport, desktop, and phone sizes.
- Check focusing every deep moon, expanding/collapsing branches, moving the rocket, long names, and Chat Mode.
- Confirm no overlapping, horizontal clipping, missing destinations, or preview errors.

## Technical details
- Flatten the recursive tree into visible rows with capped visual indentation while preserving true ancestry.
- Derive the automatically expanded path from `focusedId` and the rocket host; retain manual branch choices locally.
- Count hidden descendants recursively for accurate continuation labels without altering the generated system.
