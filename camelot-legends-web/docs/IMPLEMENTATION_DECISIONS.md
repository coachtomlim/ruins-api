# Implementation Decisions

## 1. Dependency-Free Demo First

The requested stack remains Vite + React + TypeScript, but this environment has `node.exe` and no `npm`. Bundled node modules also do not include Vite or React. To keep the project moving toward a playable demo, the first vertical slice is a dependency-free browser module app.

Impact: the demo is playable now through `tools/serve-static.mjs`; React/Vite can be restored as the main shell when npm is available.

## 2. Extracted Content Is Source Of Truth

The demo uses generated JSON records from `public/content`, especially `areas.json`, `missions.json`, `dialogue.json`, `items.json`, `equipment.json`, and `skills.json`.

Impact: no major canon is invented. Temporary systems are documented separately.

## 3. Minimal Route

The first playable route is `area-001 -> area-002 -> area-003 -> area-004 -> area-005`.

Reason: these are high-confidence early episode records and form a coherent opening path from warning, road search, equipment recovery, castle approach, and first combat.

## 4. IndexedDB First, localStorage Fallback

Save/load attempts IndexedDB first and falls back to localStorage if IndexedDB is unavailable.

Reason: IndexedDB matches the target architecture, while the fallback keeps local testing resilient.

## 5. Local Asset Binding Is Provisional

The demo now wires two recovered PNG references into runtime:

- `public/assets/recovered/level-design-example.png`
- `public/assets/recovered/characters-v2.png`

Reason: these make the browser/mobile route visibly game-like while leaving deeper asset conversion and licensing review for a later pass.

## 6. Objective Gating

The route requires the player to complete local objectives before moving forward: hear the warning, recover the Amethyst, equip Lithic Armor, reach the castle road, and defeat the raider.

Reason: this turns recovered content into a testable playable loop without inventing a larger quest system yet.

## 7. Local PWA Shell

The demo includes `public/manifest.webmanifest`, `service-worker.js`, and `src/static/pwa.js`.

Reason: the stated target includes local browser and mobile device play. The service worker caches the static shell, recovered content JSON, and wired assets so offline-capable testing can begin without a backend.

## 8. First-Level Data Module

The first playable level now has a dedicated data module at `src/static/level-data.js` for route, objectives, selected dialogue, pre-combat interactions, battle setup, enemy intent sequence, and rewards.

Reason: this is the smallest stable step toward many levels without introducing a full authoring pipeline before the first demo is solid.

## 9. Rebuilt Combat Mechanics

The first combat loop now includes MP costs, guard, visible enemy intent, potion healing, armor stat changes, Amethyst skill bonus, defeat retry, and a victory screen.

Reason: recovered combat formulas were missing, but the game needs a playable fighting system before broader content expansion.

## 10. Five-Minute Level Pacing

Level 1 includes one optional support beat in area 003 and one required preparation beat in area 004 before the Forgon Scout battle.

Reason: the first demo needs to feel like a playable level rather than a direct path into a single fight, while still keeping scope tight enough to verify on every pass.
