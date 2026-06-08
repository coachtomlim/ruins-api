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
