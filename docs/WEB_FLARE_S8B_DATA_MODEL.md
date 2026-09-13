# WEB-FLARE S8B Provider-Neutral Data Model

## Entities

### `player_profile`

- player ID
- auth-provider user reference
- display name
- created/updated timestamps

### `challenge`

- challenge ID
- sender player ID
- runner ID/version
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
- runner ID/version
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

### `asset_ownership`

- ownership ID
- player ID
- asset type/key
- acquisition reason
- source reference
- created/revoked timestamps

### `saved_dungeon`

- saved dungeon ID
- owner player ID
- room ID
- encounter configuration
- rules/content version
- budget used
- created/updated timestamps

## Relationships

- player 1:N challenges
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
- historical run score/reward remains tied to its rules version;
- authoritative reward values are server-derived/validated, never trusted from arbitrary browser fields.
