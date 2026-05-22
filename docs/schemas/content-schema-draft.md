# Content Schema Draft

This draft defines the target shape for future content files. It is intentionally not enforced yet. The goal is to make the first engine implementation testable, deterministic, and canon-preserving.

Recommended future directory:

```text
content/
  canon-version.json
  rooms.json
  monsters.json
  items.json
  journal-entries.json
  flags.json
  commands.json
```

## Shared Types

```ts
type CanonStatus = "LOCKED" | "LIKELY" | "CONFLICTED" | "UNKNOWN";
type CanonVariant = "alpha_frozen" | "alpha_post_test" | "alpha_tuned_candidate" | "beta_candidate";
type StatKey = "ATF" | "DEF" | "EVA" | "HP";

interface CanonRef {
  status: CanonStatus;
  variant?: CanonVariant;
  source: string;
  notes?: string;
}

interface Stats {
  ATF: number;
  DEF: number;
  EVA: number;
  HP: number;
}
```

## Rooms

```ts
interface RoomDefinition {
  id: string; // e.g. "room.01"
  number: number;
  name: string;
  aliases?: string[];
  description: string;
  canon: CanonRef[];
  exits: ExitDefinition[];
  encounters?: EncounterTrigger[];
  examineTargets?: ExamineTarget[];
  visibleItems?: VisibleItem[];
  entryEvents?: EventRef[];
  flagsSetOnEnter?: string[];
  assetRefs?: AssetRef[];
}

interface ExitDefinition {
  id: string;
  direction: "north" | "south" | "east" | "west" | "northwest" | "multi_step" | "portal";
  label: string;
  toRoomId: string;
  conditions?: Condition[];
  oneWay?: boolean;
  onUseEvents?: EventRef[];
  invalidMessage?: string;
}

interface ExamineTarget {
  id: string; // e.g. "altar.prism.face_1"
  aliases: string[];
  description: string;
  revealsItems?: string[];
  addsJournalEntries?: string[];
  setsFlags?: string[];
  conditions?: Condition[];
  repeatable?: boolean;
}

interface VisibleItem {
  itemId: string;
  visibilityConditions?: Condition[];
  pickupConditions?: Condition[];
  pickupSetsFlags?: string[];
}
```

## Monsters

```ts
interface MonsterDefinition {
  id: string;
  name: string;
  type: "fixed" | "random_low_tier" | "boss";
  stats: Stats | ScaledStats;
  canon: CanonRef[];
  weaknesses?: ScrollWeakness[];
  drops?: DropDefinition[];
  onDefeatEvents?: EventRef[];
}

interface ScaledStats {
  scaleFrom: "player_current" | "player_base";
  percent: number;
  rounding: "floor";
}

interface ScrollWeakness {
  itemId: string;
  correctEffectPercent: number;
  incorrectEffectPercent?: number;
  affectedStats: StatKey[];
}

interface DropDefinition {
  itemId: string;
  mode: "visible_after_victory" | "auto_grant";
  canon: CanonRef[];
}
```

## Items

```ts
interface ItemDefinition {
  id: string;
  name: string;
  category: "quest" | "scroll" | "consumable" | "equipment" | "readable";
  canon: CanonRef[];
  stackable?: boolean;
  singleUse?: boolean;
  usableContexts?: ("exploration" | "combat" | "room_event")[];
  effects?: ItemEffect[];
  equipmentSlot?: "defense" | "speed" | "auto_heal" | "boss_protection";
  priceGold?: number;
}

type ItemEffect =
  | { type: "stat_modifier"; stat: StatKey; amount: number; target: "player_equipment" }
  | { type: "restore_all_stats"; curesFlags: string[] }
  | { type: "scroll_stat_reduction"; correctPercent: number; incorrectPercent: number }
  | { type: "assemble"; consumes: string[]; creates: string }
  | { type: "unlock_exit"; exitId: string; consumesItem?: boolean }
  | { type: "auto_prevent_boss_defeat"; bossId: string };
```

## Journal Entries

```ts
interface JournalEntryDefinition {
  id: string; // semantic id, not display number
  title?: string;
  text: string;
  category: "quest" | "combat_hint" | "lore" | "discovery" | "ending";
  canon: CanonRef[];
  triggerIds: string[];
  duplicatePolicy: "once";
}
```

## Flags

```ts
interface FlagDefinition {
  id: string;
  kind: "room" | "item" | "combat" | "journal" | "story" | "save";
  description: string;
  canon: CanonRef[];
  defaultValue: boolean | number | string | null;
}

interface Condition {
  type: "has_item" | "has_flag" | "not_flag" | "room_current" | "monster_defeated" | "stats_compare";
  key: string;
  value?: unknown;
}
```

## Commands

```ts
interface CommandDefinition {
  id: string;
  verbs: string[];
  context: "prologue" | "exploration" | "combat" | "store" | "ending";
  targetRequired?: boolean;
  routesTo: "movement" | "examine" | "pickup" | "inventory" | "journal" | "combat" | "save_load" | "store" | "system";
  conditions?: Condition[];
}
```

## Asset References

```ts
interface AssetRef {
  id: string;
  kind: "room_image" | "map" | "transition";
  path: string;
  alt: string;
}
```

## Schema Design Notes

- Use semantic ids rather than document numbering.
- Represent canon conflicts as data, not comments only.
- Keep prose content separate from engine rules where practical.
- Do not encode AI narration as authoritative state.
- Treat random choices as seeded draws from declared tables.
