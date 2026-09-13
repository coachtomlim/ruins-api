# WEB-FLARE S8B Provider-Neutral Data Model

## Entities

### `player_profile`

- player ID
- auth-provider user reference
- display name
- created/updated timestamps

### `runner_profile`

Persistent player-owned Runner state.

- runner profile ID
- owner player ID
- runner catalog ID / base version
- permanent HP bonus
- permanent ATK bonus
- permanent DEF bonus
- equipped weapon ownership ID
- equipped armor ownership ID
- progression/rules version
- created/updated timestamps

### `runner_upgrade_event`

Append-only or auditable progression record for permanent stat upgrades.

- upgrade event ID
- runner profile ID
- stat key (`HP`, `ATK`, `DEF`)
- amount
- gold ledger debit reference
- rules/catalog version
- created timestamp

### `challenge`

- challenge ID
- sender player ID
- runner profile ID when persistent accounts exist
- immutable Runner snapshot/version used for this challenge
- target HP percent
- status
- created/expiry timestamps

### `run`

- run ID
- challenge ID
- optional receiver player ID until claimed
- room ID
- canonical encounter configuration
- rules/content version
- deterministic input hash
- terminal status
- finishing HP/max HP/percent
- score
- Hero gold
- Builder reward preview
- simulation seconds
- created timestamp

### `guest_claim`

- opaque claim ID/reference
- run ID
- expiry
- consumed state
- attached player ID when claimed
- created/consumed timestamps

### `saved_goal`

- saved goal ID
- owner player ID
- source challenge/run reference
- source sender context
- runner ID/version snapshot
- target HP percent
- created timestamp

### `gold_ledger`

- ledger entry ID
- player ID
- amount
- reason code
- source type/source ID
- unique idempotency key
- created timestamp

Positive entries include Builder/Hero rewards. Negative entries include governed Runner stat upgrades, equipment purchases and armor purchases.

### `asset_ownership`

- ownership ID
- player ID
- asset type/key
- acquisition reason
- source reference
- created/revoked timestamps

Initial progression asset types include at least:

- `WEAPON`
- `ARMOR`

Each equipment catalog asset carries governed stat modifiers and version metadata. Ownership alone does not apply the modifier; the asset must also be equipped on the owner's Runner profile.

### `saved_dungeon`

- saved dungeon ID
- owner player ID
- room ID
- encounter configuration
- rules/content version
- budget used
- created/updated timestamps

## Relationships

- player 1:N runner profiles
- player 1:N challenges
- runner profile 1:N runner upgrade events
- runner profile 0..1 equipped weapon ownership
- runner profile 0..1 equipped armor ownership
- challenge N:1 immutable Runner snapshot/profile origin
- challenge 1:N runs
- run 0..1:1 guest claim for initial conversion design
- player 1:N saved goals
- player 1:N ledger entries
- player 1:N asset ownership records
- player 1:N saved dungeons

## Constraints

- target HP valid range/step must match game rules version;
- idempotency key unique in ledger;
- guest claim cannot be attached to two different players;
- saved goal must reference immutable runner/target snapshot;
- historical challenge Runner stats do not change when its owner later upgrades;
- a player may equip only assets they own;
- equipped weapon/armor modifiers apply exactly once;
- permanent stat upgrades are owner-scoped and auditable;
- Gold spend cannot make the authoritative wallet balance negative;
- Dungeon Budget is not Gold and never appears as a player-ledger debit;
- historical run score/reward remains tied to its rules version;
- authoritative reward and progression values are server-derived/validated, never trusted from arbitrary browser fields.
