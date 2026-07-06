# Fable 5 Roguelike Handoff

## Purpose

This package prepares Fiends & Hero Roguelike Beta for autonomous implementation in a new repository named `fiends-hero-roguelike`.

The current repository, `coachtomlim/ruins-api`, remains the legacy, canon, and reference repository. Do not build the roguelike implementation here except for audit and handoff material.

## Current State

- Candidate audit complete on branch `engine-prep-v1`.
- Audit commit: `9087888`.
- Recommended base: Roguelike Browser Boilerplate.
- Top audit score: 84/100.
- ROT.js remains the fallback/toolkit.
- HobgoblinJS is not recommended as the initial base.
- Existing Beta app code was not touched by the audit.

## Handoff Bundle

Portable folder:

`handoff/fable5-roguelike/`

Important files:

- `handoff/fable5-roguelike/FABLE5_MASTER_PROMPT.md`
- `handoff/fable5-roguelike/NEW_REPO_BOOTSTRAP.md`
- `handoff/fable5-roguelike/CANON_LOCK.md`
- `handoff/fable5-roguelike/audit/`
- `handoff/fable5-roguelike/alpha-content/`
- `handoff/fable5-roguelike/engine-reference/`
- `handoff/fable5-roguelike/canon/`

## Implementation Direction

Create a new repository:

`fiends-hero-roguelike`

Use Roguelike Browser Boilerplate as the starting base, then convert the implementation toward data-driven F&H modules. The 10-room Forgotten Ruin of the Dark Galan becomes Content Module 001.

## Must Preserve

- Room names and authored room graph.
- Exits and one-way movement rules.
- Fiends and encounter placement.
- Artifacts, scrolls, journals, and inventory logic.
- Dialogue/events and command vocabulary.
- Combat rules, boss rules, win/loss state, and known canon conflicts.
- Existing `ruins-api` behavior.

## First Autonomous Task For Fable 5

Bootstrap the new repo with RBB, import Module 001 JSON data under `content/modules/forgotten-ruin-dark-galan/`, build a deterministic engine layer, and iterate until an automated walkthrough reaches victory and emits both `walkthrough.md` and `trace.json`.

## Do Not Do Yet

- Do not migrate the full game inside `ruins-api`.
- Do not rewrite Alpha canon.
- Do not resolve canon conflicts unless explicitly instructed.
- Do not collapse the new repo back into the legacy repo.
