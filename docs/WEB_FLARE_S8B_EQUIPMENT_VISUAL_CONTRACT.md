# WEB-FLARE S8B Equipment Visual Contract

## Product intent

Equipment should be visibly represented on the Hero-Runner whenever the pinned stock Flare asset supports it. The player should be able to see meaningful progression such as acquiring the first boots, head gear or better shield.

## Governed slots

Initial Runner visual/equipment slots are:

- `WEAPON`
- `SHIELD`
- `HEAD`
- `CHEST`
- `HANDS`
- `LEGS`
- `FEET`

There is no starter armor set.

## Starter visuals

Pinned Flare v1.15 provides:

- Club source `mods/fantasycore/items/base/weapons/melee/club.txt`, `gfx=club`
- Wood shield source `mods/fantasycore/items/base/shields/wood.txt`, `gfx=buckler`

Starter Rookie Warrior should visibly compose the Club and Wooden Shield while head/chest/hands/legs/feet remain the default visual baseline with no owned armor bonus.

## Existing stock-Flare layers

The pinned avatar set contains separate layers suitable for later visible progression, including examples such as:

- `battle_axe`
- `buckler`
- `chain_cuirass`
- `chain_coif`
- `chain_gloves`
- `chain_greaves`
- `chain_boots`

Leather, chain and plate item families also exist in the pinned stock data.

Pinned source authority:

`2ef474f5f5f368628bc526f9e56f936dac743e49`

## Renderer reuse

The S3/S7.1 Hero composer already builds the Hero from independent avatar layers. Progression should extend that composer rather than create a second unrelated renderer.

## Catalog representation

An item carries presentation metadata separately from gameplay modifiers, for example:

```json
{
  "id": "example-boots",
  "slot": "feet",
  "modifiers": { "defense": 1 },
  "visual": { "avatarLayers": ["chain_boots"] }
}
```

## Authority separation

- gameplay modifiers determine combat;
- avatar layers determine appearance;
- presentation changes cannot change deterministic combat;
- missing visual art cannot silently remove/add stats;
- item catalog versions modifier identity and visual identity;
- an item bonus is counted once whether the owner is a Runner or a monster.

## Runtime snapshot

A challenge Runner snapshot records each equipped item ID/slot plus effective stats. Runtime resolves corresponding visual layers from the challenge content/catalog version.

Later loadout changes cannot alter an issued challenge.

## Mobile UX

Upgrade/inventory panels should preview the Runner with current gear. New item acquisition should visibly identify the new slot and stat effect before equipping. Keep one equipment category/panel visible at a time rather than showing a dense desktop inventory grid.
