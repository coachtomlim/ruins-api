# WEB-FLARE S8B Owner UAT Hub and Practice Bridge 001

## Status

Implementation preparation on:

`work/web-flare-s8b-owner-uat-hub-001`

Base product authority:

`e6a8e3a4dbe2570fd53b438cfc027a45f95eba76`

This branch is not deployed.

## Owner UAT finding

The first live S8B account/progression surface was technically correct but did not yet communicate the Dungeon Runner game loop strongly enough.

Specific gaps:

- Runner was represented by an `RW` badge rather than the existing composed Flare Hero.
- engineering-facing labels dominated the authenticated Hub;
- a synthetic `SAVE TOM · L3 · 60%` control remained visible;
- email confirmation depended entirely on Supabase Site URL;
- there was no prepared bridge from authoritative account Runner state into a self-built dungeon practice run.

## Hub correction implemented

The branch now:

- uses player-facing `YOUR RUNNER` / `RUNNER STATS` language;
- removes the synthetic saved-goal mutation control from the player surface;
- only shows a real saved challenge goal when one exists;
- reuses the existing S8A/S7.1 composed Hero renderer for the starter Club + Wooden Shield loadout;
- fails closed instead of showing a misleading visual if a later unsupported loadout appears;
- explicitly sends the current app URL as Supabase `emailRedirectTo` during signup.

No Supabase schema, catalog, wallet, purchase, challengeability or reward-settlement behavior changes.

## Existing visual reuse

S8B reuses:

- `public/flare-s8a/actors.mjs`
- `public/flare-s71/hero-preview.mjs`

The existing actor pack composes the stock Flare Warrior from separate avatar layers including:

- default body/clothing;
- `club`;
- `buckler`.

This matches the current authoritative S8B starter loadout.

The current S8B preview deliberately accepts only that supported starter visual. Future equipment/armor activation must extend the composed-avatar layer selection from authoritative gear rather than silently showing stale gear.

## Practice Runner snapshot

New:

`public/flare-s8b/practice-runner-snapshot.mjs`

`createPracticeRunnerSnapshot(viewModel)` captures:

- mode = `PRACTICE`;
- rewardSettlement = `false`;
- Dungeon Budget = `100`;
- player Runner ID;
- Runner template ID;
- Runner name;
- progression/catalog version;
- authoritative base stats;
- authoritative effective stats;
- all seven governed gear slots.

The result is immutable and is intended to be captured when the player starts a practice run so later account changes cannot mutate that in-flight attempt.

## Simulation authority seam

Existing simulation authority was traced to:

`public/flare-p0/src/core/simulation.mjs`

At reset, the simulation reads:

`catalog.heroes[challenge.hero]`

and derives the live Hero directly from:

- `maxHp`
- `damage`
- `armor`

Existing S7/S8A catalog construction ultimately derives these values from the legacy Runner model.

New:

`public/flare-s8b/practice-runner-catalog.mjs`

`applyPracticeRunnerToCatalog(baseCatalog,snapshot)`:

1. requires an explicit no-reward PRACTICE snapshot;
2. structured-clones the already prepared dungeon catalog;
3. replaces only:
   - `catalog.heroes.warrior.maxHp`
   - `catalog.heroes.warrior.damage`
   - `catalog.heroes.warrior.armor`
   with the authoritative S8B Runner effective stats;
4. leaves the base catalog, monsters, items, rooms and 100-point Dungeon Budget unchanged.

Therefore progressed account stats can enter the existing deterministic simulation without modifying frozen S8A/S7 source behavior.

## Next integration slice

The next executor should add an S8B-only practice shell/action:

`TEST YOUR RUNNER`

Desired flow:

`RUNNER HUB -> TEST YOUR RUNNER -> CHOOSE/CUSTOMIZE DUNGEON -> RUN -> RESULT -> RUN AGAIN / EDIT DUNGEON / BACK TO RUNNER`

Rules:

- reuse existing room, monster, trap, support and simulation modules;
- use the practice Runner snapshot and catalog bridge above;
- 100-point Dungeon Budget remains unchanged;
- mark the experience `PRACTICE RUN · NO REWARDS`;
- do not call reward settlement;
- do not write wallet rows;
- do not create persistent challenge/run records;
- do not alter S8A routes or behavior;
- do not solve persistent challenge token/lifetime/reward decisions in this slice.

## Frozen boundaries

Must remain unchanged unless separately authorized:

- `public/flare-s8a/**`
- `public/flare-s7/**`
- `public/flare-s71/**`
- `public/flare-p0/**`
- existing HostGator S2-S8A roots;
- `main`;
- persistent reward/challenge schema.

New S8B code may import frozen modules but must not mutate them.

## Verification still required

This branch has been source-audited but has not yet received the local execution gate.

Before acceptance/deployment, run:

- focused S8B tests;
- full suite;
- frozen verifier;
- real browser proof of the Hero preview;
- signup redirect proof;
- 360x800 / 390x844 / 430x932 layout proof;
- subsequent practice-mode simulation proof after the next slice is wired.
