# WEB-FLARE S8B Runner Progression Data Model

## Purpose

Persist player-owned Runner progression so Gold can improve stats and individual equipment while preserving immutable challenge history.

## `player_runner`

Persistent player-owned Runner instance:

- `player_runner_id`
- `player_id`
- `runner_template_id`
- `display_name`
- `progression_version`
- timestamps

The template supplies governed base stats/art/class identity. Item bonuses are not baked into the base stats.

## `runner_stat_upgrade`

Permanent stat gains:

- `upgrade_id`
- `player_runner_id`
- `offer_id`
- `stat_key` = HP / ATTACK / DEFENSE
- `amount`
- `tier`
- `ledger_entry_id`
- `created_at`

## `progression_catalog`

Versioned server-authoritative definitions.

Equipment offers use one of:

- `WEAPON`
- `SHIELD`
- `HEAD`
- `CHEST`
- `HANDS`
- `LEGS`
- `FEET`

Each item defines governed modifiers plus visual/source metadata. Exact prices and later item modifiers are not locked yet.

## `runner_item_ownership`

Durable item ownership:

- ownership ID
- player ID
- item ID
- slot
- acquisition reason
- optional Gold ledger entry or starter-grant source
- acquired timestamp
- optional revoked timestamp

Starter Club and Wooden Shield are granted ownership records and do not require a Gold debit.

## `runner_loadout`

Current equipment selection for one Runner:

- player Runner ID
- weapon ownership ID or null
- shield ownership ID or null
- head ownership ID or null
- chest ownership ID or null
- hands ownership ID or null
- legs ownership ID or null
- feet ownership ID or null
- updated timestamp

Every equipped ownership row must belong to the same player and match the slot.

## Starter state

Rookie Warrior starts with:

- base HP 100
- base ATK 8
- base DEF 0
- Wooden Club equipped: +4 ATK
- Wooden Shield equipped: +1 DEF
- all armor-piece slots empty

Effective starter stats remain 100 HP / 12 ATK / 1 DEF.

## Effective stats

Derived only from:

`base Runner template + permanent stat upgrades + all equipped item modifiers`

Do not store an unaudited manually editable effective total as sole authority.

## Challenge Runner snapshot

Every persistent challenge stores immutable:

- Runner identity/template
- effective HP / ATK / DEF
- permanent upgrade summary/version
- all equipped item identities, slots and modifiers
- rules/content/progression version

Later progression cannot alter historic challenge behavior.

## Monster compatibility

The same item definition/modifier model may be referenced by monster loadouts. A monster item contributes the same governed modifier semantics as a Runner item. Monster ownership/loadout belongs to content/rules data rather than a player account unless a later feature explicitly introduces owned monsters.

## Security constraints

- player mutates only their own Runner;
- server resolves cost and ownership;
- cross-player equipping is forbidden;
- wrong-slot equipping is forbidden;
- challenge snapshots are immutable;
- historical results are not recalculated from current progression.
