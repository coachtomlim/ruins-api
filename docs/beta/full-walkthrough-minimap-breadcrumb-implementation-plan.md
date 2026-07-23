# Full Walkthrough, Minimap, And Breadcrumb Implementation Plan

Date: 2026-06-13

Goal: make the full Alpha walkthrough run as a graphical Beta demo with visible room transitions, combat presentation, a minimap, and breadcrumb trail, while preserving combat math and existing deterministic gameplay behavior.

Local target: `http://localhost:4273/play.html`

## Operating Principle

Proceed without user intervention unless one of these is required:

- canon conflict changes movement, rewards, or required walkthrough commands;
- bespoke final art is needed instead of an acceptable placeholder;
- public deployment/security packaging decisions are needed.

Everything else can be implemented with existing room art, current transition art, CSS/HTML effects, generated UI primitives, and manifest-driven placeholders.

## Current Baseline

Already implemented:

- full room image coverage for Rooms 1-10;
- `public/route-transitions.json` with 21 approved/placeholder route mappings;
- `public/navigation-map.json` with 13 nodes and 21 route edges;
- animated movement strip with origin, destination, dots, and moving marker;
- persistent minimap with current, visited, objective, and active-route states;
- breadcrumb trail for manual route movement, Auto Walkthrough steps, combat, item, store, gear, assembly, and ending events;
- store, boss, artifact, and ending visual event panel states;
- CSS-driven monster placeholder emblems for named and random encounters;
- inventory item chips with type-specific marks for scrolls, quest items, equipment, consumables, lore, and artifacts;
- full-walkthrough screenshot capture checkpoints for Room 9 store, Room 10 boss, and final ending;
- Auto Walkthrough timing that pauses for movement and combat visibility;
- combat HUD with enemy/player HP, stats, and scroll readiness;
- route/navigation validation and DOM walkthrough smoke checks.

Still needed for the full walkthrough demo:

- full mobile screenshot pass;
- final bitmap art to replace CSS placeholders before public Beta.

## Phase 1: Navigation State Model

Purpose: make minimap and breadcrumbs data-driven instead of inferred from log text.

Files:

- `public/play.js`
- `scripts/walkthrough-dom-smoke.js`
- optional new `public/navigation-map.json`

Implementation:

1. Add UI-only navigation state:
   - `visitedRoomIds`
   - `visitedRouteIds`
   - `breadcrumbEvents`
   - `currentRouteId`
   - `walkthroughStepIndex`
2. Update state during:
   - prologue-to-Room-1 entry;
   - every successful `move`;
   - one-way portal use;
   - Auto Walkthrough step execution.
3. Do not move this into engine state yet unless tests require it. It is presentation state for the local demo.
4. Store breadcrumb events as structured objects:

```json
{
  "type": "move",
  "from": "room.01",
  "to": "room.02",
  "routeId": "route.room01.north.room02",
  "label": "Altar -> Shrine"
}
```

Acceptance checks:

- manual movement updates `visitedRoomIds` and breadcrumbs;
- Auto Walkthrough updates the same path;
- save/load does not crash if breadcrumb state is absent in old saves;
- `walkthrough-dom-smoke` still completes.

## Phase 2: Minimap Data

Purpose: create a stable map coordinate layer independent of the large map image.

Files:

- new `public/navigation-map.json`
- `api/game-bootstrap.js`
- `test/game-bootstrap.test.js`
- new or expanded validator script

Implementation:

1. Create `public/navigation-map.json`:

```json
{
  "schemaVersion": 1,
  "nodes": [
    { "id": "room.01", "label": "Altar", "x": 48, "y": 86 },
    { "id": "room.02", "label": "Shrine", "x": 48, "y": 72 },
    { "id": "room.06", "label": "Mirror", "x": 66, "y": 72 },
    { "id": "room.05", "label": "Library", "x": 70, "y": 56 },
    { "id": "transition.room05.mid_passage", "label": "Passage", "x": 66, "y": 48 },
    { "id": "transition.dead_end.black_wall", "label": "Dead End", "x": 54, "y": 48 },
    { "id": "room.03", "label": "Sarcophagus", "x": 34, "y": 54 },
    { "id": "room.04", "label": "Guardroom", "x": 28, "y": 40 },
    { "id": "room.08", "label": "Chapel", "x": 16, "y": 26 },
    { "id": "room.07", "label": "Roots", "x": 28, "y": 58 },
    { "id": "room.09", "label": "Cares", "x": 28, "y": 74 },
    { "id": "room.10", "label": "Boss", "x": 14, "y": 66 }
  ],
  "edges": [
    { "from": "room.01", "to": "room.02", "routeId": "route.room01.north.room02" }
  ]
}
```

