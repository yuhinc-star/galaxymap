# Restore proportional Sun Chat Mode

## What will change
- Keep the Sun large at the bottom of the strip, as the visual anchor.
- Size each displayed planet from its real size relative to the Sun and to its siblings; no shared row-height cap will flatten them to one diameter.
- Pack the vertical lineup using each body's actual displayed diameter and label space, then apply one shared fit adjustment only if the complete lineup needs it. This preserves relative proportions instead of shrinking every body independently.
- When the Sun has many deep branches, keep all direct planets in the main lineup but fold distant descendants out of the strip rather than making the planets unreadably tiny. Selecting a planet still opens its own five-generation lineup.
- Preserve the hand-painted art, parent→child ordering, animation, rocket behavior, semantic zoom, and Galaxy Mode.

## Verification
- Reproduce Sun Chat Mode at the current 835×665 viewport and on a 390×844 phone.
- Confirm differently sized planets remain visibly different, the Sun remains dominant, labels fit, and bodies do not overlap.
- Re-focus from the Sun into the deep branch and confirm the five-generation lineup still works there.
