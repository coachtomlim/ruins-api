# WEB-FLARE S8B Asset Ownership Contract

## Goal

Define what an account actually owns before implementing persistence.

## Asset classes

Initial player-owned records may include:

- saved goals;
- owned runner unlocks;
- owned cosmetic or gameplay assets introduced later;
- authored/saved dungeon configurations;
- challenge history references;
- reward ledger history.

Rooms, monsters, traps and supports that are globally available in the current prototype are catalog content, not automatically duplicated as player-owned records.

## Ownership record

Each ownership record should identify:

- `ownership_id`
- `player_id`
- `asset_type`
- `asset_key`
- `acquisition_reason`
- `source_id`
- `created_at`
- optional `revoked_at`

Use a unique constraint that prevents duplicate active ownership for the same player and asset unless the future design explicitly supports stackable assets.

## Saved goal

A saved goal is not a mutable copy of an invitation URL. It is a domain record containing at minimum:

- owner player ID;
- source sender display name/reference when known;
- runner identity and level/version;
- target finishing HP;
- source challenge/run reference;
- created timestamp.

The saved goal becomes the starting point for the receiver to build and send their own challenge later.

## Dungeon configuration

When persistent dungeon saving is introduced, store data references rather than serialized DOM/UI state:

- room ID;
- enemy selections;
- trap selections;
- support selections;
- rules/content version;
- budget used;
- owner player ID.

## Versioning

All stored game assets/configurations should carry a rules/content version so later balance changes do not silently reinterpret historic challenges.

## Deletion and history

Deleting a saved dungeon or goal should not erase immutable run/reward ledger history needed for reconciliation.
