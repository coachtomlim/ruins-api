# Implementation Decisions

## 1. Dependency-Free Demo First

The requested stack remains Vite + React + TypeScript, but this environment has `node.exe` and no `npm`. Bundled node modules also do not include Vite or React. To keep the project moving toward a playable demo, the first vertical slice is a dependency-free browser module app.

Impact: the demo is playable now through `tools/serve-static.mjs`; React/Vite can be restored as the main shell when npm is available.

## 2. Extracted Content Is Source Of Truth

The demo uses generated JSON records from `public/content`, especially `areas.json`, `missions.json`, `dialogue.json`, `items.json`, `equipment.json`, and `skills.json`.

Impact: no major canon is invented. Temporary systems are documented separately.

## 3. Minimal Route

The first playable route is `area-001 -> area-002 -> area-003`.

Reason: these are high-confidence early episode records and form a coherent opening path.

## 4. IndexedDB First, localStorage Fallback

Save/load attempts IndexedDB first and falls back to localStorage if IndexedDB is unavailable.

Reason: IndexedDB matches the target architecture, while the fallback keeps local testing resilient.

## 5. No Asset Binding Yet

The first demo uses a neutral CSS visual panel instead of copying archive images into runtime.

Reason: the asset manifest is large, several assets need conversion, and CraftPix/Daz licensing needs review before redistribution.
