# WEB-FLARE S8B Owner Decision Packet 002

This packet supersedes conflicting progression assumptions in Owner Decision Packet 001.

## Resolved: starter Runner

The persistent starter is one Rookie Warrior that can grow over time.

Starter effective combat remains:

- HP 100
- ATK 12
- DEF 1

These totals are decomposed as:

- base HP 100
- base ATK 8
- base DEF 0
- Wooden Club +4 ATK
- Wooden Shield +1 DEF

## Resolved: individual equipment slots

Do not use a single Armor Set slot.

Initial equipment slots are:

- WEAPON
- SHIELD
- HEAD
- CHEST
- HANDS
- LEGS
- FEET

The player begins with Club and Wooden Shield only. Head, chest, hands, legs and feet begin empty so acquiring the first piece of visible gear is meaningful.

## Resolved: shared item modifier semantics

An equipment item's governed modifiers belong to the item definition.

A Runner or monster explicitly using the same item receives the same item modifier. Acquisition source does not change combat semantics.

Frozen S7 monster values remain untouched. New equipment-aware monster definitions belong to later content/rules versions.

## Resolved: gear can have multiple acquisition sources

Equipment is not required to come from one source.

Prepared acquisition paths include:

- starter grant;
- Gold purchase;
- dungeon-run award;
- future player exchange mechanism, reserved for later design.

An item may exist without being sold for Gold. Purchase offers therefore reference equipment definitions rather than defining the item itself.

## Still deliberately unresolved

Owner decision is not required yet on:

- later equipment prices;
- later item stat modifiers;
- permanent stat-upgrade increments/caps;
- dungeon-run award frequency and rarity;
- duplicate-item handling;
- details of a future player exchange system;
- relationship between progression and displayed Runner level.

These should be brought back as concrete calibrated options rather than arbitrary numbers.

## Other existing S8B decisions still open

Separate account/reward decisions remain open where already documented, including persistent reward settlement timing, failed-run Hero Gold persistence, backend/provider choice, persistent invitation identity and post-registration landing.
