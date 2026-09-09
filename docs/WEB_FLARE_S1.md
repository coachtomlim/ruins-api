# WEB-FLARE S1: real one-room runtime

Scope: replace the P0 timeline animation with a data-driven, rules-based auto-run. The human taps Start, but does not steer the hero. AI-assisted dungeon authoring remains optional and out of this sprint. No native Flare launch, C++ work, new stock art, Beta changes, main/production changes or GitHub Actions.

## Isolated delivery

Repository: coachtomlim/ruins-api, branch work/web-flare-p0-001. Existing P0 path is preserved at /flare-p0/index.html. Root build files on this branch serve the isolated preview only. No other existing route, API, or production branch is edited. Vercel performs the ordinary preview build and one bounded browser proof; no Actions workflow is present or created.

## Separation for reuse

- `data/catalog.json`: authoritative stock hero/enemy/item IDs, costs and prototype balance.
- `data/challenge.json`: versioned, compact placement and goal data. No scripts, asset URLs, inline stat overrides or client-supplied prices.
- `src/core/flare.mjs`: strict source-data adapters.
- `src/core/navigation.mjs`: ground collision semantics, radius checks, swept segments, stable A*, no diagonal corner cutting, dynamic occupied cells.
- `src/core/simulation.mjs`: pure 60-Hz simulation. No DOM, wall clock, network, RNG or LLM. Path decisions occur at objectives, not on every render frame. Attacks require range and unobstructed line of effect. Health, deaths, healing, coin collection and exit conditions are state-derived.
- `src/core/challenge.mjs`: schema/allowlist, budget and legal-placement validation, stable serialization.
- `src/view/renderer.mjs`: real stock animations, interleaved world/actor depth, camera, responsive canvas, optional route/collision overlays. Camera and frame rate cannot change outcomes.
- `tools/flare-assets.mjs`: deterministic build-time extraction of one exact stock room. Text and images pinned to source commit. Four compressed local atlases rather than live GitHub dependencies. Derived art retains source attribution/CC-BY-SA licensing. No fonts or C++ binary shipped.

## Hero policy v1

Select the reachable living guard with the shortest valid approach path, with stable order for ties. After a kill, move to and collect the actual coin drop. When injured, take a useful potion within six tiles before the next encounter. When all guards are defeated and all dropped coins collected, navigate to the exit. Monsters are stationary sentries with range-gated counterattacks. No ranged attacks, pursuit, dynamic doors or trap mechanics yet.

The old prototype put both enemy positions on blocked cells. S1 rejects such manifests rather than snapping or silently relocating them. The new legal placements exercise detours around the existing pillars.

## Acceptance / evidence

- 23 fast local unit tests: exact collision semantics, wall radius, detours, corner cutting, sweep, occupancy, source parsing, invalid/budgeted placement, per-tick collision, result derivation, changed enemy damage, no healing without potion, defeat, simultaneous impacts, unreachable route, timeout, zero-enemy scalability, reset and reproducible trace.
- Asset build verifies original map blob, tileset blob and equality of all 784 collision values to the independently copied source fixture.
- One actual-art Chromium mobile-emulated walkthrough. Includes pause, orientation change, exact comparison with pure simulation, camera, coin/drop/health/exit, brief replay reset and desktop/reduced-motion check. No stress matrix or repeated full suites.
- Public preview evidence: `/flare-p0/evidence/browser-smoke.json`, `asset-build.json`, and real browser screenshots. A successful build is not physical-iPhone acceptance.

## Deliberate limits / next sprint

This is the reusable one-room foundation, not the complete four-sprint builder. Next add a small stock-room gallery and owner 100-gold placement UI, then portable share manifests and public player hosting. No accounts, ranked score, monetisation, AOL narrative integration or AI runtime. Current preview sharing still follows Vercel preview-access policy and may need a temporary share URL. Do not call it a permanent public player URL.

Pure simulation can later be run unchanged in a server/worker to validate a submitted challenge and recompute results. Client results are never an authority for future rankings, inventory, purchases or progression. Before public sharing, introduce server validation, challenge size/rate limits, immutable rules/content versions and non-expiring public hosting. Scale here means reusable data/core boundaries and small cached assets, not an untested promise about concurrent users.

Run `npm test` for inexpensive core verification. `npm run build:flare` requires network for pinned source ingestion and development dependencies; it creates compressed art, verifies source identity and runs the one bounded browser proof. No model calls during a build or a run.
