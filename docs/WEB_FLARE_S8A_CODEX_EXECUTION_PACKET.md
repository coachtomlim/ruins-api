# WEB-FLARE S8A Codex Execution Packet

This is the single entry point for the next implementation build.

## Branch

`work/web-flare-s8a-rewards-replay-001`

Do not recreate, reset or rebase the branch.

## Read first

1. `docs/WEB_FLARE_S8_AUTHORITY_PRECEDENCE.md`
2. `docs/WEB_FLARE_S8_MASTER_EXECUTION_PLAN.md`
3. `docs/WEB_FLARE_S8A_IMPLEMENTATION_CUTLINE.md`
4. `docs/WEB_FLARE_S8A_IMPLEMENTATION_FILE_MAP.md`
5. `docs/WEB_FLARE_S8A_ACCEPTANCE_SCORECARD.md`
6. `docs/WEB_FLARE_S8_BACKGROUND_PREFLIGHT_CHECKPOINT.md`
7. `docs/WEB_FLARE_S8_PREFLIGHT_MANIFEST.json`

Then read the original work order, amendments and supporting contracts referenced by those documents.

## Mission

Implement S8A once, as one bounded integration build, using the prepared pure modules/tests rather than re-designing them.

Primary receiver journey:

`INVITATION -> MISSION + DUNGEON -> OPTIONAL CUSTOMIZE -> READY -> RUN -> REWARDS -> REGISTRATION GATE`

Product meaning:

`GET THE HERO TO THE EXIT AT ~[TARGET]% HP`

`Closer to the target = higher score + more Gold.`

`Do not kill the Hero. The Hero must clear the dungeon.`

## Required implementation qualities

- portrait-phone first;
- large bright primary actions;
- no critical small-text boxes;
- no long customization page;
- panel/category navigation instead of vertical control dumping;
- no-scroll novice path where practical;
- 100 Gold build budget remains visibly distinct from earned rewards;
- deterministic simulation remains authoritative;
- Overview and Follow Hero produce measurable camera changes;
- dedicated reward screen;
- clear-only Builder Gold;
- memory-only registration handoff;
- no Buddy/Test routing from Build Your Own.

## Boundaries

Do not:

- mutate S2-S7.1;
- change old routes;
- implement real accounts/backend;
- use localStorage/sessionStorage/IndexedDB/cookies as account authority;
- add progression/content/rebalance;
- deploy HostGator;
- touch Vercel.

## Test sequence

Run in this order so failures are cheap and diagnosable:

1. focused prepared S8A pure-module tests;
2. predecessor test suite;
3. frozen-file diff verification;
4. Flare source/asset verification;
5. S8A integration tests;
6. mobile browser journeys at 360x800, 390x844, 430x932;
7. camera geometry proof;
8. deterministic Run Again proof;
9. reward and registration journey proof;
10. final complete suite once.

Do not run repeated full-suite matrices unless diagnosing an actual failure.

## Deployment preparation

Only after PASS:

- identify exact deployable S8A web SHA;
- prepare bounded S8A HostGator handoff and deploy helper;
- restrict helper to S8A public roots;
- do not execute it.

## Return

Return `S8A TEST STATUS: PASS` or exact blocker/revise reason.

Include branch, starting SHA, ending SHA, deployable web SHA, exact changed files, tests, browser evidence, camera proof, Level 3/60% outcome, Hero Gold, Builder Gold, predecessor freeze evidence, route-isolation evidence, and confirmation that neither HostGator nor Vercel was touched.
