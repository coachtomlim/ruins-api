# WEB-FLARE S8A Integration Readiness

Purpose: determine when planning/preparation is complete enough to hand one bounded browser integration build to Codex.

## Product semantics frozen

- receiver goal is a successful precision clear, not killing the Hero;
- visible mission: `GET THE HERO TO THE EXIT AT ~[TARGET]% HP`;
- visible incentive: closer to target = higher score + more Gold;
- Builder reward requires `cleared` outcome;
- Hero Gold and Builder Gold are separate concepts;
- build budget Gold is not reward Gold;
- customization is optional;
- `RUN AGAIN` preserves exact gameplay inputs;
- `EDIT THIS DUNGEON` preserves room/configuration;
- `SAVE THIS GOAL & BUILD YOUR OWN` enters registration context, never Buddy/Test.

## Mobile UX frozen

- portrait phone first;
- full-height panels rather than long pages;
- mission target and reward cue visible without hunting below the fold;
- large bright primary actions;
- MONSTERS / TRAPS / SUPPORTS category panels;
- one customization category visible at a time;
- dungeon budget always visible during customization;
- Overview and Follow Hero require visibly different camera compositions.

## Prepared implementation building blocks

- invite `/m/XXXX` flow;
- goal model;
- receiver session/journey state;
- invitation, mission, customization, ready, runtime HUD, result, registration and error view models;
- reward calculation and reward teaser;
- target-fit guidance;
- replay/edit preservation;
- registration memory handoff;
- account-service-disabled S8A registration action state;
- focus and mobile policy;
- design tokens and panel-shell CSS;
- local S8A preview server;
- shallow-clone-safe frozen predecessor verifier;
- test fixtures and golden L3/60 journey.

## Prepared test surfaces

Focused S8 tests can run with:

`npm run test:s8a-preflight`

Frozen predecessor trees can be verified with:

`npm run verify:frozen`

The final implementation still needs browser integration tests proving real DOM layout, real Flare animation/simulation wiring and real camera composition.

## Not yet implemented by design

The one-go integration build still owns:

- `public/flare-s8a/index.html`
- `public/flare-s8a/builder.mjs`
- `public/flare-s8a/challenge.html`
- `public/flare-s8a/challenge.mjs`
- final composition styles beyond the prepared tokens/panel shell
- actual DOM wiring of all prepared view models and state transitions
- browser proof at 360x800, 390x844 and 430x932
- prepared-but-unexecuted HostGator deploy handoff after PASS.

## S8B remains planning/prep only

No real auth provider, account, database, wallet or persistent reward settlement is authorized in S8A.

Provider-neutral S8B domain prep exists, including append-only Gold ledger logic and tests, but provider selection remains a separate Owner gate.

## Hosting restriction

Vercel automatic Git deployment is disabled for this S8 branch. Do not re-enable or manually deploy to Vercel. HostGator remains the only authorized public deployment path after S8A implementation PASS.
