# Test Strategy

The first engine implementation should be test-driven around deterministic state transitions. Tests should not depend on Vercel, browser rendering, or AI narration.

## Testing Principles

- Test pure engine modules before API handlers.
- Inject RNG sequences instead of using ambient randomness.
- Assert state changes and logs, not only response text.
- Use semantic ids for rooms, items, monsters, and journal entries.
- Keep canon conflicts represented as pending or variant-specific tests.

## Suggested Test Layers

### Unit Tests

- Combat math
- Command parsing
- Inventory mutations
- Journal entry insertion
- Flag evaluation
- Room transition resolution
- Save/load serialization

### Integration Tests

- Full room entry flow.
- Multi-command puzzle sequences.
- Combat plus item drops.
- Prism assembly and Room 10 unlock.
- Boss preconditions and final cutscene state.

### API Contract Tests

- Current `/api/display-room` behavior.
- Future `/api/start`, `/api/command`, `/api/state`, `/api/load` contracts.
- OpenAPI spec validity.

## Example Test Cases

### Combat Math

- Given attacker `EVA 6`, defender `EVA 4`, rolls `2` and `3`, hit succeeds because `8 >= 7`.
- Given attacker `ATF 6`, defender `DEF 8`, damage roll `1`, damage is minimum `1`.
- Given monster reaches `HP <= 0`, combat ends and victory reward applies.
- Given fixed roll sequence, `Fight till the End` produces repeatable final state.

### Monster Initiative

- On entering a combat room, `actorToAct` is `monster`.
- On re-entering a room after running, uncleared monster is still present and attacks first.

### Run Penalties

- Run always succeeds.
- All relevant stats are reduced by `15%`, rounded down.
- Return room is previous room for normal encounters.
- Return room is Room 6 when running after using the hex portal to Room 4.
- Pending clarification: current HP vs max HP reduction semantics.

### Scroll Effectiveness

- Fog of Confusion against Imp reduces all monster stats by `50%`.
- Pulse of Calm against Musca reduces all monster stats by `50%`.
- Heart Beacon against Lizardman reduces all monster stats by `50%`.
- Incorrect scroll reduction has variant tests for `5%` and `10%` until canon is resolved.
- Used scroll is removed from inventory.
- Scroll use consumes player action and advances turn order.

### Victory Rewards

- Player receives floor of `30%` of defeated monster stats.
- Player is fully healed after victory.
- Pending clarification: reward source stats should be original/base vs scroll-modified monster stats.

### Room Transition Correctness

- Room 1 north leads to Room 2.
- Room 2 east leads to Room 6.
- Invalid directions return deterministic invalid move response.
- Room 10 cannot be entered without prism unlock.
- One-way portal cannot be reversed.
- Room 5 corrected mid-passage choices resolve to dead-end or Room 6.

### Inventory and Pickup

- Visible items are not added until `Pick/Get`.
- Room 6 shard discovery makes Hexagonal Glass Piece visible but does not auto-add it.
- Room 5 Girdle requires `Examine East Wall`, `Push Panel`, then pickup.
- Store purchase fails if gold is insufficient.
- Gold never drops below `0`.
- Equipping Shield adds `+2 DEF` through equipment modifier.
- Equipping Hose adds `+1 EVA` through equipment modifier.

### Prism Assembly

- `Assemble` fails when any Prism Fragment is missing.
- `Assemble` consumes fragments A/B/C.
- `Assemble` adds Prism of Makidos.
- Assembly adds journal entry and unlocks Room 9/Room 10 condition as approved.

### Journal

- Reading journal is disallowed during combat.
- Examining each Room 1 prism face adds the matching scroll clue once.
- Re-examining a completed lore target does not duplicate journal entries.
- Display numbering follows discovery order.

### Boss Mechanics

- Without Girdle, entering Room 10 triggers automatic defeat.
- With Girdle, shriek is neutralized.
- Banshee mirrors player base stats at Room 10 entry.
- Banshee does not copy equipment modifiers.
- Boss attacks first.
- After Banshee defeat, artifact becomes available.
- Final cutscene triggers only after artifact pickup.

### Save/Load Integrity

- Manual save captures stats, inventory, room, journal, flags, and RNG state.
- Pre-boss save does not overwrite manual save.
- Loading restores complete state.
- Save snapshots are JSON-serializable.
- Loading from no-save state returns deterministic no-save response.

### Conditional Flags

- One-time room events set flags.
- Store appears only if its condition is met and `storeVisited` is false.
- Poison applies on Room 7 entry according to approved repeat behavior.
- Cure All Stats Potion clears poison and restores approved stat bucket.

## Recommended First Test Harness

Use a lightweight Node test runner once `package.json` is introduced. Candidate options:

- `node:test` for minimal dependencies.
- `vitest` if TypeScript and richer assertions are adopted.

The first implementation PR should include tests for:

1. combat hit/damage math,
2. deterministic RNG injection,
3. manual pickup,
4. Room 1 to Room 2 movement,
5. journal deduplication,
6. one unresolved canon conflict represented as pending/variant data.
