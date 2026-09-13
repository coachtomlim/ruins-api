# WEB-FLARE S8 Background Development Checkpoint 004

Branch: `work/web-flare-s8a-rewards-replay-001`

Live S7.1 remains untouched. No HostGator deployment has been executed. Vercel automatic Git deployment remains disabled for this branch.

## New development after checkpoint 003

- mobile design tokens: `public/flare-s8a/tokens.css`
- viewport panel shell CSS: `public/flare-s8a/panel-shell.css`
- local route-aware S8A preview server and route tests
- mobile acceptance HTML fixture: `tests/fixtures/s8a-mobile-panels.html`
- focused package scripts:
  - `npm run test:s8a-preflight`
  - `npm run verify:frozen`
- explicit `FINISH_HP_PERCENT` goal module and tests
- registration handoff now carries the versioned goal contract while preserving current target HP
- reward teaser and tier fixture, integrated into the mission view model
- exhaustive journey transition-matrix tests
- one-room-at-a-time room-carousel model and tests
- history-independent S2-S7.1 tree verifier using accepted Git tree identities, avoiding shallow-clone false failures
- `public/flare-s8a/prepared.mjs` refreshed as the prepared integration entry point
- provider-neutral S8B Gold ledger helper and tests, with append-only balance and idempotency checks
- S8A implementation file map refreshed to point Codex at the prepared modules rather than reimplementing them
- integration-readiness checklist added: `docs/WEB_FLARE_S8A_INTEGRATION_READINESS.md`

## Current one-go integration cutline

Still intentionally not built piecemeal:

- final `public/flare-s8a/index.html`
- final `builder.mjs`
- final `challenge.html`
- final `challenge.mjs`
- real DOM wiring and Flare runtime integration
- phone browser proof
- HostGator deployment helper/handoff after implementation PASS.

## Recovery rule

Every preparation slice above is committed separately. If execution is interrupted, resume from branch HEAD and use checkpoints 003/004 plus `docs/WEB_FLARE_S8_PREFLIGHT_MANIFEST.json` to reconstruct prepared authority.
