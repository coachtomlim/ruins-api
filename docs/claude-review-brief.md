# Claude Review Brief

## Context

This repo currently contains a small Vercel-hosted image display API for **Forgotten Ruin of the Dark Galan / Ruins Adventure Game**. The real game design lives in a CustomGPT/Drive archive and needs to be migrated into a deterministic, source-controlled adventure engine.

This branch does not implement the engine. It creates reviewable prep artifacts:

- canon extraction docs,
- schema drafts,
- deterministic engine architecture proposal,
- test strategy,
- repo improvement backlog.
- initial structured content JSON under `content/` with validation.
- minimal executable engine scaffold under `src/engine/`.

## Current Implementation Reality

Current repo contents:

- `api/display-room.js`: returns markdown for hardcoded room/map images.
- `public/openapi.yaml`: OpenAPI spec for `/api/display-room`.
- `public/`: static image assets.

Verified deployment behavior:

- `/api/display-room?name=Map` works.
- `/api/display-room?name=Room%203` works.
- `/openapi.yaml` works.
- `/api/display-room?name=Room%201` returns `404` despite `public/Room 1.png` existing.

## Requested Review Areas

Please review the new docs with attention to:

1. Architecture boundaries:
   - Are `state`, `movement`, `combat`, `inventory`, `journal`, `events`, `rng`, `save-load`, `content-loader`, `session`, and `api` separated cleanly?
   - Is anything over-abstracted before implementation?

2. Canon preservation:
   - Are `LOCKED`, `LIKELY`, `CONFLICTED`, and `UNKNOWN` labels used conservatively?
   - Are any rules silently resolved that should be flagged?
   - Thomas has directed that `Adventure Game Design V3 - Alpha.docx` should be used as the base authority. Please review whether any remaining docs or content still incorrectly privilege older frozen material.

3. Deterministic guarantees:
   - Is RNG state sufficiently explicit?
   - Can combat be replayed from seed plus command stream?
   - Are save snapshots complete enough?

4. State serialization:
   - Are current stats, base stats, equipment modifiers, status effects, room flags, inventory, and journal entries separated correctly?
   - Is the proposed state compatible with future persistence?

5. API boundaries:
   - Should the first API return JSON facts plus presentation text, markdown, or both?
   - Should the current markdown image endpoint remain separate from gameplay API?

6. AI narration boundary:
   - Is the proposed rule strong enough that AI narration cannot change canon, rewards, exits, combat, or flags?
   - What facts must be included in engine output to safely support narration?

7. Multiplayer foresight:
   - Are session/world/player boundaries sufficient as a future-proofing measure?
   - What should be avoided now to prevent multiplayer rework later?

8. Test sufficiency:
   - Are the proposed tests enough to begin implementation safely?
   - Which tests should block the first engine PR?

9. Engine scaffold:
   - Are the current executable contracts minimal enough?
   - Should content loading stay synchronous for the first engine pass?
   - Are the state/query helpers shaped correctly before mutation APIs are added?

## Key Open Canon Questions

- Incorrect scroll effect: `5%` or `10%` reduction?
- Imp stats: `9/4/6/20` or `9/8/6/30`?
- Lizardman EVA: `14` or `24`?
- Room 9: magical store, prism seal chamber, or both?
- Girdle: direct drop or hidden panel/pickup flow?
- Final reward: fixed `700g`, negotiated amount up to `900g`, or both represented separately?
- Journal identity: can semantic ids fully replace numeric ids?
- Run penalty: does it reduce current HP, max HP, both, or base stats?
- Victory reward: calculated from original monster stats or post-scroll modified stats?

## Files to Review First

1. `docs/canon/canon-index.md`
2. `docs/canon/canon-conflicts.md`
3. `docs/architecture/deterministic-engine-proposal.md`
4. `docs/schemas/state-schema-draft.md`
5. `docs/testing/test-strategy.md`
6. `content/game-config.json`
7. `content/rooms.json`
8. `content/monsters.json`
9. `content/items.json`
10. `src/engine/index.js`
11. `test/engine-state.test.js`
12. `test/engine-rng.test.js`
13. `test/engine-registries.test.js`

## Suggested Claude Output

Please produce:

- architectural concerns,
- canon risks,
- missing state fields or schema corrections,
- test gaps,
- questions requiring human canon decisions,
- recommended order for implementation PRs.
