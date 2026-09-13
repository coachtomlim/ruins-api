# WEB-FLARE S8 Background Preflight Checkpoint

Purpose: durable recovery point for background preparation before the next live build. No HostGator deployment has been performed by this work.

Branch: `work/web-flare-s8a-rewards-replay-001`

Accepted live predecessor remains S7.1.

## Completed S8A background preparation

1. Pure reward contract: `public/flare-s8a/rewards.mjs`.
2. Receiver journey state machine: `public/flare-s8a/journey.mjs`.
3. Reward and journey tests: `tests/flare-s8a-preflight.test.mjs`.
4. Memory-only registration handoff and tests.
5. Mobile acceptance and camera proof contracts/tests.
6. Mission/reward/registration copy helper and tests.
7. Canonical mobile UI state contract.
8. End-to-end browser scenario matrix and fixtures.
9. Touch/readability and single-viewport panel layout contracts.
10. Layout/camera measurement helpers and tests.
11. Frozen receiver copy deck.
12. Pure runtime camera-mode helper.
13. Pure customization-panel helper.
14. Privacy-safe telemetry contract, helper and tests.
15. Error/recovery contract for invalid invites, asset failures and interrupted guest runs.
16. Mobile performance budget.
17. Reward result view model and tests.
18. Canonical deterministic run-input serializer and tests.
19. Replay/edit context preservation helper and tests.
20. Registration gate view model and tests.

## Completed S8B background preparation

1. Account/persistence design.
2. Provider-neutral auth state machine.
3. Append-only gold ledger and idempotency contract.
4. Asset ownership contract.
5. Canonical challenge and run record contract.
6. Provider-neutral account/persistence API contract.
7. Account backend option assessment.
8. Prototype `Buddy / Test` retirement plan.
9. Release/rollback contract preserving isolated S8A and S7.1 rollback.
10. Guest claim security contract.
11. Player-data authorization/RLS contract.
12. Security test matrix.
13. Account UX contract.
14. Provider-neutral data model.
15. Data lifecycle contract.
16. Backend decision gate, with Supabase Auth + PostgreSQL as the leading candidate for evaluation but not yet authorized.

## Recovery manifest

Machine-readable inventory: `docs/WEB_FLARE_S8_PREFLIGHT_MANIFEST.json`.

## Latest commit checkpoints

- `fc9ff59769b290d0fd19beb80e0fd2797161a356` S8A error/recovery contract
- `9cf844237030a48bbc78666ba938e658a473700a` S8A mobile performance budget
- `ff81b31a99db75ba4c77444c4e7ac3a561b11734` S8B guest claim security contract
- `da62f981c8a26124d4604d5255e53fa7db2e7c0e` S8B authorization contract
- `b25cfe7e6dcc245da423cada147d4425e54b12b9` S8A single-viewport panel layout contract
- `67aab11c8e7ec4e7c17532bc79672fffa76a8d32` S8A result view model
- `3e88505245572b221df06c5bf3d4ca006590b334` result view-model tests
- `3f63dfca959d75c5d8f10e4c912598be116007c5` canonical run-input serializer
- `65f130bc7b4c95c7c666e31cb3f80eea6a0e99b2` canonical run-input tests
- `3cd5408eb7fdb7cdec10f278f58bac381287dd2e` replay/edit context helper
- `4d41d71f92c42d5e165b405d958f5cb7d5e840bf` replay/edit context tests
- `bc2cf56db636b2bc37e61e19d53828b64c9503a7` registration view model
- `3fb62d0e08d6000101c38920304936ee4fbb54c1` registration view-model tests
- `ebc3e39efcf23e3a52d5e9e09abc2848be616fc3` S8B security test matrix
- `b1edbd8ebdb68ce3c49ad932a85d190ecdf6b683` S8B account UX contract
- `11c2142950560bacc73e174f78838bab712f9a0d` S8B data model
- `e0534e181346f2264f132ee28308ed5dbad8e628` S8B data lifecycle contract
- `258bbd98829a981d83cbe3abded5006994db406b` machine-readable preflight manifest
- `bf23bb6b1a36b46f3401a537aafac787b37c1ce4` S8B backend decision gate

Earlier checkpoints remain valid in branch history and can be recovered individually.

## Explicitly not done

- no HostGator deployment
- no live S7.1 modification
- no real account service
- no database mutation
- no browser-based wallet persistence
- no gameplay rebalance
- no production telemetry transmission
- no backend/provider selection has been authorized

## Next build

Codex should consume these files as existing preflight authority rather than recreate them. It should integrate the pure modules into S8A, run the complete suite, execute every browser scenario, prove phone layout and Overview camera behavior, and only then prepare a deployable S8A source SHA.
