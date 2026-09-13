# WEB-FLARE S8 Pre-Codex Freeze 001

## Purpose

Freeze the background-preparation state before the one-go S8A integration build.

## Branch and authority

Branch:

`work/web-flare-s8a-rewards-replay-001`

Pre-Codex authority head at freeze creation:

`28fbb129ba5402b6a8f9d64ea79c35a9abbd31f0`

Live predecessor remains S7.1. No HostGator deployment is authorized by this freeze. Vercel remains out of scope and branch auto-deploy protection must remain in place.

## S8A implementation scope now sufficiently prepared

The next implementation build should consume the existing prepared modules and contracts rather than redesign them.

S8A must integrate:

- receiver invitation -> mission/dungeon -> optional customization -> ready -> run -> rewards -> registration gate;
- precision-clear mission language and reward incentive;
- clear-only Builder Gold;
- separate Hero Gold and Builder Gold presentation;
- Run Again and Edit This Dungeon preservation;
- Overview / Follow Hero camera behavior with measurable geometry proof;
- portrait-phone panel UX with large controls and no critical below-fold actions;
- explicit Wooden Club + Wooden Shield starter gear while preserving accepted effective L1/L2/L3 stats;
- no starter head/chest/hands/legs/feet armor;
- stock Flare `club` + `buckler` visual composition in S8A only;
- memory-only registration handoff with no real credentials or persistence;
- isolated `/m/XXXX` receiver route with legacy routes frozen.

## Later progression preparation already available but excluded from S8A activation

Prepared architecture now supports:

- individual equipment slots: weapon, shield, head, chest, hands, legs, feet;
- canonical item definitions separated from purchase offers;
- starter Club + Shield ownership;
- permanent stat upgrades;
- account gear instances;
- Gold purchase acquisition;
- dungeon-run/drop acquisition;
- acquisition provenance independent of combat semantics;
- future trade-compatible ownership shape without an active trade system;
- identical item modifiers for Runner and monster equipment;
- immutable progressed Runner challenge snapshots;
- append-only Gold ledger and idempotent progression mutations;
- mobile gear/inventory/acquisition presentation;
- stock-Flare visual mappings for starter gear and candidate later equipment.

These modules are preparation only. S8A must not expose live shop, drop, inventory persistence, trade, wallet or account features.

## Open decisions that do not block S8A

Do not ask the Owner to decide these before the S8A build:

- exact Gold prices;
- later item stat modifiers;
- drop probability/rarity;
- duplicate-item policy;
- exact persistent reward settlement rule;
- backend/auth provider;
- future trade/exchange rules;
- later progression caps/level mapping.

## Required Codex sequence

1. Confirm this branch and authority lineage before mutation.
2. Read `WEB_FLARE_S8_AUTHORITY_PRECEDENCE.md` and `WEB_FLARE_S8A_CODEX_EXECUTION_PACKET.md` first.
3. Run cheap S8 preflight tests before integration.
4. Implement the complete S8A browser integration in one bounded pass.
5. Run frozen-predecessor verification, source/asset verification, focused tests, mobile browser journeys and final suite once.
6. Do not deploy HostGator or Vercel.
7. Return exact ending SHA, deployable web SHA and evidence.

## Recovery rule

If a timeout/outage occurs, use this freeze document plus Git history rather than reconstructing design from chat memory. Do not reset or rebase the branch to an earlier S7 state.
