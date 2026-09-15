# WEB-FLARE S8B Progression Transaction Design 001

## Status

`DESIGN AUTHORITY — FOUNDATION ONLY`

This design begins after Owner acceptance of the OD-05 calibration policy.

It deliberately does not activate any concrete progression offer because exact prices and later item modifiers remain unresolved.

## Transaction authority

The progression purchase boundary must be server-authoritative, atomic and idempotent.

Browser responsibilities are limited to selecting an already-active offer and supplying a client idempotency key.

The browser must never supply or control:

- Gold price;
- stat amount;
- item modifier;
- projected effective Runner values;
- resulting wallet balance;
- ownership record contents;
- challengeability classification.

## Versioned catalog

Use two layers:

1. `progression_catalog_version`
   - immutable version identity;
   - calibration version;
   - lifecycle status `DRAFT`, `ACTIVE`, `RETIRED`;
   - at most one active version.

2. `progression_offer_catalog`
   - `(catalog_version, offer_id)` identity;
   - kind `STAT` or `ITEM`;
   - exact Gold cost;
   - for `STAT`: one accepted atomic unit only (`+5 HP`, `+1 ATK`, `+1 DEF`);
   - for `ITEM`: governed `runner_item_catalog` reference;
   - concrete offers remain absent until exact values are Owner accepted.

An empty/no-active catalog is a valid safe state and must make product purchases fail closed.

## Challengeability envelope

Use `runner_challengeability_envelope` keyed by:

- calibration version;
- effective HP;
- effective ATK;
- effective DEF.

Only rows classified `PREFERRED` are purchase-eligible for launch stat progression.

The purchase transaction must project the post-purchase effective state and require an exact `PREFERRED` row for the active catalog's calibration version.

No envelope row means no purchase.

This turns the accepted cumulative-power policy into a server-side fail-closed gate rather than independent stat caps.

## Persistent progression state

Permanent stat training is append-only:

`runner_stat_upgrade_event`

Each accepted stat purchase creates one immutable event linked to the authoritative purchase record.

Current permanent stat bonus is the sum of those events.

The authoritative Runner-state projection must include these events before calculating effective stats.

## Purchase receipt

`progression_purchase` records:

- player;
- owned Runner;
- catalog version;
- offer;
- authoritative Gold cost;
- wallet ledger entry;
- client idempotency key;
- creation time.

A retry with the same idempotency key and the same semantic purchase returns the same purchase and ledger entry.

A reused key with different Runner/offer intent fails `IDEMPOTENCY_CONFLICT`.

## Wallet serialization

The transaction locks the authenticated `player_profile` row before reading balance or writing a debit.

This serializes purchases for one player and prevents concurrent double-spending.

Balance is derived from authoritative `wallet_ledger` sum.

If balance is below the catalog price, the transaction fails before any progression mutation.

Debit reasons are explicit progression reasons, separate from reward credits.

## Item purchase boundary

An `ITEM` offer may create a `runner_item_ownership` row with acquisition reason `GOLD_PURCHASE`.

Purchase does **not** equip the item.

Equip mutation remains a separate later gate because challengeability must evaluate the projected equipped state and slot replacement semantics.

No item offer is activated by this design packet.

## Security

Authenticated browser roles receive read-only access to their own receipts/stat events and active catalog metadata.

They receive no direct INSERT/UPDATE/DELETE authority over:

- wallet ledger;
- catalog versions/offers;
- challengeability envelope;
- stat upgrade events;
- purchase receipts;
- Runner ownership/loadout authority.

Mutation occurs only through the governed transaction RPC.

## Proof plan

Because no concrete offers are yet authorized, the transaction can be proven with transaction-scoped synthetic catalog/envelope rows and synthetic wallet credit, all rolled back afterward.

Required proof:

- insufficient Gold causes zero residue;
- first stat purchase creates one debit, one receipt, one stat event;
- retry returns same purchase/ledger identity and no second debit/event;
- conflicting idempotency reuse is rejected;
- projected state outside `PREFERRED` is rejected with zero residue;
- another player cannot buy against someone else's Runner;
- item purchase creates ownership but leaves loadout unchanged;
- anonymous invocation denied;
- direct authenticated progression writes denied;
- post-proof player/test state returns to zero.

## Product boundary

This foundation does not activate:

- any exact progression price;
- any product purchase button;
- any live progression offer;
- equip mutation;
- drops/reward acquisition;
- trade;
- reward settlement;
- persistent challenges;
- S8A changes;
- HostGator/Vercel/main changes.
