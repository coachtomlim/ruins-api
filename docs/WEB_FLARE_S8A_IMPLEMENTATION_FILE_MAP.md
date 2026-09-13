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

## Prepared S8A modules already on branch

Codex should consume these rather than recreate equivalent logic inline:

- `public/flare-s8a/rewards.mjs`
- `public/flare-s8a/reward-teaser.mjs`
- `public/flare-s8a/journey.mjs`
- `public/flare-s8a/receiver-session.mjs`
- `public/flare-s8a/goal.mjs`
- `public/flare-s8a/flow.mjs`
- `public/flare-s8a/mission-copy.mjs`
- `public/flare-s8a/invitation-view-model.mjs`
- `public/flare-s8a/mission-view-model.mjs`
- `public/flare-s8a/budget-view-model.mjs`
- `public/flare-s8a/customize-panels.mjs`
- `public/flare-s8a/customize-view-model.mjs`
- `public/flare-s8a/ready-view-model.mjs`
- `public/flare-s8a/runtime-view.mjs`
- `public/flare-s8a/camera-controller.mjs`
- `public/flare-s8a/runtime-hud-view-model.mjs`
- `public/flare-s8a/result-view-model.mjs`
- `public/flare-s8a/replay-context.mjs`
- `public/flare-s8a/canonical-run-input.mjs`
- `public/flare-s8a/registration-handoff.mjs`
- `public/flare-s8a/registration-view-model.mjs`
- `public/flare-s8a/registration-action-state.mjs`
- `public/flare-s8a/error-view-model.mjs`
- `public/flare-s8a/screen-shell.mjs`
- `public/flare-s8a/focus-policy.mjs`
- `public/flare-s8a/mobile-policy.mjs`
- `public/flare-s8a/share-copy.mjs`
- `public/flare-s8a/target-fit.mjs`
- `public/flare-s8a/target-fit-action.mjs`
- `public/flare-s8a/telemetry.mjs`
- barrel entry point: `public/flare-s8a/prepared.mjs`
- mobile tokens: `public/flare-s8a/tokens.css`
- viewport panel shell styles: `public/flare-s8a/panel-shell.css`

## Prepared verification tools

- local route-aware preview server: `tools/flare-s8a-preview-server.mjs`
- history-independent frozen predecessor verifier: `tools/verify-frozen-web-trees.mjs`
- expected predecessor tree identities: `tools/frozen-web-trees.json`

Use `npm run verify:frozen` to verify S2-S7.1 without requiring historical commit objects in a shallow clone.

Use `npm run test:s8a-preflight` for the focused S8 preflight tests before the complete repository suite.

## Expected S8A runtime surface still to integrate in one go

Codex should add the smallest coherent browser integration under `public/flare-s8a/`, expected to include:

- `index.html`
- `builder.mjs`
- `challenge.html`
- `challenge.mjs`
- final integration `style.css` if the prepared shell/tokens need composition rules
- thin re-export/adaptor modules for accepted S7/S7.1 runtime components where useful.

`flow.mjs` is already prepared and owns the isolated `/m/XXXX` invitation contract.

Do not duplicate large predecessor implementations unless necessary for route isolation or mobile composition.

## Tests already prepared

In addition to the earlier S8 tests, prepared tests now cover:

- isolated `/m/XXXX` encoding/routing
- mission intent and reward cue
- dungeon budget versus reward Gold
- panel customization
- ready-to-run state
- invitation state
- runtime HUD Gold semantics
- error recovery states
- registration account-service boundary
- receiver session continuity through replay/edit/registration
- panel shell and focus behavior
- mobile policy and design-token minima
- share copy
- explicit versioned goal model
- reward teaser tiers
- golden L3/60 journey
- shallow-clone-safe frozen tree verification
- preview-server route isolation
- test fixture: `tests/fixtures/s8a-mobile-panels.html`
- E2E scenario fixture: `tests/fixtures/s8a-e2e-scenarios.json`
- camera/layout proof helpers under `tests/helpers/`.

Codex should add only missing integration/browser tests required to prove actual DOM wiring, animation, runtime simulation, phone layout and final reward/registration navigation.

## Deployment preparation

Only after implementation/test PASS may Codex prepare:

- `docs/WEB_FLARE_S8A_HOSTGATOR_HANDOFF.md`
- `scripts/deploy/hostgator-flare-s8a-deploy.py`

The helper must be bounded to S8A-only public roots and must fingerprint S2-S7.1 before and after deployment. It must not execute deployment.
