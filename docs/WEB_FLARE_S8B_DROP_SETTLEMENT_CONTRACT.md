# WEB-FLARE S8B Gear Drop Settlement Contract

## Purpose

Prepare equipment drops without changing the deterministic Hero simulation or inventing loot probabilities before balance work.

## Separation from simulation

The current combat/run simulation remains deterministic and authoritative for movement, combat, pickups already in the challenge, HP, Gold and terminal status.

Gear drop entitlement is a settlement concern layered on the completed canonical run. It must not inject uncontrolled randomness into the simulation core.

If a future design uses random loot, randomness must be generated and recorded by a governed authority with replayable evidence. The browser cannot choose the result.

## Drop entitlement

A candidate drop entitlement contains:

- `drop_entitlement_id`
- `canonical_run_id`
- optional `source_monster_id`
- `item_id`
- `slot`
- `rules_version`
- `content_version`
- entitlement state
- created/claimed timestamps

Entitlement state initially supports:

- `PENDING`
- `CLAIMED`
- `VOID`

## Claim rule

Claiming a valid drop must be idempotent:

1. authenticate player;
2. verify the run/drop is claimable by that player;
3. verify item identity and slot from server-side entitlement;
4. reserve idempotency key;
5. create the ownership grant if absent;
6. mark entitlement claimed;
7. return ownership and inventory state.

Repeated claim calls return the same ownership result.

## Failed runs

No global rule is locked yet on whether a failed Hero run may yield equipment. Drop policy can later be defined per content/rules version.

Do not infer that collected Hero Gold and gear-drop eligibility use the same rule.

## First-item experience

Because a new player starts without head/chest/hands/legs/feet gear, acquiring the first item in one of those empty slots should be treated as a notable game event.

Presentation may say, for example:

`NEW FOOTWEAR!`

`Leather Boots`

`+1 DEF`

with a large `EQUIP` action.

Presentation does not establish ownership; it reflects an already-authoritative grant/entitlement.

## Anti-farming

Run Again or repeated browser requests must not duplicate the same drop entitlement or ownership grant. Canonical run identity plus idempotency is required.

Drop-generation frequency, loot tables, rarity and item probabilities remain future balance decisions.
