# Beta 3 Combat Presentation

Date: 2026-05-23

## Implemented

- Added a graphical combat HUD in `/play.html`.
- Added enemy and player HP bars that read from existing runtime combat state.
- Added enemy/player combat stat summaries.
- Added scroll readiness chips for Fog, Pulse, and Heart.
- Added a room-to-combat visual pulse when combat starts.
- Kept combat math, turn order, scroll effects, run logic, rewards, and item drops unchanged.

## Prism Examine Fix

`Examine prism face 1`, `Examine prism face 2`, and `Examine prism face 3` now show visible journal feedback when a new entry unlocks.

Example:

`Journal updated: Fog of Confusion`

The log now includes the entry summary, so the action no longer appears to do nothing.

## Verification

- `scripts/lint.js`
- Node test suite
- `scripts/validate-openapi.js`
- `scripts/validate-assets.js`
- `scripts/validate-content.js`
- `scripts/walkthrough-dom-smoke.js`
- Combat screenshot: `docs/beta/beta-3-combat-hud.png`

## Remaining Combat Gaps

- No monster art is wired yet.
- No die pose or attack animation policy is chosen yet.
- Random low-tier monsters currently use a generated letter portrait.
- Scroll/action event animation is not implemented yet.
- Combat browser regression is still handled by local screenshot helper until a proper Playwright dependency is available.