2. Include all route edges already represented in `public/route-transitions.json`.
3. Expose this through `/api/game-bootstrap`.
4. Validate:
   - all node ids exist in rooms or transition nodes;
   - all route ids exist;
   - all coordinates are 0-100.

Acceptance checks:

- bootstrap payload includes `navigationMap`;
- invalid route/node references fail validation;
- minimap can render without loading the large map image.

Minimal-intervention note:

- The first coordinates can be approximate and adjusted by visual QA. No user decision is needed unless we want exact canon map geometry.

## Phase 3: Persistent Minimap UI

Purpose: give the player constant spatial awareness while moving.

Files:

- `public/play.html`
- `public/play.js`
- `public/beta.css`
- `scripts/capture-route-transition-screenshot.js`

Implementation:

1. Add a new minimap section beside/under status:

```html
<section id="miniMapPanel" class="mini-map-panel" aria-label="Mini map">
  <header>
    <h2>Map</h2>
    <p id="miniMapStatus"></p>
  </header>
  <div id="miniMap" class="mini-map"></div>
</section>
```

2. Render nodes as buttons/spans:
   - locked/unknown;
   - visited;
   - current;
   - combat room;
   - objective/final room.
3. Render edges:
   - unvisited route;
   - visited route;
   - active route animating.
4. During movement animation, highlight the active route and animate a small marker along the edge.
5. On mobile, make the minimap compact and scroll-free, with tap targets still readable.

Acceptance checks:

- current room is visually obvious;
- visited rooms remain marked;
- active movement route animates during manual movement and Auto Walkthrough;
- no UI overlap at desktop and mobile widths.

## Phase 4: Breadcrumb Trail

Purpose: show where the player has been and where Auto Walkthrough is in the scripted path.

Files:

- `public/play.html`
- `public/play.js`
- `public/beta.css`

Implementation:

1. Add breadcrumb panel:

```html
<section id="breadcrumbPanel" class="breadcrumb-panel" aria-label="Route breadcrumbs">
  <h2>Trail</h2>
  <ol id="breadcrumbs"></ol>
</section>
```

2. Render a concise trail:
   - `Inn`
   - `Altar`
   - `Shrine`
   - `Mirror`
   - `Library`
   - ...
3. Collapse long trails:
   - show first, last 6, and current;
   - use an ellipsis marker for skipped middle steps.
4. Add breadcrumb event icons through CSS text/symbol styling:
   - move;
   - combat;
   - item;
   - journal;
   - store;
   - boss/ending.
5. Auto Walkthrough should mark each step as:
   - queued;
   - active;
   - complete;
   - blocked/failed.

Acceptance checks:

- breadcrumb trail updates on manual movement;
- Auto Walkthrough step status is visible;
- long trail does not break layout;
- failed command leaves a visible blocked breadcrumb.

## Phase 5: Full Walkthrough Visual States

Purpose: close the local demo gaps beyond navigation.

Files:

- `public/play.js`
- `public/beta.css`
- optional `public/walkthrough-visual-states.json`

Implementation:

1. Room 9 store:
   - show store drawer or inline panel when `flag.prism.assembled` is true;
   - rows for Shield, Potion, Hose;
   - affordability and owned/equipped states;
   - keep commands `Buy 1`, `Buy 3`, `Equip shield`, `Equip hose` working.
2. Room 10 boss:
   - pre-combat boss warning state;
   - Banshee combat portrait placeholder;
   - boss defeated state;
   - crystal stand available state.
3. Ending:
   - artifact pickup visual confirmation;
   - final Sheja reward/end panel;
   - Auto Walkthrough completes on this state.
4. Item/journal feedback:
   - toast or small event rail entries for item reveal, pickup, equip, prism assembly, journal unlock.

Acceptance checks:

- Auto Walkthrough visibly reaches store, boss, artifact, and ending;
- no command behavior changes;
- `walkthrough-dom-smoke` confirms final ending text and key visual state ids are touched.

## Phase 6: Monster And Item Placeholder Assets

