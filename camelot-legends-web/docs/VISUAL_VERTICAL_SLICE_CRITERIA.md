# Visual Vertical Slice Criteria

Level 1 must not be called a complete visual slice unless these checks pass.

## Acceptance Criteria

1. Level 1 scene panel renders a recovered map/isometric/2D environment.
2. Party/player marker or sprite is visible in the scene.
3. At least one scene actor or survivor marker/sprite is visible before battle.
4. Scout approach visually distinguishes enemy presence.
5. Forgon Scout battle displays a battle background.
6. Forgon enemy sprite or animation is visible during combat.
7. Player/party sprite or party visual is visible during combat.
8. Dialogue screens show speaker labels.
9. UI remains usable at 390x844 mobile viewport.
10. Automated tests verify the presence and visibility of key visual elements.

## Current Result

Automated visual gate:

`tools/verify-visual-slice.mjs`

Current status: passing.

## What Passing Means

Passing means Level 1 has visible recovered-art map, party, battle, and enemy presentation. It does not mean the final art direction, animation slicing, UI polish, or production asset pipeline are complete.
