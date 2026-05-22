# Ruins API

This repository is the Vercel API and migration workspace for **Forgotten Ruin of the Dark Galan / Ruins Adventure Game**.

The current production surface is intentionally small: it serves room/map image markdown for CustomGPT-style rendering. The future target is a deterministic cloud-deployed adventure engine, but the full engine is not implemented yet.

## Current API

### `GET /api/display-room?name=...`

Returns `text/markdown` containing an image link and title for known assets.

Supported names are defined in [public/assets-manifest.json](public/assets-manifest.json).

Known examples:

- `Map`
- `Room 1`
- `Room 3`
- `Room 4`
- `Room3to4`
- `Room4to3`

Required compatibility checks:

- `GET /api/display-room?name=Map`
- `GET /api/display-room?name=Room%203`
- `GET /openapi.yaml`

## Local Setup

Use Node.js 20 or newer.

```bash
npm ci
npm test
npm run check
```

Useful scripts:

- `npm test`: run Node built-in tests.
- `npm run lint`: run lightweight syntax and whitespace checks.
- `npm run validate:openapi`: validate the small OpenAPI contract.
- `npm run validate:assets`: validate the asset manifest and referenced files.
- `npm run check`: run all checks.

## Repository Structure

- `api/`: Vercel serverless functions.
- `public/`: static assets and OpenAPI spec.
- `public/assets-manifest.json`: source of truth for displayable assets.
- `docs/canon/`: reconstructed canon with `LOCKED`, `LIKELY`, `CONFLICTED`, and `UNKNOWN` labels.
- `docs/schemas/`: draft future content/state schemas.
- `docs/architecture/`: deterministic engine architecture proposal.
- `test/`: current API tests.
- `scripts/`: repo validation scripts.

## Known Limitations

- The deterministic adventure engine is not implemented.
- Combat, inventory, journal, save/load, movement, and boss logic currently exist only as docs/schema plans.
- Canon conflicts are intentionally unresolved in docs.
- The current API returns markdown, not structured game state.
- No Vercel deployment is triggered by this repository setup.

## Migration Direction

The intended path is:

1. Preserve existing display API behavior with tests.
2. Extract canon into source-controlled content.
3. Add deterministic engine modules under test.
4. Expose engine state transitions through API endpoints.
5. Add UI or optional AI narration above the deterministic engine.

AI narration must never be the source of truth for state, exits, rewards, combat, inventory, or flags.

## Codex / Claude Workflow

- Codex: builder, implementer, repo operator.
- Claude: architecture reviewer, systems critic, canon and logic auditor.
- GitHub: source of truth.
- Docs and tests: implementation authority.

When canon is unclear, flag it in docs or tests instead of silently resolving it in code.
