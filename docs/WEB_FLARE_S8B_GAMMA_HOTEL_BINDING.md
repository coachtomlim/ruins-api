# WEB-FLARE S8B Gamma / HOTEL Binding

## Decision

Dungeon Runner S8B staging consumes the existing Gamma Mission Control service
as logical project `DUNGEON-RUNNER-S8B`.

No `Dungeon Runner S8B Staging` Supabase project is required for HOTEL. Gamma's
existing Supabase project is shared control-plane infrastructure, not Dungeon
Runner's application backend.

## Gamma-owned state

- logical project identity and lifecycle;
- work items, dependencies, jobs and attempts;
- receipts and bounded evidence references;
- events, gates, exceptions and escalations;
- source repository, branch and accepted-source metadata.

## Dungeon Runner-owned state

- authentication and player profiles;
- challenges, invitations and immutable Runner snapshots;
- runs, result verification and reward claims;
- Gold ledger and derived balances;
- saved goals and dungeons;
- assets, equipment, inventory and progression.

Gamma must not become the authoritative store or transaction path for any
Dungeon Runner-owned state. It may retain opaque references and operational
status needed to coordinate work.

## Persistence gate

The current S8A registration handoff remains memory-only. S8B needs persistent
cloud application state only when real accounts, cross-device continuity,
durable challenges, reward settlement, wallet, ownership or progression are
activated. Backend/provider selection remains a separate Owner gate governed by
`WEB_FLARE_S8B_BACKEND_DECISION_GATE.md`.

If Supabase is selected later, its non-production and production environments
belong to Dungeon Runner application infrastructure outside Gamma.
