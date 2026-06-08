# Ruins Beta Implementation Plan

## Architecture Recommendation

Keep `/play.html` as entrypoint for Beta and incrementally modularize JS.

Recommended modules:
- `ui-shell.js` (layout + screen state)
- `ui-panels.js` (inventory/journal/map/save)
- `ui-combat.js` (combat rendering/actions)
- `ui-assets.js` (manifest + preload/fallback)
- `game-controller.js` (command dispatch + deterministic state updates)
- `walkthrough-runner.js` (auto walkthrough as structured replay)

Avoid framework migration during Beta unless velocity drops significantly.

## Beta 0 Tasks
- Snapshot Alpha walkthrough as regression source.
- Lock current command/response expectations.
- Add baseline Playwright smoke script for title->prologue->explore.

## Beta 1 Tasks
- Create visual shell with responsive breakpoints.
- Add title/start screen and improved prologue presentation.
- Keep command parser and mechanics unchanged.

## Beta 2 Tasks
- Introduce inventory/journal/map modal UX.
- Map existing data objects to panel cards and icon slots.

## Beta 3 Tasks
- Build combat scene renderer:
  - enemy portrait
  - HP bars
  - action bar
  - event feed
- Ensure deterministic combat behavior unchanged.

## Beta 4 Tasks
- Build room-state scenes for:
  - Room 5 puzzle interaction
  - Room 9 store panel
  - Room 10 boss + artifact + ending states

## Beta 5 Tasks
- Public URL hardening:
  - asset fallback
  - error boundaries
  - perf and preload tuning
- Cross-device polish and final QA.

## Test Matrix (Required)

- `desktop-chromium` smoke
- `mobile-portrait` smoke
- `mobile-landscape` smoke
- save/load flow
- combat flow (all actions)
- no-broken-asset validation
- walkthrough replay completeness

## Acceptance Gates

Gate A (Graphical Explore):
- all main explore actions usable in mobile portrait
- room art and status visible without overlap

Gate B (Graphical Combat):
- combat can be completed entirely from buttons on mobile
- HP/event updates visually correct

Gate C (End-to-End):
- full campaign to boss + ending on public preview URL
- auto walkthrough produces coherent command/output stream
