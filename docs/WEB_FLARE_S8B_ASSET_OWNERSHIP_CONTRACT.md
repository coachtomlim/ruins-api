# WEB-FLARE S8B Asset Ownership Contract

## Goal

Define persistent player-owned game state before backend implementation.

## Player-owned classes

Initial account-owned records may include:

- saved goals;
- player-owned Runner profiles;
- permanent Runner stat upgrades;
- owned equipment;
- authored/saved dungeon configurations;
- challenge history references;
- reward/purchase ledger history.

Rooms, monsters, traps and supports that are globally available content are not automatically duplicated as player-owned records.

## Equipment ownership

Initial Runner equipment slots:

- `WEAPON`
- `SHIELD`
- `HEAD`
- `CHEST`
- `HANDS`
- `LEGS`
- `FEET`

Ownership record:

- `ownership_id`
- `player_id`
- `asset_type`
- `asset_key`
- `slot`
- `acquisition_reason`
- `source_id`
- `created_at`
- optional `revoked_at`

Owning an item does not automatically apply its stats. The item must be equipped on the owner's Runner in the matching slot.

## Starter ownership

New-player starter ownership grants exactly:

- Wooden Club, slot `WEAPON`
- Wooden Shield, slot `SHIELD`

No head/chest/hands/legs/feet armor is granted at onset. Default avatar clothing is a visual baseline only and is not an owned armor set.

Starter grants do not require a Gold debit. Their acquisition reason should identify them as starter assets.

## Runner progression

Persistent Runner state includes permanent HP/ATK/DEF upgrades plus loadout references for every governed equipment slot.

## Saved goal

A saved goal stores domain data, not DOM/UI state. It includes owner, source challenge/run/sender context, Runner snapshot identity and target finishing HP.

## Dungeon configuration

Store room/enemy/trap/support IDs, rules/content version, budget used and owner ID rather than serialized UI state.

## Challenge snapshot

When a player sends a challenge, persist the exact effective Runner snapshot used at creation, including each equipped item and modifier. Later upgrades cannot mutate historic challenge behavior.

## Monster equipment distinction

Monsters can use the same governed item/modifier semantics, but monster loadouts are content/rules state, not player-owned asset records unless a future feature explicitly changes that ownership model.

## Versioning and history

Stored game assets/configurations carry rules/content/progression versions. Deleting a saved goal/dungeon must not erase immutable run/reward/purchase history needed for reconciliation.
