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
5. `docs/WEB_FLARE_S8A_DOM_CONTRACT.md`
6. `docs/WEB_FLARE_S8A_INTEGRATION_READINESS.md`
7. `docs/WEB_FLARE_S8A_PREDECESSOR_FREEZE_MATRIX.md`
8. `docs/WEB_FLARE_S8A_ROUTE_MATRIX.md`
9. `docs/WEB_FLARE_S8A_ACCEPTANCE_SCORECARD.md`
10. `docs/WEB_FLARE_S8_BACKGROUND_PREFLIGHT_CHECKPOINT_004.md`
11. `docs/WEB_FLARE_S8_PREFLIGHT_MANIFEST.json`
12. `docs/WEB_FLARE_S8_VERCEL_AUTODEPLOY_INCIDENT.md`

Then read the original work order, amendments and supporting contracts referenced by those documents.

## Mission

Implement S8A once, as one bounded integration build. Consume `public/flare-s8a/prepared.mjs` and the prepared view/state modules rather than rebuilding equivalent behavior inline.

Primary receiver journey:

`INVITATION -> MISSION + DUNGEON -> OPTIONAL CUSTOMIZE -> READY -> RUN -> REWARDS -> REGISTRATION GATE`

Product meaning:

`GET THE HERO TO THE EXIT AT ~[TARGET]% HP`

`Closer to the target = higher score + more Gold.`

`Do not kill the Hero. The Hero must clear the dungeon.`

## Existing prepared implementation assets

Use, do not duplicate unnecessarily:

- isolated `/m/XXXX` flow;
- receiver session + journey state machine;
- receiver state presenter and screen view models;
- explicit finish-HP goal model;
- mission/reward copy and target-fit guidance;
- room carousel + swipe helper;
- build-budget model;
- panel customization state;
- ready/runtime/reward/registration/error models;
- replay/edit preservation;
- camera controller and camera proof helpers;
- focus/mobile policies;
- design tokens and panel-shell CSS;
- registration memory handoff with no connected account service;
- local S8A preview server;
- mobile DOM fixture and stable DOM selector contract.

## Required implementation qualities

- portrait-phone first;
- large bright primary actions;
- no critical small-text boxes;
- no long customization page;
- panel/category navigation instead of vertical control dumping;
- target, clear requirement and reward incentive visible without hunting below the fold;
- 100 Gold build budget visibly distinct from earned reward Gold;
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
- re-enable or manually deploy to Vercel.

Vercel Git auto-deployment is disabled on this branch. Leave that protection in place.

## Test commands and environment

Start cheap:

`npm run test:s8a-preflight`

Then verify frozen predecessors without requiring old commit objects:

`npm run verify:frozen`

The freeze verifier compares current `HEAD:<path>` Git tree identities for S2-S7.1 against accepted S7.1 fingerprints in `tools/frozen-web-trees.json`. This is safe in shallow clones and avoids the previous false failure caused only by unavailable historical Git objects.

The inherited S7.1 historical-diff test may still require its older commit object when the complete legacy suite is run. If the checkout is shallow, fetch the required accepted commit/history or document that specific environment limitation. Do not weaken product freeze authority.

## Test sequence

Run in this order so failures are cheap and diagnosable:

1. `npm run test:s8a-preflight`;
2. `npm run verify:frozen`;
3. predecessor tests;
4. Flare source/asset verification;
5. S8A integration tests;
6. mobile browser journeys at 360x800, 390x844, 430x932 using the stable DOM contract;
7. camera geometry proof;
8. deterministic Run Again proof;
9. reward and registration journey proof;
10. final complete suite once.

Do not run repeated full-suite matrices unless diagnosing an actual failure.

## Deployment preparation

Only after PASS:

- identify exact deployable S8A web SHA;
- prepare bounded S8A HostGator handoff and deploy helper;
- restrict helper to S8A public roots and `/m`;
- fingerprint S2-S7.1 before and after;
- do not execute it.

## Return

Return `S8A TEST STATUS: PASS` or exact blocker/revise reason.

Include branch, starting SHA, ending SHA, deployable web SHA, exact changed files, focused/full test counts, browser evidence, phone viewport evidence, camera proof, Level 3/60% outcome, Hero Gold, Builder Gold, predecessor freeze evidence, route-isolation evidence, and confirmation that HostGator was not deployed and no Vercel deployment occurred.
