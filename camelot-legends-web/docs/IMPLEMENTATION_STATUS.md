# Implementation Status

Last updated: 2026-06-08

## Current Playable Status

Level 1 is now a visual prototype playable from title screen to victory in a local desktop browser and in the automated mobile viewport.

Playable flow:

`Title Screen -> Area 1 speaker-labelled dialogue -> visual map scenes -> Area 2 road cache -> Area 3 armor/equipment -> authored survivor choice -> Area 4 authored scout choice -> Area 5 Forgon Scout visual battle -> victory summary -> save/load`

It is no longer only a text/state prototype, but it is still not final art-complete production gameplay.

## Implemented

- Dependency-free browser shell.
- Static server and static build script.
- Recovered content JSON loading.
- Title screen.
- Level 1 route and objective gating.
- Mission journal.
- Inventory and equipment.
- Authored survivor encounter choices.
- Authored scout approach choices.
- Recovered map/tile-sheet visuals rendered in each Level 1 area.
- Visible party/player visual in exploration and combat.
- Visible survivor/scout/enemy markers during exploration.
- Recovered battle background.
- Visible Forgon animation during combat.
- Rebuilt turn combat with HP, MP, guard, potion, enemy intent, victory, defeat, and retry.
- IndexedDB save/load with localStorage fallback.
- PWA manifest and service worker.
- Offline reload verification.

## Current Validation

Latest required commands passed:

- `tools/validate-content.mjs`
- `tools/test-demo.mjs`
- `tools/build-static.mjs`
- `tools/verify-demo.mjs`
- `tools/verify-visual-slice.mjs`

## Build

Static build output:

`dist/`

## Mobile

Automated mobile viewport:

- `390x844`
- Full walkthrough passed.
- Service worker readiness passed.
- Offline reload passed.
- Visual slice assertions passed for map, party, speaker labels, survivor/scout markers, battle background, Forgon enemy visual, party battle visual, and victory visual.

Manual phone-over-LAN testing is still pending.

## Current Commit Line

- `1f759cc Add Camelot Legends level one pacing beats`
- Next checkpoint should improve art cropping/frame extraction and manual phone-over-LAN testing.
