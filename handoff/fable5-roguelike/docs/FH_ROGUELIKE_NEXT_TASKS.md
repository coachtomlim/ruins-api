# Fiends & Hero Roguelike Next Tasks

## Task 1: Create New Repo

Create `fiends-hero-roguelike` and initialize it from Roguelike Browser Boilerplate.

Deliverables:

- new repo exists
- RBB base runs locally
- README identifies `ruins-api` as legacy/reference
- `LICENSE_NOTES.md` added

## Task 2: Add Handoff Bundle

Copy the relevant files from:

`ruins-api/handoff/fable5-roguelike/`

Deliverables:

- `FABLE5_MASTER_PROMPT.md`
- canon lock notes
- audit references
- Alpha content references
- engine reference notes

## Task 3: Define Module 001 Schema

Create the data schema under:

`content/modules/forgotten-ruin-dark-galan/`

Deliverables:

- `module.json`
- `rooms.json`
- `map.json`
- `exits.json`
- `encounters.json`
- `fiends.json`
- `artifacts.json`
- `scrolls.json`
- `journals.json`
- `dialogue.json`
- `events.json`
- `victory.json`

## Task 4: Implement Deterministic Engine Layer

Create `src/engine/` in the new repo.

Deliverables:

- seeded RNG
- module loader
- state reducer/transition API
- movement
- encounters
- inventory
- journals
- combat
- victory/loss
- trace emission

## Task 5: Build 2-Room Playable Spike

Use Entry Chamber plus one fiend encounter room.

Deliverables:

- move from Room 1 to Room 2
- encounter trigger
- artifact acquisition
- journal unlock
- victory condition
- `trace.json`

## Task 6: Expand To 10-Room Module 001

Add all rooms and canonical dependencies.

Deliverables:

- all rooms reachable as intended
- one-way rules represented
- Prism assembly path
- final boss path
- victory path

## Task 7: Add Editor/Admin UI

Create room/map development UI.

Deliverables:

- inspect rooms/exits
- inspect encounters/artifacts/journals
- validate reachability
- show broken dependencies

## Task 8: Add Automated Walkthrough

Create deterministic walkthrough runner.

Deliverables:

- `walkthrough.md`
- `trace.json`
- tests that fail if the module becomes unwinnable

## Task 9: Prepare Vercel Deployment

Make browser deployment repeatable.

Deliverables:

- build script
- test script
- Vercel build passes
- no CDN dependency surprises
