# WEB-FLARE S8B Challenge and Run Record Contract

## Challenge record

A persistent challenge represents sender intent, not receiver dungeon construction.

Minimum fields:

- `challenge_id`
- `sender_player_id`
- `runner_id`
- `runner_rules_version`
- `target_hp_percent`
- `created_at`
- optional `expires_at`
- status such as `ACTIVE`, `CLOSED`, `EXPIRED`

The challenge must not embed a receiver-selected room, monsters, traps or supports.

## Receiver run record

A run records what the receiving player actually attempted against that challenge.

Minimum fields:

- `run_id`
- `challenge_id`
- optional `receiver_player_id` until account claim
- room ID
- enemy/trap/support selections
- rules/content version
- budget used
- terminal status
- finishing HP and max HP
- finishing HP percent
- score
- Hero gold collected
- Builder reward preview
- elapsed simulation time
- deterministic input hash
- created_at

## Deterministic input hash

Hash canonical game inputs, not DOM/UI state. The same challenge + dungeon config + rules version should produce the same deterministic input identity.

## Guest-to-account claim

A guest run can be represented by a short-lived claim reference until account conversion. On successful claim, associate the canonical run with the authenticated receiver player and append any eligible reward ledger entry atomically.

## Replay distinction

A replay is a new run record even if the deterministic inputs are identical. It can reference the same input hash while retaining its own `run_id` and timestamp.

## Historical integrity

Never recompute old scores or rewards silently under a later rules version. Historic records remain tied to the version under which they were produced.
