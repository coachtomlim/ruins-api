# Repo Improvement Inventory

This backlog is practical, not aspirational. It prioritizes repo readiness for a deterministic engine while preserving the current deployed behavior.

## Current Repo Snapshot

- One Vercel serverless function: `api/display-room.js`.
- Static assets in `public/`.
- OpenAPI spec: `public/openapi.yaml`.
- No package metadata.
- No tests.
- No CI.
- No content schemas.
- No engine implementation.

## Quick Wins

- Add `package.json` with test/lint scripts once the first code PR begins.
- Add a `README.md` explaining current API behavior and migration status.
- Add an asset manifest so `Room 1.png` and future assets are not hidden by hardcoded API mappings.
- Add tests for `/api/display-room` before changing it.
- Add OpenAPI validation to CI.
- Document Vercel project assumptions without committing secrets.

## Medium Refactors

- Replace hardcoded `FILES` object with a checked-in asset manifest.
- Split markdown rendering from asset resolution.
- Introduce `content/` definitions for rooms, monsters, items, and journal entries.
- Build pure engine modules outside `api/`.
- Add schema validation for content files.
- Add command parser and deterministic state transition tests.
- Add save-state serialization tests.

## High-Risk Areas

- Canon conflicts in combat balance and Room 9 behavior.
- Boss mirror stat timing and equipment exclusion.
- Save/load semantics around RNG state.
- Manual pickup rules conflicting with older auto-add wording.
- Room navigation represented as multi-step prose instead of explicit graph.
- Optional AI narration overriding deterministic facts.
- Future multiplayer if early state is stored as global mutable process memory.

## Deployment Considerations

- Keep current `display-room` endpoint stable until replacement contracts exist.
- Avoid changing Vercel config until tests cover current behavior.
- Do not store authoritative session state in module globals on Vercel serverless functions.
- Decide whether early saves are encoded client-side, stored in Vercel KV/Postgres, or kept in a temporary in-memory dev mode only.
- Keep OpenAPI spec synchronized with API changes.

## Missing Tooling

- `package.json`
- test runner
- schema validator
- formatter/linter
- CI workflow
- OpenAPI validation
- content validation script
- local dev instructions

## Suggested First Implementation PR

Scope:

- Add package/test tooling.
- Add asset manifest.
- Add tests for existing `display-room` behavior.
- Fix only the missing `Room 1` mapping if approved as a compatibility bug.

Do not include the engine in the same PR. Keep the first PR small enough that the deployment helper remains trustworthy.
