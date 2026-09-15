# WEB-FLARE S8B Runner Authority Projection Checkpoint 001

## Status

`S8B RUNNER AUTHORITY PROJECTION: BACKEND PASS`

This checkpoint was completed directly by the PM after accepting the S8B Account Foundation Client.

Active branch:

`work/web-flare-s8b-supabase-integration-001`

Supabase staging project:

`qpgwqmduqtqidmhbuclw`

## Purpose

Remove starter-only stat/item authority from the browser before any progression feature is activated.

The accepted account client currently renders correctly, but its Account Ready projection still knows the Rookie Warrior 100/8/0 base stats and Wooden Club/Wooden Shield modifiers locally.

That is acceptable for the accepted foundation proof, but it must not become the authority model for future equipment or progression.

This slice moves the governed starter Runner/template/item definitions and effective-stat projection behind the Supabase application boundary.

## Schema added

### `runner_template_catalog`

Current governed row only:

- `warrior-l1`
- Rookie Warrior
- base HP 100
- base ATK 8
- base DEF 0
- catalog version `s8b-1`

No later Runner tiers, prices or progression values are introduced.

### `runner_item_catalog`

Current governed rows only:

- Wooden Club
  - slot `weapon`
  - +4 ATK
  - Flare source `mods/fantasycore/items/base/weapons/melee/club.txt`
  - gfx `club`
- Wooden Shield
  - slot `shield`
  - +1 DEF
  - Flare source `mods/fantasycore/items/base/shields/wood.txt`
  - gfx `buckler`

No armor, later weapons, prices, rarity, drops or purchase offers are introduced.

## Referential authority

The database now enforces:

- `player_runner.runner_template_id` references the governed Runner template catalog;
- `(runner_item_ownership.item_id, slot)` references the governed item catalog and slot;
- browser roles cannot mutate either catalog;
- authenticated users may read current catalog entries;
- anonymous users receive no catalog grant.

Covering indexes were added for the new foreign keys.

## Authoritative projection RPC

Added:

`get_account_runner_state(p_player_runner_id uuid default null)`

Properties:

- `SECURITY INVOKER`, not `SECURITY DEFINER`;
- requires an authenticated identity;
- reads only player-owned Runner/loadout/ownership state through RLS;
- uses the governed catalogs for base stats and item modifiers;
- rejects missing/unknown templates;
- rejects missing loadout;
- rejects invalid, cross-player, revoked or wrong-slot equipped ownership;
- supports explicit Runner selection;
- if no Runner ID is supplied, automatically resolves only when the account has exactly one Runner;
- fails `RUNNER_SELECTION_REQUIRED` rather than guessing when multiple Runners eventually exist.

The RPC returns:

- player Runner ID;
- Runner template ID;
- Runner display name;
- progression/catalog version;
- base stats;
- effective stats;
- seven gear slots;
- equipped item identity/name/modifiers/source metadata;
- explicit empty slots.

## Independent proof

A transaction-scoped synthetic authenticated player was created and fully rolled back after proof.

Observed authoritative projection:

- Rookie Warrior
- base 100 HP / 8 ATK / 0 DEF
- Wooden Club equipped, +4 ATK
- Wooden Shield equipped, +1 DEF
- HEAD empty
- CHEST empty
- HANDS empty
- LEGS empty
- FEET empty
- effective 100 HP / 12 ATK / 1 DEF

A second authenticated synthetic identity saw:

- visible player Runners: 0
- visible owned items: 0
- visible loadouts: 0

while the global governed catalog correctly exposed:

- 1 Runner template
- 2 starter items

Privilege proof:

- authenticated `get_account_runner_state(uuid)` execute: YES
- anonymous execute: NO
- authenticated catalog INSERT: NO

All proof users and player state were transaction-rolled-back.

Post-proof staging counts:

- Auth users: 0
- player profiles: 0
- player Runners: 0
- owned items: 0
- loadouts: 0
- saved goals: 0
- wallet ledger: 0
- reward claims: 0
- governed Runner templates: 1
- governed Runner items: 2

## Adviser status

No new security adviser warning was introduced by this projection.

`get_account_runner_state` is a `SECURITY INVOKER` function.

The existing three authenticated `SECURITY DEFINER` warnings remain limited to:

- proof-only reward claim;
- starter-account provisioning;
- governed saved-goal mutation.

Performance foreign-key warnings introduced by the new catalog references were resolved with covering indexes. Remaining performance notices are only unused-index informational notices in the empty staging database.

## Product boundary preserved

This backend slice does not activate:

- reward settlement;
- Gold spending;
- stat upgrades;
- equipment purchases;
- armor acquisition;
- drops;
- trade;
- challenge persistence;
- live S8A registration;
- HostGator deployment;
- Vercel;
- main.

## Next residual implementation task

The browser account client should now be refactored to consume `get_account_runner_state` rather than deriving effective stats from hardcoded starter definitions.

The next client slice may also present a read-only Runner Account Hub with Stats / Equipment / Armor navigation, but all progression mutations remain disabled until the unresolved economy and settlement gates are intentionally opened.