Purpose: improve visual clarity without blocking on final 3D/animated monsters.

Files:

- `public/assets-manifest.json`
- `public/play.js`
- `public/beta.css`
- optional generated assets under `public/assets/beta/monsters/` and `public/assets/beta/icons/`

Implementation:

1. Use CSS/generated placeholders first:
   - Imp: red/orange silhouette badge;
   - Musca: winged/insect badge;
   - Lizardman: green scale badge;
   - Banshee: pale spectral badge.
2. Add manifest entries only if bitmap assets are created.
3. Inventory icons can start as CSS icon chips using item type and rarity.
4. Replace placeholders later with final art using the same manifest ids.

Acceptance checks:

- named monster encounters are distinguishable;
- item inventory is scannable;
- no missing image icons.

Art escalation:

- No art request is needed for placeholder demo.
- Raise a request before public Beta for final Banshee, Imp, Musca, Lizardman, and ending card art.

## Phase 7: Verification And Screenshots

Purpose: make the demo repeatable and hard to regress.

Files:

- `scripts/walkthrough-dom-smoke.js`
- new `scripts/capture-full-walkthrough-screenshot.js`
- new or updated validation scripts
- `package.json`

Implementation:

1. Expand DOM smoke to assert:
   - minimap rendered;
   - breadcrumbs rendered;
   - at least one visited route;
   - combat HUD displayed during walkthrough;
   - store visual displayed;
   - boss/ending visual displayed.
2. Add screenshot capture after:
   - first route transition;
   - Room 9 store;
   - Room 10 combat;
   - final ending.
3. Add package scripts:
   - `capture:walkthrough`
   - `validate:navigation`
4. Keep `npm run check` focused on deterministic fast checks; screenshot captures can remain explicit.

Acceptance checks:

- `npm run check` passes;
- `node scripts/walkthrough-dom-smoke.js` passes;
- screenshot capture produces expected files in `docs/beta/`.

## Phase 8: Mobile And Public URL Readiness

Purpose: keep the local design migration-safe.

Implementation:

1. Responsive layout:
   - minimap collapses under scene or status on small screens;
   - breadcrumbs use horizontal scroll or compact chips;
   - command dock remains touch usable.
2. Production package safety:
   - no local absolute paths exposed in browser payloads;
   - no dev-only file enumeration endpoints;
   - assets loaded only from `public/`;
   - save state remains local unless public account/persistence is explicitly designed.
3. Public URL readiness:
   - no hardcoded `localhost`;
   - bootstrap uses relative paths;
   - route/nav data served as static JSON or bootstrap payload.

Acceptance checks:

- desktop screenshot: 1200 x 900;
- mobile screenshot: 390 x 844;
- no horizontal page overflow;
- no console errors.

## Recommended Execution Order

1. Create `navigation-map.json` and validator.
2. Expose navigation map in bootstrap and tests.
3. Add minimap panel and render current/visited/active routes.
4. Add breadcrumb panel and event state.
5. Wire Auto Walkthrough step status into breadcrumbs.
6. Add Room 9 store visual state.
7. Add Room 10 boss, artifact, and ending visual states.
8. Add placeholder monster/item visual chips.
9. Expand DOM smoke and screenshot capture.
10. Mobile QA pass and production-readiness review.

## User Intervention Points

I can proceed through steps 1-9 without stopping.

Only raise to user if:

- exact map geometry must match a source image rather than approximate coordinates;
- Room 8/Room 7 route canon must be changed beyond current content;
- final monster or ending art must be bespoke rather than placeholder;
- public deployment target, domain, authentication, or persistent saves are requested.

## First Implementation Slice

Implemented in the 2026-06-13 coding pass:

- `public/navigation-map.json`;
- `scripts/validate-navigation-map.js`;
- bootstrap exposure and test coverage;
- persistent minimap panel;
- breadcrumb panel;
- manual and Auto Walkthrough path updates;
- screenshot capture proving minimap + breadcrumbs + active route.

Completed checks for that slice:

- Auto Walkthrough visibly moves through minimap and breadcrumbs;
- movement strip and minimap active route agree;
- DOM smoke passes;
- validators pass;
- local URL remains `http://localhost:4273/play.html`.

Next implementation slice:

- run desktop and mobile visual QA;
- add a mobile screenshot capture script or viewport mode;
- decide which placeholder visuals must become bespoke bitmap art before public Beta.
