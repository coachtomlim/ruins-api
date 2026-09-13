# WEB-FLARE S8B Gear Acquisition Contract

## Product truth

Player gear is not tied to a single acquisition mechanism.

A Runner may acquire equipment through multiple governed sources, initially including:

- `STARTER_GRANT`
- `GOLD_PURCHASE`
- `DROP`
- future `TRADE`
- future explicitly authorized reward/unlock sources

The same equipment item behaves the same after ownership is established regardless of how it was acquired. Acquisition source explains provenance, not combat semantics.

## Current starter rule

New Runner starts with exactly:

- Wooden Club in `WEAPON`
- Wooden Shield in `SHIELD`

No head, chest, hands, legs or feet equipment is granted at onset.

## Ownership grant

Every acquisition that creates player ownership must produce a durable ownership grant containing at minimum:

- `ownership_id`
- `player_id`
- `item_id`
- `slot`
- `acquisition_type`
- `source_id`
- `idempotency_key`
- `created_at`
- optional `revoked_at`

The ownership grant is authoritative. The browser cannot create ownership merely by displaying an item.

## Gold purchase

A Gold purchase must remain atomic with its Gold debit:

1. authenticate player;
2. resolve authoritative item and price;
3. verify balance;
4. reserve idempotency key;
5. append Gold debit;
6. create ownership grant;
7. return new balance and ownership.

A retry cannot debit twice or create duplicate ownership.

## Drop acquisition

A drop becomes ownership only after the authoritative run/drop settlement says the player is entitled to it.

The browser must not be able to submit `I found item X` as authority.

A drop ownership grant records the canonical run/drop entitlement as its source.

## Trade

Trade is a reserved acquisition channel only. No player-to-player transfer, marketplace, pricing, gifting or escrow behavior is authorized yet.

The ownership schema should not require a rewrite if Trade is later introduced, but no current UI or API should pretend Trade is active.

## Equipment behavior

- owning an item does not automatically equip it;
- equipping requires ownership and matching slot;
- equipped item modifiers affect effective stats exactly once;
- unequipped owned items do not affect stats;
- challenge snapshots preserve the exact equipped items and modifiers used when sent.

## Monsters

Monsters may use the same item definitions and modifiers as Runners. Monster gear is content/rules configuration, not player ownership, unless a future system explicitly changes that rule.

## Provenance and deletion

Acquisition history is reconciliation evidence. Removing an item from active inventory later must not erase the historical acquisition event or related Gold ledger entry.
