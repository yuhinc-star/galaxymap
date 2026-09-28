<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Semantic zoom is presentation-only: derive a three-generation visibility window from focus and apparent size; never mutate or regenerate bodies when zoom changes.
- Recursive moon geometry stays proportional: every child is smaller than its parent, and orbit clearance scales from both bodies without a fixed radius floor.
- Deep Navigator trees use capped visual indentation and progressive disclosure while always opening the focused or rocket-host ancestry, preventing unreachable bodies and horizontal collapse.
- Focused-body camera tracking runs before paint and survives wheel/pinch zoom; only deliberate panning releases it, preventing amplified deep-orbit jitter.
- Freeze orbital time while a generation-three-or-deeper body (moon of a moon and below) is focused in Galaxy Mode; motion resumes continuously when focus leaves, preventing deep motion from destabilizing the view.
- Chat Mode presents five progressively quieter family generations in its tall strip; Galaxy Mode retains the concise three-generation window.
- A wheel/pinch gesture owns the camera exclusively (260ms tail); the focused-body follow loop pauses during it and eases back to center at the user's new scale — two camera owners in the same frame caused amplified deep-zoom shake.
