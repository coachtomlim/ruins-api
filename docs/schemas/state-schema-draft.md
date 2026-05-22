# State Schema Draft

This draft describes the runtime state the deterministic engine should own. API and UI layers may serialize it, but should not mutate it directly.

## Game State

```ts
interface GameState {
  schemaVersion: string;
  canonVariant: "alpha_frozen" | "alpha_with_post_test_fixes" | "beta_candidate";
  sessionId: string;
  phase: "prologue" | "exploration" | "combat" | "store" | "ending" | "game_over";
  player: PlayerState;
  location: LocationState;
  inventory: InventoryState;
  journal: JournalState;
  rooms: Record<string, RoomState>;
  flags: Record<string, boolean | number | string | null>;
  combat?: CombatState;
  saves: SaveSlotsState;
  rng: RngState;
  transcript: TranscriptEntry[];
}
```

## Player State

```ts
interface PlayerState {
  baseStats: Stats;
  currentStats: Stats;
  equipmentModifiers: Partial<Record<StatKey, number>>;
  statusEffects: StatusEffect[];
  gold: number;
}

interface StatusEffect {
  id: string;
  source: string;
  statMultipliers?: Partial<Record<StatKey, number>>;
  removableBy?: string[];
}
```

## Location and Room State

```ts
interface LocationState {
  currentRoomId: string;
  previousRoomId?: string;
  enteredVia?: string; // e.g. "hex_portal"
}

interface RoomState {
  visited: boolean;
  cleared: boolean;
  visibleItems: string[];
  pickedUpItems: string[];
  defeatedMonsters: string[];
  examinedTargets: string[];
  localFlags: Record<string, boolean | number | string | null>;
}
```

## Inventory State

```ts
interface InventoryState {
  items: InventoryItem[];
  equipped: Record<string, string | null>;
}

interface InventoryItem {
  itemId: string;
  quantity: number;
  acquiredAtRoomId?: string;
  flags?: Record<string, boolean | number | string | null>;
}
```

## Journal State

```ts
interface JournalState {
  entries: JournalEntryState[];
}

interface JournalEntryState {
  entryId: string;
  discoveredAt: number; // monotonic turn index
  sourceTriggerId: string;
}
```

## Combat State

```ts
interface CombatState {
  id: string;
  roomId: string;
  monsterId: string;
  monsterInstance: CombatantState;
  playerSnapshotAtStart: CombatantState;
  turn: number;
  actorToAct: "monster" | "player";
  mode?: "attack_once" | "fight_to_end";
  usedItems: string[];
  canRun: boolean;
  returnOnRunRoomId?: string;
  log: CombatLogEntry[];
}

interface CombatantState {
  stats: Stats;
  maxStats: Stats;
  baseStats: Stats;
}

interface CombatLogEntry {
  turn: number;
  actor: "player" | "monster" | "system";
  action: string;
  rolls?: RollRecord[];
  damage?: number;
  result: string;
}
```

## Save State

```ts
interface SaveSlotsState {
  manual?: SaveSnapshot;
  preBoss?: SaveSnapshot;
}

interface SaveSnapshot {
  createdAtTurn: number;
  reason: "manual" | "pre_boss";
  state: Omit<GameState, "saves" | "transcript">;
}
```

## RNG State

```ts
interface RngState {
  seed: string;
  drawIndex: number;
}

interface RollRecord {
  kind: "d4";
  value: 1 | 2 | 3 | 4;
  drawIndex: number;
}
```

## Serialization Rules

- The engine must be able to replay a session from `seed + command stream`, or restore directly from serialized `GameState`.
- Dice rolls must be observable in test logs.
- AI narration must not be part of authoritative state.
- Save snapshots must not contain functions, class instances, or environment-specific values.
- Future multiplayer state should separate `session`, `player`, and `world` ownership cleanly.
