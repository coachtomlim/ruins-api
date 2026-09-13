# WEB-FLARE S8B Gold Ledger and Idempotency Contract

## Principle

Do not store Gold as an unaudited mutable number. Store authoritative Gold changes as append-only ledger entries and derive/display balance from accepted entries.

## Ledger entry

Each entry requires:

- `ledger_entry_id`
- `player_id`
- `amount`
- `currency = GOLD`
- `reason_code`
- `source_type`
- `source_id`
- `idempotency_key`
- `created_at`

`idempotency_key` is unique.

## Initial credit reason codes

- `DUNGEON_BUILDER_REWARD`
- `HERO_RUN_REWARD`
- `STARTER_GRANT`

## Initial debit reason codes

Gold progression spending must use explicit negative ledger entries rather than generic balance edits:

- `RUNNER_STAT_UPGRADE`
- `EQUIPMENT_PURCHASE`
- `ARMOR_PURCHASE`

Future debit reasons must also remain explicit.

## Reward claim rule

A qualifying run may produce at most one Builder reward claim for the receiver account. Repeated registration submits, refreshes or network retries must return the existing claim result rather than append another ledger entry.

Recommended idempotency key shape:

`builder-reward:<canonical-run-id>:<player-id>`

## Upgrade/purchase rule

A Runner upgrade or equipment/armor purchase must be transactional and idempotent.

Recommended idempotency key shapes:

- `runner-stat:<runner-profile-id>:<upgrade-request-id>`
- `equipment-purchase:<player-id>:<asset-id>:<purchase-request-id>`
- `armor-purchase:<player-id>:<asset-id>:<purchase-request-id>`

The server must verify authoritative Gold balance before accepting a debit. A rejected purchase must not create partial ownership or partial progression state.

## Guest conversion transaction boundary

The following should be atomic when a guest converts to an account:

1. validate claim token/context;
2. ensure player identity owns the claim attempt;
3. persist saved goal if not already persisted;
4. append reward ledger entry if absent;
5. mark claim as consumed/attached to player;
6. return resulting balance and saved-goal identity.

## Progression purchase transaction boundary

The following should be atomic:

1. authenticate player;
2. validate Runner/asset ownership scope;
3. validate catalog/rules version and governed price;
4. confirm derived Gold balance is sufficient;
5. append one debit ledger entry if absent;
6. persist the stat-upgrade event or asset ownership if absent;
7. update equipped loadout only when explicitly requested;
8. return resulting Gold balance and effective Runner snapshot.

## Balance

`balance = SUM(accepted ledger amounts)`

A cached/materialized balance may exist for speed later, but the ledger remains reconciliation authority.

Gold balance must never become negative through a progression purchase.

## Failed Hero run

A failed Hero run may still have collected Hero Gold during play, but Builder reward is zero unless the governed reward rules say otherwise. Do not create a positive Builder ledger entry for death, blocked, timeout or invalid runs.

## Replay

Running the same guest challenge repeatedly does not create persistent ledger entries until a valid account claim occurs. If future product rules allow multiple rewardable runs, each eligible run must have a distinct canonical run ID and its own idempotency key.
