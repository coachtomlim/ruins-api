# WEB-FLARE S8 Background Preflight Checkpoint

Purpose: durable recovery point for background preparation before the next live build. No HostGator deployment has been performed by this work.

Branch: `work/web-flare-s8a-rewards-replay-001`

Accepted live predecessor remains S7.1.

## Completed S8A background preparation

1. Pure reward contract and reward tests.
2. Receiver journey state machine.
3. Memory-only registration handoff and registration view model.
4. Mission/reward copy helpers.
5. Result view model.
6. Canonical deterministic run-input serializer.
7. Replay/edit context preservation helper.
8. Runtime camera-mode helper.
9. Customization-panel helper.
10. Privacy-safe/no-op-capable telemetry helper.
11. Mobile acceptance, touch/readability and single-viewport panel-layout contracts.
12. Overview camera geometry proof helper and tests.
13. Mobile layout measurement helper and tests.
14. End-to-end scenario matrix and browser fixtures.
15. Frozen receiver copy deck.
16. Error/recovery contract.
17. Mobile performance budget.
18. Complete authority precedence file.
19. One-go implementation cutline.
20. Implementation file map.
21. Binary acceptance scorecard.
22. HostGator one-pass deployment plan.
23. Codex single-entry execution packet.
24. Implementation risk register.
25. Owner manual acceptance script.

## Completed S8B background preparation

1. Account/persistence design.
2. Provider-neutral auth state machine.
3. Append-only Gold ledger and idempotency contract.
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
16. Backend decision gate. Supabase Auth + PostgreSQL remains the leading candidate for later evaluation but is not authorized.
17. Open-decision register for reward settlement, failed-run Hero Gold, sender identity, reward economy and challenge lifetime.

## Recovery manifest

Machine-readable inventory: `docs/WEB_FLARE_S8_PREFLIGHT_MANIFEST.json`.

## Latest planning checkpoints

- `f626a1e7bbc326cc7eeb244092b21242917e556c` authority precedence
- `5662d328af07d64ca8952722f7dbab6ad21c66b7` implementation cutline
- `db0b26a824037388c7d9ce6fbdad25244080603d` implementation file map
- `696e83b1200235fec68937223c952eed9b1746b4` acceptance scorecard
- `15ee616b578439512edbe35f8410a1cb3cae98a5` HostGator one-pass deployment plan
- `dfaa119283713e88ee7c2278bd12b2960869a6f3` Codex execution packet
- `6581274c80d29f949624af803d2d71b6b4628675` risk register
- `e5888bed73df93f7b57ae334b05c1e262328bc7c` Owner acceptance script

Earlier checkpoints remain valid in branch history and can be recovered individually.

## Operating restrictions

- no HostGator deployment during planning
- no live S7.1 modification
- no real account service
- no database mutation
- no browser-based wallet persistence
- no gameplay rebalance
- no production telemetry transmission
- no backend/provider selection authorized
- no Vercel operation of any kind

## Next build

Codex must treat `docs/WEB_FLARE_S8A_CODEX_EXECUTION_PACKET.md` as the single entry point, consume the prepared modules/contracts/tests, implement S8A once in a bounded integration build, run the complete focused-to-full test sequence, and only then identify one deployable S8A web SHA and prepare but not execute the HostGator handoff.
