# WEB-FLARE S8B Runner Progression Data Model

## Purpose

Extend the account model so Gold can improve a player's own Hero-Runner through permanent stats, equipment and armor while preserving immutable challenge history.

## `player_runner`

One persistent player-owned Runner instance.

Required fields:

- `player_runner_id`
- `player_id`
- `runner_template_id`
- `display_name`
- `progression_version`
- timestamps

The template supplies governed base stats/art/class identity. Progression is stored separately.

## `runner_stat_upgrade`

Append-only or uniquely tiered records describing permanent stat gains.

- `upgrade_id`
- `player_runner_id`
- `offer_id`
- `stat_key` = HP / ATTACK / DEFENSE
- `amount`
- `tier`
- `ledger_entry_id`
- `created_at`

Unique constraints must prevent the same tier/offer being applied twice when the catalog defines one-time tiers.

## `progression_catalog`

Authoritative versioned definitions, not browser-owned values.

Stat offer fields:

- offer ID
- stat key
- amount
- tier/cap metadata
- Gold cost
- active/version metadata

Equipment offer fields:

- item ID
- slot = WEAPON or ARMOR
- modifiers
- Gold cost
- active/version metadata

Exact catalog values are not locked yet.

## `runner_item_ownership`

Owned weapon/armor instance or durable ownership record.

- ownership ID
- player ID
- item ID
- acquired via ledger entry/source
- acquired timestamp
- optional revoked timestamp

Items are non-stackable by default unless a later item explicitly authorizes quantity.

## `runner_loadout`

Current equipment selection for one player Runner.

- player Runner ID
- weapon ownership ID or null
- armor ownership ID or null
- updated timestamp

The equipped ownership rows must belong to the same player.

## Effective stats

Derived from:

`base Runner template + permanent stat upgrades + equipped weapon modifiers + equipped armor modifiers`

Do not store an unaudited manually editable effective-stat total as the sole authority.

A materialized/cached effective total may exist for performance if it is reproducible from the authoritative components.

## Challenge Runner snapshot

Every persistent challenge stores an immutable snapshot containing at minimum:

- Runner template/identity
- displayed level/version
- effective HP / ATK / DEF
- permanent upgrade summary or progression version
- equipped weapon identity/modifiers
- equipped armor identity/modifiers
- rules/content version

The challenge uses this snapshot even if the owner upgrades or changes equipment later.

## Relationship to Gold ledger

Each paid stat upgrade or item acquisition must reference its Gold debit ledger entry.

Deleting/changing a loadout must never delete the ledger history that explains how the item or upgrade was acquired.

## Security constraints

- player can mutate only their own Runner;
- purchase cost is server-resolved;
- item ownership is server-resolved;
- cross-player equipping is forbidden;
- challenge snapshot is immutable after challenge creation;
- historical challenge/run records are not recalculated from the player's current Runner state.