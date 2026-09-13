# WEB-FLARE S8B Runner Upgrade Transaction Contract

## Purpose

Define the server-authoritative mutation boundary for spending persisted Gold on the player's own Runner without locking final prices or catalogs yet.

## Supported mutation classes

Initial classes:

- `STAT_UPGRADE`
- `EQUIPMENT_PURCHASE`
- `ARMOR_PURCHASE`
- `EQUIP_ITEM`

No other slots or progression classes are authorized by this contract.

## Authority

The server resolves:

- authenticated player identity;
- player wallet balance;
- Runner ownership;
- progression offer/catalog entry;
- current upgrade tier/cap;
- active asset ownership;
- authoritative Gold cost;
- idempotency state.

The browser may request an offer ID but must not supply an authoritative price, stat modifier, wallet balance, or owner ID.

## Purchase transaction

A successful Gold-spending upgrade should be atomic:

1. authenticate player;
2. verify Runner belongs to player;
3. resolve progression offer from authoritative catalog/version;
4. verify offer is currently legal for Runner state/tier;
5. verify Gold balance is sufficient;
6. reserve unique idempotency key;
7. append explicit negative Gold ledger entry;
8. persist stat upgrade or asset ownership;
9. return updated wallet balance and Runner progression snapshot.

If any step fails, no partial Gold debit or partial upgrade remains.

## Idempotency

Repeated requests with the same idempotency key must return the original purchase result and must not create another debit or another copy of the upgrade.

Suggested key families:

- `runner-stat:<player>:<runner>:<offer>:<client-operation>`
- `equipment-buy:<player>:<runner>:<offer>:<client-operation>`
- `armor-buy:<player>:<runner>:<offer>:<client-operation>`

The exact key generator may differ, but uniqueness and retry safety are mandatory.

## Equip transaction

Equipping an already-owned item does not itself spend Gold unless a future rule explicitly says so.

Equip flow:

1. authenticate player;
2. verify Runner belongs to player;
3. verify asset is active and belongs to same player;
4. verify asset slot matches requested slot;
5. replace equipped asset in that slot atomically;
6. return refreshed effective Runner stats.

## Challenge snapshot boundary

When a player sends a new challenge, the challenge records the current effective Runner snapshot. Later purchases or loadout changes cannot mutate an issued challenge.

## Fail-closed rules

Reject:

- insufficient Gold;
- negative or client-supplied prices;
- cross-player Runner mutation;
- cross-player equipment use;
- wrong-slot equipment;
- duplicate non-idempotent tier application;
- stale catalog/version when the server requires a newer quote;
- upgrades beyond configured cap.

## Values intentionally unresolved

This contract does not define Gold prices, upgrade amounts, tier caps, weapon/armor catalog, or Runner-level progression. Those remain balance decisions and must be supplied by an authorized progression catalog before implementation.