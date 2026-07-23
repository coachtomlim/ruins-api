# Migration Plan

This plan moves Ruins from CustomGPT design archive plus image helper API toward a deterministic cloud-deployed adventure engine.

## Guiding Bias

Preserve -> extract -> formalize -> modularize -> implement.

Do not rewrite or expand gameplay canon as part of migration. New gameplay belongs in a later versioned design process.

## Phase 1: Audit and Evidence Recovery

Status: complete enough for planning.

Outputs:

- Repo assessment.
- Vercel behavior check.
- Drive source inventory.
- Initial canon conflict list.

## Phase 2: Canon and Architecture Prep

Status: this branch.

Outputs:

- `docs/canon/` source-controlled canon reconstruction.
- Schema drafts for content and runtime state.
- Deterministic engine module proposal.
- Test strategy.
- Repo improvement inventory.
- Claude review brief.

Exit criteria:

- Claude reviews canon risk and architecture.
- Human confirms which canon variant controls implementation.
- First implementation PR scope is approved.

## Phase 3: Repo Tooling and Compatibility Tests

Purpose: make the existing repo safer before adding engine code.

Suggested scope:

- Add `package.json`.
- Add a minimal Node test runner.
- Add tests for current `display-room` behavior.
- Add OpenAPI validation.
- Add asset manifest draft.
- Optionally expose `Room 1` through the existing endpoint only after tests capture current and intended behavior.

No engine logic yet.

## Phase 4: Content Model Extraction

Purpose: turn canon into data before engine behavior.

Suggested scope:

- Add `content/rooms.json`.
- Add `content/monsters.json`.
- Add `content/items.json`.
- Add `content/journal-entries.json`.
- Add `content/flags.json`.
- Add schema validation.
- Preserve conflicts as versioned variants.

Exit criteria:

- Content validates.
- Canon conflicts remain visible.
- No runtime engine needed to inspect content.

## Phase 5: Engine Skeleton

Purpose: create deterministic pure modules with tests.

Suggested initial modules:

- `state`
- `rng`
- `commands`
- `movement`
- `journal`
- `inventory`

Defer full combat until state/content plumbing is stable, unless tests require a minimal combat math module first.

## Phase 6: Combat and Boss Mechanics

Purpose: implement the highest-risk deterministic systems under test.

Suggested scope:

- Combat start and initiative.
- Hit/damage math with injected RNG.
- Scroll effects with canon-variant support.
- Run penalty.
- Victory rewards.
- Boss mirror logic.
- Girdle auto-trigger.

Exit criteria:

- Combat is replayable.
- Boss stat copy behavior is tested.
- No AI narration participates in state mutation.

## Phase 7: API Integration

Purpose: expose engine through Vercel without coupling engine to Vercel.

Suggested endpoints:

- `POST /api/start`
- `POST /api/command`
- `GET /api/state`
- `POST /api/save`
- `POST /api/load`

Response shape should include:

- machine-readable state delta,
- available commands,
- visible room facts,
- presentation text,
- asset refs.

## Phase 8: Frontend / CustomGPT / Narration Layers

Purpose: add presentation surfaces after engine contract is stable.

Options:

- CustomGPT action integration.
- Web frontend.
- Optional AI narration layer.

Rule:

The engine remains authoritative. Narration receives facts; it does not create facts.

## Phase 9: Persistence and Multiplayer Foresight

Purpose: choose persistence after state shape is proven.

Options:

- signed serialized state for early single-player,
- Vercel KV / Postgres for cloud saves,
- event log model for multiplayer or replay.

Do not store authoritative state in serverless globals.
