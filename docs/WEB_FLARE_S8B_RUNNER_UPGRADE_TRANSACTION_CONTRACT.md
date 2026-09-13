# WEB-FLARE S8B Runner Upgrade Transaction Contract

## Purpose

Define the server-authoritative mutation boundary for spending persisted Gold on the player's own Runner without locking final prices/catalog values.

## Supported mutation classes

- `STAT_UPGRADE`
- `EQUIPMENT_PURCHASE` for weapon/shield
- `ARMOR_PURCHASE` for head/chest/hands/legs/feet
- `EQUIP_ITEM`

Governed equipment slots are:

`WEAPON`, `SHIELD`, `HEAD`, `CHEST`, `HANDS`, `LEGS`, `FEET`.

## Starter grants

The initial Wooden Club and Wooden Shield are starter-owned assets, not Gold purchases. Account initialization grants them and equips them without creating a debit ledger entry.

## Authority

The server resolves authenticated player identity, wallet balance, Runner ownership, offer/catalog entry, tier/cap, asset ownership, slot, authoritative Gold cost and idempotency state.

The browser may request an offer ID but never supplies authoritative price, modifier, balance or owner identity.

## Purchase transaction

A Gold-spending upgrade is atomic:

1. authenticate player;
2. verify Runner ownership;
3. resolve authoritative progression offer/version;
4. verify offer is legal for current Runner state;
5. verify Gold balance;
6. reserve idempotency key;
7. append explicit negative Gold ledger entry;
8. persist stat upgrade or item ownership;
9. return updated balance and progression snapshot.

Failure leaves no partial debit or partial ownership.

## Debit reason

- permanent stat upgrade → `RUNNER_STAT_UPGRADE`
- weapon or shield purchase → `EQUIPMENT_PURCHASE`
- head/chest/hands/legs/feet purchase → `ARMOR_PURCHASE`

## Equip transaction

Equipping an already-owned item does not spend Gold unless a later rule explicitly changes that.

Equip flow verifies Runner ownership, item ownership, active state and exact slot match before replacing the current slot reference atomically and returning refreshed effective stats.

## Effective-stat rule

`effective stats = base stats + permanent stat upgrades + equipped item modifiers`

Each equipped item contributes once. The server must not both bake an item's bonus into base stats and add it as equipment.

The same composition rule applies to governed monster loadouts, although player purchase transactions do not own/mutate monster equipment.

## Challenge snapshot boundary

Challenge creation snapshots all current equipped slots and effective stats. Later purchases/loadout changes cannot mutate an issued challenge.

## Idempotency

Repeated purchase requests with the same idempotency key return the original result and cannot create another debit or duplicate ownership/upgrade.

## Fail closed

Reject insufficient Gold, client-supplied prices, cross-player mutation, unowned items, wrong-slot equipment, duplicate non-idempotent tier application, stale required catalog version, and cap violations.

## Values unresolved

Gold prices, upgrade amounts, caps, later item modifiers/catalog and Runner-level semantics remain balance decisions.
