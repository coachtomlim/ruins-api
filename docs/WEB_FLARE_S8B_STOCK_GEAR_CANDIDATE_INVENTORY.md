# WEB-FLARE S8B Stock Gear Candidate Inventory

## Purpose

Identify stock Flare v1.15 gear that can support visible Runner progression without commissioning new art.

Pinned source authority:

`flareteam/flare-game @ 2ef474f5f5f368628bc526f9e56f936dac743e49`

This inventory is a sourcing shortlist only. It does not assign Gold prices or gameplay modifiers.

## Confirmed melee weapon base assets

The pinned Fantasycore melee weapon directory includes visible gear definitions for examples including:

- `club`
- `reinforced_club`
- `mace`
- `maul`
- `dagger`
- `longsword`
- `greatsword`
- `hand_axe`
- `infantry_axe`
- `battle_axe`

The existing prototype already uses `club`/Wooden Club as the current Runner weapon baseline.

Pinned `battle_axe` confirms the stock item points to:

`gfx=battle_axe`

and the pinned male avatar folder contains a matching `battle_axe` animation layer.

## Confirmed armor families

The pinned Fantasycore armor base contains families including:

- `cloth`
- `leather`
- `chain`
- `plate`
- mage variants

For the current Warrior Runner progression, the first practical visual shortlist should stay with warrior-compatible families:

- Leather
- Chain
- Plate

Mage-family armor should remain outside the first progression catalog unless another Runner/class is authorized.

Pinned chain chest confirms:

`gfx=chain_cuirass`

and the avatar set contains matching visible layers such as chain cuirass, coif, gloves, greaves and boots.

## Recommended first-catalog art shortlist

For later balance testing, prepare candidate art mappings around:

### Starter weapon

- Wooden Club / existing `club`

### Candidate weapon upgrades

- Reinforced Club
- Mace
- Longsword
- Battle Axe

This gives visibly distinct weapon progression while avoiding an oversized first catalog.

### Candidate armor upgrades

- Leather set
- Chain set
- Plate set

For v1 these may be represented as one governed `ARMOR` purchase/loadout choice whose visual metadata composes several underlying avatar layers.

## Important separation

Stock Flare names and visuals do not automatically determine our balance values.

Our game still needs separately governed:

- attack/defense/HP modifiers;
- Gold costs;
- progression tier/cap;
- unlock sequence.

Do not copy Flare RPG balance blindly into Dungeon Runner. The current deterministic combat and 100-point Dungeon Budget must remain the balance reference.

## Why this matters

Using stock visual layers means a player can see their Gold-funded progression on the actual Hero-Runner:

`earn Gold -> buy gear -> equip gear -> see changed Runner -> send upgraded Runner challenge`

This keeps the reward loop tangible without new-art dependency.