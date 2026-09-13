# WEB-FLARE S8B Stock Equipment Candidate Audit

Purpose: identify stock Flare v1.15 visuals that can support visible Runner progression without creating new art. This is an asset/provenance shortlist only. It does not authorize Gold prices or combat modifiers beyond the accepted starter Club +4 ATK and Wooden Shield +1 DEF.

Pinned Flare authority:

`2ef474f5f5f368628bc526f9e56f936dac743e49`

## Starter items

### Wooden Club

- slot: `WEAPON`
- item source: `mods/fantasycore/items/base/weapons/melee/club.txt`
- avatar visual: `club`
- governed starter modifier: `+4 ATK`

### Wooden Shield

- slot: `SHIELD`
- item source: `mods/fantasycore/items/base/shields/wood.txt`
- avatar visual: `buckler`
- governed starter modifier: `+1 DEF`

## Later weapon visual candidates

Stock melee item definitions include visual identities for examples such as:

- Reinforced Club
- Mace
- Longsword
- Battle Axe
- Greatsword
- Hand Axe
- Infantry Axe
- Maul
- Dagger

These are candidate visuals only until progression balance assigns modifiers/prices.

## Later armor-piece candidates

Stock armor is already separated by body location and material family. This directly supports the Owner's piece-by-piece acquisition direction.

### Leather

Available individual definitions include:

- head
- chest
- hands
- legs
- feet

### Chain

Stock avatar layers include:

- `chain_coif`
- `chain_cuirass`
- `chain_gloves`
- `chain_greaves`
- `chain_boots`

### Plate

The pinned item family contains individual plate armor definitions, including a chest item using `gfx=plate_cuirass`.

## Selection principles

When the later economy catalog is authorized:

1. Prefer stock visuals that already have compatible avatar animation layers.
2. Keep combat modifiers in the progression catalog, separate from visual filenames.
3. Give each owned item one equipment slot.
4. Do not bundle head/chest/hands/legs/feet into an armor set for v1 progression.
5. Keep starter armor slots empty so first gear acquisition is meaningful.
6. Do not infer Flare's original RPG item balance as the browser game's balance. Prices/modifiers require separate calibration.
7. Reuse the same governed item modifier semantics when an S8 monster is explicitly assigned that item.

## Not authorized by this audit

- no item prices;
- no later-item combat modifiers;
- no rarity system;
- no drop tables;
- no shop implementation;
- no new art;
- no mutation of frozen S7 monsters.
