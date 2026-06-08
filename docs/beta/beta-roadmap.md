# Ruins Beta Roadmap

## Beta 0 - Baseline Lock

Goal:
- Freeze Alpha behavior baseline and route/state expectations.

Likely files:
- `docs/beta/*`
- `docs/walkthrough-log.md`

Risks:
- Beginning UI changes before baseline capture.

Tests:
- Existing `npm run check`.
- Replay walkthrough validation.

Acceptance:
- Alpha baseline documented and reproducible.

---

## Beta 1 - Graphical Exploration Shell

Goal:
- Introduce visual game shell (title, prologue, exploration viewport, action bars).

Likely files:
- `public/play.html`
- `public/play.js` (split modules or staged split)
- `public/assets-manifest.json` expansion
- new CSS file(s)

Risks:
- Breaking existing action flow while changing layout.

Tests:
- Exploration smoke tests (desktop + mobile portrait).

Acceptance:
- Room art viewport + usable controls on mobile vertical and desktop.

---

## Beta 2 - Inventory / Journal / Map UX

Goal:
- Graphical panelized UX for inventory, journal, map.

Likely files:
- UI renderer modules
- panel CSS
- item/icon asset list

Risks:
- Overlap and overflow issues on narrow screens.

Tests:
- open/close panel flows
- no clipped text
- keyboard + touch interactions

Acceptance:
- Inventory/journal/map are fast, readable, and stable across viewports.

---

## Beta 3 - Graphical Combat

Goal:
- Dedicated combat presentation: enemy art, HP bars, action slots, event timeline.

Likely files:
- combat renderer module
- combat UI assets
- action state handlers

Risks:
- Logic/render coupling causing deterministic regressions.

Tests:
- combat action tests (attack, run, use scroll)
- HP bar correctness
- victory/reward screen transitions

Acceptance:
- Combat feels visual, readable, and canon-correct.

---

## Beta 4 - Store / Puzzle / Boss Presentation

Goal:
- Rich room-state visuals for Room 5 puzzle flow, Room 9 store, Room 10 boss chamber + ending.

Likely files:
- room-specific view components
- store panel UI
- boss/ending state renderer

Risks:
- Conditional event order bugs.

Tests:
- puzzle trigger sequence tests
- store purchase/equip UI tests
- boss precondition and ending sequence tests

Acceptance:
- Endgame loop is complete with clear visual transitions.

---

## Beta 5 - Polish + Deployment Readiness

Goal:
- Production hardening for public URL + mobile portrait.

Likely files:
- caching/meta settings
- perf/preload helpers
- error/fallback handling
- docs/release notes

Risks:
- Last-minute regressions from optimization.

Tests:
- Playwright E2E smoke on desktop/mobile
- no broken asset checks
- public preview URL checks

Acceptance:
- Beta candidate ready for public testing on URL.
