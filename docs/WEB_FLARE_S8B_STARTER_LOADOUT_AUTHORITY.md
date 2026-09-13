# WEB-FLARE S8B Starter Loadout Authority

Owner decision superseding the earlier armor-set recommendation.

## Starter Runner

The persistent Rookie Warrior starts with:

- Wooden Club in `WEAPON`, +4 ATK
- Wooden Shield in `SHIELD`, +1 DEF
- no owned/equipped `HEAD`, `CHEST`, `HANDS`, `LEGS`, or `FEET` armor

Default avatar clothing is visual baseline only and grants no equipment bonus.

Preserve the current Rookie Warrior effective stats by decomposing them as:

- base HP 100
- base ATK 8 + Wooden Club 4 = 12 ATK
- base DEF 0 + Wooden Shield 1 = 1 DEF

## Equipment slots

Initial governed slots are:

`WEAPON`, `SHIELD`, `HEAD`, `CHEST`, `HANDS`, `LEGS`, `FEET`.

Armor is acquired piece by piece. Do not grant a starter armor set. The progression experience should include the first acquisition of visible items such as footwear and head gear.

## Monsters

Equipment bonuses are common combat rules. A monster that owns/equips an item receives that item's governed stat modifiers exactly once, using the same composition rule as a Runner.

Do not bake an equipment bonus into a monster base stat and add the same item bonus again. Frozen S7 monster values remain legacy effective stats until a later S8 content refactor explicitly decomposes them.

## Stock Flare provenance

Pinned Flare source contains both starter visuals:

- `mods/fantasycore/items/base/weapons/melee/club.txt` (`gfx=club`)
- `mods/fantasycore/items/base/shields/wood.txt` (`gfx=buckler`)

Reuse stock Flare art. No new starter art is required.

## Still unresolved

Gold prices, later item catalog, later item modifiers, progression caps, and Runner-level semantics remain balance decisions. Do not invent them during S8A.
