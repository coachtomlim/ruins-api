# WEB-FLARE S8B Pre-Persistence Execution Cutline

## Purpose

Define what S8B work may proceed while the Dungeon Runner persistence/backend gate remains closed.

This cutline sits under the accepted Gamma/HOTEL architecture:

- Gamma logical project: `DUNGEON-RUNNER-S8B`
- adapter: `DUNGEON-RUNNER-HOTEL-CONTROL-PLANE-v1`
- boundary: `CONTROL_PLANE_ONLY`
- application persistence: `UNDECIDED_EXTERNAL_TO_GAMMA`

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

## Work prohibited until backend gate reopens

Do not:

- provision a Dungeon Runner application Supabase project/branch or equivalent provider environment;
- apply the preserved Supabase proof migration;
- put Dungeon Runner application data in Gamma Mission Control;
- activate real registration/login/session persistence;
- activate cross-device saved goals;
- activate persistent challenge records;
- activate guest-to-account reward settlement;
- activate durable Gold wallet/ledger;
- activate persistent equipment ownership/loadouts;
- activate persistent purchases/upgrades;
- expose service/admin secrets to browser code;
- mutate live S8A account gate into a fake persisted experience.

## Preserved conditional provider-proof artifacts

The branch `work/web-flare-s8b-account-proof-001` remains conditional evidence only.

Preserved artifacts:

- `docs/WEB_FLARE_S8B_SUPABASE_PROOF_PLAN_001.md`
- `supabase/migrations/20260914_s8b_account_proof.sql`
- `docs/WEB_FLARE_S8B_ACCOUNT_PROOF_RECONCILIATION_001.md`

They may be reconsidered only when the Owner intentionally reopens the application persistence/backend gate.

## Immediate recommended S8B workstream

Proceed with `S8B-PRE-PERSISTENCE-001`:

1. audit existing S8A/S8B pure modules against this cutline;
2. define one backend-neutral `DungeonRunnerAccountPort` contract;
3. align saved-goal, reward-claim, wallet, Runner progression, equipment ownership and challenge DTOs behind that port;
4. build a memory-only test adapter for automated contract tests only;
5. run progression/economy calibration without locking prices until Owner review;
6. keep all live S8A routes and behavior frozen.

A memory-only adapter is test infrastructure only. It must never be described as durable account storage or shipped as persistence authority.

## Reopen trigger

The backend gate should be reopened only when S8B is ready to activate one or more of:

- real accounts/session identity;
- cross-device saves;
- persistent public challenges;
- durable reward claims/Gold;
- durable equipment ownership/progression.

At that point the Owner selects the application backend and authorizes a bounded provider proof outside Gamma.
