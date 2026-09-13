# WEB-FLARE S8B Equipment Visual Contract

## Product intent

Weapons and armor should not exist only as hidden stat numbers. When the selected stock Flare asset supports it, equipped gear should be visibly represented on the Hero-Runner in the builder preview and runtime.

## Existing stock-Flare evidence

The pinned Flare v1.15 avatar set already contains separate male avatar animation layers for gear, including examples such as:

- `battle_axe`
- `buckler`
- `chain_cuirass`
- `chain_coif`
- `chain_gloves`
- `chain_greaves`
- `chain_boots`

The current S3/S7.1 Hero composer already builds the default Hero from independent avatar layers such as legs, feet, chest, hands, head and club. Progression should extend that layer composition instead of creating a second unrelated Hero renderer.

Pinned source authority remains Flare commit:

`2ef474f5f5f368628bc526f9e56f936dac743e49`

## Catalog representation

A progression item may carry presentation metadata separate from gameplay modifiers:

```json
{
  "id": "example-item",
  "slot": "weapon",
  "modifiers": { "attack": 2 },
  "visual": {
    "avatarLayers": ["battle_axe"]
  }
}
```

An armor offer may map to one layer or to a governed bundle of layers. This keeps the data model flexible while the exact armor-slot granularity remains undecided.

## Authority separation

- gameplay modifiers determine combat;
- avatar layers determine appearance;
- changing presentation must never change the deterministic result;
- an unavailable visual layer must not silently alter stats;
- the item catalog must version both modifier and visual identity.

## Runtime rule

When a challenge is created, its Runner snapshot records item IDs and effective stats. The runtime may resolve the corresponding visual layers from the challenge's content/catalog version.

A later cosmetic/presentation patch must not change historic challenge combat stats.

## Mobile UX

The Runner upgrade screen should show the Hero preview with equipped gear wherever practical. Selecting an owned item for preview may update appearance before confirmation, but only an authoritative equip mutation changes persistent loadout.

## Open design choice

The schema supports either:

1. a simple `WEAPON + ARMOR` model, where an Armor item may visually bundle multiple stock layers; or
2. a later multi-slot armor model.

Do not expand persistent slots beyond the currently governed `WEAPON` and `ARMOR` abstraction until the Owner chooses the desired RPG depth. The visual metadata is deliberately flexible enough to avoid a schema rewrite when that decision is made.