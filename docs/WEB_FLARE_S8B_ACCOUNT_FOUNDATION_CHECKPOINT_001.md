# WEB-FLARE S8B Account Foundation Checkpoint 001

## Status

`S8B ACCOUNT FOUNDATION BACKEND: PASS`

This checkpoint records the bounded work completed after Supabase Auth + PostgreSQL was selected and its provider proof accepted.

## Authority

Repository:

`coachtomlim/ruins-api`

Active integration branch:

`work/web-flare-s8b-supabase-integration-001`

Frozen live S8A source remains:

`6962696b84f44e7d15bafb770ade92d8eb0ea42b`

Supabase staging:

- project: `Dungeon Runner S8B Staging`
- ref: `qpgwqmduqtqidmhbuclw`
- region: `ap-southeast-1`

Gamma Mission Control remains `CONTROL_PLANE_ONLY`. No player/application state was placed in Gamma.

## Independent reconciliation before implementation

After the managed Auth proof returned PASS, PM independently confirmed the staging proof was clean:

- Auth users: 0
- player profiles: 0
- saved goals: 0
- proof awards: 0
- wallet ledger rows: 0
- reward claims: 0

The provider decision was then reconciled with the later Gamma/HOTEL architecture rather than continuing from the older proof branch alone.

## Durable backend additions

The account foundation now contains:

### `player_runner`

Player-owned Runner record with a stable UUID, template identity and progression version.

### `runner_item_ownership`

Player-owned equipment records with:

- item identity;
- slot;
- acquisition reason;
- source reference;
- idempotency key;
- acquisition/revocation timestamps.

### `runner_loadout`

Seven explicit equipment slots:

- weapon
- shield
- head
- chest
- hands
- legs
- feet

### `ensure_starter_account()`

Authenticated server-authoritative RPC that idempotently provisions:

- one `warrior-l1` Rookie Warrior;
- Wooden Club in WEAPON;
- Wooden Shield in SHIELD;
- HEAD/CHEST/HANDS/LEGS/FEET empty.

Anonymous execution is denied. Direct browser mutation of Runner, ownership and loadout tables is denied; authenticated clients receive read access only.

### `save_account_goal()`

Authenticated server-authoritative saved-goal write boundary.

It derives Runner name/level server-side and accepts only the governed S7/S8 demo runner IDs:

- `warrior-l1`
- `warrior-l2`
- `warrior-l3`

Target HP must be 5..95 in increments of 5. Direct authenticated INSERT/UPDATE/DELETE on `saved_goal` is revoked; clients retain own-row read access through RLS.

## Migrations applied in staging

Provider proof lineage:

1. `s8b_account_proof`
2. `s8b_account_proof_security_hardening`
3. `s8b_account_proof_rls_performance`

Account foundation lineage:

4. `s8b_account_foundation`
5. `s8b_account_foundation_fix`
6. `s8b_account_foundation_fix2`
7. `s8b_account_foundation_privileges`
8. `s8b_account_foundation_indexes`
9. `s8b_account_goal_rpc`

The two small follow-up fixes were discovered by executing the RPCs against staging rather than assuming the migration compiled semantically. They correct PL/pgSQL output-parameter/column ambiguity.

## Independent staging proof

### Starter provisioning

First authenticated call for Player A:

- one Rookie Warrior created;
- Wooden Club ownership created;
- Wooden Shield ownership created;
- one loadout created;
- `starter_created = true`.

Second call for the same Player A:

- exact same Runner UUID;
- exact same Club ownership UUID;
- exact same Shield ownership UUID;
- no duplicate rows;
- `starter_created = false`.

Visible Player A state after provisioning:

- Runners: 1
- owned items: 2
- loadouts: 1
- owned HEAD/CHEST/HANDS/LEGS/FEET items: 0

Player B saw:

- Runners: 0
- owned items: 0
- loadouts: 0

RLS isolation therefore passed.

### Privilege hardening

Verified after explicit revocation:

- authenticated direct `player_runner` INSERT: denied
- authenticated direct `runner_item_ownership` INSERT: denied
- authenticated direct `runner_loadout` UPDATE: denied
- authenticated read of own Runner state: allowed
- anonymous `ensure_starter_account()` execute: denied
- authenticated `ensure_starter_account()` execute: allowed

### Saved-goal boundary

Authenticated Player A saved:

- sender: Tom
- Runner: `warrior-l3`
- server-derived name: Tough Warrior
- server-derived level: 3
- target HP: 60

Readback passed.

Validation proof:

- unknown Runner -> `RUNNER_NOT_ALLOWED`
- target 61 -> `TARGET_HP_NOT_ALLOWED`
- authenticated direct table INSERT -> denied
- authenticated RPC -> allowed
- anonymous RPC -> denied

## Adviser status

Performance adviser no longer reports missing foreign-key indexes. Fresh staging indexes may appear as `unused_index` INFO until normal workload exists.

Security adviser currently reports:

1. authenticated execution of `claim_proof_builder_reward()` SECURITY DEFINER;
2. authenticated execution of `ensure_starter_account()` SECURITY DEFINER;
3. leaked-password protection disabled in Supabase Auth.

The first two are intentional authenticated RPC mutation boundaries and must continue to enforce identity/ownership internally.

Leaked-password protection is a remaining Auth hardening item before production readiness. It is not a reason to expose secrets or weaken Auth configuration.

## Cleanup

All synthetic DB test users and account-foundation rows were deleted after proof.

Final verified staging counts:

- Auth users: 0
- profiles: 0
- saved goals: 0
- Runners: 0
- owned items: 0
- loadouts: 0

## Integration cutline now available

The residual client work may now implement, on S8B only:

- Supabase account/session adapter using the publishable credential only;
- signup pending-email-confirmation state;
- sign-in/session reload/sign-out;
- call `ensure_starter_account()` after authenticated identity exists;
- read authoritative profile/Runner/ownership/loadout state;
- call `save_account_goal()` and read back own saved goal;
- feed the existing Account Ready presentation from authoritative backend state.

Do not yet activate:

- guest reward settlement;
- product use of `claim_proof_builder_reward()`;
- Gold purchases/upgrades;
- persistent challenge issuance;
- post-registration conversion landing assumptions;
- live S8A registration wiring;
- HostGator deployment;
- Vercel.

## Result

The backend prerequisites for the S8B account-foundation client slice are complete and independently exercised against staging.
