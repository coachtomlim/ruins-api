# Ruins Beta Requirements

## Scope

This document defines Beta requirements after the locked Alpha baseline. Beta objective is graphical gameplay for public web use and mobile-capable vertical play.

Date baseline: 2026-05-22
Alpha branch baseline: `engine-prep-v1`

---

## 1) Alpha Baseline Assessment

### Working
- `public/play.html` + `public/play.js` provide playable flow.
- `GET /api/game-bootstrap` provides content + initial state.
- Prologue, movement, examine, pickup, inventory, journal, assembly, store, combat, save/load all function.
- Auto walkthrough exists and executes player-like command stream.
- Existing compatibility endpoints remain functional (`/api/display-room`, `/openapi.yaml`).
- Content validation and API/unit tests run in CI.

### Partial
- Narrative polish and command phrasing consistency.
- Some route aliases are fragile (multi-step direction strings).
- End-state UX is functional but not polished as a final product screen set.

### Fragile
- Main game loop still concentrated in `public/play.js`.
- UI state, logic state, and rendering are tightly coupled.
- Auto walkthrough is script-like behavior in client runtime, not a structured replay system.

### Missing / Unsuitable for Beta
- No dedicated graphical screen architecture (title/prologue/combat/store as distinct views).
- No comprehensive asset set (many rooms/monsters/items still text-first).
- No strong mobile-first vertical layout system for all game states.
- No production-grade public URL runtime hardening (performance budgets, preload, errors, fallback assets).

---

## 2) Beta Gameplay Target

Recommended target model: **D. Hybrid**

- Illustrated text adventure + command/button controls + clickable exits.
- Not full point-and-click puzzle game yet.
- Not full first-person dungeon crawler yet.

Definition of "graphical gameplay" for Beta:
- Persistent illustrated room viewport.
- Visual state panels (player stats, enemy stats, inventory indicators, room exits).
- Context-aware action bars.
- Modal/panel UX for journal, inventory, map, save/load, store.
- Combat presentation with visible enemy art, HP bars, action events, and item/scroll actions.
- Smooth transitions between room states.

---

## 3) Required Beta Screens / States

1. Title / Start screen
2. Prologue conversation scene (Sheja at Adventurer's Inn)
3. Exploration screen (main room view + controls)
4. Room image viewport state
5. Map overlay panel
6. Inventory modal/panel
7. Journal modal/panel
8. Examine result panel
9. Pickup confirmation toast/panel
10. Combat screen (enemy art + HP bars + actions)
11. Scroll/item use sub-panel during combat
12. Room transition scene/state
13. Store screen (Room 9)
14. Save/Load screen/panel
15. Boss chamber screen
16. Ending / completion screen

---

## 4) Public URL + Mobile (Vertical) Requirements

### Public URL Requirements
- Beta must be deployable to stable HTTPS URL (Vercel target).
- 404-safe assets with fallback visuals.
- Graceful handling of `game-bootstrap` fetch failure.
- Cache strategy for static assets (images/css/js) and no-cache for save-state endpoints (if later server save is added).

### Mobile Vertical Requirements
- Primary viewport design target: portrait phone first.
- Single-column default with sticky action bar.
- Room viewport fixed aspect ratio and non-overlapping controls.
- Combat actions always visible without horizontal overflow.
- Journal/Inventory/Map as full-height slide-up drawers or modal sheets.
- Touch targets at least ~44px.
- Avoid text clipping and input overlap with virtual keyboard.

---

## 5) Beta Architecture Requirements

1. Preserve Alpha runtime behavior as baseline contract.
2. Split current `public/play.js` into modules:
   - state/controller
   - renderers (exploration/combat/prologue/ui shell)
   - action dispatcher
   - replay/walkthrough runner
3. Introduce UI state layer:
   - `viewMode` (`title|prologue|explore|combat|store|ending`)
   - modal states (`inventory|journal|map|save`)
4. Expand asset manifest:
   - room art, transition art, monster art, item icons, UI sprites.
5. Add preloading + lazy loading policy.
6. Keep deterministic game logic separated from visual rendering.
7. Add accessibility baseline:
   - focus order
   - keyboard navigation
   - ARIA labels for key controls.

---

## 6) Beta Testing Requirements

### Required
- UI smoke tests for each required screen/state.
- Bootstrap contract test.
- Asset completeness test (manifest references real files).
- No broken image test.
- Command button tests (explore/combat/prologue/store).
- Save/load UI tests.
- Combat UI flow tests (HP updates, victory, run, scroll effects).
- Journal/inventory/map panel tests.
- Mobile viewport tests (portrait + landscape sanity).
- Public URL availability checks after deploy preview.

### Suggested Tooling
- Keep Node built-ins + lightweight scripts for integrity checks.
- Use Playwright for UI flow/regression snapshots (already used in project context).

---

## 7) Beta Phase Plan (Summary)

- **Beta 0**: Alpha UI audit + asset coverage lock.
- **Beta 1**: Graphical exploration shell + responsive layout.
- **Beta 2**: Inventory/journal/map graphical panels.
- **Beta 3**: Graphical combat presentation.
- **Beta 4**: Store/puzzle/boss presentation.
- **Beta 5**: polish, testing matrix, deployment readiness.

Detailed breakdown is in `beta-roadmap.md` and `beta-implementation-plan.md`.

---

## 8) Specific Recommendations

- Keep `/play.html` for Beta, but treat as shell and modularize JS aggressively.
- Stay vanilla JS for Beta unless complexity becomes blocking.
- Use static/pre-generated assets only for gameplay visuals.
- No runtime AI/image generation in Beta gameplay.
- Keep Alpha accessible as separate mode/path for regression and canon comparison.

---

## 9) Major Risks

- Canon drift during UI polish if logic and visuals are coupled.
- Asset bottleneck (missing room/monster/item art) slowing Beta.
- Mobile layout regressions from dense controls.
- Deterministic logic regressions from view refactor.

---

## 10) Beta Entry Criteria

Before Beta implementation starts:
- Alpha contract snapshot accepted.
- Canon conflict list explicitly reviewed.
- Asset plan approved (what is placeholder vs production).
- Mobile-first interaction model approved.
