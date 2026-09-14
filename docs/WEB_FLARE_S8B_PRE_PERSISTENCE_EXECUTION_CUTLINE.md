# WEB-FLARE S8B Pre-Persistence Execution Cutline

> **STATUS: SUPERSEDED FOR APPLICATION-PERSISTENCE GATING.** The Owner has reopened the backend gate and selected Supabase Auth + PostgreSQL after the provider proof passed. See `docs/WEB_FLARE_S8B_SUPABASE_SELECTION_AND_PROOF_ACCEPTANCE.md`. The Gamma/HOTEL `CONTROL_PLANE_ONLY` boundary below remains authoritative.

## Purpose

Define what S8B work may proceed while the Dungeon Runner persistence/backend gate remains closed.

This cutline sits under the accepted Gamma/HOTEL architecture:

- Gamma logical project: `DUNGEON-RUNNER-S8B`
- adapter: `DUNGEON-RUNNER-HOTEL-CONTROL-PLANE-v1`
- boundary: `CONTROL_PLANE_ONLY`
- application persistence: originally `UNDECIDED_EXTERNAL_TO_GAMMA`, now Supabase Auth + PostgreSQL under Dungeon Runner authority

Gamma is orchestration infrastructure only. It is not the Dungeon Runner application database.

## Work allowed now

The following may proceed without selecting or provisioning an application backend.

### 1. Pure game-domain contracts

- immutable Runner/challenge snapshot model;
- effective stat composition;
- equipment slot semantics;
- source-neutral acquisition provenance;
- reward calculation and settlement-intent contracts;
- Gold ledger entry shapes and idempotency semantics;
- saved-goal/challenge/run DTOs;
- deterministic validation rules;
- progression feasibility against the 100-point Dungeon Budget.

These remain pure logic/data contracts and must not imply persistence exists.

### 2. Backend-neutral UI/UX

Prepare states and view models for:

- account-required gate;
- account-ready landing;
- Runner profile/loadout;
- Gold balance presentation;
- Stats / Equipment / Armor navigation;
- gear acquisition reveal;
- inventory/loadout management;
- purchase confirmation intent;
- reward-claim intent;
- saved-goal continuation.

All such UI must accept injected state/adapters. No browser storage may be treated as account authority.

### 3. Economy and challengeability calibration

Proceed with deterministic simulations to propose:

- stat upgrade increments;
- candidate Gold prices;
- equipment modifier bands;
- equipment acquisition pacing;
- progression caps/tiers;
- safeguards that keep the 100-point Dungeon Budget capable of challenging progressed Runners.

These outputs are recommendations for Owner decision, not locked economy values until accepted.

### 4. Backend-neutral application boundary

Define an application persistence interface that can later be implemented by the selected provider, covering operations such as:

- get/create player profile;
- load/save goal;
- load Runner progression;
- list owned equipment;
- equip owned item;
- quote/commit progression purchase;
- submit governed run evidence;
- claim reward idempotently;
- load derived Gold balance;
- create/load persistent challenge.

The interface must not expose provider-specific SQL, auth tokens or service secrets to game-domain code.

### 5. HOTEL/Gamma coordination metadata

Continue project-management/orchestration registration, work items, dependencies, evidence and execution status through Gamma/HOTEL.

Gamma may store opaque references to an eventual application environment after one exists, but no player/gameplay application records.

## Historical work prohibition while gate was closed

The following restrictions applied until the Owner reopened the backend gate:

- no Dungeon Runner application provider provisioning;
- no provider migration application;
- no application data in Gamma Mission Control;
- no real registration/session persistence;
- no cross-device saves;
- no persistent challenges/reward settlement/Gold/equipment/progression;
- no service/admin secrets in browser code;
- no mutation of live S8A into a fake persisted experience.

The first two restrictions are now superseded by the accepted Supabase selection. All security, Gamma-boundary and S8A-live protections remain in force.

## Preserved provider-proof artifacts

The branch `work/web-flare-s8b-account-proof-001` remains evidence of the bounded provider proof.

Preserved artifacts include:

- `docs/WEB_FLARE_S8B_SUPABASE_PROOF_PLAN_001.md`
- proof migrations under `supabase/migrations/`
- `docs/WEB_FLARE_S8B_SUPABASE_PROOF_CHECKPOINT_001.md`
- `docs/WEB_FLARE_S8B_AUTH_CONFIRMATION_PROOF_DECISION.md`

Proof-only database structures are not automatically production schema authority.

## Current workstream

The active workstream is now defined by:

`docs/WEB_FLARE_S8B_SUPABASE_SELECTION_AND_PROOF_ACCEPTANCE.md`

on:

`work/web-flare-s8b-supabase-integration-001`

It begins with the account foundation slice and deliberately excludes guest reward settlement until the remaining settlement-policy decision is closed.

## Historical reopen trigger

This gate was to reopen when S8B was ready to activate real accounts/session identity, cross-device saves, persistent challenges, durable rewards/Gold, or durable equipment/progression.

That trigger has now occurred. The Owner selected Supabase and the isolated provider proof passed.
