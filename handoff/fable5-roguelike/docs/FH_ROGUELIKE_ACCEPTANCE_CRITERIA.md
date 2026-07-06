# Fiends & Hero Roguelike Acceptance Criteria

## Bootstrap

- RBB base runs locally.
- Vercel build passes.
- Browser deployment remains functional.
- RBB/ROT dependencies are pinned or vendored.
- License notes are documented.

## Module Loading

- Module 001 loads from JSON.
- Module schema is validated by tests.
- Invalid module data fails with actionable errors.
- Module data is not hardcoded in the gameplay loop.

## Navigation

- All 10 rooms are reachable as intended.
- Exits match Alpha canon.
- Room 9 to Room 10 remains one-way if canon requires it.
- Movement is deterministic and traceable.
- Tests fail if any required room becomes unreachable.

## Gameplay

- Fiend encounters trigger deterministically.
- Artifacts can be acquired.
- Scrolls can be discovered or used according to canon.
- Journal entries unlock.
- Inventory state is persisted in the game state.
- Prism can be assembled.
- Final boss can be reached.
- Victory state can be reached.
- Loss state can be reached where canon requires it.

## Walkthrough Automation

- Automated walkthrough runner exists.
- `walkthrough.md` is generated.
- `trace.json` is generated.
- Walkthrough reaches victory from a fresh seeded state.
- Tests fail if the module becomes unwinnable.
- Trace includes module load, movement, encounters, item/artifact acquisition, journal unlocks, combat, Prism assembly, boss state, and victory.

## Editor/Admin

- Map/room development UI exists.
- UI can inspect rooms, exits, encounters, artifacts, journals, and victory rules.
- UI can identify unreachable rooms or broken dependencies.
- UI does not silently rewrite canon.

## Legacy Repo Safety

- No legacy `ruins-api` behavior is broken.
- Existing `ruins-api` tests and validators still pass.
- Legacy repo remains reference-only for the new implementation.
