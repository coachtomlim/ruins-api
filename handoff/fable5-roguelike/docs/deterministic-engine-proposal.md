# Deterministic Engine Architecture Proposal

## Goal

Build a reusable deterministic adventure engine that preserves Ruins canon while remaining deployable on Vercel and reviewable by future agents.

The engine should decide facts. UI and optional AI narration may present those facts, but must not invent gameplay state.

## Proposed Module Boundaries

### `content-loader`

Responsibilities:

- Load versioned room, monster, item, journal, command, and flag definitions.
- Validate schemas before engine boot.
- Expose immutable content definitions to the engine.
- Support canon variants such as `alpha_frozen` and `beta_candidate`.

### `state`

Responsibilities:

- Own `GameState` creation, cloning, serialization, and migration.
- Provide pure helpers for stat modifiers and derived values.
- Keep current stats, base stats, equipment modifiers, status effects, room flags, and journal state separate.

### `commands`

Responsibilities:

- Parse player input into normalized command intents.
- Route intents by phase: prologue, exploration, combat, store, ending.
- Reject invalid commands with deterministic messages.
- Avoid LLM-dependent parsing in the authoritative path.

### `movement`

Responsibilities:

- Resolve exits and room transitions.
- Evaluate conditional exits.
- Track previous room and route metadata such as `enteredVia: "hex_portal"`.
- Trigger room entry events, encounters, and visible item changes.

### `events`

Responsibilities:

- Execute declarative room/item/story events.
- Set flags, reveal items, add journal entries, start combat, unlock exits.
- Suppress duplicate one-time triggers.

### `combat`

Responsibilities:

- Start combat with monster initiative.
- Resolve to-hit and damage using injected RNG.
- Apply scroll effects, run penalties, victory rewards, and defeat behavior.
- Generate deterministic combat logs.
- Avoid direct API/UI concerns.

### `inventory`

Responsibilities:

- Pick up visible items.
- Consume single-use items.
- Equip gear.
- Assemble Prism of Makidos.
- Apply item effects through the event/state layers.

### `journal`

Responsibilities:

- Add semantic journal entries once.
- Return entries in discovery order.
- Keep display numbering derived from order, not hardcoded ids.

### `save-load`

Responsibilities:

- Create manual and pre-boss snapshots.
- Restore full game state.
- Preserve RNG state or define replay semantics explicitly.
- Validate snapshot schema version.

### `rng`

Responsibilities:

- Provide seeded `d4` rolls.
- Track draw index.
- Make tests able to inject fixed roll sequences.

### `session`

Responsibilities:

- Bind engine state to API sessions.
- Choose initial persistence strategy.
- Keep future multiplayer separation in mind: session state should not be hardwired to a single global process.

### `api`

Responsibilities:

- Expose stable endpoints for starting games, sending commands, reading state, and assets.
- Convert engine responses into JSON or markdown.
- Never mutate state except by invoking engine command handlers.

### `assets`

Responsibilities:

- Replace hardcoded image lookup with an asset manifest.
- Preserve current `display-room` compatibility until a new API is ready.

## Suggested Request Flow

```text
HTTP command request
  -> session loads GameState
  -> commands parses input
  -> engine routes by phase
  -> module applies pure state transition
  -> events/journal/inventory/combat update state
  -> session persists state
  -> API returns deterministic response payload
```

## Determinism Rules

- Every command must produce the same state transition given the same prior state and RNG stream.
- Random monster selection and dice rolls must use the engine RNG only.
- All state transitions should be unit-testable without Vercel.
- Engine output should include machine-readable facts and optional presentation text.
- AI narration can summarize or embellish only after receiving immutable facts.

## Future Multiplayer Foresight

Do not implement multiplayer yet, but avoid choices that block it:

- Use session/world ids.
- Avoid global mutable process state.
- Keep commands as events that can be logged.
- Keep player state distinct from world/room state.
- Consider optimistic concurrency or state version numbers in the API design.

## Near-Term Non-Goals

- No engine rewrite in this prep phase.
- No API behavior changes yet.
- No deployment config changes yet.
- No AI narration implementation yet.
- No multiplayer implementation yet.
