# WEB-FLARE S8 Background Preflight Checkpoint

Purpose: durable recovery point for background preparation before the next live build. No HostGator deployment has been performed by this work.

Branch: `work/web-flare-s8a-rewards-replay-001`

Accepted live predecessor remains S7.1.

## Completed S8A background preparation

1. Pure reward contract: `public/flare-s8a/rewards.mjs`.
2. Receiver journey state machine: `public/flare-s8a/journey.mjs`.
3. Reward and journey tests: `tests/flare-s8a-preflight.test.mjs`.
4. Memory-only registration handoff: `public/flare-s8a/registration-handoff.mjs`.
5. Registration handoff tests: `tests/flare-s8a-registration-handoff.test.mjs`.
6. Mobile acceptance contract: `docs/WEB_FLARE_S8A_MOBILE_ACCEPTANCE_CONTRACT.md`.
7. Overview camera proof helper and tests.
8. Mission, reward and registration copy helpers: `public/flare-s8a/mission-copy.mjs` plus tests.
9. Canonical mobile UI state contract: `docs/WEB_FLARE_S8A_UI_STATE_CONTRACT.md`.
10. End-to-end browser scenario matrix: `docs/WEB_FLARE_S8A_E2E_SCENARIO_MATRIX.md`.
11. Touch/readability contract: `docs/WEB_FLARE_S8A_ACCESSIBILITY_TOUCH_CONTRACT.md`.
12. Layout/camera measurement helpers and tests: `tests/helpers/s8a-layout-proof.mjs`, `tests/flare-s8a-layout-proof.test.mjs`.
13. Frozen receiver copy deck: `docs/WEB_FLARE_S8A_COPY_DECK.md`.
14. Browser acceptance fixtures: `tests/fixtures/s8a-e2e-scenarios.json`.
15. Pure runtime camera-mode helper: `public/flare-s8a/runtime-view.mjs`.
16. Pure customization-panel helper: `public/flare-s8a/customize-panels.mjs`.
17. UI helper tests: `tests/flare-s8a-ui-helpers.test.mjs`.
18. Privacy-safe telemetry event contract: `docs/WEB_FLARE_S8A_TELEMETRY_EVENT_CONTRACT.md`.
19. Injectable/no-op-capable telemetry helper and tests: `public/flare-s8a/telemetry.mjs`, `tests/flare-s8a-telemetry.test.mjs`.

## Completed S8B background preparation

1. Account/persistence design: `docs/WEB_FLARE_S8B_ACCOUNT_PERSISTENCE_CONTRACT.md`.
2. Provider-neutral auth state machine: `docs/WEB_FLARE_S8B_AUTH_STATE_MACHINE.md`.
3. Append-only gold ledger and idempotency contract: `docs/WEB_FLARE_S8B_LEDGER_IDEMPOTENCY_CONTRACT.md`.
4. Asset ownership contract: `docs/WEB_FLARE_S8B_ASSET_OWNERSHIP_CONTRACT.md`.
5. Canonical challenge and run record contract: `docs/WEB_FLARE_S8B_CHALLENGE_RUN_RECORD_CONTRACT.md`.
6. Provider-neutral account/persistence API contract: `docs/WEB_FLARE_S8B_API_CONTRACT.md`.
7. Account backend option assessment: `docs/WEB_FLARE_S8B_ACCOUNT_BACKEND_OPTIONS.md`.
8. Prototype `Buddy / Test` retirement plan: `docs/WEB_FLARE_S8B_PROTOTYPE_LOGIN_RETIREMENT.md`.
9. Release/rollback contract preserving isolated S8A and S7.1 rollback: `docs/WEB_FLARE_S8_RELEASE_ROLLBACK_CONTRACT.md`.

## Recent commit checkpoints

- `f46c661424b3b3d5c6324ad262f90e46e2776adb` mission/reward copy helper
- `13269cabf6b6014df62b5036e766c00259a54955` mission/reward copy tests
- `bc29c70cf229ae59b200496a038e2aff5a4c48e3` UI state contract
- `f865f088fffa8296a1553c2027462a9c7e7dc09d` E2E scenario matrix
- `727890dae34af1e027e44260f202db562f4295f0` accessibility/touch contract
- `6d8e7cdcd714ec41bb03181ce630ca1709e7bb73` layout proof helper
- `8fbbc250bdf094af5223ccb97380c888c7c3cd2a` layout proof tests
- `8ba578e548649ca67023b20bf2d6d5458a44999e` auth state machine
- `11257417ddeec60d893b7d984203e18b68703a6e` ledger/idempotency contract
- `118b26fe25b2a34beb2024ddf520c628489d18cd` asset ownership contract
- `8078972d6f0c69bddbdb1af20469c7f2383add07` challenge/run record contract
- `6e03826cf20f69ec36f4767345099b425bdafe59` release/rollback contract
- `d64c0d3068d1f0edddbcc96761353d5dce5fab13` backend option assessment
- `4a364da2a98c267510b097ae44405407cf105f95` receiver copy deck
- `9b1a172a8658fd76e6add07bab681a106f632785` E2E scenario fixtures
- `985a715c48bab5c2c5e541ca7f5d54ba3f217e20` camera-mode helper
- `7f459b91091d1dd3901dc449138f9034d48c6cfa` customization-panel helper
- `8becf68977b7263c915661a620f960729782bc54` UI helper tests
- `f1cf4e895ca6329896dbf3a43a899db9c6408d17` API contract
- `2b6eb761a53543aee4f1cb46e8d0b3b843a779a6` prototype login retirement
- `78b25313d89be327cdd982cbb9ca487bc99af3d1` telemetry event contract
- `90159be8a7107f69d06b1f06ba7f332996c92673` telemetry helper
- `d0700563d2bf351fe4967e5a40f398329e98a834` telemetry tests

Earlier checkpoints remain valid and are in branch history.

## Explicitly not done

- no HostGator deployment
- no live S7.1 modification
- no real account service
- no database mutation
- no browser-based wallet persistence
- no gameplay rebalance
- no production telemetry transmission

## Next build

Codex should consume these files as existing preflight authority rather than recreate them. It should integrate the pure modules into S8A, run the complete suite, execute every browser scenario, prove phone layout and Overview camera behavior, and only then prepare a deployable S8A source SHA.
