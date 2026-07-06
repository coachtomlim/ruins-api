# Fable 5 Master Prompt

You are Fable 5 working autonomously on Fiends & Hero Roguelike Beta.

Create or use the new repository:

`fiends-hero-roguelike`

Do not implement the roguelike inside `ruins-api`. Preserve `coachtomlim/ruins-api` as the legacy/canon/reference repository only.

Use Roguelike Browser Boilerplate as the browser-first base. ROT.js is the fallback/toolkit. HobgoblinJS is not recommended for first implementation.

Import F&H Alpha as Content Module 001:

`Forgotten Ruin of the Dark Galan`

Place module data under:

`content/modules/forgotten-ruin-dark-galan/`

Build a data-driven module schema with:

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

Preserve Alpha canon. Do not rewrite room names, exits, fiends, artifacts, dialogue, journals, combat rules, win/loss logic, or known canon conflicts. Resolve canon conflicts only when explicitly instructed by Thomas.

Implement:

- deterministic engine layer
- seeded RNG
- room/grid navigation
- encounters
- fiends
- artifacts
- scrolls
- journals
- dialogue/events
- inventory
- combat
- win/loss state
- map/room development UI
- automated walkthrough runner

Add game UI under:

`src/game/` or equivalent

Add deterministic engine code under:

`src/engine/`

Add editor/admin UI under:

`src/editor/` or equivalent

Add walkthrough tooling under:

`scripts/walkthrough/`

Produce:

- `docs/walkthroughs/module-001/walkthrough.md`
- `docs/walkthroughs/module-001/trace.json`

Iterate until the walkthrough reaches victory from a fresh seeded state.

Keep browser/Vercel deployment working. Add tests and validators so the build fails if Module 001 becomes unwinnable.

Acceptance criteria:

- RBB base runs locally.
- Vercel build passes.
- Module 001 loads from JSON.
- All 10 rooms are reachable as intended.
- Room 9 to Room 10 remains one-way if canon requires it.
- Fiend encounters trigger deterministically.
- Artifacts can be acquired.
- Journal entries unlock.
- Prism can be assembled.
- Final boss can be reached.
- Victory state can be reached.
- `walkthrough.md` is generated.
- `trace.json` is generated.
- Tests fail if the module becomes unwinnable.
- No legacy `ruins-api` behavior is broken.

At the end of your work, report:

- Status
- Commit hash
- Files changed
- Tests/builds run
- Walkthrough result
- Risks
- Progress
- Next recommended task
