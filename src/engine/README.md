# Engine Scaffold

This directory contains the first executable scaffold for the future deterministic Ruins adventure engine.

Implemented in this phase:

- `content.js`: read-only content loader for `content/*.json`.
- `rng.js`: seedable deterministic RNG with generic dice and `d4`.
- `state.js`: immutable initial state factory and read-only query helpers.
- `commands.js`: command definition registry.
- `movement.js`: transition node registry only.
- `index.js`: public engine scaffold exports.

Still intentionally not implemented:

- command parsing,
- movement resolution,
- combat resolution,
- inventory mutation,
- journal mutation,
- event execution,
- save/load persistence,
- API integration.

The placeholder modules for combat, inventory, journal, events, and session exist only to reserve module boundaries.

Planned module boundaries are documented in [../../docs/architecture/deterministic-engine-proposal.md](../../docs/architecture/deterministic-engine-proposal.md).
