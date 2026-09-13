# WEB-FLARE S8A Implementation File Map

Purpose: reduce reconnaissance during the one-go Codex build.

## Reuse / import from accepted predecessors

- S7.1 invitation/receiver flow as behavioral predecessor.
- S7 room registry and room loading.
- S7 actor pack and simulation extensions.
- S7 calibration and game model.
- S3 composed Hero actor pack for invitation stance.
- P0 renderer/simulation foundations where inherited through S7/S7.1.

Frozen predecessor files must be imported or re-exported, not edited.

## Prepared S8A pure modules already on branch

- `public/flare-s8a/rewards.mjs`
- `public/flare-s8a/journey.mjs`
- `public/flare-s8a/mission-copy.mjs`
- `public/flare-s8a/registration-handoff.mjs`
- `public/flare-s8a/registration-view-model.mjs`
- `public/flare-s8a/result-view-model.mjs`
- `public/flare-s8a/replay-context.mjs`
- `public/flare-s8a/canonical-run-input.mjs`
- `public/flare-s8a/runtime-view.mjs`
- `public/flare-s8a/customize-panels.mjs`
- `public/flare-s8a/telemetry.mjs`

Codex should consume these modules rather than recreate equivalent logic inline unless a focused correction is required by tests.

## Expected S8A runtime surface

Codex may add the smallest coherent set under `public/flare-s8a/`, expected to include equivalents of:

- `index.html`
- `builder.mjs`
- `flow.mjs`
- `challenge.html`
- `challenge.mjs`
- `style.css`
- thin re-export/adaptor modules for accepted S7/S7.1 runtime components where useful.

Do not duplicate large predecessor implementations unless necessary for route isolation or mobile composition.

## Tests already prepared

- `tests/flare-s8a-preflight.test.mjs`
- `tests/flare-s8a-registration-handoff.test.mjs`
- `tests/flare-s8a-camera-contract.test.mjs`
- `tests/flare-s8a-layout-proof.test.mjs`
- `tests/flare-s8a-mission-copy.test.mjs`
- `tests/flare-s8a-registration-view-model.test.mjs`
- `tests/flare-s8a-replay-context.test.mjs`
- `tests/flare-s8a-result-view-model.test.mjs`
- `tests/flare-s8a-telemetry.test.mjs`
- `tests/flare-s8a-ui-helpers.test.mjs`
- `tests/flare-s8-canonical-run-input.test.mjs`
- E2E scenario fixture: `tests/fixtures/s8a-e2e-scenarios.json`
- camera/layout proof helpers under `tests/helpers/`.

Codex should add only missing integration/browser tests required to prove the runtime wiring.

## Deployment preparation

Only after implementation/test PASS may Codex prepare:

- `docs/WEB_FLARE_S8A_HOSTGATOR_HANDOFF.md`
- `scripts/deploy/hostgator-flare-s8a-deploy.py`

The helper must be bounded to S8A-only public roots and must fingerprint S2-S7.1 before and after deployment. It must not execute deployment.
