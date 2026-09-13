# WEB-FLARE S8B Gold Ledger and Idempotency Contract

## Principle

Do not store gold as an unaudited mutable number. Store authoritative gold changes as append-only ledger entries and derive/display balance from accepted entries.

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

## Initial reason codes

- `DUNGEON_BUILDER_REWARD`
- `HERO_RUN_REWARD`
- `STARTER_GRANT`
- future debit reasons must be explicit rather than negative generic adjustments.

## Reward claim rule

A qualifying run may produce at most one Builder reward claim for the receiver account. Repeated registration submits, refreshes or network retries must return the existing claim result rather than append another ledger entry.

Recommended idempotency key shape:

`builder-reward:<canonical-run-id>:<player-id>`

## Transaction boundary

The following should be atomic when a guest converts to an account:

1. validate claim token/context;
2. ensure player identity owns the claim attempt;
3. persist saved goal if not already persisted;
4. append reward ledger entry if absent;
5. mark claim as consumed/attached to player;
6. return resulting balance and saved-goal identity.

## Balance

`balance = SUM(accepted ledger amounts)`

A cached/materialized balance may exist for speed later, but the ledger remains reconciliation authority.

## Failed Hero run

A failed Hero run may still have collected Hero gold during play, but Builder reward is zero unless the governed reward rules say otherwise. Do not create a positive Builder ledger entry for death, blocked, timeout or invalid runs.

## Replay

Running the same guest challenge repeatedly does not create persistent ledger entries until a valid account claim occurs. If future product rules allow multiple rewardable runs, each eligible run must have a distinct canonical run ID and its own idempotency key.
