# WEB-FLARE S8B Supabase Proof Plan 001

## Status

**CONDITIONAL PROVIDER-PROOF ARTIFACT — DORMANT**

This plan is preserved as candidate application-persistence proof work only. It is **not** a HOTEL prerequisite, does **not** authorize Supabase provisioning, and must not be executed until the separate Dungeon Runner persistence/backend gate is intentionally reopened by the Owner.

## Superseding architecture boundary

Dungeon Runner S8B is now registered in Gamma/HOTEL as a logical control-plane project:

- Gamma project id: `DUNGEON-RUNNER-S8B`
- adapter: `DUNGEON-RUNNER-HOTEL-CONTROL-PLANE-v1`
- boundary: `CONTROL_PLANE_ONLY`
- application persistence: `UNDECIDED_EXTERNAL_TO_GAMMA`
- separate Supabase project required for HOTEL: `false`

The authoritative Dungeon Runner architecture is recorded on:

- repository: `coachtomlim/ruins-api`
- branch: `work/web-flare-s8b-gamma-binding-001`
- accepted head: `2e92639ac77b7ad2be331e456dfe67657e913197`

The persistence assessment at that head establishes:

- HOTEL onboarding/current S8B staging registration does not require cloud application state;
- full accounts, cross-device saved goals, persistent challenges, guest claims, Gold ledger, equipment ownership and progression will require a transactional application backend;
- that future backend must remain outside Gamma Mission Control;
- provider selection remains an Owner gate.

## Historical proof authority

This branch remains:

- repository: `coachtomlim/ruins-api`
- branch: `work/web-flare-s8b-account-proof-001`
- frozen S8A deployed web SHA: `6962696b84f44e7d15bafb770ade92d8eb0ea42b`

The earlier authorization of Supabase Auth + PostgreSQL as an immediate staging proof candidate is superseded. Supabase remains one candidate only.

## Conditional provider proof objective

If the Owner later selects Supabase and intentionally reopens the persistence/backend gate, this proof may be used to demonstrate the minimum authority chain:

`register -> authenticated session -> player profile -> save goal -> one idempotent Builder Gold claim -> player isolation -> sign out`

The proof would need to establish that:

1. the selected auth provider owns credentials/session identity;
2. the transactional application database owns durable game/account state;
3. player isolation prevents cross-player reads/writes;
4. wallet history is append-only and player-scoped;
5. reward settlement is idempotent and server-authoritative;
6. browser code never receives an admin/service secret;
7. saved goals survive session/page reload;
8. sign-out blocks protected operations.

## Conditional Supabase schema

The preserved migration implements only the minimum entities needed for a Supabase-specific proof:

- `player_profile`
- `saved_goal`
- `wallet_ledger`
- `proof_run_award`
- `reward_claim`

`proof_run_award` is a staging-only authority fixture. Authenticated clients cannot create or alter these rows. A future deterministic run verifier/server endpoint would replace this fixture source.

Migration preserved at:

`supabase/migrations/20260914_s8b_account_proof.sql`

Do **not** apply it to Gamma Mission Control, StoryForge Studio, Dreamscape OS, or any other existing Supabase project.

## Idempotent claim model

If this Supabase proof is later authorized, an authenticated client would call `claim_proof_builder_reward(run_award_id, idempotency_key)`.

The database function:

1. resolves `auth.uid()`;
2. locks and validates the governed award belongs to that player;
3. returns an existing claim if already settled;
4. appends exactly one wallet ledger credit using a server-derived unique ledger key;
5. records one reward claim linked to the ledger row;
6. returns the reconciled Gold balance.

The browser does not supply the reward amount.

## Conditional RLS proof matrix

For Player A and Player B prove:

- A can select/update own `player_profile`, not B's;
- A can create/read/delete own `saved_goal`, not B's;
- A can read own `wallet_ledger`, not B's;
- A cannot directly insert/update/delete `wallet_ledger`;
- A cannot directly create/update `proof_run_award`;
- A can claim an award assigned to A;
- B cannot claim A's award;
- repeated claim returns the same settlement and balance without duplicate Gold.

## Current boundaries

Do not:

- create a Dungeon Runner Supabase project merely for HOTEL onboarding;
- use Gamma Mission Control as Dungeon Runner application persistence;
- place auth, gameplay, challenge, run, reward, wallet, inventory, equipment or progression rows in Gamma;
- apply the preserved Supabase migration anywhere until the backend gate is reopened;
- alter S8A live files or routes;
- connect the S8A live registration button to a provider;
- migrate Buddy/Test;
- store provider admin/service secrets in Git or browser code;
- define production prices, drops, trade, or equipment economy;
- settle Hero Gold policy before Owner decision OD-02;
- implement public S8B challenge tokens before OD-07.

## Reopen gate

This proof becomes executable only after the Owner explicitly reopens the Dungeon Runner persistence/backend gate and selects a provider.

At that point:

1. revalidate this schema against the then-current S8B domain model;
2. decide whether Supabase remains the selected provider;
3. provision an application environment outside Gamma;
4. apply a reviewed migration to that application environment only;
5. run security/performance checks and the full isolation/idempotency proof.

## Exit criteria if reopened

Return `S8B SUPABASE PROVIDER PROOF: PASS` only when registration/session, saved goal persistence, idempotent reward claim, player isolation and sign-out are all demonstrated in the selected isolated application environment.

A provider-proof PASS would authorize design continuation, not production launch.
