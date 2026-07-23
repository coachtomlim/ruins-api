# Fiends & Hero Roguelike Risks

## Primary Risks

- RBB is browser-ready but not data-driven enough for F&H without refactoring.
- RBB uses CDN dependencies by default; the new repo should pin or vendor dependencies for Vercel.
- RBB production build tooling is minimal and may need a modern package/build setup.
- Some bundled assets have distinct licenses; the CC-BY coin should be replaced or attributed.
- The Alpha canon contains known conflicts; autonomous implementation must not resolve them without instruction.
- Full Module 001 reachability may reveal mismatches between current route files and desired roguelike room graph.
- Walkthrough automation can give false confidence unless it asserts every required story/mechanics milestone.

## Candidate-Specific Risks

### Roguelike Browser Boilerplate

- Fastest start, but `main.js` is mostly hardcoded.
- Needs extraction into module schema, engine state, and UI layers.
- Existing combat/item examples are too simple for final F&H logic.

### ROT.js

- Strong toolkit, but not a complete game.
- Using ROT.js directly may be cleaner long term but slower upfront.

### HobgoblinJS

- Old tooling failed scaffold generation on Node 24.
- License metadata mismatch between `LICENSE` and `package.json`.
- Not recommended as the first base.

## Mitigations

- Start with a 2-room Module 001 spike in the new repo.
- Require deterministic `trace.json` before adding more rooms.
- Add reachability and victory-path tests early.
- Keep canon files copied into the handoff and referenced from every implementation task.
- Add `LICENSE_NOTES.md` before retaining any third-party asset.
- Keep `ruins-api` tests green and avoid implementation changes in the legacy repo.
