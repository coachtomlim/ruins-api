# WEB-FLARE S8 Master Execution Plan

## Operating rule

Do not touch Vercel.

No Vercel project changes, preview deployments, environment-variable changes, domain changes, build settings or routing changes are authorized by S8 planning.

The accepted public deployment path remains HostGator and must stay isolated until the S8A build passes locally/browser-side and a separate deployment authorization is given.

## Current live authority

Accepted live baseline: S7.1.

S7.1 remains frozen and usable as the rollback baseline.

S8 work remains additive on:

`work/web-flare-s8a-rewards-replay-001`

## Plan-first rule

Before the next implementation build, freeze the S8A product/UX/logic contracts and the S8B account/persistence contracts. Do not keep making piecemeal runtime changes while requirements are still moving.

The next executable implementation should happen as one bounded Codex build against the frozen S8 plan.

## S8A one-go implementation scope

The next Codex build should integrate, not reinvent, the prepared modules and contracts into one coherent mobile-first S8A runtime.

Required product flow:

`INVITATION -> MISSION + DUNGEON -> OPTIONAL CUSTOMIZE -> READY -> RUN -> REWARDS -> REGISTRATION GATE`

### Invitation

- `DUNGEON RUNNER`
- real animated Hero-Runner stance
- friend challenge copy
- large `ACCEPT CHALLENGE`

### Mission + Dungeon

Must visibly communicate without scrolling:

- `GET THE HERO TO THE EXIT AT ~[TARGET]% HP`
- `Closer to the target = higher score + more gold.`
- `Do not kill the Hero. The Hero must clear the dungeon.`
- `CLEAR NEAR [TARGET]% HP · WIN UP TO 25 GOLD`

Use target-fit language rather than lethality-oriented difficulty language:

- `TOO GENTLE`
- `CLOSE TO TARGET`
- `TOO HARSH`

### Dungeon choice

- one room at a time
- swipe / large arrows
- `USE THIS DUNGEON`
- `CUSTOMIZE - OPTIONAL`

### Customization

- dedicated panel, not a long page
- tabs/panels: MONSTERS / TRAPS / SUPPORTS
- one category visible at a time
- `DUNGEON BUDGET [USED] / 100` always visible
- large `DONE`
- preserve zero-customization path

### Ready

- concise target, room and build summary
- `RUN THE HERO`
- `EDIT DUNGEON`

### Runtime

- preserve deterministic simulation
- working `OVERVIEW` showing materially wider dungeon composition
- active overview control becomes `FOLLOW HERO`
- switching back restores tracked Hero camera
- Pause/Resume remains functional

### Rewards

Dedicated full-screen reward panel, not a battlefield overlay.

Show separately:

- `[NAME]'S HERO EARNED` -> actual Hero gold
- `YOU EARNED` -> Dungeon Builder gold

Builder reward requires a successful Hero clear and follows the governed score bands.

If Hero does not clear:

- `HERO DID NOT CLEAR`
- Builder reward = 0 Gold

Actions:

- `RUN AGAIN`
- `EDIT THIS DUNGEON`
- `SAVE THIS GOAL & BUILD YOUR OWN`

Run Again preserves exact gameplay inputs and deterministic result.

Edit This Dungeon preserves room and current selections.

### Registration gate

Open a dedicated:

`CREATE YOUR DUNGEON RUNNER ACCOUNT`

Carry current sender/runner/target/reward-preview context in memory only.

S8A must not:

- route to Buddy/Test
- collect credentials
- claim persistence
- create a wallet
- use localStorage/sessionStorage/IndexedDB/cookies as account authority

## S8A test gate

The one-go build must execute the prepared unit/contract tests and browser scenarios, including:

- 360x800
- 390x844
- 430x932
- no-scroll mission comprehension
- large touch targets
- panel-based customization
- target-fit language
- build-budget vs reward-Gold distinction
- camera geometry proof
- deterministic Run Again
- Edit This Dungeon preservation
- reward ownership separation
- failure reward = 0 Builder Gold
- registration gate never exposes Buddy/Test
- route isolation `/m/XXXX`
- S2-S7.1 frozen-file verification

## S8B planning only during S8A build

Do not implement real accounts/backend as part of S8A.

Prepared S8B authority includes:

- auth state machine
- account UX
- provider-neutral data model
- saved goals/assets/challenges/runs
- append-only Gold ledger
- idempotent guest claim
- authorization/RLS expectations
- security test matrix
- dual-party reward settlement
- persistent invite identity evolution
- prototype login retirement

## Backend decision gate

No backend provider is authorized yet.

Supabase Auth + PostgreSQL is the leading candidate for a bounded staging proof because it offers managed authentication, relational transactions and row-level security.

If selected later, run one isolated staging proof before production implementation.

Do not touch Vercel as part of that proof unless the Owner explicitly changes hosting authority.

## Deployment gate

After Codex returns a clean S8A candidate:

1. audit branch/commit against this plan;
2. verify predecessor freeze;
3. verify complete unit/browser gates;
4. select one deployable S8A web SHA;
5. only then prepare/execute the bounded HostGator deployment in one controlled pass;
6. write only S8A roots and preserve all old routes;
7. complete live mobile acceptance;
8. freeze S8A only after live PASS.

## Rollback

If S8A live acceptance fails, S7.1 remains the accepted public fallback. No rollback should require overwriting S7.1 because S8A remains route-isolated.
