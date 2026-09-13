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
10. latest `docs/WEB_FLARE_S8_BACKGROUND_PREFLIGHT_CHECKPOINT_*.md`
11. `docs/WEB_FLARE_S8_PREFLIGHT_MANIFEST.json`
12. `docs/WEB_FLARE_S8_VERCEL_AUTODEPLOY_INCIDENT.md`
13. `docs/WEB_FLARE_S8B_STARTER_LOADOUT_AUTHORITY.md`

Then read the original S8A work order/amendments and referenced supporting contracts.

## Mission

Implement S8A once, as one bounded integration build. Consume `public/flare-s8a/prepared.mjs` and prepared state/view modules rather than rebuilding equivalent behavior inline.

Receiver journey:

`INVITATION -> MISSION + DUNGEON -> OPTIONAL CUSTOMIZE -> READY -> RUN -> REWARDS -> REGISTRATION GATE`

Product meaning:

`GET THE HERO TO THE EXIT AT ~[TARGET]% HP`

`Closer to the target = higher score + more Gold.`

`Do not kill the Hero. The Hero must clear the dungeon.`

## S8A starter Runner presentation

Owner authority now makes starter gear explicit.

Every S8A demo Runner should present the accepted Wooden Club and Wooden Shield as equipment rather than hiding their bonuses in anonymous stats.

Use the prepared `decomposeLegacyRunnerForStarterGear()` adapter to preserve existing effective S7 balance while decomposing DEF into base + Shield bonus:

- Club contributes +4 ATK;
- Wooden Shield contributes +1 DEF;
- no head/chest/hands/legs/feet armor is granted;
- effective L1/L2/L3 HP/ATK/DEF must remain exactly the existing accepted values.

The S8A Hero presentation should include the stock Flare shield visual (`buckler`) wherever the composed Hero is shown, alongside the existing Club, without mutating frozen predecessor files. Extend S8A composition/adaptation only.

Do not introduce later armor pieces, item purchases or progression balance in S8A.

## Reward-to-progression meaning

S8A still has no persistent purchases, but rewards/registration must explain why Gold matters:

`USE GOLD TO UPGRADE YOUR RUNNER`

`Stats · Equipment · Armor`

Builder Gold belongs to the receiver and later improves the receiver's own Runner after an account exists. Never imply it upgrades the friend's incoming Runner.

Registration explains that an account is required to keep Gold and use future Runner progression. `CREATE ACCOUNT` remains non-functional/disabled in S8A unless separately authorized.

## Existing prepared implementation assets

Use rather than duplicate:

- isolated `/m/XXXX` flow;
- receiver session/journey/view models;
- finish-HP goal model;
- mission/reward/target-fit copy;
- room carousel/swipe;
- build-budget and panel customization models;
- ready/runtime/reward/registration/error models;
- replay/edit preservation;
- camera controller/proof helpers;
- focus/mobile policy;
- design tokens/panel shell;
- registration memory handoff;
- local preview server;
- stable mobile DOM fixture/selectors;
- explicit Club + Wooden Shield starter loadout;
- legacy Runner starter-gear decomposition preserving accepted effective stats;
- common combatant equipment stat semantics for future Runner/monster parity.

Progression modules are later-account preparation. S8A may use their presentation/stat decomposition but must not expose active purchase/equip mutations.

## Required implementation qualities

- portrait-phone first;
- large bright primary actions;
- no critical small-text boxes;
- no long customization page;
- one panel/category at a time;
- target, clear requirement and reward incentive visible without hunting below fold;
- Dungeon Budget visibly distinct from reward Gold;
- deterministic simulation authoritative;
- Overview and Follow Hero visibly/measurably different;
- dedicated reward screen;
- clear-only Builder Gold;
- reward screen explains Runner-upgrade purpose;
- Club and Wooden Shield visibly/semantically explicit without changing accepted effective stats;
- no starter armor set;
- memory-only registration handoff;
- no Buddy/Test routing from Build Your Own.

## Boundaries

Do not:

- mutate S2-S7.1;
- change old routes;
- implement real accounts/backend;
- use localStorage/sessionStorage/IndexedDB/cookies as account authority;
- activate progression purchases/equipment mutations;
- add later armor/content/rebalance;
- retrofit equipment onto frozen S7 monsters;
- deploy HostGator;
- re-enable or manually deploy to Vercel.

Vercel Git auto-deployment is disabled on this branch. Leave it disabled.

## Test sequence

1. `npm run test:s8a-preflight`;
2. `npm run verify:frozen`;
3. predecessor tests;
4. Flare source/asset verification;
5. S8A integration tests;
6. mobile journeys at 360x800, 390x844, 430x932;
7. starter Club+Shield effective-stat and visual proof;
8. camera geometry proof;
9. deterministic Run Again proof;
10. reward/progression-teaser/registration journey proof;
11. final complete suite once.

Do not repeat full-suite matrices unless diagnosing a real failure.

## Deployment preparation

Only after PASS identify one deployable S8A web SHA and prepare bounded HostGator handoff/helper restricted to S8A roots and `/m`. Fingerprint S2-S7.1 before/after. Do not execute deployment.

## Return

Return `S8A TEST STATUS: PASS` or exact blocker/revise reason.

Include branch, starting/ending SHA, deployable web SHA, changed files, focused/full test counts, mobile evidence, camera proof, Club+Shield effective-stat/visual evidence, Level 3/60% result, Hero Gold, Builder Gold, reward-to-progression copy, predecessor freeze/route isolation, and confirmation that HostGator was not deployed and no Vercel deployment occurred.
