# WEB-FLARE S8B Supabase Proof Plan 001

## Authority

Owner has authorized Supabase Auth + PostgreSQL as the S8B staging/proof candidate.

This is a staging proof only. It does not authorize production account rollout, migration of S8A, or live wallet persistence.

## Git authority

- repository: `coachtomlim/ruins-api`
- branch: `work/web-flare-s8b-account-proof-001`
- branch base: S8A live-lock commit `e133e8baaf32be3f8ce67b742beefbf9e64fb308`
- frozen S8A deployed web SHA: `6962696b84f44e7d15bafb770ade92d8eb0ea42b`

S8A remains a frozen predecessor.

## Provider proof objective

Prove the minimum authority chain before broader S8B implementation:

`register -> authenticated session -> player profile -> save goal -> one idempotent Builder Gold claim -> player isolation -> sign out`

The proof must establish that:

1. Supabase Auth owns credentials/session identity.
2. PostgreSQL owns durable game/account state.
3. RLS prevents cross-player reads/writes.
4. wallet history is append-only and player-scoped.
5. reward settlement is idempotent and server-authoritative.
6. browser code never receives a service-role/admin secret.
7. saved goals survive session/page reload.
8. sign-out blocks protected operations.

## Proof schema

The initial migration intentionally implements only the minimum entities needed for the provider proof:

- `player_profile`
- `saved_goal`
- `wallet_ledger`
- `proof_run_award`
- `reward_claim`

`proof_run_award` is a staging-only authority fixture. Authenticated clients cannot create or alter these rows. A future deterministic run verifier/server endpoint will replace this fixture source.

## Idempotent claim model

Authenticated client calls `claim_proof_builder_reward(run_award_id, idempotency_key)`.

The database function:

1. resolves `auth.uid()`;
2. locks and validates the governed award belongs to that player;
3. returns an existing claim if already settled;
4. appends exactly one wallet ledger credit using a server-derived unique ledger key;
5. records one reward claim linked to the ledger row;
6. returns the reconciled Gold balance.

The browser does not supply the reward amount.

## RLS proof matrix

For Player A and Player B prove:

- A can select/update own `player_profile`, not B's;
- A can create/read/delete own `saved_goal`, not B's;
- A can read own `wallet_ledger`, not B's;
- A cannot directly insert/update/delete `wallet_ledger`;
- A cannot directly create/update `proof_run_award`;
- A can claim an award assigned to A;
- B cannot claim A's award;
- repeated claim returns the same settlement and balance without duplicate Gold.

## Staging-only boundaries

Do not:

- alter S8A live files or routes;
- connect S8A live registration button to Supabase;
- deploy account code to HostGator;
- migrate Buddy/Test;
- store service-role keys in Git or browser code;
- define production prices, drops, trade, or equipment economy;
- settle Hero Gold policy before Owner decision OD-02;
- implement public S8B challenge tokens before OD-07.

## Provider-creation gate

A new isolated Supabase project is preferred over reusing existing unrelated projects. Creating a Supabase project requires explicit Owner confirmation of organization and displayed cost before mutation.

Once the staging project exists, apply `supabase/migrations/20260914_s8b_account_proof.sql`, run security/performance advisors, and execute the proof matrix.

## Exit criteria

Return `S8B SUPABASE PROVIDER PROOF: PASS` only when registration/session, saved goal persistence, idempotent reward claim, RLS isolation and sign-out are all demonstrated in the isolated staging project.

A provider proof PASS authorizes design continuation, not production launch.
