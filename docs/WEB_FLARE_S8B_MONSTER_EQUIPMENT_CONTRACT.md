# WEB-FLARE S8B Monster Equipment Contract

## Product rule

Equipment has one governed combat meaning. If a Runner or monster owns/equips the same item definition, that item's HP/ATK/DEF modifiers apply the same way exactly once.

## Composition

For an S8 monster with explicit equipment:

`effective stats = base monster stats + equipped item modifiers`

Do not create a weaker/stronger hidden version of the same named item depending on whether a Runner or monster uses it.

## Ownership distinction

Runner equipment is player-owned account state.

Monster equipment is content/rules state attached to the monster profile or encounter version. It is not a player ownership record unless a future feature explicitly introduces owned monsters.

## Frozen S7 compatibility

The current S7 Goblin, Skeleton, Goblin Elite and Antlion values are frozen legacy effective combat stats. Do not infer hidden gear or subtract guessed item bonuses from those values.

A later S8 content milestone may introduce new versioned monster profiles with explicit base stats + equipment. That milestone must preserve old challenge history by rules/content version.

## Item examples

The accepted starter definitions demonstrate shared semantics:

- Wooden Club: +4 ATK
- Wooden Shield: +1 DEF

If a new S8 monster is explicitly equipped with both, add +4 ATK and +1 DEF to its governed base stats exactly once.

## Presentation

A monster's visible equipment should match the content profile where stock art supports it, but art is presentation. Missing/incompatible visual layers must not silently change combat stats.

## Challenge/dungeon data

When explicit monster loadouts are introduced, deterministic run identity must include the versioned monster profile/loadout identity so a later equipment change cannot reinterpret an old run.

## Not authorized here

- no retroactive S7 monster decomposition;
- no new monster gear assignments;
- no Gold prices for monster gear;
- no player trading of monster equipment;
- no new art.
